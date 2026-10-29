import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import { mockSupabase } from "./supabaseMock.mjs";

test("첨부 원본 해시 보존 및 인물 제거 영역 밖 표시 픽셀 보존", async () => {
  const original = readFileSync("public/assets/company-study-room-final.png");
  assert.equal(
    createHash("sha256").update(original).digest("hex"),
    "1a985ff9f847b46041ccd5c68764a1419189eec8380ae9553abc283d60787aaa",
  );
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await mockSupabase(page);
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    const stats = await page.evaluate(async () => {
      const load = async (src) => {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`이미지 요청 실패 ${src}`);
        const image = await createImageBitmap(await response.blob());
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
      };
      const a = await load("/assets/company-study-room-final.png"),
        b = await load("/assets/company-study-room-final-display.png");
      let changedOutside = 0,
        changedInside = 0,
        originalPurple = 0,
        displayPurple = 0;
      for (let y = 0; y < a.height; y++)
        for (let x = 0; x < a.width; x++) {
          const i = (y * a.width + x) * 4;
          const inside = x >= 815 && x < 955 && y >= 765 && y < 900;
          const changed =
            a.data[i] !== b.data[i] ||
            a.data[i + 1] !== b.data[i + 1] ||
            a.data[i + 2] !== b.data[i + 2];
          if (changed) {
            if (inside) changedInside++;
            else changedOutside++;
          }
          // 보라색 검사에서 러그의 어두운 테두리는 제외하고 원래 캐릭터 몸체 영역만 비교합니다.
          if (inside && x >= 845 && x < 930 && y >= 787 && y < 885) {
            if (
              a.data[i + 2] > a.data[i + 1] * 1.15 &&
              a.data[i] > a.data[i + 1] * 1.1
            )
              originalPurple++;
            if (
              b.data[i + 2] > b.data[i + 1] * 1.15 &&
              b.data[i] > b.data[i + 1] * 1.1
            )
              displayPurple++;
          }
        }
      return {
        width: b.width,
        height: b.height,
        changedOutside,
        changedInside,
        originalPurple,
        displayPurple,
      };
    });
    assert.equal(stats.width, 1705);
    assert.equal(stats.height, 922);
    assert.equal(stats.changedOutside, 0);
    assert.ok(stats.changedInside > 0);
    assert.ok(stats.originalPurple > 100);
    assert.ok(
      stats.displayPurple <= stats.originalPurple * 0.02,
      JSON.stringify(stats),
    );
  } finally {
    await browser.close();
  }
});
