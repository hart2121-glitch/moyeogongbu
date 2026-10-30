import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createFakeServer, mockSupabase, SECOND_USER_ID, SEED_ROOM } from "./supabaseMock.mjs";

// Story 004: 두 사용자가 같은 방에 있는 화면 (가짜 Realtime). 증거 스크린샷을 남긴다.
const url = process.env.APP_URL || "http://127.0.0.1:4173/";
const evidence = "production/qa/evidence/story-004-realtime-room";
const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
const viewport = { width: 1536, height: 1024 };
const shot = (page, name) => page.screenshot({ path: `${evidence}/${name}`, fullPage: true });
async function enterQuick(page) {
  await page.goto(url);
  await page.getByRole("button", { name: / 방으로 출근$/ }).first().click();
  await page.getByTestId("movement-status").filter({ hasText: "출입구에 도착" }).waitFor({ timeout: 20000 });
}
async function floor(page, p) {
  const r = await page.getByTestId("company-stage").boundingBox();
  await page.mouse.click(r.x + r.width * p.x, r.y + r.height * p.y);
}

test("두 사람이 같은 방: 이동 재생, 이름표와 마우스 올림, 반응 3초와 5초 간격, 방장 도구와 강퇴, 방이 가득 찼어요", async () => {
  await mkdir(evidence, { recursive: true });
  const browser = await launch();
  let browserB;
  try {
    // Arrange: 밍구(방장)와 두리(멤버)가 기본 방에 있다. 두리는 공부 중이고 지금 하는 일을 공개했다.
    const server = createFakeServer();
    const ctxA = await browser.newContext({ viewport });
    // 사용자마다 다른 브라우저: 같은 브라우저의 뒤쪽 페이지는 requestAnimationFrame이 멈춰 걷기 재생이 진행되지 않는다.
    browserB = await launch();
    const ctxB = await browserB.newContext({ viewport });
    const a = await ctxA.newPage(),
      b = await ctxB.newPage();
    const errors = [];
    a.on("pageerror", (e) => errors.push(e.message));
    b.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(a, { server });
    await mockSupabase(b, { server, userId: SECOND_USER_ID, displayName: "두리" });
    server.addMember(SEED_ROOM.id, SECOND_USER_ID, "두리");
    server.tasks.set(SECOND_USER_ID, { task: "영어 단어 50개", shared: true });

    // 방 목록 (내 방 목록, 만들기, 코드로 들어가기)
    await a.goto(url);
    await a.getByRole("navigation").getByRole("button", { name: "스터디룸", exact: true }).click();
    await a.getByRole("heading", { name: "내 방 목록", exact: true }).waitFor();
    await a.getByRole("button", { name: `${SEED_ROOM.name} 입장`, exact: true }).waitFor();
    assert.ok(!(await a.locator(".study-room-list").innerText()).includes("·"));
    await shot(a, "room-list.png");

    await enterQuick(a);
    await enterQuick(b);

    // Act: 두리가 바닥으로 걸어간다 (목적지만 전송, 밍구 화면이 같은 경로를 계산).
    const remote = a.getByTestId("remote-character");
    await remote.waitFor();
    await b.bringToFront();
    await floor(b, { x: 0.52, y: 0.9 });
    await a.waitForFunction(() => document.querySelector('[data-testid="remote-character"]')?.dataset.activity === "walking", {}, { timeout: 10000 });
    await b.waitForFunction(() => document.querySelector('[data-testid="study-character"]')?.dataset.activity === "idle", {}, { timeout: 20000 });
    await a.waitForFunction(() => document.querySelector('[data-testid="remote-character"]')?.dataset.activity === "idle", {}, { timeout: 20000 });
    const there = await b.getByTestId("study-character").evaluate((e) => [e.dataset.x, e.dataset.y]);
    const replayed = await remote.evaluate((e) => [e.dataset.x, e.dataset.y]);
    assert.deepEqual(replayed, there);

    // 두리가 2번 좌석에 앉는다. 밍구 화면에서도 앉고 좌석이 사용 중이 된다.
    await b.getByRole("button", { name: "2번 좌석", exact: true }).click();
    await b.getByTestId("movement-status").filter({ hasText: "2번 좌석 착석" }).waitFor({ timeout: 20000 });
    await a.waitForFunction(() => document.querySelector('[data-testid="remote-character"]')?.dataset.activity === "seated", {}, { timeout: 20000 });
    await a.waitForFunction(() => document.querySelector('.seat-marker[aria-label="2번 좌석"]')?.disabled, {}, { timeout: 10000 });
    await a.getByRole("button", { name: "3번 좌석", exact: true }).click();
    await a.getByTestId("movement-status").filter({ hasText: "3번 좌석 착석" }).waitFor({ timeout: 20000 });
    assert.match(await remote.locator(".character-name").innerText(), /두리/);
    assert.match(await a.getByTestId("study-character").locator(".character-name").innerText(), /밍구/);
    await shot(a, "room-two-characters.png");

    // 마우스 올림: 상태, 오늘 공부 시간, 공개한 지금 하는 일.
    server.studyState.set(SECOND_USER_ID, { state: "studying", seconds: 2 * 3600 + 5 * 60 });
    await a.reload();
    await a.getByTestId("remote-character").waitFor({ timeout: 20000 });
    await a.waitForFunction(() => document.querySelector('[data-testid="remote-character"]')?.dataset.activity === "seated", {}, { timeout: 20000 });
    const card = a.getByTestId("remote-character").locator(".character-card");
    await a.waitForFunction(
      () => document.querySelector('[data-testid="remote-character"] .character-card')?.textContent.includes("2시간 5분"),
      {},
      { timeout: 10000 },
    );
    await a.getByTestId("remote-character").hover();
    await card.waitFor({ state: "visible" });
    const cardText = await card.innerText();
    assert.match(cardText, /공부 중/);
    assert.match(cardText, /오늘 2시간 5분/);
    assert.match(cardText, /영어 단어 50개/);
    await shot(a, "hover-card.png");

    // 반응: 정해진 목록만, 3초 표시, 같은 사람은 5초에 한 번.
    await a.mouse.move(5, 5);
    await card.waitFor({ state: "hidden" });
    await b.getByRole("button", { name: "반응 불타오르네", exact: true }).click();
    const bubble = a.getByTestId("remote-character").getByTestId("character-reaction");
    await bubble.filter({ hasText: "🔥" }).waitFor({ timeout: 5000 });
    await shot(a, "reaction-above-head.png");
    await b.getByRole("button", { name: "반응 화이팅", exact: true }).click();
    await b.getByText("반응은 5초에 한 번 보낼 수 있어요.").waitFor();
    await bubble.waitFor({ state: "detached", timeout: 5000 });
    assert.equal(server.broadcasts.filter((m) => m.event === "reaction").length, 1);

    // 방장 도구: 이름 변경, 초대 코드 재발급, 강퇴, 풀어 주기.
    await a.getByText("방장 도구", { exact: true }).click();
    await a.getByLabel("방 이름", { exact: true }).fill("새 이름 회사");
    await a.getByRole("button", { name: "이름 바꾸기", exact: true }).click();
    await a.locator(".company-toolbar").filter({ hasText: "새 이름 회사" }).waitFor();
    const oldCode = server.rooms.get(SEED_ROOM.id).invite_code;
    await a.getByRole("button", { name: "초대 코드 재발급", exact: true }).click();
    await a.getByText("새 초대 코드를 만들었어요.").waitFor();
    assert.notEqual(server.rooms.get(SEED_ROOM.id).invite_code, oldCode);
    await shot(a, "owner-tools.png");
    await a.getByRole("button", { name: "두리 강퇴", exact: true }).click();
    await b.getByTestId("room-blocked").filter({ hasText: "멤버가 아니에요" }).waitFor({ timeout: 10000 });
    await b.getByRole("button", { name: "방 목록으로", exact: true }).click();
    await b.getByLabel("초대 코드", { exact: true }).fill(server.rooms.get(SEED_ROOM.id).invite_code);
    await b.getByRole("button", { name: "코드로 입장하기", exact: true }).click();
    await b.getByRole("alert").filter({ hasText: "방장이 풀어 주면" }).waitFor();
    await a.getByRole("button", { name: "두리 풀어 주기", exact: true }).click();
    await a.getByText("두리 님을 풀어 줬어요.").waitFor();
    await b.getByRole("button", { name: "코드로 입장하기", exact: true }).click();
    await b.getByTestId("movement-status").filter({ hasText: "출입구에 도착" }).waitFor({ timeout: 20000 });

    // 7번째 사람: 다른 6명이 이미 방 안에 있으면 "방이 가득 찼어요".
    const ctxC = await browser.newContext({ viewport });
    const c = await ctxC.newPage();
    const third = "00000000-0000-4000-8000-000000000003";
    await mockSupabase(c, { server, userId: third, displayName: "세나" });
    const crowded = server.addRoom({ name: "북적이는 회사", code: "MANY29", ownerId: "00000000-0000-4000-8000-000000000004" });
    server.addMember(crowded, third);
    for (let i = 4; i <= 9; i++) server.addPresence(crowded, `00000000-0000-4000-8000-00000000000${i}`);
    await c.goto(new URL(`/rooms/${crowded}`, url).href);
    await c.getByTestId("room-blocked").filter({ hasText: "방이 가득 찼어요" }).waitFor({ timeout: 10000 });
    await shot(c, "room-full.png");

    assert.deepEqual(errors, []);
    await Promise.all([ctxA.close(), ctxB.close(), ctxC.close()]);
  } finally {
    await browserB?.close();
    await browser.close();
  }
});

