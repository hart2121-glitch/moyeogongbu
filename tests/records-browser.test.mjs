// Story 005: 할 일 가져오기, 공부 기록 화면, 날짜 상세, 방의 "지금 하는 일" 고르기 브라우저 테스트.
// EVIDENCE_DIR가 있으면 증거 스크린샷을 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { mockSupabase, SEED_ROOM } from "./supabaseMock.mjs";

const url = process.env.APP_URL || "http://127.0.0.1:4173/";
const evidence = process.env.EVIDENCE_DIR;
const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
const shot = async (page, name) => {
  if (!evidence) return;
  mkdirSync(evidence, { recursive: true });
  await page.screenshot({ path: join(evidence, name), fullPage: true });
};

const DAY = 86_400_000;
/** 가짜 서버와 같은 공부 날짜 (오전 5시 경계). */
const studyDay = (offsetDays) => new Date(Date.now() + 4 * 3600_000 + offsetDays * DAY).toISOString().slice(0, 10);

/** 1년 기록 고정값: 요일과 주에 따라 정해진 공부 시간 (난수 없음). */
function yearRecords() {
  const out = [];
  for (let i = 1; i < 365; i++) {
    const pattern = [0, 0.5, 2, 4, 7, 1.5, 0][(i * 3 + Math.floor(i / 7)) % 7];
    if (pattern) out.push({ day: studyDay(-i), seconds: Math.round(pattern * 3600), coins: Math.round(pattern * 60) });
  }
  return out;
}

