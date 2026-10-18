import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  companyLayout,
  COMPANY_BACKGROUND,
} from "../src/study/companyLayout.js";
const folder = "screenshots/movement-system";
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const results = {
  background: COMPANY_BACKGROUND,
  checks: [],
  geometry: [],
  errors: [],
};
try {
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1024 },
  });
  page.on("pageerror", (e) => results.errors.push(e.message));
  const status = async (text) =>
    page
      .getByTestId("movement-status")
      .filter({ hasText: text })
      .waitFor({ timeout: 20000 });
  const capture = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${folder}/${name}.png`, fullPage: true });
  };
  await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/", {
    waitUntil: "networkidle",
  });
  await page
    .getByRole("button", { name: "회사 테마로 가기", exact: true })
    .click();
  await status("출입구에 도착");
  await page.locator(".company-original").evaluate((img) => img.decode());
  assert.equal(
    await page.locator(".company-original").getAttribute("src"),
    COMPANY_BACKGROUND,
  );
  await capture("01-entry");
  results.checks.push("새 회사 원본 로드·입장");
  for (let id = 1; id <= 6; id++) {
    await page
      .getByRole("button", { name: `${id}번 좌석`, exact: true })
      .click();
    await status(`${id}번 좌석 착석`);
    assert.equal(
      await page.getByTestId("study-character").getAttribute("data-direction"),
      "down",
    );
    assert.equal(await page.locator(".seat-foreground").count(), 1);
    await capture(`02-seat-${id}`);
    results.checks.push(`${id}번 좌석 착석·출입구 방향·원본 책상 전경`);
  }
  await page
    .getByRole("button", { name: "휴게실로 이동", exact: true })
    .click();
  await status("휴게실에 도착");
  await capture("03-lounge");
  results.checks.push("업무 공간에서 휴게실 경계 통과·내부 도착");
  await page.getByRole("button", { name: "휴식하기", exact: true }).click();
  await status("소파에서 휴식 중");
  await page.locator(".study-character img").evaluate((img) => img.decode());
  assert.match(
    await page.locator(".study-character img").getAttribute("src"),
    /approved-front/,
  );
  await capture("04-sofa-rest");
  results.checks.push("소파 옆 확정 정면 에셋 표시(휴식 자세 프레임 대기)");
  await page.getByRole("button", { name: "화장실 가기", exact: true }).click();
  await status("화장실 내부");
  await capture("05-restroom");
  results.checks.push("휴게실에서 화장실 열린 문을 통해 내부 도착");
  for (const width of [1280, 1536]) {
    await page.setViewportSize({ width, height: 1024 });
    const geometry = await page
      .getByTestId("company-stage")
      .evaluate((stage) => {
        const r = stage.getBoundingClientRect(),
          sprite = stage
            .querySelector('[data-testid="study-character"]')
            .getBoundingClientRect();
        return {
          ratio: r.width / r.height,
          x: (sprite.x + sprite.width / 2 - r.x) / r.width,
          y: (sprite.y + sprite.height - r.y) / r.height,
        };
      });
    assert.ok(
      Math.abs(
        geometry.ratio - companyLayout.image.width / companyLayout.image.height,
      ) < 0.001,
    );
    assert.ok(Math.abs(geometry.x - companyLayout.nodes.restroom.x) < 0.001);
    assert.ok(Math.abs(geometry.y - companyLayout.nodes.restroom.y) < 0.001);
    results.geometry.push({ width, ...geometry });
  }
  await page
    .getByRole("button", { name: "화장실 나가기", exact: true })
    .click();
  await status("업무 공간에 도착");
  results.checks.push("화장실 문을 통과해 업무 공간으로 복귀");
  await page
    .getByRole("button", { name: "공부 재개하기", exact: true })
    .click();
  await status("6번 좌석 착석");
  results.checks.push("원래 선택했던 6번 좌석으로 복귀");
  await page.getByRole("button", { name: "퇴근하기", exact: true }).click();
  await page
    .getByRole("heading", { name: "밍구", exact: true })
    .waitFor({ timeout: 20000 });
  results.checks.push("퇴근·로비 복귀");
  assert.deepEqual(results.errors, []);
  results.result = "passed";
} catch (error) {
  results.result = "failed";
  results.failure = error.message;
  throw error;
} finally {
  await writeFile(
    `${folder}/results.json`,
    JSON.stringify(results, null, 2) + "\n",
  );
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
