import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
const url = process.env.APP_URL || "http://127.0.0.1:4173/";
async function enter(page) {
  await page.goto(url);
  await page
    .getByRole("button", { name: "회사 테마로 가기", exact: true })
    .click();
  await page.getByTestId("study-character").waitFor();
  await page.locator(".study-character img").evaluate((img) => img.decode());
}
async function floor(page, p) {
  const r = await page.getByTestId("company-stage").boundingBox();
  await page.mouse.click(r.x + r.width * p.x, r.y + r.height * p.y);
}
async function idle(page) {
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="study-character"]')?.dataset
        .activity === "idle",
    {},
    { timeout: 20000 },
  );
}

test("바닥 클릭·도중 목적지 변경·4방향 상태·캐릭터 깜빡임 없음", async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await enter(p);
    await p.evaluate(() => {
      window.motion = [];
      window.missing = 0;
      window.sample = setInterval(() => {
        if (!document.querySelector(".company-stage")) return;
        const s = document.querySelector('[data-testid="study-character"]');
        if (!s) {
          window.missing++;
          return;
        }
        const img = s.querySelector("img"),
          css = getComputedStyle(s);
        if (
          !img?.complete ||
          !img.naturalWidth ||
          css.display === "none" ||
          css.visibility === "hidden" ||
          Number(css.opacity) === 0
        )
          window.missing++;
        window.motion.push({
          x: Number(s.dataset.x),
          y: Number(s.dataset.y),
          time: performance.now(),
          activity: s.dataset.activity,
        });
      }, 16);
    });
    for (const [point, direction] of [
      [{ x: 0.52, y: 0.86 }, "up"],
      [{ x: 0.58, y: 0.86 }, "right"],
      [{ x: 0.48, y: 0.86 }, "left"],
      [{ x: 0.48, y: 0.95 }, "down"],
    ]) {
      await floor(p, point);
      await p.waitForFunction(
        () =>
          document.querySelector('[data-testid="study-character"]')?.dataset
            .activity === "walking",
      );
      await idle(p);
      assert.equal(
        await p.getByTestId("study-character").getAttribute("data-direction"),
        direction,
      );
    }
    await floor(p, { x: 0.74, y: 0.8 });
    await p.waitForFunction(
      () =>
        document.querySelector('[data-testid="study-character"]')?.dataset
          .activity === "walking",
    );
    await floor(p, { x: 0.52, y: 0.89 });
    await idle(p);
    const final = await p
      .getByTestId("study-character")
      .evaluate((s) => ({ x: Number(s.dataset.x), y: Number(s.dataset.y) }));
    assert.ok(
      Math.hypot((final.x - 0.52) * 1705, (final.y - 0.89) * 922) < 1.5,
    );
    const before = final;
    await floor(p, { x: 0.4, y: 0.55 });
    await p.getByRole("alert").filter({ hasText: "바닥" }).waitFor();
    assert.deepEqual(
      await p
        .getByTestId("study-character")
        .evaluate((s) => ({ x: Number(s.dataset.x), y: Number(s.dataset.y) })),
      before,
    );
    const trace = await p.evaluate(() => {
      clearInterval(window.sample);
      return { points: window.motion, missing: window.missing };
    });
    assert.equal(trace.missing, 0);
    assert.ok(trace.points.length > 30);
    for (let i = 1; i < trace.points.length; i++) {
      const a = trace.points[i - 1],
        b = trace.points[i];
      const d = Math.hypot((b.x - a.x) * 1705, (b.y - a.y) * 922);
      assert.ok(d <= (270 * (b.time - a.time)) / 1000 + 10, `위치 점프 ${d}`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("탭 간 원자적 예약·사용중 좌석 차단·퇴장 해제·만료 임대 소유권 보호", async () => {
  const browser = await launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1536, height: 1024 },
    });
    const a = await context.newPage(),
      b = await context.newPage();
    await Promise.all([enter(a), enter(b)]);
    for (const [page, owner] of [
      [a, "racer-a"],
      [b, "racer-b"],
    ])
      await page.evaluate(async (owner) => {
        const { createSeatService } = await import("/src/study/seatService.js");
        window.racer = createSeatService("invited-demo", owner, owner);
      }, owner);
    const race = await Promise.all([
      a.evaluate(() => window.racer.reserve(1)),
      b.evaluate(() => window.racer.reserve(1)),
    ]);
    assert.equal(race.filter(Boolean).length, 1);
    await a.getByRole("button", { name: "1번 좌석", exact: true }).waitFor();
    assert.equal(
      await a
        .getByRole("button", { name: "1번 좌석", exact: true })
        .isDisabled(),
      true,
    );
    await Promise.all([
      a.evaluate(() => window.racer.release()),
      b.evaluate(() => window.racer.release()),
    ]);
    await a.bringToFront();
    await a.getByRole("button", { name: "1번 좌석", exact: true }).click();
    await b.waitForFunction(
      () =>
        document.querySelector('.seat-marker[aria-label="1번 좌석"]')?.disabled,
    );
    await a
      .getByTestId("movement-status")
      .filter({ hasText: "1번 좌석 착석" })
      .waitFor({ timeout: 20000 });
    assert.equal(
      await b
        .getByRole("button", { name: "1번 좌석", exact: true })
        .isDisabled(),
      true,
    );
    await a.bringToFront();
    await floor(a, { x: 0.52, y: 0.9 });
    await idle(a);
    await b.bringToFront();
    await b.getByRole("button", { name: "1번 좌석", exact: true }).click();
    await b
      .getByTestId("movement-status")
      .filter({ hasText: "1번 좌석 착석" })
      .waitFor({ timeout: 20000 });
    await a.getByRole("button", { name: "공부 재개하기", exact: true }).click();
    await a.getByRole("alert").filter({ hasText: "사용하거나 예약" }).waitFor();
    assert.equal(
      await a.getByTestId("study-character").getAttribute("data-activity"),
      "idle",
    );
    await b.getByRole("button", { name: "모여공부 로비", exact: true }).click();
    await a.waitForFunction(
      () =>
        !document.querySelector('.seat-marker[aria-label="1번 좌석"]')
          ?.disabled,
    );
    await a.evaluate(async () => {
      await window.racer.release();
      window.racer.close();
      const { createSeatService } = await import("/src/study/seatService.js");
      window.expireA = createSeatService("expiry-test", "a", "a");
      await window.expireA.reserve(1);
    });
    const result = await a.evaluate(async () => {
      const original = Date.now;
      Date.now = () => original() + 46000;
      try {
        const { createSeatService } = await import("/src/study/seatService.js");
        const other = createSeatService("expiry-test", "b", "b");
        const next = await other.reserve(1),
          stale = await window.expireA.occupy(1);
        await other.release();
        other.close();
        window.expireA.close();
        return { next, stale };
      } finally {
        Date.now = original;
      }
    });
    assert.deepEqual(result, { next: true, stale: false });
    await context.close();
  } finally {
    await browser.close();
  }
});

