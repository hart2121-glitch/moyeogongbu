import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mockSupabase } from "./supabaseMock.mjs";
import { mkdir, writeFile } from "node:fs/promises";

// Story 009: 캐릭터는 레이어 시트(칸 56×72)를 칸 번호로 잘라 그린다.
// 정면(아래) 걷기 칸은 4~7번이고, 멈추면 정면 서기 칸 0번으로 돌아온다.
const WALK_DOWN = [4, 5, 6, 7];

test("정면 걷기 4프레임 순환, 정지 대기, 시트 칸, 픽셀 렌더링", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const folder = "screenshots/walk-down";
  await mkdir(folder, { recursive: true });
  const report = {};
  try {
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    await mockSupabase(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    await page
      .getByRole("button", { name: / 방으로 출근$/ }).first()
      .click();
    await page.getByTestId("study-character").waitFor();
    await page
      .locator(".study-character img")
      .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())));
    const floor = async (x, y) => {
      const r = await page.getByTestId("company-stage").boundingBox();
      await page.mouse.click(r.x + r.width * x, r.y + r.height * y);
    };
    // 먼저 위쪽 통로로 옮겨 두고, 아래로 걷는 동안의 칸 순서를 본다.
    await floor(0.315, 0.455);
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity === "walking",
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity === "idle",
      {},
      { timeout: 20000 },
    );
    await page.evaluate(() => {
      window.walkReport = { sequence: [], missing: 0, samples: 0, pixelated: true };
      const record = () => {
        const e = document.querySelector(".study-character");
        if (e?.dataset.pose !== "walk.down") return;
        const frame = Number(e.dataset.frame);
        if (window.walkReport.sequence.at(-1) !== frame) window.walkReport.sequence.push(frame);
      };
      // 칸 순서는 화면 갱신 표본이 아니라 속성 변경마다 기록한다 (바쁜 컴퓨터에서 짧은 칸을 놓치지 않게).
      window.walkObserver = new MutationObserver(record);
      window.walkObserver.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-frame", "data-pose"],
      });
      const sample = () => {
        if (!window.walkObserver) return;
        const e = document.querySelector(".study-character");
        if (e?.dataset.pose === "walk.down") {
          const img = e.querySelector('.sheet-frame[data-layer="body"] img');
          if (!img?.complete || !img.naturalWidth) window.walkReport.missing++;
          else {
            window.walkReport.samples++;
            window.walkReport.pixelated &&= getComputedStyle(img).imageRendering === "pixelated";
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await floor(0.315, 0.79);
    await page.waitForFunction(() => window.walkReport.sequence.length >= 2);
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity === "idle",
      {},
      { timeout: 20000 },
    );
    const result = await page.evaluate(() => {
      window.walkObserver.disconnect();
      window.walkObserver = null;
      return window.walkReport;
    });
    Object.assign(report, result);
    assert.ok(result.sequence.length >= 5, `4프레임 반복 부족: ${result.sequence}`);
    for (let i = 0; i < result.sequence.length; i++)
      assert.equal(result.sequence[i], WALK_DOWN[i % 4], `칸 순서: ${result.sequence}`);
    assert.equal(result.missing, 0);
    assert.ok(result.samples > 20);
    assert.ok(result.pixelated);
    const character = page.getByTestId("study-character");
    assert.equal(await character.getAttribute("data-pose"), "idle.down");
    assert.equal(await character.getAttribute("data-frame"), "0");
    await page.screenshot({ path: `${folder}/stopped.png`, fullPage: true });
    // 캡처의 렌더링 비용이 순서 관측을 방해하지 않도록 별도 이동에서 촬영합니다.
    await floor(0.315, 0.455);
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity === "walking",
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity === "idle",
      {},
      { timeout: 20000 },
    );
    await floor(0.315, 0.79);
    await page.waitForFunction(() => {
      const e = document.querySelector(".study-character");
      return e?.dataset.pose === "walk.down" && e.dataset.frame === "5";
    });
    await page.screenshot({ path: `${folder}/walking.png`, fullPage: true });
    assert.deepEqual(errors, []);
    report.result = "passed";
  } catch (e) {
    report.result = "failed";
    report.failure = e.message;
    throw e;
  } finally {
    await writeFile(`${folder}/results.json`, JSON.stringify(report, null, 2) + "\n");
    await browser.close();
  }
});
