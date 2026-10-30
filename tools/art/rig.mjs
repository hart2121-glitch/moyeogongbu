// 캐릭터 리그 (Story 009): 기본 몸 프레임 + 프레임별 머리 기준점 + 방향별 부품을 합성한다.
// 머리에 붙는 부품(머리카락, 얼굴, 액세서리)은 방향마다 서기 기준 그림 1장만 있으면 되고,
// 각 프레임에서는 머리가 움직인 만큼 옮겨 붙인다. 의존성 없이 Node 기본 기능만 쓴다.
import { emptyLike, pixelIndex } from "./rigImage.mjs";

/**
 * 서기 그림의 머리 조각(rect)이 프레임의 어디에 가장 잘 맞는지 찾는다.
 * 불투명 픽셀의 색 차이 합(SAD)이 가장 작은 이동량을 고른다.
 * @param stand 방향의 서기 그림 (기준)
 * @param frame 같은 방향의 동작 프레임
 * @param rect 머리 영역 {x,y,w,h} (서기 그림 좌표)
 * @param search 탐색 반경(픽셀)
 * @returns {{dx:number, dy:number, score:number}}
 */
export function findOffset(stand, frame, rect, search = 6) {
  let best = { dx: 0, dy: 0, score: Infinity };
  for (let dy = -search; dy <= search; dy++)
    for (let dx = -search; dx <= search; dx++) {
      let score = 0, count = 0;
      for (let y = rect.y; y < rect.y + rect.h; y++)
        for (let x = rect.x; x < rect.x + rect.w; x++) {
          const a = pixelIndex(stand, x, y);
          if (a < 0 || stand.pixels[a + 3] === 0) continue;
          const b = pixelIndex(frame, x + dx, y + dy);
          if (b < 0 || frame.pixels[b + 3] === 0) { score += 3 * 255; count++; continue; }
          for (let k = 0; k < 3; k++) score += Math.abs(stand.pixels[a + k] - frame.pixels[b + k]);
          count++;
        }
      const mean = count ? score / count : Infinity;
      if (mean < best.score) best = { dx, dy, score: mean };
    }
  return best;
}

/**
 * 부품을 기본 프레임 위에 이동량만큼 옮겨 겹친다. 반투명 가장자리는 원본 위에 섞는다.
 * @param base 기본 몸 프레임
 * @param parts [{image, dx, dy}] 아래에서 위 순서
 */
export function composite(base, parts) {
  const out = emptyLike(base);
  out.pixels.set(base.pixels);
  for (const { image, dx = 0, dy = 0 } of parts)
    for (let y = 0; y < image.height; y++)
      for (let x = 0; x < image.width; x++) {
        const s = pixelIndex(image, x, y), alpha = image.pixels[s + 3];
        if (!alpha) continue;
        const d = pixelIndex(out, x + dx, y + dy);
        if (d < 0) continue;
        const a = alpha / 255, under = out.pixels[d + 3] / 255;
        for (let k = 0; k < 3; k++) out.pixels[d + k] = Math.round(image.pixels[s + k] * a + out.pixels[d + k] * (1 - a));
        out.pixels[d + 3] = Math.round(255 * (a + under * (1 - a)));
      }
  return out;
}

/**
 * 완성 그림(옷과 머리를 입은 서기)과 기본 몸 서기를 비교해 부품을 떼어 낸다.
 * 두 그림에서 색이 다른 불투명 픽셀 중 keep(r,g,b,x,y)가 참인 것만 남긴다.
 */
export function extractPart(dressed, base, keep, tolerance = 24) {
  const out = emptyLike(dressed);
  for (let y = 0; y < dressed.height; y++)
    for (let x = 0; x < dressed.width; x++) {
      const i = pixelIndex(dressed, x, y);
      if (!dressed.pixels[i + 3]) continue;
      const j = pixelIndex(base, x, y);
      const same = j >= 0 && base.pixels[j + 3] &&
        [0, 1, 2].every((k) => Math.abs(dressed.pixels[i + k] - base.pixels[j + k]) <= tolerance);
      if (same) continue;
      const [r, g, b] = dressed.pixels.subarray(i, i + 3);
      if (keep(r, g, b, x, y)) out.pixels.set(dressed.pixels.subarray(i, i + 4), i);
    }
  return out;
}
