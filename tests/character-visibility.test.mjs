import { test } from "node:test";
import assert from "node:assert/strict";
import { companyLayout } from "../src/study/companyLayout.js";
import { getCharacterOcclusion } from "../src/study/characterVisibility.js";

test("배경 인물과 겹치는 접근 구간과 착석에서는 독립 캐릭터 중복 표시 방지", () => {
  for (const seat of companyLayout.seats) {
    const position = companyLayout.nodes[seat.node];
    assert.equal(
      getCharacterOcclusion(
        { position, activity: "walking", edge: null },
        companyLayout,
      ),
      "background-person",
    );
    assert.equal(
      getCharacterOcclusion(
        { position, activity: "seated", edge: null },
        companyLayout,
      ),
      "seated",
    );
  }
  for (const node of ["entrance", "sofa", "restroom", "loungeFloor"]) {
    assert.equal(
      getCharacterOcclusion(
        { position: companyLayout.nodes[node], activity: "idle", edge: null },
        companyLayout,
      ),
      null,
    );
  }
});
test("휴게실 경계는 양방향 모두 문 통과 가림 처리", () => {
  for (const edge of companyLayout.portalEdges) {
    for (const direction of [edge, [...edge].reverse()]) {
      assert.equal(
        getCharacterOcclusion(
          {
            position: companyLayout.nodes[direction[0]],
            activity: "walking",
            edge: direction,
          },
          companyLayout,
        ),
        "doorway",
      );
    }
  }
});
