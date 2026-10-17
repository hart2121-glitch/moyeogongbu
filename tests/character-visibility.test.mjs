import { test } from "node:test";
import assert from "node:assert/strict";
import { companyLayout } from "../src/study/companyLayout.js";
import { getCharacterOcclusion } from "../src/study/characterVisibility.js";

test("인물 없는 최종 의자에는 독립 캐릭터를 표시하고 고정 인물을 추가하지 않음", () => {
  assert.equal(companyLayout.backgroundPeople.length, 0);
  for (const seat of companyLayout.seats) {
    assert.equal(
      getCharacterOcclusion(
        {
          position: companyLayout.nodes[seat.node],
          activity: "seated",
          edge: null,
        },
        companyLayout,
      ),
      null,
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
