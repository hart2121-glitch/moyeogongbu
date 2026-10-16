import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

test("로비, 메뉴 전환, 할 일, 꾸미기, 구매 체험", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await page
        .getByRole("heading", { name: "공부하는 일상에 작은 선물" })
        .count(),
      0,
    );
    assert.equal(
      await page
        .locator(".profile-avatar")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
    await page.screenshot({
      path: "/tmp/moyeogongbu-lobby.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
    await page.getByLabel("오늘 하고 싶은 일").fill("React 공부하기");
    await page.getByRole("button", { name: "추가하기", exact: true }).click();
    await page.getByLabel("React 공부하기").check();
    assert.equal(await page.getByLabel("React 공부하기").isChecked(), true);
    await page
      .getByRole("button", { name: "회사 테마로 가기", exact: true })
      .click();
    await page.getByText("회사 테마 스터디룸", { exact: true }).waitFor();
    await page.getByRole("button", { name: "로비로 돌아가기" }).click();
    for (const label of [
      "공용 스터디카페",
      "캐릭터 꾸미기",
      "상점",
      "공부 기록",
      "친구 목록",
      "가이드",
    ]) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name: label, exact: true })
        .click();
      assert.equal(
        await page.locator(".content-panel .panel-heading").innerText(),
        label,
      );
    }
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "캐릭터 꾸미기", exact: true })
      .click();
    await page.getByRole("button", { name: "세이지", exact: true }).click();
    await page.getByRole("button", { name: "이 스타일로 적용하기" }).click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "상점", exact: true })
      .click();
    await page
      .getByRole("button", { name: "구매하기", exact: true })
      .first()
      .click();
    assert.equal(await page.locator(".wallet").innerText(), "950");
    assert.equal(
      await page.getByRole("button", { name: "보관함에 있어요" }).isDisabled(),
      true,
    );
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "스터디룸", exact: true })
      .click();
    assert.match(
      await page.locator(".profile-avatar").getAttribute("class"),
      /세이지/,
    );
    assert.equal(await page.getByLabel("React 공부하기").isChecked(), true);
    await page.getByRole("button", { name: "프로필 수정" }).click();
    await page.getByLabel("닉네임", { exact: true }).fill("공부친구");
    await page.getByRole("button", { name: "저장하기", exact: true }).click();
    await page
      .getByRole("heading", { name: "공부친구", exact: true })
      .waitFor();
    await page.setViewportSize({ width: 1280, height: 800 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: "/tmp/moyeogongbu-1280.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
