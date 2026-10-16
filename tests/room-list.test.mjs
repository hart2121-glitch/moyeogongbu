import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

test("로비 메뉴 → 방 목록 → 생성·입장, 재접속 저장, 초대 코드 검증", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "스터디룸", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "내가 만든 방 목록", exact: true })
      .waitFor();
    assert.equal(await page.locator(".room-content").count(), 0);
    await page.getByLabel("방 이름", { exact: true }).fill("테스트 회사");
    await page.getByRole("button", { name: "방 만들기", exact: true }).click();
    await page
      .getByRole("button", { name: "테스트 회사 입장", exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "스터디룸", exact: true })
      .click();
    await page
      .getByRole("button", { name: "테스트 회사 입장", exact: true })
      .waitFor();
    await page.getByLabel("초대 코드", { exact: true }).fill("XXXXXX");
    await page
      .getByRole("button", { name: "코드로 입장하기", exact: true })
      .click();
    await page.getByRole("alert").waitFor();
    await page.getByLabel("초대 코드", { exact: true }).fill("moyeo6");
    await page
      .getByRole("button", { name: "코드로 입장하기", exact: true })
      .click();
    await page.getByText("회사 테마 스터디룸", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "모여공부 로비", exact: true })
      .click();
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
  } finally {
    await browser.close();
  }
});
