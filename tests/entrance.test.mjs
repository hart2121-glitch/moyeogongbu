// 로그인과 환영 화면의 집 현관 장면 (2026-10-31). 장면과 문패, 캐릭터가 한 정수 배율로 그려지는지 본다.
// EVIDENCE_DIR가 있으면 증거 스크린샷을 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { mockSupabase } from "./supabaseMock.mjs";

const url = new URL(process.env.APP_URL || "http://127.0.0.1:4173/");
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
/** 장면 그림(240×144)이 실제로 그려진 크기와, 페이지에 가로 스크롤이 없는지. */
const sceneBox = (page) =>
  page.locator(".entrance-art").evaluate((art) => {
    const img = art.querySelector("img");
    return {
      width: art.getBoundingClientRect().width,
      height: art.getBoundingClientRect().height,
      loaded: img.complete && img.naturalWidth === 240,
      scrolls: document.documentElement.scrollWidth > window.innerWidth,
    };
  });

test("로그인: 집 현관 문패에 서비스 이름을 걸고, 넓은 화면은 3배, 좁은 화면은 2배로 그린다", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await mockSupabase(page, { signedIn: false });
    await page.goto(new URL("/login", url).href);
    await page.getByRole("button", { name: "Google로 로그인" }).waitFor();
    await page.waitForFunction(() => document.querySelector(".entrance-art img")?.complete);
    assert.equal(await page.locator(".entrance-sign").innerText(), "모여공부");
    assert.equal(await page.locator(".entrance-character").count(), 0);
    assert.deepEqual(await sceneBox(page), { width: 720, height: 432, loaded: true, scrolls: false });
    await shot(page, "entrance-login-1440.png");

    await page.setViewportSize({ width: 1024, height: 768 });
    assert.deepEqual(await sceneBox(page), { width: 480, height: 288, loaded: true, scrolls: false });
  } finally {
    await browser.close();
  }
});

test("환영: 적는 이름이 문패에 바로 새겨지고, 문 앞에 내 캐릭터가 같은 배율로 선다", async () => {
  const browser = await launch();
  try {
    // 휴대폰 폭: 2배 장면(480px)의 가운데만 보이고 페이지는 가로로 밀리지 않는다.
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mockSupabase(page, { displayName: null });
    await page.goto(new URL("/welcome", url).href);
    await page.getByRole("heading", { name: "화면 이름을 정해 주세요" }).waitFor();
    assert.equal(await page.locator(".entrance-sign").innerText(), "이름을 적어 주세요");
    await page.getByLabel("화면 이름", { exact: true }).fill("밍구");
    await page.locator(".entrance-sign", { hasText: "밍구의 방" }).waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll(".entrance-scene img")].every((i) => i.complete));
    assert.deepEqual(await sceneBox(page), { width: 480, height: 288, loaded: true, scrolls: false });
    // 캐릭터 56×72를 장면과 같은 2배로, 발 중심 (118, 131) 기준 왼쪽 위 (90, 59)에 세운다.
    assert.deepEqual(
      await page.locator(".entrance-character").evaluate((node) => {
        const art = node.parentElement.getBoundingClientRect(), box = node.getBoundingClientRect();
        return { left: box.left - art.left, top: Math.round(box.top - art.top), width: box.width, facing: node.querySelector("[data-direction]").dataset.direction };
      }),
      { left: 180, top: 118, width: 112, facing: "down" },
    );
    await shot(page, "entrance-welcome-390.png");
  } finally {
    await browser.close();
  }
});
