// 내 방 꾸밈 (꾸미기 슬롯 계획 3절, 2026-11-01 사용자 결정: 가구, 벽지, 바닥까지 바꾼다): 꾸미기 "내 방" 탭에서 자리마다
// 아이템을 놓아 보고 그 자리에서 사서 저장하면, 로비 내 방에 그대로 그려진다. 2026-11-02: 테마(브라운, 화이트, 블랙, 앤티크)로
// 한 번에 놓아 볼 수 있고, 튀는 파스텔 아이템은 판매를 멈췄다. EVIDENCE_DIR가 있으면 증거를 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { createFakeServer, FAKE_USER_ID, mockSupabase } from "./supabaseMock.mjs";

const url = process.env.APP_URL || "http://127.0.0.1:4173/";
const evidence = process.env.EVIDENCE_DIR;
const viewport = { width: 1440, height: 900 };
const launch = () =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const shot = async (page, name, locator = page) => {
  if (!evidence) return;
  mkdirSync(evidence, { recursive: true });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await locator.screenshot({ path: join(evidence, name) });
};
const SAVED_LOOK = {
  body: "body-basic", face: "face-black", hair_back: "hair-basic", hair_front: "hair-basic", hair_color: "hair-color-black",
  outfit: "outfit-lavender", accessory: null, gender: "f", desk_left: "desk-lamp", desk_right: "desk-plant", desk_front: null,
};
const imagesLoaded = (page, selector) =>
  page.waitForFunction((sel) => [...document.querySelectorAll(sel)].every((i) => i.complete && i.naturalWidth > 0), selector);
/** 그림 층 "층:파일" 목록 (그리는 순서). 기본 아이템의 층 그림은 층 이름과 같은 파일이다. */
const layers = (page, root) =>
  page.locator(root).evaluate((node) =>
    [...node.querySelectorAll("img.home-room-part[data-slot]")].map((i) => `${i.dataset.slot}:${i.getAttribute("src").split("/").pop()}`),
  );
