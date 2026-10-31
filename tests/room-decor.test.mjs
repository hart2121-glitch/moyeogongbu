// 회사 방 공용 꾸밈 (꾸미기 슬롯 계획 2절, 2026-11-01 사용자 결정): 방장이 휴게실 소파 쿠션, 탁자 위, 러그, 출입구 매트를
// 자기 코인으로 사서 갈아 끼우고, 화이트보드 문구를 무료로 바꾼다. 같은 방 멤버 화면에도 같게 보인다.
// EVIDENCE_DIR가 있으면 증거를 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { createFakeServer, FAKE_USER_ID, mockSupabase, SEED_ROOM } from "./supabaseMock.mjs";

const url = process.env.APP_URL || "http://127.0.0.1:4173/";
const evidence = process.env.EVIDENCE_DIR;
const viewport = { width: 1440, height: 900 };
const COMEMBER = "00000000-0000-4000-8000-000000000041";
const launch = () =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const shot = async (page, name, locator = page) => {
  if (!evidence) return;
  mkdirSync(evidence, { recursive: true });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await locator.screenshot({ path: join(evidence, name) });
};
/** 방에 놓인 공용 꾸밈: "자리:아이템" 목록 (기본 러그는 방 그림 그대로라 그림이 없다). */
const decor = (page) =>
  page.evaluate(() => [...document.querySelectorAll(".room-decor")].map((i) => `${i.dataset.slot}:${i.dataset.item}`));
const board = (page) => page.getByTestId("room-sign-board").textContent();
const enter = async (page) => {
  await page.goto(`${url}rooms/${SEED_ROOM.id}`);
  await page.locator(".company-toolbar").getByText(SEED_ROOM.name).waitFor();
};
const DEFAULT = ["cushions:cushions-cat", "table:table-cat", "mat:mat-cat"];

