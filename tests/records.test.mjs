// Story 005: 공부 기록 순수 함수 (잔디 구간, 날짜 채우기, 주 열, 시간 문구, 공부 날짜).
import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarWeeks, fillDays, formatDuration, heatLevel, weekdayLabel } from "../src/features/records/model/recordMath.ts";
import { RECORDS_CONFIG } from "../src/features/records/model/recordsConfig.ts";
import { addDays, dayLabel, studyDayOf } from "../src/features/todos/model/dayMath.ts";
import { carryOverAsked, markCarryOverAsked } from "../src/features/todos/model/carryOver.ts";

const H = 3600;

test("잔디 진하기는 0분, 1시간 미만, 1~3시간, 3~6시간, 6시간 이상의 5단계", () => {
  const cases = [
    [0, 0],
    [59, 0],
    [60, 1],
    [H - 1, 1],
    [H, 2],
    [3 * H - 1, 2],
    [3 * H, 3],
    [6 * H - 1, 3],
    [6 * H, 4],
    [14 * H, 4],
  ];
  for (const [seconds, level] of cases) assert.equal(heatLevel(seconds, RECORDS_CONFIG), level, `${seconds}초`);
});

test("기록이 없는 날은 0으로 채워 기간의 모든 날이 있다", () => {
  const rows = [{ day: "2026-10-29", seconds: 120, coins: 2, todosDone: 1 }];
  const filled = fillDays(rows, "2026-10-27", "2026-10-30");
  assert.deepEqual(filled.map((d) => d.day), ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]);
  assert.equal(filled[2].seconds, 120);
  assert.equal(filled[3].seconds, 0);
  assert.equal(fillDays([], addDays("2026-10-30", -364), "2026-10-30").length, 365);
});

test("잔디 주 열은 월요일 시작이고 앞뒤 빈칸은 null", () => {
  // 2026-10-28은 수요일, 2026-11-03은 화요일.
  const weeks = calendarWeeks("2026-10-28", "2026-11-03");
  assert.equal(weeks.length, 2);
  assert.deepEqual(weeks[0].slice(0, 3), [null, null, "2026-10-28"]);
  assert.equal(weeks[0][6], "2026-11-01");
  assert.deepEqual(weeks[1].slice(0, 3), ["2026-11-02", "2026-11-03", null]);
  assert.ok(weeks.every((w) => w.length === 7));
  assert.equal(weekdayLabel("2026-10-30"), "금");
});

test("시간 문구와 날짜 문구에는 가운뎃점이 없다", () => {
  assert.equal(formatDuration(0), "0분");
  assert.equal(formatDuration(45 * 60 + 30), "45분");
  assert.equal(formatDuration(2 * H), "2시간");
  assert.equal(formatDuration(3 * H + 5 * 60), "3시간 5분");
  assert.equal(dayLabel("2026-10-30"), "10월 30일");
  for (const s of [formatDuration(3 * H + 60), dayLabel("2026-01-05")]) assert.ok(!s.includes("·"));
});

test("공부 날짜는 한국 시간 오전 5시에 바뀐다", () => {
  assert.equal(studyDayOf(Date.parse("2026-10-29T19:59:59Z"), 5), "2026-10-29"); // 한국 04:59:59
  assert.equal(studyDayOf(Date.parse("2026-10-29T20:00:00Z"), 5), "2026-10-30"); // 한국 05:00
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("어제 할 일 가져오기는 하루에 한 번만 묻는다", () => {
  const map = new Map();
  const storage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
  assert.equal(carryOverAsked(storage, "u1", "2026-10-30"), false);
  markCarryOverAsked(storage, "u1", "2026-10-30");
  assert.equal(carryOverAsked(storage, "u1", "2026-10-30"), true);
  assert.equal(carryOverAsked(storage, "u1", "2026-10-31"), false);
  assert.equal(carryOverAsked(storage, "u2", "2026-10-30"), false);
});
