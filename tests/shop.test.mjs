// Story 007: 상점과 캐릭터 꾸미기 (가짜 Supabase). 증거 스크린샷은 production/qa/evidence/story-007-shop-customize/에 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { createFakeServer, FAKE_USER_ID, mockSupabase, SEED_ROOM } from "./supabaseMock.mjs";

// CI는 끝에 / 없이 넘기므로 붙여서 경로를 이어 쓴다.
const url = (process.env.APP_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const evidence = process.env.EVIDENCE_DIR_STORY_007 || "production/qa/evidence/story-007-shop-customize";
const viewport = { width: 1440, height: 900 };
const launch = () =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
// 모든 이미지가 다 읽힌 뒤에 찍는다.
const shot = async (page, name) => {
  mkdirSync(evidence, { recursive: true });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.screenshot({ path: join(evidence, name), fullPage: true });
};
const nav = (page, label) => page.getByRole("navigation").getByRole("button", { name: label, exact: true }).click();
const COMEMBER = "00000000-0000-4000-8000-000000000021";
const defaultLook = () => ({
  body: "body-basic", face: "face-black", hair_back: "hair-basic", hair_front: "hair-basic", hair_color: "hair-color-black",
  outfit: "outfit-lavender", accessory: null, gender: "f",
});

test("환영 선물, 처음 꾸미기, 입어 보기, 구매, 저장 유지, 로비와 방의 꾸민 캐릭터", async () => {
  const browser = await launch();
  const errors = [];
  try {
    const server = createFakeServer();
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const state = await mockSupabase(page, { server, balance: 0, welcomeMail: true });
    await page.goto(`${url}lobby`);
    // 로비를 처음 열 때 상점과 꾸미기는 보이지 않는다.
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
    assert.equal(await page.locator(".shop-grid, .customizer").count(), 0);

    // 환영 선물 120코인 (우편)
    await page.getByRole("button", { name: /^우편함/ }).click();
    const box = page.getByTestId("mailbox");
    await box.getByText("환영 선물 120코인").waitFor();
    await shot(page, "welcome-gift-mail.png");
    await box.getByRole("button", { name: "받기" }).click();
    await box.getByText("120코인을 받았어요.").waitFor();
    assert.equal(state.coins.balance, 120);
    await page.keyboard.press("Escape");
    await page.goto(`${url}character`);

    // 처음 꾸미기: 기본 아이템만 (머리 탭에 머리 모양 2와 머리 색 3, 눈 탭에 눈 색 7, 의상 탭에 의상 3). 액세서리 탭은 없다.
    // 처음 모습은 여자, 단발, 검은 머리, 검은 눈이다.
    await page.getByRole("heading", { name: "처음 꾸미기" }).waitFor();
    const tab = (name) => page.getByRole("tab", { name, exact: true }).click();
    const optionCount = async (name) => (await tab(name), page.locator(".item-options button").count());
    assert.equal(await optionCount("눈"), 7);
    assert.equal(await optionCount("의상"), 3);
    assert.equal(await optionCount("머리"), 5);
    assert.equal(await page.getByRole("tab", { name: "액세서리" }).count(), 0);
    const preview = page.getByTestId("character-layers").first();
    assert.equal(await preview.getAttribute("data-hair-color"), "hair-color-black");
    assert.equal(await preview.getAttribute("data-layer-face"), "face-black");
    assert.equal(await preview.getAttribute("data-gender"), "f");
    // 남자를 고르면 눈매와 기본 머리 모양, 옷이 바뀌고, 여자로 돌아가면 되돌아온다
    await page.getByRole("button", { name: "남자", exact: true }).click();
    assert.equal(await preview.getAttribute("data-gender"), "m");
    assert.equal(await preview.getAttribute("data-layer-hair-front"), "hair-short");
    assert.equal(await preview.getAttribute("data-layer-outfit"), "outfit-boy");
    assert.match(await preview.locator('img[data-layer="face"]').getAttribute("src"), /face-black-m\.png$/);
    await page.getByRole("button", { name: "여자", exact: true }).click();
    assert.equal(await preview.getAttribute("data-layer-hair-front"), "hair-basic");
    // 미리보기는 돌려 보고 걸려 볼 수 있다
    await page.getByRole("button", { name: "오른쪽으로 돌리기" }).click();
    assert.equal(await preview.getAttribute("data-direction"), "right");
    await page.getByRole("button", { name: "걷기", exact: true }).click();
    assert.equal(await preview.getAttribute("data-pose"), "walk.right");
    await page.getByRole("button", { name: "걷기", exact: true }).click();
    await page.getByRole("button", { name: "왼쪽으로 돌리기" }).click();
    assert.equal(await preview.getAttribute("data-pose"), "idle.down");
    await page.getByRole("button", { name: /^밤색 염색/ }).click();
    assert.equal(await page.getByTestId("character-layers").first().getAttribute("data-hair-color"), "hair-color-chestnut");
    await tab("눈");
    await page.getByRole("button", { name: /^초록 눈/ }).click();
    assert.equal(await page.getByTestId("character-layers").first().getAttribute("data-layer-face"), "face-green");
    await tab("의상");
    await page.getByRole("button", { name: /^세이지 옷/ }).click();
    await shot(page, "customize-first-time-default-pick.png");
    await page.getByRole("button", { name: "이 모습으로 시작하기" }).click();
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).waitFor();
    assert.equal(server.looks.get(FAKE_USER_ID).outfit, "outfit-sage");
    assert.equal(server.looks.get(FAKE_USER_ID).face, "face-green");
    assert.equal(server.looks.get(FAKE_USER_ID).hair_color, "hair-color-chestnut");

    // 꾸미기 안 상점 (2026-11-01: 상점 페이지를 꾸미기에 합쳤다). 예전 상점 주소는 꾸미기로 간다.
    await page.goto(`${url}shop`);
    await page.waitForURL(/\/character$/);
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).waitFor();
    assert.equal(await page.getByRole("navigation").getByRole("button", { name: "상점", exact: true }).count(), 0);
    await page.getByTestId("shop-balance").filter({ hasText: /^120$/ }).waitFor();
    // 120코인으로 별 머리핀(150)은 이유와 함께 막힌다
    await tab("액세서리");
    await page.getByRole("button", { name: /^별 머리핀/ }).click();
    await page.getByText("입어 보는 중이에요. 사지 않은 아이템은 저장되지 않아요.").waitFor();
    assert.equal(await page.getByRole("button", { name: "별 머리핀 구매하기" }).isDisabled(), true);
    await page.locator('.try-on-buy [data-item="acc-hairpin"]').getByText("30코인이 더 모이면 살 수 있어요.").waitFor();
    assert.equal(await page.getByRole("button", { name: "이 모습으로 저장하기" }).isDisabled(), true);
    await shot(page, "shop-prices-insufficient.png");
    // 리본으로 바꿔 입어 보고 산다. 줄어들 코인을 보여 주고, 그만두면 사지 않는다.
    await page.getByRole("button", { name: /^보라 리본/ }).click();
    await page.getByRole("button", { name: "보라 리본 구매하기" }).click();
    const confirm = page.getByRole("group", { name: "보라 리본 구매 확인" });
    await confirm.getByText("환불할 수 없어요.").waitFor();
    assert.match(await confirm.innerText(), /코인 120에서 0으로 줄어요/);
    await shot(page, "shop-buy-confirm.png");
    await confirm.getByRole("button", { name: "그만두기" }).click();
    await page.getByRole("button", { name: "보라 리본 구매하기" }).waitFor();
    assert.equal(state.coins.balance, 120);
    await page.getByRole("button", { name: "보라 리본 구매하기" }).click();
    await page.getByRole("button", { name: "보라 리본 사기", exact: true }).click();
    await page.getByRole("button", { name: "보라 리본, 보유 중" }).waitFor();
    await page.getByTestId("shop-balance").filter({ hasText: /^0$/ }).waitFor();
    assert.equal(await page.locator(".try-on-buy").count(), 0);
    await shot(page, "shop-purchase-success.png");
    assert.equal(state.coins.balance, 0);

    // 산 리본은 저장할 수 있고, 사지 않은 로즈 옷은 입어 보기만
    await tab("의상");
    await page.getByRole("button", { name: /^로즈 옷/ }).click();
    await page.getByText("입어 보는 중이에요. 사지 않은 아이템은 저장되지 않아요.").waitFor();
    assert.equal(await page.getByTestId("character-layers").getAttribute("data-layer-outfit"), "outfit-rose");
    assert.equal(await page.getByRole("button", { name: "이 모습으로 저장하기" }).isDisabled(), true);
    await shot(page, "customize-try-on.png");
    await page.getByRole("button", { name: /^세이지 옷/ }).click();
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).click();
    await page.getByText("꾸민 모습을 저장했어요!").waitFor();
    assert.equal(server.looks.get(FAKE_USER_ID).accessory, "acc-ribbon");

    // 꾸미기 주소의 ?try=아이템은 그 아이템을 입힌 그 탭을 연다 (공지나 우편에서 이어 줄 때)
    await page.goto(`${url}character?try=outfit-rose`);
    await page.getByText("입어 보는 중이에요. 사지 않은 아이템은 저장되지 않아요.").waitFor();
    assert.equal(await page.locator('.item-options [data-item="outfit-rose"]').getAttribute("aria-pressed"), "true");

    // 새로고침 후에도 같은 모습
    await page.reload();
    const stack = page.getByTestId("character-layers");
    await stack.waitFor();
    assert.equal(await stack.getAttribute("data-layer-accessory"), "acc-ribbon");
    assert.equal(await stack.getAttribute("data-layer-hair-front"), "hair-basic");
    assert.equal(await stack.getAttribute("data-hair-color"), "hair-color-chestnut");

    // 로비 캐릭터 (꾸미기와 같은 레이어로 그린다)
    await page.goto(`${url}lobby`);
    await page.locator('.desk-character [data-layer-outfit="outfit-sage"]').waitFor();
    assert.match(await page.locator('.desk-character img[data-layer="outfit"]').getAttribute("src"), /outfit-sage\.png$/);
    await shot(page, "lobby-avatar-saved-look.png");

    // 같은 방 멤버의 꾸민 캐릭터
    server.addMember(SEED_ROOM.id, COMEMBER, "로아");
    server.looks.set(COMEMBER, { ...defaultLook(), outfit: "outfit-rose", hair_back: "hair-wave", hair_front: "hair-wave", accessory: "acc-beret" });
    const ctxB = await browser.newContext({ viewport });
    const b = await ctxB.newPage();
    b.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(b, { server, userId: COMEMBER, displayName: "로아", seedRoom: false });
    await page.goto(`${url}rooms/${SEED_ROOM.id}`);
    await page.locator(".company-toolbar").getByText(SEED_ROOM.name).waitFor();
    await b.goto(`${url}rooms/${SEED_ROOM.id}`);
    const remote = page.locator('[data-testid="remote-character"][data-layer-outfit="outfit-rose"]');
    await remote.waitFor({ timeout: 20000 });
    assert.equal(await remote.getAttribute("data-layer-accessory"), "acc-beret");
    assert.match(await remote.locator('img[data-layer="outfit"]').getAttribute("src"), /outfit-rose\.png$/);
    assert.equal(await page.getByTestId("study-character").getAttribute("data-layer-outfit"), "outfit-sage");
    await shot(page, "room-comember-customized.png");
    assert.ok(!(await page.locator("body").innerText()).includes("·"));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