const place = async (page, region, name) => page.getByRole("region", { name: region, exact: true }).getByRole("button", { name: new RegExp(`^${name},`) }).click();
const isDefaultLayer = (l) => `${l.split(":")[0]}.png` === l.split(":")[1];
const buy = async (page, name) => {
  await page.getByRole("button", { name: `${name} 구매하기` }).click();
  await page.getByRole("button", { name: `${name} 사기`, exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^${name}, 보유 중`) }).first().waitFor();
};

test("내 방 꾸밈: 내 방 탭에서 벽지, 안락의자, 책상 위를 놓아 보고 사서 저장하면 로비 내 방에 그려진다", async () => {
  const browser = await launch();
  const errors = [];
  try {
    // 준비: 캐릭터를 이미 꾸몄고 코인이 3000인 사용자, 내 방은 아직 기본
    const server = createFakeServer();
    server.looks.set(FAKE_USER_ID, SAVED_LOOK);
    const page = await (await browser.newContext({ viewport })).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(page, { server, balance: 3000 });
    await page.goto(`${url}character`);
    await page.getByRole("tab", { name: "내 방" }).click();

    // 확인: 미리보기는 기본 내 방(층 17개: 러그, 그림자, 물건 15개)이고, 테마 줄과 열여섯 자리가 있으며 선택지 그림이
    // 모두 불러와진다. 판매를 멈춘 파스텔 아이템 14개는 보이지 않는다 (91개 가운데 77개). 성별 단추는 감춘다.
    const preview = '[data-testid="home-preview"]';
    await imagesLoaded(page, `${preview} img`);
    const defaults = await layers(page, preview);
    assert.equal(defaults.length, 17);
    assert.equal(defaults.every(isDefaultLayer), true);
    const rows = await page.locator(".wardrobe-slot").evaluateAll((s) => s.map((x) => x.getAttribute("aria-label")));
    assert.deepEqual(rows, [
      "테마", "벽지", "바닥", "커튼", "벽 액자", "벽 선반", "책상", "책상 위", "스탠드",
      "안락의자", "협탁", "협탁 위", "침대", "이불", "침대 인형", "러그", "바닥 화분",
    ]);
    await imagesLoaded(page, ".home-options img");
    assert.equal(await page.locator(".home-options button").count(), 77);
    assert.equal(await page.getByRole("button", { name: /^민트 점 벽지,/ }).count(), 0);
    assert.equal(await page.getByRole("group", { name: "성별" }).isVisible(), false);

    // 실행: 흰 벽지, 흰 안락의자, 펼친 책을 놓아 본다. 사지 않은 동안에는 저장할 수 없다.
    await place(page, "벽지", "흰 벽지");
    await place(page, "안락의자", "흰 안락의자");
    await place(page, "책상 위", "펼친 책");
    const tried = await layers(page, preview);
    assert.equal(tried.includes("wall:home-wall-white-wall.png"), true);
    assert.equal(tried.includes("armchair:home-chair-white-armchair.png"), true);
    assert.equal(tried.includes("desk-paper:home-desktop-book-desk-paper.png"), true);
    assert.equal(await page.getByRole("button", { name: "이 모습으로 저장하기" }).isDisabled(), true);
    await shot(page, "home-customize-try.png");

    // 실행: 그 자리에서 셋 다 사고 저장한다
    await buy(page, "흰 벽지");
    await buy(page, "흰 안락의자");
    await buy(page, "펼친 책");
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).click();
    await page.getByText("꾸민 모습을 저장했어요!").waitFor();

    // 확인: 서버에는 기본이 아닌 자리만 저장된다
    assert.deepEqual(server.homes.get(FAKE_USER_ID), {
      wallpaper: "home-wall-white", armchair: "home-chair-white", desk_top: "home-desktop-book",
    });

    // 확인: 로비 내 방에 같은 층이 3배로 그려진다 (기본 17개에 벽지 덮개 하나가 더해진다)
    await page.goto(`${url}lobby`);
    await imagesLoaded(page, ".desk-scene-art img.home-room-part");
    const lobby = await layers(page, ".desk-scene-art");
    assert.equal(lobby.length, 18);
    assert.deepEqual(
      lobby.filter((l) => !isDefaultLayer(l)),
      ["wall:home-wall-white-wall.png", "desk-paper:home-desktop-book-desk-paper.png", "armchair:home-chair-white-armchair.png"],
    );
    await shot(page, "home-lobby-decorated.png", page.locator(".desk-scene-art"));

    // 실행과 확인: 기본 안락의자로 되돌려 저장하면 그 자리는 서버에서 빠진다
    await page.goto(`${url}character`);
    await page.getByRole("tab", { name: "내 방" }).click();
    await place(page, "안락의자", "크림 안락의자");
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).click();
    await page.getByText("꾸민 모습을 저장했어요!").waitFor();
    assert.deepEqual(server.homes.get(FAKE_USER_ID), { wallpaper: "home-wall-white", desk_top: "home-desktop-book" });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("내 방 꾸밈: 테마를 누르면 그 테마 아이템을 한 번에 놓아 보고, 테마 없는 자리는 그대로 둔다", async () => {
  const browser = await launch();
  const errors = [];
  try {
    // 준비: 펼친 책을 이미 산 사용자
    const server = createFakeServer();
    server.looks.set(FAKE_USER_ID, SAVED_LOOK);
    server.owned.set(FAKE_USER_ID, new Set(["home-desktop-book"]));
    server.homes.set(FAKE_USER_ID, { desk_top: "home-desktop-book" });
    const page = await (await browser.newContext({ viewport })).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(page, { server, balance: 0 });
    await page.goto(`${url}character`);
    await page.getByRole("tab", { name: "내 방" }).click();
    const preview = '[data-testid="home-preview"]';
    await imagesLoaded(page, `${preview} img`);

    // 실행: 앤티크 테마
    await page.getByRole("region", { name: "테마" }).getByRole("button", { name: "앤티크" }).click();
    await imagesLoaded(page, `${preview} img`);

    // 확인: 벽지, 바닥, 가구, 천이 앤티크로 바뀌고, 앤티크 아이템이 없는 선반은 기본, 책상 위 책은 그대로다
    const tried = await layers(page, preview);
    for (const l of [
      "wall:home-wall-damask-wall.png", "floor:home-floor-parquet-floor.png", "rug:home-rug-persian-rug.png",
      "curtains:home-curtain-burgundy-curtains.png", "desk:home-desk-antique-desk.png", "bed:home-bed-antique-bed.png",
      "armchair:home-chair-velvet-armchair.png", "wall-shelves:wall-shelves.png", "desk-paper:home-desktop-book-desk-paper.png",
    ]) assert.equal(tried.includes(l), true, l);
    assert.equal(await page.getByRole("button", { name: "이 모습으로 저장하기" }).isDisabled(), true);
    await shot(page, "home-theme-antique.png");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("내 방 꾸밈: 사지 않은 아이템이나 다른 자리 아이템은 저장되지 않는다 (서버 판정)", async () => {
  // 준비: 아무것도 사지 않은 사용자
  const server = createFakeServer();
  const browser = await launch();
  try {
    const page = await (await browser.newContext({ viewport })).newPage();
    await mockSupabase(page, { server });
    await page.goto(`${url}lobby`);
    const save = (parts) =>
      page.evaluate(async (p) => {
        const res = await fetch("http://127.0.0.1:54321/rest/v1/rpc/save_home", {
          method: "POST",
          headers: { "content-type": "application/json", apikey: "test-anon-key" },
          body: JSON.stringify({ p_parts: p }),
        });
        return res.text();
      }, parts);

    const rpc = (name, body) =>
      page.evaluate(async ([n, b]) => {
        const res = await fetch(`http://127.0.0.1:54321/rest/v1/rpc/${n}`, {
          method: "POST",
          headers: { "content-type": "application/json", apikey: "test-anon-key" },
          body: JSON.stringify(b),
        });
        return res.text();
      }, [name, body]);

    // 실행: 사지 않은 벽지, 다른 자리 아이템, 기본 아이템을 저장해 보고, 판매를 멈춘 벽지를 사 본다
    const notOwned = await save({ wallpaper: "home-wall-white" });
    const wrongSlot = await save({ rug: "home-chair-sage" });
    const defaults = await save({ wallpaper: "home-wall-pink", rug: "home-rug-cream" });
    const retired = await rpc("buy_item", { p_item: "home-wall-mint" });
    const shop = JSON.parse(await rpc("get_shop", {}));

    // 확인: 앞의 둘은 거절되고, 기본 아이템은 저장된다. 판매를 멈춘 아이템은 살 수 없고 목록에도 없다.
    assert.match(notOwned, /not_owned/);
    assert.match(wrongSlot, /not_owned/);
    assert.deepEqual(JSON.parse(defaults), { wallpaper: "home-wall-pink", rug: "home-rug-cream" });
    assert.match(retired, /no_item/);
    assert.equal(shop.some((i) => i.id === "home-wall-mint"), false);
    assert.equal(shop.find((i) => i.id === "home-wall-damask")?.theme, "antique");
  } finally {
    await browser.close();
  }
});
