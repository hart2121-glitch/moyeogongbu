// 원본/앱 코드는 수정하지 않고 실제 브라우저에서 2단계 흐름을 검토합니다.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const results = {
  viewport: { width: 1536, height: 1024 },
  checks: [],
  errors: [],
  geometry: [],
};
try {
  const page = await browser.newPage({ viewport: results.viewport });
  page.on("pageerror", (e) => results.errors.push(e.message));
  const waitStatus = async (text) =>
    page
      .getByTestId("movement-status")
      .filter({ hasText: text })
      .waitFor({ timeout: 20000 });
  const capture = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  };
  await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/", {
    waitUntil: "networkidle",
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "스터디룸", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "내가 만든 방 목록", exact: true })
    .waitFor();
  await capture("01-study-room-list");
  await page.getByLabel("방 이름", { exact: true }).fill("2단계 검토용 회사");
  await page.getByRole("button", { name: "방 만들기", exact: true }).click();
  await page
    .getByRole("button", { name: "만든 방 입장하기", exact: true })
    .click();
  await waitStatus("출입구에 도착");
  await page.locator(".company-original").evaluate((img) => img.decode());
  await page.locator(".study-character img").evaluate((img) => img.decode());
  await capture("02-company-entry");
  results.checks.push("목록·회사 방 생성·입장");
  for (let id = 1; id <= 6; id++) {
    await page
      .getByRole("button", { name: `${id}번 좌석`, exact: true })
      .click();
    if (id === 1) {
      await page.waitForFunction(() => {
        const s = document.querySelector('[data-testid="study-character"]');
        return (
          s &&
          Math.abs(Number(s.dataset.x) - 0.256) < 0.001 &&
          Number(s.dataset.y) < 0.465
        );
      });
      await capture("05-walking-upper-boundary");
    }
    if (id === 4) {
      await page.waitForFunction(() => {
        const s = document.querySelector('[data-testid="study-character"]');
        return (
          s &&
          Number(s.dataset.x) > 0.32 &&
          Math.abs(Number(s.dataset.y) - 0.602) < 0.001
        );
      });
      await capture("06-walking-middle-boundary");
    }
    await waitStatus(`${id}번 좌석 착석`);
    assert.equal(await page.getByTestId("study-character").count(), 0);
    assert.equal(
      await page
        .getByRole("button", { name: `${id}번 좌석`, exact: true })
        .getAttribute("data-occupied"),
      "true",
    );
    results.checks.push(`${id}번 좌석 이동·착석`);
    if (id === 1) await capture("03-company-seat-1");
  }
  await page.getByRole("button", { name: "휴식하기", exact: true }).click();
  await waitStatus("소파에서 휴식 중");
  await capture("04-company-sofa-rest");
  results.checks.push("6번에서 소파로 이동·휴식");
  for (const width of [1280, 1536]) {
    await page.setViewportSize({ width, height: 1024 });
    const geometry = await page
      .getByTestId("company-stage")
      .evaluate((stage) => {
        const r = stage.getBoundingClientRect();
        const sprite = stage.querySelector('[data-testid="study-character"]');
        const s = sprite.getBoundingClientRect();
        return {
          ratio: r.width / r.height,
          footX: (s.x + s.width / 2 - r.x) / r.width,
          footY: (s.y + s.height - r.y) / r.height,
          seats: [...stage.querySelectorAll(".seat-marker")].map((el) => {
            const b = el.getBoundingClientRect();
            return {
              x: (b.x + b.width / 2 - r.x) / r.width,
              y: (b.y + b.height / 2 - r.y) / r.height,
            };
          }),
        };
      });
    assert.ok(Math.abs(geometry.ratio - 1.5) < 0.001);
    assert.ok(
      Math.abs(geometry.footX - 0.2) < 0.001 &&
        Math.abs(geometry.footY - 0.555) < 0.001,
    );
    results.geometry.push({ width, ...geometry });
  }
  results.checks.push("1280/1536px에서 원본 비율·소파 발 좌표 유지");
  await page
    .getByRole("button", { name: "공부 재개하기", exact: true })
    .click();
  await waitStatus("6번 좌석 착석");
  results.checks.push("원래 선택한 6번 좌석 복귀");
  await page.getByRole("button", { name: "퇴근하기", exact: true }).click();
  await waitStatus("출입구로 이동 중");
  await page
    .getByRole("heading", { name: "밍구", exact: true })
    .waitFor({ timeout: 20000 });
  results.checks.push("퇴근 이동 완료 후 로비 복귀");
  assert.deepEqual(results.errors, []);
  results.result = "passed";
} catch (error) {
  results.result = "failed";
  results.failure = error.message;
  throw error;
} finally {
  await writeFile(
    "screenshots/stage2-review-results.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
