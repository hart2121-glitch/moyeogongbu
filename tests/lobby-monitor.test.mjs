import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createFakeServer, FAKE_USER_ID, mockSupabase, SECOND_USER_ID } from "./supabaseMock.mjs";

// 내 방 모니터: 들어간 회사 방이 많아도 모니터가 늘어나 로비를 밀어내지 않는다 (안에서 넘긴다).
const url = process.env.APP_URL || "http://127.0.0.1:4173/";

test("회사 방이 다섯 개여도 모니터 회사 목록은 두 줄 남짓에서 멈추고 안에서 넘기며, 카페 줄은 그대로 보인다", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    // Arrange: 내 방 하나에 친구 방 네 개를 더 들어가 있다.
    const server = createFakeServer();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await mockSupabase(page, { server });
    for (const [i, name] of ["두리네 회사", "새벽 스터디", "토익 900", "코딩테스트반"].entries()) {
      const id = server.addRoom({ name, code: `ROOM${i}X`, ownerId: SECOND_USER_ID });
      server.addMember(id, SECOND_USER_ID, "하늘");
      server.addMember(id, FAKE_USER_ID, "밍구");
    }

    // Act
    await page.goto(new URL("/lobby", url).href);
    const list = page.getByTestId("monitor-companies");
    await list.getByRole("button", { name: "코딩테스트반 방으로 출근" }).waitFor({ state: "attached" });

    // Assert: 다섯 줄이 다 있지만 목록 높이는 정해진 만큼, 넘치는 줄은 목록 안에서 넘긴다.
    assert.equal(await list.locator("li").count(), 5);
    const box = await list.evaluate((el) => ({ client: el.clientHeight, scroll: el.scrollHeight }));
    assert.ok(box.client <= 150, `목록 높이 ${box.client}`);
    assert.ok(box.scroll > box.client, "넘치는 줄은 안에서 넘긴다");
    await page.getByTestId("monitor-cafe").waitFor();
    assert.ok(await page.getByTestId("monitor-cafe").isVisible());
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    assert.ok(pageHeight < 1000, `로비 높이 ${pageHeight}`);
  } finally {
    await browser.close();
  }
});
