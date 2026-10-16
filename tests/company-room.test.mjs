import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { companyLayout } from "../src/study/companyLayout.js";
import { findPath } from "../src/study/pathfinding.js";

const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
const url = process.env.APP_URL || "http://127.0.0.1:4173/";
async function waitStatus(page, text) {
  await page
    .getByTestId("movement-status")
    .filter({ hasText: text })
    .waitFor({ timeout: 20000 });
}

test("회사 방 생성 → 1~6번 좌석 이동·착석 → 휴식·복귀 → 퇴근", async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "스터디룸", exact: true })
      .click();
    await page.getByLabel("방 이름", { exact: true }).fill("이동 테스트 회사");
    await page.getByRole("button", { name: "방 만들기", exact: true }).click();
    await page
      .getByRole("button", { name: "만든 방 입장하기", exact: true })
      .click();
    await waitStatus(page, "출입구에 도착");
    assert.match(
      await page.locator(".company-toolbar").innerText(),
      /이동 테스트 회사/,
    );
    assert.equal(
      await page.getByTestId("study-character").getAttribute("data-activity"),
      "idle",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "공부 재개하기", exact: true })
        .isDisabled(),
      true,
    );
    await page.screenshot({
      path: "screenshots/company-entry.png",
      fullPage: true,
    });
    // RAF 위치를 수집해 실제 렌더링 위치가 설정된 통로의 간선 위에만 있는지 확인.
    await page.evaluate(() => {
      window.movementTrace = [];
      window.traceTimer = setInterval(() => {
        const sprite = document.querySelector(
          '[data-testid="study-character"]',
        );
        if (sprite)
          window.movementTrace.push({
            x: Number(sprite.dataset.x),
            y: Number(sprite.dataset.y),
          });
      }, 32);
    });
    for (let id = 1; id <= 6; id++) {
      await page
        .getByRole("button", { name: `${id}번 좌석`, exact: true })
        .click();
      await waitStatus(page, "이동 중");
      assert.equal(
        await page
          .getByRole("button", { name: "휴식하기", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "퇴근하기", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "1번 좌석", exact: true })
          .isDisabled(),
        true,
      );
      if (id === 1)
        await page.screenshot({
          path: "/tmp/moyeogongbu-company-walking.png",
          fullPage: true,
        });
      await waitStatus(page, `${id}번 좌석 착석`);
      assert.equal(await page.getByTestId("study-character").count(), 0);
      assert.equal(
        await page
          .getByRole("button", { name: `${id}번 좌석`, exact: true })
          .getAttribute("data-occupied"),
        "true",
      );
      assert.equal(
        await page.locator('.seat-marker[data-occupied="true"]').count(),
        1,
      );
    }
    await page.screenshot({
      path: "screenshots/company-seated.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "휴식하기", exact: true }).click();
    await waitStatus(page, "소파에서 휴식 중");
    const resting = await page
      .getByTestId("study-character")
      .evaluate((el) => ({
        x: Number(el.dataset.x),
        y: Number(el.dataset.y),
        activity: el.dataset.activity,
      }));
    assert.deepEqual(resting, {
      ...companyLayout.nodes.sofa,
      activity: "resting",
    });
    assert.equal(
      await page.locator('.seat-marker[data-occupied="true"]').count(),
      0,
    );
    // 확대/축소 후에도 원본 비율과 좌석 상대 좌표 유지.
    for (const width of [1280, 1536]) {
      await page.setViewportSize({ width, height: 1024 });
      const geometry = await page
        .getByTestId("company-stage")
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          const s = el.querySelector(".seat-marker").getBoundingClientRect();
          return {
            ratio: r.width / r.height,
            x: (s.x + s.width / 2 - r.x) / r.width,
            y: (s.y + s.height / 2 - r.y) / r.height,
          };
        });
      assert.ok(Math.abs(geometry.ratio - 1.5) < 0.001);
      assert.ok(Math.abs(geometry.x - companyLayout.seats[0].label.x) < 0.001);
      assert.ok(Math.abs(geometry.y - companyLayout.seats[0].label.y) < 0.001);
    }
    await page
      .getByRole("button", { name: "공부 재개하기", exact: true })
      .click();
    await waitStatus(page, "6번 좌석 착석");
    await page.getByRole("button", { name: "퇴근하기", exact: true }).click();
    await waitStatus(page, "출입구로 이동 중");
    await page
      .getByRole("heading", { name: "밍구", exact: true })
      .waitFor({ timeout: 20000 });
    const trace = await page.evaluate(() => {
      clearInterval(window.traceTimer);
      return window.movementTrace;
    });
    assert.ok(trace.length > 50);
    for (const point of trace) {
      const onEdge = companyLayout.edges.some(([a, b]) => {
        const start = companyLayout.nodes[a],
          end = companyLayout.nodes[b];
        const cross = Math.abs(
          (point.x - start.x) * (end.y - start.y) -
            (point.y - start.y) * (end.x - start.x),
        );
        return (
          cross < 0.000001 &&
          point.x >= Math.min(start.x, end.x) - 0.000001 &&
          point.x <= Math.max(start.x, end.x) + 0.000001 &&
          point.y >= Math.min(start.y, end.y) - 0.000001 &&
          point.y <= Math.max(start.y, end.y) + 0.000001
        );
      });
      assert.ok(onEdge, `통로 밖 위치 ${JSON.stringify(point)}`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("좌석·소파·출입구 모든 경로 연결 및 책상 몸체 직선 통과 방지", () => {
  const destinations = [
    "entrance",
    "sofa",
    ...companyLayout.seats.map((s) => s.node),
  ];
  // 책상 몸체의 보수적인 영역. 가려진 의자/배경 인물까지 판별하는 픽셀 충돌 마스크는 아님.
  const desks = [
    { left: 0.285, right: 0.74, top: 0.47, bottom: 0.59 },
    { left: 0.285, right: 0.74, top: 0.66, bottom: 0.785 },
  ];
  for (const from of destinations)
    for (const to of destinations) {
      const route = findPath(companyLayout, from, to);
      for (let i = 1; i < route.length; i++) {
        const a = companyLayout.nodes[route[i - 1]],
          b = companyLayout.nodes[route[i]];
        for (let step = 0; step <= 100; step++) {
          const x = a.x + ((b.x - a.x) * step) / 100,
            y = a.y + ((b.y - a.y) * step) / 100;
          assert.ok(
            !desks.some(
              (r) => x > r.left && x < r.right && y > r.top && y < r.bottom,
            ),
          );
        }
      }
    }
});
