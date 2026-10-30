// Story 003: 코인 표시와 정산 카드 브라우저 테스트. EVIDENCE_DIR가 있으면 증거 스크린샷을 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { mockSupabase } from "./supabaseMock.mjs";

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

/** 지난 정산 고정값 (가짜 서버 응답). */
const PENDING = {
  day: "2026-10-29",
  study_seconds: 3 * 3600 + 12 * 60 + 40,
  coins: { study: 192, pomodoro: 15, todo: 6 },
  total: 213,
  balance: 553,
};

test("퇴근 없이 닫은 날은 로비 위에 지난 정산이 한 번 뜨고, 로비 코인은 서버 잔액이다", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const state = await mockSupabase(page, { balance: 553, pendingSettlement: PENDING });
    await page.goto(url);
    const popup = page.getByRole("dialog", { name: "지난 정산" });
    await popup.waitFor();
    const text = await popup.innerText();
    assert.match(text, /10월 29일/);
    assert.match(text, /3시간 12분/);
    assert.ok(!text.includes("·"));
    assert.equal(await page.getByTestId("settlement-balance").innerText(), "553");
    await page.waitForFunction(() => [...document.querySelectorAll(".desk-character img")].some((img) => img.naturalWidth > 0));
    await shot(page, "last-settlement-popup.png");
    await popup.getByRole("button", { name: "닫기", exact: true }).click();
    await popup.waitFor({ state: "detached" });
    assert.ok(state.calls.some((c) => c.endsWith("/rpc/dismiss_settlement")));
    assert.equal(state.pending, null);
    assert.equal(await page.locator(".wallet").innerText(), "553");
    await shot(page, "lobby-server-coins.png");
  } finally {
    await browser.close();
  }
});

test("앉으면 툴바에 근무 시간과 코인, 퇴근하면 오늘의 정산 카드 뒤 로비", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const state = await mockSupabase(page, { balance: 340 });
    state.study.closedSeconds = 2 * 3600 + 5 * 60;
    await page.goto(url);
    await page.getByRole("navigation").getByRole("button", { name: "스터디룸", exact: true }).click();
    await page.getByLabel("방 이름", { exact: true }).fill("코인 테스트 회사");
    await page.getByRole("button", { name: "방 만들기", exact: true }).click();
    await page.getByRole("button", { name: "만든 방 입장하기", exact: true }).click();
    await page.getByTestId("movement-status").filter({ hasText: "출입구에 도착" }).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "1번 좌석", exact: true }).click();
    await page.getByTestId("movement-status").filter({ hasText: "1번 좌석 착석" }).waitFor({ timeout: 20000 });
    const coins = page.getByTestId("today-coins");
    await coins.filter({ hasText: "125" }).waitFor();
    const bar = await page.getByTestId("study-session").innerText();
    assert.match(bar, /오늘 근무/);
    assert.ok(!bar.includes("·"));
    await shot(page, "room-toolbar-time-coins.png");
    await page.getByRole("button", { name: "퇴근하기", exact: true }).click();
    const card = page.getByRole("dialog", { name: "오늘의 정산" });
    await card.waitFor({ timeout: 20000 });
    assert.match(await card.innerText(), /근무 시간/);
    assert.ok(state.calls.some((c) => c.endsWith("/rpc/settle_study")));
    await shot(page, "today-settlement-card.png");
    await card.getByRole("button", { name: "로비로 가기", exact: true }).click();
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor({ timeout: 20000 });
    assert.equal(await page.getByRole("dialog").count(), 0);
  } finally {
    await browser.close();
  }
});
