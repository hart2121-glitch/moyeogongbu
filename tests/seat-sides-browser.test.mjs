import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { companyLayout as layout } from "../src/study/companyLayout.js";

test("실제 브라우저 1·3·4·6번 각각 좌우 이동·퇴석·재착석 발 충돌 검증", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const folder = "screenshots/seat-sides";
  await mkdir(folder, { recursive: true });
  const results = { checks: [], errors: [] };
  try {
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    page.on("pageerror", (e) => results.errors.push(e.message));
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    await page
      .getByRole("button", { name: "회사 테마로 가기", exact: true })
      .click();
    await page.getByTestId("study-character").waitFor();
    await page
      .locator(".study-character img[data-active=true]")
      .evaluate((img) => img.decode());
    await page.evaluate(() => {
      window.sideTrace = [];
      window.sideMissing = 0;
      window.sideTimer = setInterval(() => {
        const e = document.querySelector(".study-character");
        if (!e) return;
        const css = getComputedStyle(e),
          img = e.querySelector("img[data-active=true]");
        if (
          !img ||
          !img.complete ||
          !img.naturalWidth ||
          css.display === "none" ||
          css.visibility === "hidden" ||
          Number(css.opacity) === 0
        )
          window.sideMissing++;
        window.sideTrace.push({
          x: Number(e.dataset.x),
          y: Number(e.dataset.y),
          activity: e.dataset.activity,
        });
      }, 16);
    });
    const seated = async (id) => {
      await page
        .getByRole("button", { name: `${id}번 좌석`, exact: true })
        .click();
      await page
        .getByTestId("movement-status")
        .filter({ hasText: `${id}번 좌석 착석` })
        .waitFor({ timeout: 20000 });
      assert.match(
        await page
          .locator(".study-character img[data-active=true]")
          .getAttribute("src"),
        /idle-down/,
      );
      assert.equal(await page.locator(".seat-foreground").count(), 1);
    };
    for (const id of [1, 3, 4, 6]) {
      await seated(id);
      const anchor = layout.nodes[layout.seats.find((s) => s.id === id).node];
      for (const [side, x] of [
        ["left", 0.315],
        ["right", 0.76],
      ]) {
        const r = await page.getByTestId("company-stage").boundingBox();
        await page.mouse.click(r.x + r.width * x, r.y + r.height * anchor.y);
        await page.waitForFunction(
          () =>
            document.querySelector(".study-character")?.dataset.activity ===
            "standing",
        );
        await page.waitForFunction(
          () =>
            document.querySelector(".study-character")?.dataset.activity ===
            "idle",
          {},
          { timeout: 20000 },
        );
        const end = await page.getByTestId("study-character").evaluate((e) => ({
          x: Number(e.dataset.x),
          y: Number(e.dataset.y),
        }));
        assert.ok(
          Math.hypot((end.x - x) * 1705, (end.y - anchor.y) * 922) < 1.5,
        );
        if (side === "right" && (id === 1 || id === 6))
          await page.screenshot({
            path: `${folder}/seat-${id}-right-floor.png`,
            fullPage: true,
          });
        await seated(id);
        results.checks.push(
          `${id}번 ${side}: 일어서기→통로 우회→바닥 도착→재착석`,
        );
      }
    }
    const trace = await page.evaluate(() => {
      clearInterval(window.sideTimer);
      return { points: window.sideTrace, missing: window.sideMissing };
    });
    assert.equal(trace.missing, 0);
    assert.ok(trace.points.length > 100);
    for (const p of trace.points)
      for (const r of layout.partitions)
        assert.ok(
          !(
            p.x > r.left - 14 / 1705 &&
            p.x < r.right + 14 / 1705 &&
            p.y > r.top - 1.5 / 922 &&
            p.y < r.bottom + 1.5 / 922
          ),
          `발 폭이 파티션과 겹침: ${JSON.stringify(p)}`,
        );
    assert.equal(await page.locator(".room-error").count(), 0);
    assert.deepEqual(results.errors, []);
    results.samples = trace.points.length;
    results.hiddenFrames = trace.missing;
    results.result = "passed";
  } catch (e) {
    results.result = "failed";
    results.failure = e.message;
    throw e;
  } finally {
    await writeFile(
      `${folder}/results.json`,
      JSON.stringify(results, null, 2) + "\n",
    );
    await browser.close();
  }
});
