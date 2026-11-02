// 내 방 그림 검사 (2026-11-02 사용자 지적: 책상 색을 바꿔도 책상 위 물건 둘레에 옛 책상 색이 남았다).
// 아이템 그림에는 그 물건 칸만 있어야 하고, 모양이 바뀌는 물건(책상 위, 협탁 위) 밑의 가구는 가려진 자리까지 다 그려져 있어야 한다.
// 브라우저 없이 public/assets의 그림과 src/features/lobby/model/homeDecorLayers.ts만 읽는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { decodePng } from "../tools/art/pixelArt.mjs";

const data = JSON.parse(readFileSync("src/features/lobby/model/homeDecorLayers.ts", "utf8").match(/HOME_DECOR = (\{[\s\S]*\}) as const/)[1]);
const png = (src) => decodePng(readFileSync(`public${src}`));
/** 방 전체 좌표의 칸 → [r, g, b, a]. 상자 밖은 투명. */
const sampler = (box) => {
  const im = png(box.src);
  return (x, y) => {
    const lx = x - box.x, ly = y - box.y;
    if (lx < 0 || ly < 0 || lx >= im.width || ly >= im.height) return [0, 0, 0, 0];
    return [...im.pixels.subarray((ly * im.width + lx) * 4, (ly * im.width + lx) * 4 + 4)];
  };
};
/** 아이템(기본 포함)이 그 층에 쓰는 그림 상자들. */
const partsOf = (layerId) => [
  ["기본", data.layers[layerId]],
  ...Object.entries(data.items).filter(([, parts]) => parts[layerId]).map(([id, parts]) => [id, parts[layerId]]),
];

for (const [top, furniture] of [["desk-paper", "desk"], ["nightstand-plant", "nightstand-mid"], ["nightstand-jar", "nightstand-mid"]]) {
  test(`${top} 아이템 칸 밑은 ${furniture} 층이 다 채우고, 아이템에 ${furniture} 칸이 섞이지 않는다`, () => {
    // 준비: 가구 기본 층
    const under = sampler(data.layers[furniture]);
    for (const [item, box] of partsOf(top)) {
      const im = png(box.src);
      let holes = 0, copied = 0;
      // 실행: 아이템의 불투명 칸마다 밑의 가구 칸을 본다. 같은 색 검사는 물건 바깥 테두리 칸만 한다
      // (가구 칸이 섞이면 물건 둘레에 붙어 나온다. 물건 안쪽은 가구와 같은 팔레트 색을 써도 된다).
      const opaque = (x, y) => x >= 0 && y >= 0 && x < im.width && y < im.height && im.pixels[(y * im.width + x) * 4 + 3] > 0;
      for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
        const k = (y * im.width + x) * 4;
        if (!im.pixels[k + 3]) continue;
        const rim = !(opaque(x + 1, y) && opaque(x - 1, y) && opaque(x, y + 1) && opaque(x, y - 1));
        const u = under(box.x + x, box.y + y);
        // 가구 윗면 높이(아이템 바닥 쪽 칸)에서만 본다: 그 위는 벽이라 가구가 없는 게 맞다
        const onTop = top === "desk-paper" || box.y + y >= 92;
        if (!onTop) continue;
        if (!u[3]) holes++;
        else if (rim && u[0] === im.pixels[k] && u[1] === im.pixels[k + 1] && u[2] === im.pixels[k + 2]) copied++;
      }
      // 확인: 가구에 구멍이 없고, 아이템이 가구 색 칸을 그대로 들고 있지 않다
      assert.equal(holes, 0, `${item}: ${furniture} 층에 구멍 ${holes}칸`);
      assert.equal(copied, 0, `${item}: ${furniture}와 같은 색 칸 ${copied}칸`);
    }
  });
}

test("내 방 층 그림: 표에 적힌 그림이 모두 있고 상자 크기와 같으며, 불빛과 그림자 층만 섞기를 쓴다", () => {
  // 준비와 실행: 기본 층과 아이템 그림을 모두 연다
  const boxes = [...Object.values(data.layers), ...Object.values(data.items).flatMap((parts) => Object.values(parts).filter(Boolean))];
  for (const box of boxes) {
    assert.equal(existsSync(`public${box.src}`), true, box.src);
    const im = png(box.src);
    // 확인: 그림 크기가 상자와 같고 방 안에 있다
    assert.deepEqual([im.width, im.height], [box.width, box.height], box.src);
    assert.equal(box.x >= 0 && box.y >= 0 && box.x + box.width <= data.size.width && box.y + box.height <= data.size.height, true, box.src);
  }
  assert.deepEqual(
    Object.entries(data.layers).filter(([, l]) => l.blend).map(([id, l]) => `${id}:${l.blend}`),
    ["glow:screen", "shadow:multiply"],
  );
  assert.deepEqual(data.fixed, ["glow", "shadow"]);
});
