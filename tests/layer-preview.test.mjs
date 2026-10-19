import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = process.env.APP_URL || "http://127.0.0.1:4173/";
const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
async function png(
  page,
  color,
  { width = 87, height = 110, opaque = false } = {},
) {
  const data = await page.evaluate(
    ({ color, width, height, opaque }) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d");
      ctx.fillStyle = color;
      ctx.fillRect(...(opaque ? [0, 0, width, height] : [20, 30, 30, 40]));
      return c.toDataURL("image/png").split(",")[1];
    },
    { color, width, height, opaque },
  );
  return {
    name: "test-pattern.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
}
async function pixel(page) {
  const screenshot = await page.getByTestId("layer-stack").screenshot();
  return page.evaluate(async (base64) => {
    const img = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${base64}`)).blob(),
    );
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return [...ctx.getImageData(25 * 3, 35 * 3, 1, 1).data];
  }, screenshot.toString("base64"));
}
test("독립 미리보기: 초기 빈 레이어·6층 합성·실제 가림 순서·토글·방향별 에셋·초기화", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [],
      writes = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
        writes.push(r.url());
    });
    await page.goto(new URL("/character-preview.html", base).href);
    await page
      .locator('[data-testid="reference-canvas"] img')
      .evaluate((img) => img.decode());
    await page.evaluate(() =>
      localStorage.setItem("preview-isolation-check", "keep-existing-data"),
    );
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      0,
    );
    assert.equal(await page.locator(".company-room").count(), 0);
    await mkdir("screenshots/layer-preview", { recursive: true });
    await page.screenshot({
      path: "screenshots/layer-preview/empty.png",
      fullPage: true,
    });
    const layers = [
      ["뒷머리", "hairBack", "#00ff00"],
      ["기본 몸", "body", "#ff0000"],
      ["의상", "outfit", "#ff8800"],
      ["얼굴", "face", "#0000ff"],
      ["앞머리", "hairFront", "#aa00ff"],
      ["액세서리", "accessory", "#ffff00"],
    ];
    for (const [label, id, color] of layers) {
      await page
        .getByLabel(`${label} PNG 선택`, { exact: true })
        .setInputFiles(await png(page, color));
      await page
        .getByTestId("layer-stack")
        .locator(`[data-layer=${id}]`)
        .waitFor();
    }
    await page
      .getByTestId("layer-count")
      .filter({ hasText: "파일 6/6 · 표시 6개" })
      .waitFor();
    const boxes = await page
      .getByTestId("layer-stack")
      .locator("img")
      .evaluateAll((imgs) =>
        imgs.map((img) => {
          const r = img.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            pixelated: getComputedStyle(img).imageRendering,
          };
        }),
      );
    for (const b of boxes) {
      assert.equal(b.width, 261);
      assert.equal(b.height, 330);
      assert.equal(b.x, boxes[0].x);
      assert.equal(b.y, boxes[0].y);
      assert.equal(b.pixelated, "pixelated");
    }
    assert.deepEqual(await pixel(page), [255, 255, 0, 255]);
    await page.getByLabel("액세서리 표시", { exact: true }).uncheck();
    assert.deepEqual(await pixel(page), [170, 0, 255, 255]);
    await page.getByLabel("앞머리 표시", { exact: true }).uncheck();
    assert.deepEqual(await pixel(page), [0, 0, 255, 255]);
    await page.getByLabel("얼굴 표시", { exact: true }).uncheck();
    assert.deepEqual(await pixel(page), [255, 136, 0, 255]);
    await page.getByLabel("의상 표시", { exact: true }).uncheck();
    assert.deepEqual(await pixel(page), [255, 0, 0, 255]);
    await page.getByLabel("기본 몸 표시", { exact: true }).uncheck();
    assert.deepEqual(await pixel(page), [0, 255, 0, 255]);
    await page.getByLabel("뒷머리 표시", { exact: true }).uncheck();
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      0,
    );
    for (const [label] of layers)
      await page.getByLabel(`${label} 표시`, { exact: true }).check();
    await page.getByLabel("방향", { exact: true }).selectOption("up");
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      0,
    );
    assert.match(
      await page
        .locator('[data-testid="reference-canvas"] img')
        .getAttribute("src"),
      /idle-up/,
    );
    await page
      .getByLabel("기본 몸 PNG 선택", { exact: true })
      .setInputFiles(await png(page, "#00ffff"));
    await page
      .getByTestId("layer-count")
      .filter({ hasText: "파일 1/6" })
      .waitFor();
    await page.getByLabel("방향", { exact: true }).selectOption("down");
    await page
      .getByTestId("layer-count")
      .filter({ hasText: "파일 6/6" })
      .waitFor();
    await page.getByLabel("표시 배율", { exact: true }).selectOption("2");
    assert.equal(
      await page
        .getByTestId("layer-stack")
        .evaluate((e) => e.getBoundingClientRect().width),
      174,
    );
    await page
      .getByLabel("기본 몸 PNG 선택", { exact: true })
      .setInputFiles(await png(page, "#ff0000", { width: 88 }));
    await page
      .getByRole("alert")
      .filter({ hasText: "87 × 세로 110" })
      .waitFor();
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      6,
    );
    await page
      .getByLabel("기본 몸 PNG 선택", { exact: true })
      .setInputFiles(await png(page, "#ff0000", { opaque: true }));
    await page.getByRole("alert").filter({ hasText: "투명한 PNG" }).waitFor();
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      6,
    );
    await page
      .getByLabel("얼굴 PNG 선택", { exact: true })
      .setInputFiles({
        name: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from("not a PNG"),
      });
    await page.getByRole("alert").filter({ hasText: "PNG 이미지" }).waitFor();
    await page
      .getByRole("button", { name: "파일 제거", exact: true })
      .nth(0)
      .click();
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      5,
    );
    await page
      .getByRole("button", { name: "전체 비우기", exact: true })
      .click();
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      0,
    );
    await page.getByLabel("방향", { exact: true }).selectOption("up");
    assert.equal(
      await page.getByTestId("layer-stack").locator("img").count(),
      0,
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("preview-isolation-check"),
      ),
      "keep-existing-data",
    );
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
    await page.reload();
    await page
      .getByTestId("layer-count")
      .filter({ hasText: "파일 0/6" })
      .waitFor();
  } finally {
    await browser.close();
  }
});
