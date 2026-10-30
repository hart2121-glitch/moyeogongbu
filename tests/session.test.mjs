// Story 002: 공부 세션 상태 기계 단위 테스트. 시계는 숫자로 주입하고 서버는 쓰지 않는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SESSION_CONFIG as config } from "../src/features/session/model/sessionConfig.ts";
import {
  dayStartOf,
  initialSessionState,
  serverStateOf,
  sessionReducer,
  todaySeconds,
  validCustomMinutes,
} from "../src/features/session/model/sessionMachine.ts";

const MIN = 60_000;
const T0 = Date.parse("2026-10-30T01:00:00Z");
const run = (events, start = initialSessionState(T0)) =>
  events.reduce((s, e) => sessionReducer(s, e, config), start);

test("앉으면 공부 중, 휴식이나 화장실로 일어나면 쉬는 중, 퇴근하면 퇴근", () => {
  const seated = run([{ type: "seat", now: T0 }]);
  assert.equal(serverStateOf(initialSessionState(T0)), "break");
  assert.equal(serverStateOf(seated), "studying");
  assert.equal(serverStateOf(run([{ type: "unseat", now: T0 + MIN }], seated)), "break");
  assert.equal(serverStateOf(run([{ type: "leave", now: T0 + MIN }], seated)), "left");
});

test("60분 입력이 없으면 체크인, 응답하면 계속 공부", () => {
  const s = run([{ type: "seat", now: T0 }, { type: "tick", now: T0 + config.checkInAfterMs }]);
  assert.deepEqual(s.prompt, { kind: "checkIn", shownAt: T0 + config.checkInAfterMs });
  assert.equal(serverStateOf(s), "studying");
  const answered = run([{ type: "respond", now: T0 + config.checkInAfterMs + MIN }], s);
  assert.equal(answered.prompt, null);
  assert.equal(serverStateOf(answered), "studying");
});

test("입력이 있으면 체크인이 미뤄진다", () => {
  const s = run([
    { type: "seat", now: T0 },
    { type: "input", now: T0 + 30 * MIN },
    { type: "tick", now: T0 + config.checkInAfterMs },
  ]);
  assert.equal(s.prompt, null);
});

test("체크인에 5분 무응답이면 자리 비움, 끊긴 시각은 문구를 띄운 시각", () => {
  const shown = T0 + config.checkInAfterMs;
  const s = run([
    { type: "seat", now: T0 },
    { type: "tick", now: shown },
    { type: "tick", now: shown + config.responseWaitMs },
  ]);
  assert.equal(serverStateOf(s), "away");
  assert.equal(s.awaySince, shown);
  const back = run([{ type: "respond", now: shown + config.responseWaitMs + MIN }], s);
  assert.equal(serverStateOf(back), "studying");
});

test("뽀모도로 중에는 체크인하지 않고, 휴식 동안은 앉아 있어도 빼며 끝나면 다시 센다", () => {
  const start = run([
    { type: "seat", now: T0 },
    { type: "startPomodoro", now: T0, studyMinutes: 25, breakMinutes: 5 },
  ]);
  const atEnd = run([{ type: "tick", now: T0 + 25 * MIN }], start);
  assert.deepEqual(atEnd.prompt, { kind: "pomodoroEnd", shownAt: T0 + 25 * MIN });
  assert.equal(serverStateOf(atEnd), "break");
  const answered = run([{ type: "respond", now: T0 + 26 * MIN }], atEnd);
  assert.equal(serverStateOf(answered), "break");
  const resumed = run([{ type: "tick", now: T0 + 30 * MIN }], answered);
  assert.equal(resumed.pomodoro.phase, "study");
  assert.equal(serverStateOf(resumed), "studying");
  // 뽀모도로 공부 단계가 60분보다 길어도 체크인 문구는 뜨지 않는다.
  const long = run([
    { type: "seat", now: T0 },
    { type: "startPomodoro", now: T0, studyMinutes: 60, breakMinutes: 5 },
    { type: "tick", now: T0 + 60 * MIN - 1 },
  ]);
  assert.equal(long.prompt, null);
});

test("뽀모도로 종료 알림에 5분 무응답이면 체크인과 똑같이 자리 비움", () => {
  const s = run([
    { type: "seat", now: T0 },
    { type: "startPomodoro", now: T0, studyMinutes: 25, breakMinutes: 5 },
    { type: "tick", now: T0 + 25 * MIN },
    { type: "tick", now: T0 + 30 * MIN },
  ]);
  assert.equal(serverStateOf(s), "away");
  assert.equal(s.awaySince, T0 + 25 * MIN);
});

test("직접 설정은 공부 20~60분 정수만 받는다", () => {
  assert.equal(validCustomMinutes(20, config), 20);
  assert.equal(validCustomMinutes(60, config), 60);
  assert.equal(validCustomMinutes(19, config), null);
  assert.equal(validCustomMinutes(61, config), null);
  assert.equal(validCustomMinutes(30.5, config), null);
});

test("하루는 한국 시간 오전 5시에 바뀌고, 열린 구간은 경계 이후만 오늘로 센다", () => {
  // 한국 시간 2026-10-31 05:00 = 2026-10-30T20:00Z
  const boundary = Date.parse("2026-10-30T20:00:00Z");
  assert.equal(dayStartOf(boundary, config), boundary);
  assert.equal(dayStartOf(boundary - 1, config), boundary - 86_400_000);
  assert.equal(dayStartOf(boundary + 3_600_000, config), boundary);
  const now = boundary + 10 * MIN;
  assert.equal(todaySeconds({ closedSeconds: 0, openSince: boundary - 30 * MIN }, now, config), 600);
  assert.equal(todaySeconds({ closedSeconds: 60, openSince: null }, now, config), 60);
});