test("공용 꾸밈: 방장이 러그와 쿠션을 사서 놓고 화이트보드 문구를 바꾸면 같은 방 멤버 화면에도 보인다", async () => {
  const browser = await launch();
  const errors = [];
  try {
    // 준비: 코인 3000을 가진 방장과, 먼저 방에 들어와 있는 멤버
    const server = createFakeServer();
    const owner = await (await browser.newContext({ viewport })).newPage();
    owner.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(owner, { server, balance: 3000 });
    server.addMember(SEED_ROOM.id, COMEMBER, "로아");
    const member = await (await browser.newContext({ viewport })).newPage();
    member.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(member, { server, userId: COMEMBER, displayName: "로아", seedRoom: false });
    await enter(member);
    await enter(owner);

    // 확인: 처음에는 원래 그림과 같은 기본 꾸밈(고양이 쿠션, 고양이 인형과 간식, 고양이 매트)과 기본 문구
    assert.deepEqual(await decor(owner), DEFAULT);
    assert.equal(await board(owner), "오늘도\n수고했어요!");
    assert.equal(await member.getByTestId("owner-tools").count(), 0);

    // 실행: 방장 도구에서 분홍 러그를 골라 가격을 확인하고 사서 놓는다
    const tools = owner.getByTestId("owner-tools");
    await tools.locator("summary").click();
    await tools.getByTestId("owner-decor-balance").getByText("지금 가진 코인 3000").waitFor();
    // 확인: 자리마다 네 가지이고, 기본 러그를 뺀 열다섯 아이템 그림이 모두 실제로 불러와진다
    await owner.waitForFunction(() => [...document.querySelectorAll(".owner-decor-thumb img")].every((i) => i.complete));
    assert.deepEqual(
      await tools.locator(".owner-decor-row").evaluateAll((rows) => rows.map((r) => `${r.dataset.slot}:${r.querySelectorAll(".owner-decor-option").length}`)),
      ["cushions:4", "table:4", "rug:4", "mat:4"],
    );
    assert.deepEqual(
      await tools.locator(".owner-decor-thumb img").evaluateAll((imgs) => imgs.filter((i) => i.naturalWidth === 0).map((i) => i.src)),
      [],
    );
    assert.equal(await tools.locator(".owner-decor-thumb img").count(), 15);
    await tools.getByRole("button", { name: "휴게실 러그, 분홍 러그, 1800코인" }).click();
    await tools.getByRole("group", { name: "분홍 러그 구매 확인" }).waitFor();
    await tools.getByRole("button", { name: "분홍 러그 사서 놓기" }).click();
    await tools.getByText("분홍 러그을(를) 사서 휴게실에 놓았어요.").waitFor();

    // 확인: 러그가 깔리고, 코인이 줄고, 산 러그는 이제 "놓여 있어요"
    await owner.locator('.room-decor[data-slot="rug"][data-item="rug-pink"]').waitFor();
    await tools.getByTestId("owner-decor-balance").getByText("지금 가진 코인 1200").waitFor();
    assert.equal(await tools.getByRole("button", { name: "휴게실 러그, 분홍 러그" }).getAttribute("aria-pressed"), "true");

    // 실행과 확인: 하트 쿠션을 사서 놓은 뒤, 가진 기본 쿠션은 누르면 바로 다시 놓인다
    await tools.getByRole("button", { name: "소파 쿠션, 하트 쿠션, 900코인" }).click();
    await tools.getByRole("button", { name: "하트 쿠션 사서 놓기" }).click();
    await owner.locator('.room-decor[data-slot="cushions"][data-item="cushions-heart"]').waitFor();
    await tools.getByRole("button", { name: "소파 쿠션, 고양이 쿠션" }).click();
    await owner.locator('.room-decor[data-slot="cushions"][data-item="cushions-cat"]').waitFor();
    await tools.getByRole("button", { name: "소파 쿠션, 하트 쿠션" }).click();
    await owner.locator('.room-decor[data-slot="cushions"][data-item="cushions-heart"]').waitFor();

    // 실행과 확인: 코인이 모자란 하늘 러그는 얼마가 더 필요한지만 알려 주고 살 수 없다
    await tools.getByRole("button", { name: "휴게실 러그, 하늘 러그, 2400코인" }).click();
    const sky = tools.getByRole("group", { name: "하늘 러그 구매 확인" });
    await sky.getByText("2,100코인이 더 모이면 살 수 있어요.").waitFor();
    assert.equal(await sky.getByRole("button", { name: "하늘 러그 사서 놓기" }).count(), 0);
    await sky.getByRole("button", { name: "그만두기" }).click();

    // 실행과 확인: 화이트보드 문구. 한 줄이 12자를 넘으면 막고, 두 줄 문구는 그대로 올라간다
    const text = tools.getByLabel("두 줄, 줄마다 12자까지");
    await text.fill("열세 글자가 넘는 아주 긴 문구");
    await tools.getByRole("button", { name: "문구 바꾸기" }).click();
    await tools.getByText("화이트보드에는 2줄, 줄마다 12자까지 쓸 수 있어요.").waitFor();
    assert.equal(await board(owner), "오늘도\n수고했어요!");
    await text.fill("시험 기간\n다 같이 힘내요!");
    await tools.getByRole("button", { name: "문구 바꾸기" }).click();
    await tools.getByText("화이트보드 문구를 바꿨어요.").waitFor();
    assert.equal(await board(owner), "시험 기간\n다 같이 힘내요!");
    assert.equal(server.rooms.get(SEED_ROOM.id).board_text, "시험 기간\n다 같이 힘내요!");

    // 확인: 먼저 들어와 있던 멤버 화면에도 같은 꾸밈과 문구가 보인다
    const expected = ["rug:rug-pink", "cushions:cushions-heart", "table:table-cat", "mat:mat-cat"];
    await member.waitForFunction(
      (want) => [...document.querySelectorAll(".room-decor")].map((i) => `${i.dataset.slot}:${i.dataset.item}`).join() === want,
      expected.join(),
      { timeout: 20000 },
    );
    await member.getByTestId("room-sign-board").getByText("다 같이 힘내요!").waitFor({ timeout: 20000 });
    await shot(owner, "room-decor-owner-tools.png", tools);
    await shot(member, "room-decor-member.png", member.locator(".company-viewport"));

    // 실행과 확인: 빈 문구는 기본 문구로 되돌린다
    await text.fill("");
    await tools.getByRole("button", { name: "문구 바꾸기" }).click();
    await tools.getByText("화이트보드를 기본 문구로 되돌렸어요.").waitFor();
    assert.equal(await board(owner), "오늘도\n수고했어요!");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("공용 꾸밈: 멤버는 바꿀 수 없고, 방장도 사지 않은 아이템은 놓을 수 없다 (서버 판정)", async () => {
  // 준비: 방장과 멤버, 아무것도 사지 않은 상태
  const server = createFakeServer();
  const browser = await launch();
  try {
    const owner = await (await browser.newContext({ viewport })).newPage();
    await mockSupabase(owner, { server });
    server.addMember(SEED_ROOM.id, COMEMBER, "로아");
    const member = await (await browser.newContext({ viewport })).newPage();
    await mockSupabase(member, { server, userId: COMEMBER, displayName: "로아", seedRoom: false });
    await enter(owner);
    await enter(member);
    const call = (page, fn, args) =>
      page.evaluate(
        async ([fn, args]) => {
          const res = await fetch(`http://127.0.0.1:54321/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: { "content-type": "application/json", apikey: "test-anon-key" },
            body: JSON.stringify(args),
          });
          return { status: res.status, body: await res.text() };
        },
        [fn, args],
      );

    // 실행: 멤버가 꾸밈과 문구를 바꾸려 하고, 방장이 사지 않은 러그를 놓으려 한다
    const byMember = await call(member, "set_room_decor", { p_room: SEED_ROOM.id, p_slot: "rug", p_item: "rug-beige" });
    const boardByMember = await call(member, "set_room_board", { p_room: SEED_ROOM.id, p_text: "안녕" });
    const notOwned = await call(owner, "set_room_decor", { p_room: SEED_ROOM.id, p_slot: "rug", p_item: "rug-pink" });
    const wrongSlot = await call(owner, "set_room_decor", { p_room: SEED_ROOM.id, p_slot: "rug", p_item: "mat-cat" });

    // 확인: 모두 거절되고 방은 그대로다
    assert.match(byMember.body, /not_owner/);
    assert.match(boardByMember.body, /not_owner/);
    assert.match(notOwned.body, /not_owned/);
    assert.match(wrongSlot.body, /not_owned/);
    const room = server.rooms.get(SEED_ROOM.id);
    assert.deepEqual([room.decor.rug, room.board_text], ["rug-beige", null]);
    void FAKE_USER_ID;
  } finally {
    await browser.close();
  }
});
