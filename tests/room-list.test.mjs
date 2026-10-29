import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createFakeServer, mockSupabase, SECOND_USER_ID } from "./supabaseMock.mjs";

test("로비 메뉴 → 방 목록 → 서버 방 생성·입장, 재접속 유지, 초대 코드 검증, 가득 찬 방 안내", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    const server = createFakeServer();
    server.addRoom({ name: "친구네 회사", code: "HANA27", ownerId: SECOND_USER_ID });
    const full = server.addRoom({ name: "꽉 찬 회사", code: "MANY28", ownerId: SECOND_USER_ID });
    for (let i = 3; i <= 7; i++) server.addMember(full, `00000000-0000-4000-8000-00000000000${i}`);
    await mockSupabase(page, { server });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "스터디룸", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "내 방 목록", exact: true })
      .waitFor();
    assert.equal(await page.locator(".room-content").count(), 0);
    await page.getByLabel("방 이름", { exact: true }).fill("테스트 회사");
    await page.getByRole("button", { name: "방 만들기", exact: true }).click();
    await page
      .getByRole("button", { name: "테스트 회사 입장", exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "스터디룸", exact: true })
      .click();
    await page
      .getByRole("button", { name: "테스트 회사 입장", exact: true })
      .waitFor();
    await page.getByLabel("초대 코드", { exact: true }).fill("XXXXXX");
    await page
      .getByRole("button", { name: "코드로 입장하기", exact: true })
      .click();
    await page.getByRole("alert").waitFor();
    await page.getByLabel("초대 코드", { exact: true }).fill("many28");
    await page
      .getByRole("button", { name: "코드로 입장하기", exact: true })
      .click();
    await page.getByRole("alert").filter({ hasText: "방이 가득 찼어요" }).waitFor();
    await page.getByLabel("초대 코드", { exact: true }).fill("hana27");
    await page
      .getByRole("button", { name: "코드로 입장하기", exact: true })
      .click();
    await page.getByText("회사 테마 스터디룸", { exact: true }).waitFor();
    assert.match(await page.locator(".company-toolbar").innerText(), /친구네 회사/);
    await page
      .getByRole("button", { name: "모여공부 로비", exact: true })
      .click();
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "스터디룸", exact: true })
      .click();
    await page.getByRole("button", { name: "친구네 회사 입장", exact: true }).waitFor();
    await page.getByRole("button", { name: "친구네 회사 나가기", exact: true }).click();
    await page.getByRole("button", { name: "친구네 회사 입장", exact: true }).waitFor({ state: "detached" });
    assert.equal(server.members.get([...server.rooms.values()].find((r) => r.name === "친구네 회사").id).size, 1);
  } finally {
    await browser.close();
  }
});
