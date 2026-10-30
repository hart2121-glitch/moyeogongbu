// Story 003: 코인 계산 경계값 단위 테스트. 서버 coin_rules 기본값과 같은 규칙 객체를 인자로 넣는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextPomodoroClaim, studyCoins, todayCoins } from "../src/features/coins/model/coinMath.ts";
import { workTimeText } from "../src/features/coins/model/coinConfig.ts";

/** 서버 `coin_rules` 시드와 같은 값 (테스트 고정값). */
const rules = Object.freeze({
  studyCoinsPerMinute: 1,
  studyDailyCoinCap: 600,
  pomodoroBonus: 5,
  pomodoroMinStudyMinutes: 20,
  pomodoroMaxStudyMinutes: 60,
  pomodoroDailyMax: 10,
  todoCoins: 2,
  todoDailyMax: 10,
});
const HOUR = 3600;
const MIN_MS = 60_000;

test("다 찬 1분마다 1코인, 남은 초는 코인이 되지 않는다", () => {
  assert.equal(studyCoins(0, rules), 0);
  assert.equal(studyCoins(59, rules), 0);
  assert.equal(studyCoins(60, rules), 1);
  assert.equal(studyCoins(119, rules), 1);
  // 같은 날 두 세션: 90초 + 30초 = 120초 → 2코인 (남은 초가 이어진다)
  assert.equal(studyCoins(90 + 30, rules), 2);
  assert.equal(studyCoins(HOUR, rules), 60);
});

test("하루 상한 10시간 600코인: 직전, 정확히, 직후", () => {
  assert.equal(studyCoins(10 * HOUR - 1, rules), 599);
  assert.equal(studyCoins(10 * HOUR, rules), 600);
  assert.equal(studyCoins(10 * HOUR + 60, rules), 600);
  assert.equal(studyCoins(14 * HOUR, rules), 600);
});

test("오늘 코인 합계는 지금 공부 초로 계산한 공부 코인에 보너스를 더한다", () => {
  assert.equal(todayCoins({ study: 0, pomodoro: 5, todo: 4 }, 25 * 60, rules), 25 + 5 + 4);
  assert.equal(todayCoins({ study: 600, pomodoro: 50, todo: 20 }, 12 * HOUR, rules), 670);
});

test("뽀모도로 보너스 요청은 공부 단계 종료마다 한 번, 20분 미만은 요청하지 않는다", () => {
  const end = Date.parse("2026-10-30T03:25:00Z");
  const pomodoro = { studyMs: 25 * MIN_MS };
  const prompt = { kind: "pomodoroEnd", shownAt: end };
  const claim = nextPomodoroClaim(prompt, pomodoro, null, rules);
  assert.deepEqual(claim, { cycleStartedAt: end - 25 * MIN_MS, studyMinutes: 25 });
  // 같은 사이클 중복 요청 없음
  assert.equal(nextPomodoroClaim(prompt, pomodoro, end, rules), null);
  // 다음 사이클은 다시 요청
  const next = { kind: "pomodoroEnd", shownAt: end + 30 * MIN_MS };
  assert.equal(nextPomodoroClaim(next, pomodoro, end, rules)?.cycleStartedAt, end + 5 * MIN_MS);
  // 경계: 20분은 요청, 19분은 요청 안 함, 체크인 안내는 무시
  assert.equal(nextPomodoroClaim(prompt, { studyMs: 20 * MIN_MS }, null, rules)?.studyMinutes, 20);
  assert.equal(nextPomodoroClaim(prompt, { studyMs: 19 * MIN_MS }, null, rules), null);
  assert.equal(nextPomodoroClaim({ kind: "checkIn", shownAt: end }, pomodoro, null, rules), null);
  assert.equal(nextPomodoroClaim(prompt, null, null, rules), null);
});

test("근무 시간 글자에는 가운뎃점이 없다", () => {
  assert.equal(workTimeText(3 * HOUR + 12 * 60 + 5), "3시간 12분");
  assert.equal(workTimeText(59), "0분");
  assert.ok(!workTimeText(HOUR).includes("·"));
});
