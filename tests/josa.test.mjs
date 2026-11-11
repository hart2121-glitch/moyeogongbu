import { test } from "node:test";
import assert from "node:assert/strict";
import { objectParticle } from "../src/lib/josa.ts";

// 화면 문구의 목적격 조사. "카멜 러그을(를)"처럼 두 꼴을 함께 쓰지 않는다.
test("받침이 없으면 '를', 있으면 '을'을 붙인다", () => {
  assert.equal(objectParticle("카멜 러그"), "카멜 러그를");
  assert.equal(objectParticle("소파 쿠션"), "소파 쿠션을");
});

test("마지막 글자가 한글이 아니면 두 꼴을 함께 쓴다", () => {
  assert.equal(objectParticle("LED"), "LED을(를)");
  assert.equal(objectParticle(""), "을(를)");
});