test("확정 캐릭터의 불투명 픽셀은 원본과 동일하고 투명 배경을 사용", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.goto(url);
    const result = await page.evaluate(async () => {
      const decode = async (src) => {
        const img = await createImageBitmap(await (await fetch(src)).blob());
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        return context.getImageData(0, 0, img.width, img.height);
      };
      const original = await decode("/assets/company-study-room-final.png"),
        sprite = await decode("/assets/characters/approved-front.png");
      let opaque = 0,
        transparent = 0,
        changed = 0;
      for (let y = 0; y < sprite.height; y++)
        for (let x = 0; x < sprite.width; x++) {
          const s = (y * sprite.width + x) * 4,
            o = ((y + 786) * original.width + x + 845) * 4;
          if (sprite.data[s + 3] === 0) transparent++;
          if (sprite.data[s + 3] === 255) {
            opaque++;
            if (
              [0, 1, 2].some((c) => sprite.data[s + c] !== original.data[o + c])
            )
              changed++;
          }
        }
      return {
        width: sprite.width,
        height: sprite.height,
        opaque,
        transparent,
        changed,
      };
    });
    assert.equal(result.width, 87);
    assert.equal(result.height, 110);
    assert.ok(result.transparent > 1000);
    assert.ok(result.opaque > 1000);
    assert.equal(result.changed, 0);
  } finally {
    await browser.close();
  }
});
