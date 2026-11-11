import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createFakeServer, FAKE_USER_ID, mockSupabase, SECOND_USER_ID, SEED_ROOM } from "./supabaseMock.mjs";

// Story 011: 공용 스터디카페. 초대 코드 없이 들어가는 실시간 공부방, 친구 따라가기, 가득 차면 옆 카페. 증거 스크린샷을 남긴다.
const url = process.env.APP_URL || "http://127.0.0.1:4173/";
const evidence = "production/qa/evidence/story-011-public-cafe";
const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
const viewport = { width: 1536, height: 1024 };
const shot = (page, name) => page.screenshot({ path: `${evidence}/${name}`, fullPage: true });
const cafes = (server) => [...server.rooms.values()].filter((r) => r.kind === "cafe");
const arrived = (page) => page.getByTestId("movement-status").filter({ hasText: "출입구에 도착" }).waitFor({ timeout: 20000 });

test("공용 카페: 로비에서 들어가 앉고, 친구가 같은 카페로 따라오고, 카페는 내 방 목록에 없다", async () => {
  await mkdir(evidence, { recursive: true });
  const browser = await launch();
  let browserB;
  try {
    // Arrange: 밍구와 두리는 친구다. 아직 카페가 없다.
    const server = createFakeServer();
    server.addFriend(FAKE_USER_ID, SECOND_USER_ID);
    const a = await (await browser.newContext({ viewport })).newPage();
    browserB = await launch();
    const b = await (await browserB.newContext({ viewport })).newPage();
    const errors = [];
    a.on("pageerror", (e) => errors.push(e.message));
    b.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(a, { server });
    await mockSupabase(b, { server, userId: SECOND_USER_ID, displayName: "두리" });

    // Act: 밍구가 로비 모니터의 카페 줄로 들어간다.
    await a.goto(url);
    const cafeRow = a.getByTestId("monitor-cafe");
    await cafeRow.filter({ hasText: "아직 아무도 없어요" }).waitFor();
    await cafeRow.click();
    await a.getByRole("heading", { name: "공용 스터디카페", exact: true }).waitFor();
    await arrived(a);

    // Assert: 카페 하나가 열렸고, 초대 코드와 방장 도구, 친구 초대가 없다.
    assert.equal(new URL(a.url()).pathname, "/cafe");
    assert.equal(cafes(server).length, 1);
    assert.match(await a.locator(".company-toolbar").innerText(), /6석, 지금 1명/);
    assert.equal(await a.getByRole("button", { name: "방장 도구", exact: true }).count(), 0);
    assert.equal(await a.getByRole("button", { name: "친구 초대", exact: true }).count(), 0);
    assert.equal(await a.getByRole("button", { name: "카운터로 가기", exact: true }).count(), 1);
    assert.equal(await a.getByRole("button", { name: "나가기", exact: true }).count(), 1);
    await a.getByRole("button", { name: "1번 좌석", exact: true }).click();
    await a.getByTestId("movement-status").filter({ hasText: "1번 좌석 착석" }).waitFor({ timeout: 20000 });
    await shot(a, "cafe-seated.png");

    // Act: 두리의 로비에는 카페 인원이 보이고, 친구 목록에서 밍구를 따라 같은 카페로 간다.
    await b.goto(url);
    await b.getByTestId("monitor-cafe").filter({ hasText: "1명 공부 중" }).waitFor({ timeout: 10000 });
    await b.getByRole("navigation").getByRole("button", { name: "친구 목록", exact: true }).click();
    const friend = b.locator(".friend", { hasText: "밍구" });
    await friend.filter({ hasText: "공용 스터디카페에서" }).waitFor({ timeout: 10000 });
    await shot(b, "friends-in-cafe.png");
    await friend.getByRole("button", { name: "같이 공부하기", exact: true }).click();
    await b.getByRole("heading", { name: "공용 스터디카페", exact: true }).waitFor();
    await arrived(b);

    // Assert: 같은 카페, 서로의 캐릭터가 보이고 인원이 2명이다.
    assert.equal(new URL(b.url()).searchParams.get("with"), cafes(server)[0].id);
    assert.equal(cafes(server).length, 1);
    await a.getByTestId("remote-character").waitFor({ timeout: 10000 });
    await a.locator(".company-toolbar").filter({ hasText: "지금 2명" }).waitFor({ timeout: 10000 });
    await b.getByRole("button", { name: "2번 좌석", exact: true }).click();
    await b.getByTestId("movement-status").filter({ hasText: "2번 좌석 착석" }).waitFor({ timeout: 20000 });
    await a.waitForFunction(() => document.querySelector('.seat-marker[aria-label="2번 좌석"]')?.disabled, {}, { timeout: 10000 });
    await a.waitForFunction(() => document.querySelector('[data-testid="remote-character"]')?.dataset.activity === "seated", {}, { timeout: 20000 });
    await shot(a, "cafe-two-people.png");

    // 카페는 내 방 목록에 남지 않는다.
    await a.getByRole("navigation").getByRole("button", { name: "스터디룸", exact: true }).click();
    await a.getByRole("button", { name: `${SEED_ROOM.name} 입장`, exact: true }).waitFor();
    assert.ok(!(await a.locator(".study-room-list").innerText()).includes("공용 스터디카페"));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await browserB?.close();
  }
});

test("공용 카페: 여섯 명이 차면 옆 카페가 열리고, 가득 찬 친구 카페로는 들어가지 못한다", async () => {
  await mkdir(evidence, { recursive: true });
  const browser = await launch();
  try {
    // Arrange: 첫 카페에 여섯 명이 있다.
    const server = createFakeServer();
    const full = server.addRoom({ name: "공용 스터디카페", kind: "cafe" });
    for (let i = 0; i < 6; i++) {
      const id = `00000000-0000-4000-8000-0000000001${String(i).padStart(2, "0")}`;
      server.addMember(full, id, `손님${i + 1}`);
      server.addPresence(full, id);
    }
    const page = await (await browser.newContext({ viewport })).newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(page, { server });

    // Act: 가득 찬 카페로 따라가려 한다.
    await page.goto(new URL(`/cafe?with=${full}`, url).href);
    const blocked = page.getByTestId("cafe-error");
    await blocked.filter({ hasText: "그 카페는 자리가 다 찼어요." }).waitFor({ timeout: 10000 });
    await shot(page, "cafe-full.png");

    // Assert: 다른 카페로 가면 새 카페가 열리고 그곳에 들어간다.
    await blocked.getByRole("button", { name: "다른 카페로 가기", exact: true }).click();
    await page.getByRole("heading", { name: "공용 스터디카페", exact: true }).waitFor();
    await arrived(page);
    assert.equal(cafes(server).length, 2);
    const mine = cafes(server).find((r) => r.id !== full);
    assert.ok(server.members.get(mine.id).has(FAKE_USER_ID));
    assert.ok(!server.members.get(full).has(FAKE_USER_ID));
    assert.match(await page.locator(".company-toolbar").innerText(), /지금 1명/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