test("어제 미완료 할 일 제안, 골라서 가져오기, 공부 기록과 날짜 상세, 방에서 할 일 고르기", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const state = await mockSupabase(page, {
      todos: [
        { text: "수학 문제집 3쪽", day: studyDay(-1) },
        { text: "영어 단어 30개", day: studyDay(-1) },
        { text: "독서 20분", day: studyDay(-1), done: true },
        { text: "지난주 정리 노트", day: studyDay(-5) },
        { text: "오늘 복습", day: studyDay(0) },
      ],
      records: yearRecords(),
    });

    // 새 날 처음 로비: 어제 미완료 두 개를 제안한다 (완료한 것은 빼고).
    await page.goto(url);
    const carry = page.getByRole("dialog");
    await carry.getByText("어제 끝내지 못한 할 일이 있어요. 오늘로 가져올까요?").waitFor();
    const carryText = await carry.innerText();
    assert.match(carryText, /수학 문제집 3쪽/);
    assert.match(carryText, /영어 단어 30개/);
    assert.ok(!carryText.includes("독서 20분"));
    assert.ok(!carryText.includes("·"));
    await page.waitForFunction(() => [...document.querySelectorAll(".desk-character img")].some((img) => img.naturalWidth > 0));
    await shot(page, "carry-over-modal.png");

    // 골라서 가져오기: 하나만 오늘로, 나머지는 어제에 남는다.
    const pickButton = carry.getByRole("button", { name: "골라서 가져오기", exact: true });
    assert.equal(await pickButton.isDisabled(), true);
    await carry.getByLabel("수학 문제집 3쪽").check();
    await pickButton.click();
    await carry.waitFor({ state: "detached" });
    await page.locator(".task-list").getByText("수학 문제집 3쪽").waitFor();
    assert.equal(state.todos.find((t) => t.text === "수학 문제집 3쪽").day, studyDay(0));
    assert.equal(state.todos.find((t) => t.text === "영어 단어 30개").day, studyDay(-1));
    // 목록은 만든 순서라 어제 만든 할 일이 먼저 온다 (서버와 같다).
    assert.deepEqual(await page.locator(".task-list li").allInnerTexts(), ["수학 문제집 3쪽", "오늘 복습"]);
    await shot(page, "lobby-server-todos.png");

    // 새로고침해도 다시 묻지 않는다 (그날 한 번).
    await page.reload();
    await page.locator(".task-list").getByText("오늘 복습").waitFor();
    await page.waitForTimeout(500);
    assert.equal(await page.getByRole("dialog").count(), 0);

    // 공부 기록: 오늘, 최근 7일, 1년 달력 (본인 기록만, 비교 요소 없음).
    await page.getByRole("navigation").getByRole("button", { name: "공부 기록", exact: true }).click();
    await page.getByRole("heading", { name: "1년 공부 달력" }).waitFor();
    assert.equal(await page.locator(".week-bar").count(), 7);
    assert.ok((await page.locator(".year-cell:not(.is-empty)").count()) >= 365);
    for (let level = 0; level <= 4; level++)
      assert.ok((await page.locator(`.year-grid .heat-${level}`).count()) > 0, `진하기 ${level}`);
    const recordsText = await page.locator(".content-panel").innerText();
    assert.ok(!recordsText.includes("·"));
    assert.ok(!/순위|랭킹|친구보다/.test(recordsText));
    assert.match(await page.getByTestId("records-today").innerText(), /0 \/ 2/);
    await shot(page, "records-page.png");

    // 막대를 누르면 그날 상세: 공부 시간, 코인, 완료한 할 일, 남은 할 일을 오늘로 옮기기.
    await page.locator(".week-bar").nth(5).click();
    const detail = page.getByTestId("day-detail");
    await detail.waitFor();
    await detail.getByText("독서 20분").waitFor();
    await detail.getByText("영어 단어 30개").waitFor();
    const detailText = await detail.innerText();
    assert.match(detailText, /공부 시간/);
    assert.match(detailText, /받은 코인/);
    assert.ok(!detailText.includes("·"));
    await shot(page, "day-detail.png");
    await detail.getByRole("button", { name: "오늘로 옮기기" }).click();
    await detail.getByText("오늘의 할 일로 옮겼어요.").waitFor();
    assert.equal(state.todos.find((t) => t.text === "영어 단어 30개").day, studyDay(0));
    await page.keyboard.press("Escape");

    // 잔디 칸: 더 오래된 날도 상세에서 옮길 수 있다.
    await page.locator(".year-grid").getByRole("button", { name: new RegExp(`^${Number(studyDay(-5).slice(5, 7))}월 ${Number(studyDay(-5).slice(8))}일 `) }).click();
    await page.getByTestId("day-detail").getByText("지난주 정리 노트").waitFor();
    await page.keyboard.press("Escape");

    // 방: 오늘의 미완료 할 일에서 "지금 하는 일"을 고르고, 공개는 사용자가 정한다.
    await page.goto(new URL(`/rooms/${SEED_ROOM.id}`, url).href);
    const bar = page.getByTestId("room-live-bar");
    await bar.waitFor();
    const picker = bar.getByLabel("오늘의 할 일에서 고르기");
    await picker.waitFor();
    const options = await picker.locator("option").allInnerTexts();
    assert.ok(options.includes("수학 문제집 3쪽"));
    assert.ok(options.includes("영어 단어 30개"));
    await picker.selectOption({ label: "수학 문제집 3쪽" });
    assert.equal(await bar.locator("#current-task").inputValue(), "수학 문제집 3쪽");
    await bar.getByLabel("공개").check();
    await bar.getByRole("button", { name: "저장", exact: true }).click();
    await bar.getByText("지금 하는 일을 저장했어요.").waitFor();
    assert.deepEqual(state.server.tasks.get(state.profile.id), { task: "수학 문제집 3쪽", shared: true });
    await shot(page, "room-current-task-picker.png");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("오늘 할 일은 30개까지만 추가된다", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const state = await mockSupabase(page, {
      todos: Array.from({ length: 30 }, (_, i) => ({ text: `할 일 ${i + 1}`, day: studyDay(0) })),
    });
    await page.goto(url);
    await page.locator(".task-list").getByText("할 일 30").waitFor();
    await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
    await page.getByText("하루에 할 일은 30개까지 둘 수 있어요.").waitFor();
    assert.equal(await page.getByRole("button", { name: "추가하기", exact: true }).isDisabled(), true);
    assert.equal(state.todos.length, 30);
  } finally {
    await browser.close();
  }
});
