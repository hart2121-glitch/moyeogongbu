import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { isChunkLoadError, RELOAD_GUARD, shouldReload } from "../src/app/chunkReload.ts";
import { mockSupabase } from "./supabaseMock.mjs";

// 배포 뒤 예전 탭이 사라진 화면 파일을 찾을 때: 한 번 새로고침하고, 그래도 안 되면 앱 틀 안에 오류 카드를 띄운다.
const url = process.env.APP_URL || "http://127.0.0.1:4173/";

test("브라우저마다 다른 화면 파일 실패 문구를 알아본다", () => {
  assert.equal(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/assets/GuidePage-1a2b.js")), true);
  assert.equal(isChunkLoadError(new TypeError("error loading dynamically imported module")), true);
  assert.equal(isChunkLoadError(new TypeError("Importing a module script failed.")), true);
  assert.equal(isChunkLoadError(new Error("Unable to preload CSS for /assets/GuidePage-1a2b.css")), true);
  assert.equal(isChunkLoadError(new Error("Cannot read properties of undefined")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("새로고침은 처음이거나 지난번에서 10초가 지났을 때만 한다", () => {
  const now = 1_000_000;
  assert.equal(shouldReload(null, now), true);
  assert.equal(shouldReload("망가짐", now), true);
  assert.equal(shouldReload(String(now - 3_000), now), false);
  assert.equal(shouldReload(String(now - RELOAD_GUARD.withinMs - 1), now), true);
});

test("화면 파일을 받지 못하면 한 번 새로고침하고, 그래도 안 되면 틀은 두고 다시 불러오기 카드를 띄운다", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    // Arrange: 내 방에서 시작하고, 가이드 화면 파일 요청을 막는다.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await mockSupabase(page);
    await page.goto(new URL("/lobby", url).href);
    await page.getByRole("navigation").getByRole("button", { name: "가이드", exact: true }).waitFor();
    let blocked = 0;
    const block = (route) => {
      blocked++;
      return route.abort();
    };
    await page.route(/GuidePage/, block);
    let loads = 0;
    page.on("load", () => loads++);

    // Act: 가이드로 간다.
    await page.getByRole("navigation").getByRole("button", { name: "가이드", exact: true }).click();

    // Assert: 한 번 새로고침한 뒤 두 번째 실패에서 멈추고 카드를 띄운다. 상단 바와 사이드바는 남는다.
    const card = page.getByTestId("route-error");
    await card.waitFor({ timeout: 20000 });
    assert.equal(loads, 1, "새로고침은 한 번만");
    assert.ok(blocked >= 2);
    assert.match(await card.innerText(), /화면을 불러오지 못했어요/);
    assert.equal(await page.getByRole("navigation").getByRole("button", { name: "내 방", exact: true }).count(), 1);
    assert.equal(new URL(page.url()).pathname, "/guide");

    // 파일이 다시 받아지면 다시 불러오기로 가이드가 열린다.
    await page.unroute(/GuidePage/, block);
    await page.evaluate((key) => sessionStorage.removeItem(key), RELOAD_GUARD.storageKey);
    await card.getByRole("button", { name: "다시 불러오기", exact: true }).click();
    await page.getByRole("heading", { name: "모여공부에 오신 걸 환영해요" }).waitFor({ timeout: 20000 });
    assert.equal(await card.count(), 0);
  } finally {
    await browser.close();
  }
});