test("연결이 끊기면 공부 측정을 멈추고, 다시 연결되면 같은 자리에서 이어 간다", async () => {
  const browser = await launch();
  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const state = await mockSupabase(page);
    await enterQuick(page);
    await page.getByRole("button", { name: "1번 좌석", exact: true }).click();
    await page.getByTestId("movement-status").filter({ hasText: "1번 좌석 착석" }).waitFor({ timeout: 20000 });
    await page.waitForFunction(() => true);
    const deadline = Date.now() + 5000;
    while (state.study.state !== "studying" && Date.now() < deadline) await page.waitForTimeout(50);
    assert.equal(state.study.state, "studying");

    // Act: 브라우저가 오프라인이 된다.
    await context.setOffline(true);
    await page.getByText("연결이 끊겼어요.", { exact: false }).waitFor({ timeout: 5000 });
    // 측정 중지는 화면에서 바로 일어나고(오프라인이라 서버에는 못 보냄), 다시 연결되면 공부 중으로 돌아간다.
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.getByText("연결이 끊겼어요.", { exact: false }).waitFor({ state: "detached", timeout: 30000 });
    assert.equal(await page.getByTestId("study-character").getAttribute("data-activity"), "seated");
    assert.equal(state.server.seatHolder(state.server.rooms.keys().next().value, 1), state.profile.id);
    await context.close();
  } finally {
    await browser.close();
  }
});
