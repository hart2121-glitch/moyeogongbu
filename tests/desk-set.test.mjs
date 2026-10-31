// 내 책상 세트 (꾸미기 슬롯 계획 1절, 2026-11-01): 책상 꾸밈은 좌석이 아니라 사람에게 붙는다.
// 상점에서 사고, 꾸미기 책상 탭에서 자리에 놓고, 저장하면 회사 방에서 내가 앉은 책상에 펼쳐진다.
// 같은 방 사람은 그 사람의 세트가, 빈 자리는 기본 세트(스탠드, 화분)가 보인다. EVIDENCE_DIR가 있으면 증거를 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { createFakeServer, FAKE_USER_ID, mockSupabase, SEED_ROOM } from "./supabaseMock.mjs";

const url = process.env.APP_URL || "http://127.0.0.1:4173/";
const evidence = process.env.EVIDENCE_DIR;
const viewport = { width: 1440, height: 900 };
const COMEMBER = "00000000-0000-4000-8000-000000000031";
const launch = () =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const shot = async (page, name, locator = page) => {
  if (!evidence) return;
  mkdirSync(evidence, { recursive: true });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await locator.screenshot({ path: join(evidence, name) });
};
const nav = (page, label) => page.getByRole("navigation").getByRole("button", { name: label, exact: true }).click();
/** 꾸미기 안에서 놓아 본 아이템을 산다 (되팔기가 없어 한 번 더 확인). */
const buy = async (page, name) => {
  await page.getByRole("button", { name: `${name} 구매하기` }).click();
  await page.getByRole("button", { name: `${name} 사기`, exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^${name}, 보유 중`) }).first().waitFor();
};
/** 방에 깔린 책상 아이템: "자리번호:자리:아이템:주인" 목록 (주인 없음은 기본 세트). */
const deskItems = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".desk-item:not(.desk-monitor)")]
      .map((i) => [i.dataset.seat, i.dataset.spot, i.dataset.item, i.dataset.owner ?? "", i.classList.contains("is-front")].join(":"))
      .sort(),
  );
const sit = async (page, seat) => {
  await page.getByRole("button", { name: `${seat}번 좌석` }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="study-character"]')?.dataset.activity === "seated", null, { timeout: 20000 });
};

test("책상 세트: 사서 책상 탭에서 놓고 저장하면 내 자리에 펼쳐지고, 같은 방 사람은 그 사람의 세트, 빈 자리는 기본 세트", async () => {
  const browser = await launch();
  const errors = [];
  try {
    // 준비: 코인이 넉넉한 처음 사용자, 같은 방에 자기 세트(지구본, 고양이 스티커)를 꾸민 멤버
    const server = createFakeServer();
    const page = await (await browser.newContext({ viewport })).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(page, { server, balance: 2000 });
    await page.goto(`${url}lobby`);
    await nav(page, "캐릭터 꾸미기");
    await page.getByRole("button", { name: "이 모습으로 시작하기" }).click();
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).waitFor();

    // 실행: 꾸미기 책상 탭. 처음에는 기본 세트(스탠드, 화분)이고, 오른쪽 소품은 왼쪽과 좌우 대칭으로 뒤집혀 보인다.
    await page.getByRole("tab", { name: "책상" }).click();
    const preview = page.getByTestId("desk-preview");
    assert.deepEqual(
      await preview.locator("img[data-spot]").evaluateAll((imgs) => imgs.map((i) => `${i.dataset.spot}:${i.dataset.item}`)),
      ["left:desk-lamp", "right:desk-plant"],
    );
    assert.equal(await preview.locator('img[data-spot="right"]').getAttribute("class"), "is-flipped");
    // 모니터는 소품 위에 다시 그려 소품이 늘 모니터 뒤에 놓인다
    assert.equal(await preview.locator("img").last().getAttribute("data-monitor"), "true");
    // 책상을 꾸미는 동안에는 성별 단추가 필요 없다
    assert.equal(await page.getByRole("group", { name: "성별" }).isVisible(), false);

    // 실행: 오른쪽에 고양이 인형, 앞면에 별 스티커를 놓아 보고 그 자리에서 산다. 고양이 인형은 오른쪽 방향 그림이라 뒤집지 않는다.
    await page.getByRole("region", { name: "오른쪽 소품" }).getByRole("button", { name: /^고양이 인형/ }).click();
    assert.equal(await preview.locator('img[data-spot="right"]').getAttribute("class"), null);
    await buy(page, "고양이 인형");
    await page.getByRole("region", { name: "앞면 스티커" }).getByRole("button", { name: /^별 스티커/ }).click();
    await buy(page, "별 스티커");
    assert.deepEqual(
      await preview.locator("img[data-spot]").evaluateAll((imgs) => imgs.map((i) => `${i.dataset.spot}:${i.dataset.item}`)),
      ["left:desk-lamp", "right:desk-cat", "front:sticker-star"],
    );
    // 사지 않은 소품은 놓아 볼 수만 있고 저장은 막힌다. 같은 것을 다시 누르면 원래대로 치운다.
    const moon = page.getByRole("region", { name: "왼쪽 소품" }).getByRole("button", { name: /^달 무드등/ });
    await moon.click();
    assert.equal(await page.getByRole("button", { name: "이 모습으로 저장하기" }).isDisabled(), true);
    await moon.click();
    await page.getByRole("region", { name: "왼쪽 소품" }).getByRole("button", { name: /^책상 스탠드/ }).click();
    await shot(page, "desk-customize.png");
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).click();
    await page.getByText("꾸민 모습을 저장했어요!").waitFor();

    // 확인: 서버에 세트가 저장된다
    const saved = server.looks.get(FAKE_USER_ID);
    assert.deepEqual([saved.desk_left, saved.desk_right, saved.desk_front], ["desk-lamp", "desk-cat", "sticker-star"]);

    // 실행과 확인: 회사 방 2번에 앉으면 내 세트가 책상 전경보다 앞에, 나머지 다섯 자리는 기본 세트
    await page.goto(`${url}rooms/${SEED_ROOM.id}`);
    await page.locator(".company-toolbar").getByText(SEED_ROOM.name).waitFor();
    await sit(page, 2);
    const mine = ["2:front:sticker-star:me:true", "2:left:desk-lamp:me:true", "2:right:desk-cat:me:true"];
    const defaults = [1, 3, 4, 5, 6].flatMap((s) => [`${s}:left:desk-lamp::false`, `${s}:right:desk-plant::false`]);
    assert.deepEqual(await deskItems(page), [...mine, ...defaults].sort());

    // 실행과 확인: 같은 방 멤버가 5번에 앉으면 그 사람의 세트가 5번 책상에 보인다
    server.addMember(SEED_ROOM.id, COMEMBER, "로아");
    server.looks.set(COMEMBER, {
      body: "body-basic", face: "face-black", hair_back: "hair-basic", hair_front: "hair-basic", hair_color: "hair-color-black",
      outfit: "outfit-lavender", accessory: null, gender: "f", desk_left: null, desk_right: "desk-globe", desk_front: "sticker-cat",
    });
    const b = await (await browser.newContext({ viewport })).newPage();
    b.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(b, { server, userId: COMEMBER, displayName: "로아", seedRoom: false });
    await b.goto(`${url}rooms/${SEED_ROOM.id}`);
    await sit(b, 5);
    await page.locator(`.desk-item[data-owner="${COMEMBER}"][data-item="desk-globe"].is-front`).waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="remote-character"]')?.dataset.activity === "seated", null, { timeout: 20000 });
    const theirs = [`5:front:sticker-cat:${COMEMBER}:true`, `5:right:desk-globe:${COMEMBER}:true`];
    assert.deepEqual(
      await deskItems(page),
      [...mine, ...defaults.filter((d) => !d.startsWith("5:")), ...theirs].sort(),
    );
    await shot(page, "desk-room.png", page.locator(".company-viewport"));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
