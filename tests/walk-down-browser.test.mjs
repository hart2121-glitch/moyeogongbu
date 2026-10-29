import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mockSupabase } from "./supabaseMock.mjs";
import { mkdir, writeFile } from "node:fs/promises";

test("정면 걷기 4프레임 순환·정지 대기·프레임별 실제 발 정렬·픽셀 렌더링", async () => {
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
      .getByRole("button", { name: "회사 테마로 가기", exact: true })
      .click();
    await page.getByTestId("study-character").waitFor();
    await page
      .locator(".study-character img")
      .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())));
    const floor = async (x, y) => {
      const r = await page.getByTestId("company-stage").boundingBox();
      await page.mouse.click(r.x + r.width * x, r.y + r.height * y);
    };
    await floor(0.315, 0.455);
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity ===
        "walking",
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity === "idle",
      {},
      { timeout: 20000 },
    );
    await page.evaluate(async () => {
      const anchors = {};
      for (const img of document.querySelectorAll(".study-character img")) {
        const path = img.getAttribute("src");
        if (!path.includes("/walk-down-")) continue;
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        let bottom = 0,
          transparent = 0;
        for (let y = 0; y < c.height; y++)
          for (let x = 0; x < c.width; x++) {
            const a = data[(y * c.width + x) * 4 + 3];
            if (a >= 128) bottom = y + 1;
            if (a === 0) transparent++;
          }
        let left = c.width,
          right = 0;
        for (let y = bottom - 4; y < bottom; y++)
          for (let x = 0; x < c.width; x++)
            if (data[(y * c.width + x) * 4 + 3] >= 128) {
              left = Math.min(left, x);
              right = Math.max(right, x + 1);
            }
        anchors[path] = {
          x: (left + right) / 2,
          y: bottom,
          width: c.width,
          height: c.height,
          transparent,
        };
      }
      window.walkReport = {
        anchors,
        sequence: [],
        changes: [],
        samples: 0,
        maxFootDelta: 0,
        missing: 0,
        widthRatios: [],
        pixelated: true,
      };
      window.collectWalk = true;
      // 프레임 순서는 화면 갱신 표본이 아니라 속성 변경마다 기록한다.
      // 표본만 보면 바쁜 컴퓨터에서 짧게 보인 프레임을 건너뛴다.
      const recordFrame = () => {
        if (!window.collectWalk) return;
        const e = document.querySelector(".study-character"),
          img = e?.querySelector("img[data-active=true]"),
          src = img?.getAttribute("src");
        if (
          e?.dataset.activity === "walking" &&
          e.dataset.direction === "down" &&
          anchors[src] &&
          window.walkReport.sequence.at(-1) !== src
        )
          window.walkReport.sequence.push(src);
      };
      new MutationObserver(recordFrame).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "data-active", "data-activity", "data-direction"],
      });
      const collect = () => {
        if (!window.collectWalk) return;
        const e = document.querySelector(".study-character"),
          img = e?.querySelector("img[data-active=true]");
        if (e && img) {
          const signature = [
            e.dataset.activity,
            e.dataset.direction,
            img.getAttribute("src"),
          ].join("|");
          if (window.walkReport.changes.at(-1)?.signature !== signature)
            window.walkReport.changes.push({
              signature,
              time: performance.now(),
              x: e.dataset.x,
              y: e.dataset.y,
            });
        }
        if (
          e?.dataset.activity === "walking" &&
          e.dataset.direction === "down"
        ) {
          const report = window.walkReport;
          if (!img || !img.complete || !img.naturalWidth) report.missing++;
          else {
            const src = img.getAttribute("src"),
              a = anchors[src];
            if (a) {
              report.samples++;
              const r = img.getBoundingClientRect(),
                w = e.getBoundingClientRect(),
                stage = e.closest(".company-stage").getBoundingClientRect();
              const dx =
                  r.left + (a.x / a.width) * r.width - (w.left + w.width / 2),
                dy = r.top + (a.y / a.height) * r.height - w.bottom;
              report.maxFootDelta = Math.max(
                report.maxFootDelta,
                Math.abs(dx),
                Math.abs(dy),
              );
              report.widthRatios.push(r.width / stage.width);
              report.pixelated &&=
                getComputedStyle(img).imageRendering === "pixelated";
            }
          }
        }
        requestAnimationFrame(collect);
      };
      requestAnimationFrame(collect);
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
      window.collectWalk = false;
      return window.walkReport;
    });
    Object.assign(report, result);
    assert.ok(
      result.sequence.length >= 5,
      `4프레임 반복 부족: ${result.sequence}`,
    );
    for (let i = 0; i < result.sequence.length; i++)
      assert.match(
        result.sequence[i],
        new RegExp(`walk-down-0${(i % 4) + 1}\\.png\\.png$`),
      );
    assert.equal(result.missing, 0);
    assert.ok(result.samples > 20);
    assert.ok(result.maxFootDelta < 0.15);
    assert.ok(result.pixelated);
    assert.ok(result.widthRatios.every((r) => Math.abs(r - 0.060984) < 0.0001));
    for (const a of Object.values(result.anchors)) {
      assert.equal(a.width, 87);
      assert.equal(a.height, 110);
      assert.ok(a.transparent > 0);
    }
    assert.match(
      await page
        .locator(".study-character img[data-active=true]")
        .getAttribute("src"),
      /idle-down\.png\.png$/,
    );
    await page.screenshot({ path: `${folder}/stopped.png`, fullPage: true });
    // 캡처의 렌더링 비용이 순서 관측을 방해하지 않도록 별도 이동에서 촬영합니다.
    await floor(0.315, 0.455);
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity ===
        "walking",
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".study-character")?.dataset.activity === "idle",
      {},
      { timeout: 20000 },
    );
    await floor(0.315, 0.79);
    await page.waitForFunction(() =>
      document
        .querySelector(".study-character img[data-active=true]")
        ?.getAttribute("src")
        ?.includes("walk-down-02"),
    );
    await page.screenshot({ path: `${folder}/walking.png`, fullPage: true });
    assert.deepEqual(errors, []);
    report.result = "passed";
    delete report.widthRatios;
  } catch (e) {
    report.result = "failed";
    report.failure = e.message;
    throw e;
  } finally {
    await writeFile(
      `${folder}/results.json`,
      JSON.stringify(report, null, 2) + "\n",
    );
    await browser.close();
  }
});
