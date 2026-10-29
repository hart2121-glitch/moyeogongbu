import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createFakeServer, mockSupabase, SECOND_USER_ID, SEED_ROOM, FAKE_USER_ID } from "./supabaseMock.mjs";
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
  await page
    .locator('[data-testid="study-character"] img[data-active=true]')
    .evaluate((img) => img.decode());
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
    await mockSupabase(p);
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
        const img = s.querySelector("img[data-active=true]"),
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
      const sprite = p.locator(".study-character img[data-active=true]");
      await sprite.evaluate((img) => img.decode());
      assert.match(
        await sprite.getAttribute("src"),
        new RegExp(`idle-${direction}\\.png\\.png$`),
      );
      const geometry = await sprite.evaluate((img) => {
        const r = img.getBoundingClientRect(),
          wrapper = img.parentElement.getBoundingClientRect();
        return {
          ratio: r.width / r.height,
          width: r.width,
          wrapper: wrapper.width,
          stage: img.closest(".company-stage").getBoundingClientRect().width,
          footBottom: r.bottom - wrapper.bottom,
          horizontalOffset: r.left - wrapper.left,
        };
      });
      assert.ok(Math.abs(geometry.ratio - 87 / 110) < 0.001);
      assert.ok(Math.abs(geometry.width - geometry.wrapper) < 0.1);
      assert.ok(
        Math.abs(geometry.width / geometry.stage - 0.042 * 1.2 * 1.1 * 1.1) < 0.0001,
      );
      const center = { up: 44, down: 43, left: 37.5, right: 49 }[direction];
      assert.ok(
        Math.abs(
          geometry.horizontalOffset - ((43.5 - center) / 87) * geometry.width,
        ) < 0.1,
      );
      const padding = { up: 6, down: 10, left: 5, right: 6 }[direction];
      assert.ok(
        Math.abs(geometry.footBottom - (padding / 87) * geometry.width) < 0.1,
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
    // 지연된 타이머가 같은 DOM 좌표를 읽어도 마지막 실제 위치 변경 시각을 덮어쓰지 않습니다.
    // 그렇지 않으면 긴 프레임 뒤 5ms 간격으로 실행된 관측값이 정상 이동을 점프로 오판합니다.
    let lastPositionChange = trace.points[0];
    for (let i = 1; i < trace.points.length; i++) {
      const b = trace.points[i], a = lastPositionChange;
      const d = Math.hypot((b.x-a.x)*1705,(b.y-a.y)*922);
      if (d < 0.001) continue;
      assert.ok(d <= 270*(b.time-a.time)/1000+10, `위치 점프 ${d}: ${JSON.stringify({a,b})}`);
      lastPositionChange=b;
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("서버 좌석 판정: 동시 클릭은 한 명만 착석, 사용 중 좌석 차단, 퇴장 해제, 2분 지난 좌석은 빈자리", async () => {
  const browser = await launch();
  let browserB;
  try {
    const server = createFakeServer();
    const ctxA = await browser.newContext({ viewport: { width: 1536, height: 1024 } });
    // 사용자마다 다른 브라우저: 같은 브라우저의 뒤쪽 페이지는 requestAnimationFrame이 멈춰 걷기 재생이 진행되지 않는다.
    browserB = await launch();
    const ctxB = await browserB.newContext({ viewport: { width: 1536, height: 1024 } });
    const a = await ctxA.newPage(),
      b = await ctxB.newPage();
    await mockSupabase(a, { server });
    await mockSupabase(b, { server, userId: SECOND_USER_ID, displayName: "두리" });
    server.addMember(SEED_ROOM.id, SECOND_USER_ID, "두리");
    await Promise.all([enter(a), enter(b)]);
    await b.getByTestId("remote-character").waitFor();
    // 두 사람이 같은 자리를 동시에 누른다.
    await Promise.all([
      a.getByRole("button", { name: "1번 좌석", exact: true }).click(),
      b.getByRole("button", { name: "1번 좌석", exact: true }).click(),
    ]);
    const deadline = Date.now() + 5000;
    while (!server.seatHolder(SEED_ROOM.id, 1) && Date.now() < deadline) await a.waitForTimeout(50);
    const holder = server.seatHolder(SEED_ROOM.id, 1);
    assert.ok(holder, "한 명은 앉아야 한다");
    const [winner, loser, loserId] = holder === FAKE_USER_ID ? [a, b, SECOND_USER_ID] : [b, a, FAKE_USER_ID];
    await winner.getByTestId("movement-status").filter({ hasText: "1번 좌석 착석" }).waitFor({ timeout: 20000 });
    await loser.getByRole("alert").filter({ hasText: "사용하거나 예약" }).waitFor();
    assert.equal(server.seatHolder(SEED_ROOM.id, 1), holder);
    assert.equal(server.seats.get(SEED_ROOM.id).filter((s) => s.userId).length, 1);
    await loser.waitForFunction(() => document.querySelector('.seat-marker[aria-label="1번 좌석"]')?.disabled);
    // 앉은 사람이 바닥으로 가면 자리가 풀리고, 다른 사람이 앉는다.
    await winner.bringToFront();
    await floor(winner, { x: 0.52, y: 0.9 });
    await idle(winner);
    await loser.waitForFunction(() => !document.querySelector('.seat-marker[aria-label="1번 좌석"]')?.disabled, {}, { timeout: 10000 });
    await loser.bringToFront();
    await loser.getByRole("button", { name: "1번 좌석", exact: true }).click();
    await loser.getByTestId("movement-status").filter({ hasText: "1번 좌석 착석" }).waitFor({ timeout: 20000 });
    await winner.waitForFunction(() => document.querySelector('.seat-marker[aria-label="1번 좌석"]')?.disabled, {}, { timeout: 10000 });
    await winner.getByRole("button", { name: "공부 재개하기", exact: true }).click();
    await winner.getByRole("alert").filter({ hasText: "사용하거나 예약" }).waitFor();
    assert.equal(await winner.getByTestId("study-character").getAttribute("data-activity"), "idle");
    // 2분 넘게 응답이 없는 사람의 좌석은 빈자리로 본다.
    server.age(loserId, 121_000);
    await winner.getByRole("button", { name: "공부 재개하기", exact: true }).click();
    await winner.getByTestId("movement-status").filter({ hasText: "1번 좌석 착석" }).waitFor({ timeout: 20000 });
    assert.equal(server.seatHolder(SEED_ROOM.id, 1), holder);
    // 나간 사람의 좌석은 풀린다.
    await winner.getByRole("button", { name: "모여공부 로비", exact: true }).click();
    await loser.waitForFunction(() => !document.querySelector('.seat-marker[aria-label="1번 좌석"]')?.disabled, {}, { timeout: 10000 });
    assert.equal(server.seatHolder(SEED_ROOM.id, 1), null);
    await ctxA.close();
    await ctxB.close();
  } finally {
    await browserB?.close();
    await browser.close();
  }
});

test("확정 캐릭터의 불투명 픽셀은 원본과 동일하고 투명 배경을 사용", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await mockSupabase(page);
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
