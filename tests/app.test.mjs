import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mockSupabase } from "./supabaseMock.mjs";

test("로비, 메뉴 전환, 할 일, 꾸미기, 구매", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    await mockSupabase(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await page
        .getByRole("heading", { name: "공부하는 일상에 작은 선물" })
        .count(),
      0,
    );
    // 로비는 "내 자리" 장면이다 (2026-10-30 재설계). 캐릭터 레이어가 실제로 불러와질 때까지 기다린다.
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".desk-character img")].some((img) => img.naturalWidth > 0),
    );
    // 로비는 집, 내 방이다. 벽지와 나무 마루 도트 타일을 1배로 깐다 (회사 사무실 그림은 쓰지 않는다).
    assert.deepEqual(
      await page.locator(".desk-scene-art").evaluate((node) => {
        const box = node.getBoundingClientRect();
        const bg = (sel) => getComputedStyle(node.querySelector(sel));
        return {
          wall: bg(".home-wall").backgroundImage.includes("/assets/home/wallpaper.png"),
          wallTile: bg(".home-wall").backgroundSize,
          floor: bg(".home-floor").backgroundImage.includes("/assets/home/floor.png"),
          floorTile: bg(".home-floor").backgroundSize,
          office: node.innerHTML.includes("company-study-room"),
          width: box.width,
          height: box.height,
        };
      }),
      { wall: true, wallTile: "16px 16px", floor: true, floorTile: "48px 16px", office: false, width: 770, height: 455 },
    );
    assert.equal(await page.getByRole("heading", { name: "오늘 어디로 갈까" }).count(), 1);
    assert.match(await page.locator(".desk-date").innerText(), /^\d+월 \d+일 [일월화수목금토]요일$/);
    await page.screenshot({
      path: "/tmp/moyeogongbu-lobby.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
    await page.getByLabel("오늘 하고 싶은 일").fill("React 공부하기");
    await page.getByRole("button", { name: "추가하기", exact: true }).click();
    await page.getByLabel("React 공부하기").check();
    assert.equal(await page.getByLabel("React 공부하기").isChecked(), true);
    // 할 일 완료는 서버가 코인을 준다 (가짜 서버: 잔액 340 + 2).
    await page.locator(".wallet", { hasText: "342" }).waitFor();
    // 모니터의 내 방에서 바로 출근한다.
    await page
      .getByRole("button", { name: "함께하는 회사 방으로 출근", exact: true })
      .click();
    await page.getByText("회사 테마 스터디룸", { exact: true }).waitFor();
    await page.getByRole("button", { name: "모여공부 로비" }).click();
    for (const label of [
      "공용 스터디카페",
      "캐릭터 꾸미기",
      "상점",
      "공부 기록",
      "친구 목록",
      "가이드",
    ]) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name: label, exact: true })
        .click();
      // 주소 라우팅은 전환을 비동기로 그리므로 새 제목이 나타날 때까지 기다린다.
      const heading = page.locator(".content-panel .panel-heading");
      await heading.filter({ hasText: label }).waitFor();
      assert.equal(await heading.innerText(), label);
    }
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "캐릭터 꾸미기", exact: true })
      .click();
    // 처음 꾸미기: 기본 아이템(머리 색, 눈 색, 의상)에서 고른다 (Story 007, Story 009).
    await page.getByRole("heading", { name: "처음 꾸미기" }).waitFor();
    await page.getByRole("button", { name: /^세이지 옷/ }).click();
    await page.getByRole("button", { name: "이 모습으로 시작하기" }).click();
    await page.getByRole("button", { name: "이 모습으로 저장하기" }).waitFor();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "상점", exact: true })
      .click();
    // 구매는 서버가 처리한다: 342 - 120 = 222. 코인이 모자란 아이템은 버튼이 막힌다.
    await page.getByRole("button", { name: "보라 리본 구매하기" }).click();
    // 되팔기와 환불이 없어서 카드 안에서 한 번 더 확인한다.
    await page.getByRole("button", { name: "보라 리본 사기", exact: true }).click();
    await page.getByRole("button", { name: "보라 리본 보유 중" }).waitFor();
    await page.waitForFunction(() => document.querySelector(".wallet")?.textContent?.trim() === "222");
    assert.equal(
      await page.getByRole("button", { name: "긴 생머리 구매하기" }).isDisabled(),
      true,
    );
    assert.equal(
      await page.getByRole("button", { name: "보라 리본 보유 중" }).isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "모여공부 로비", exact: true })
      .click();
    // 꾸미기에서 저장한 모습이 로비 캐릭터에 그대로 보인다.
    await page.locator('.desk-character [data-layer-outfit="outfit-sage"]').waitFor();
    assert.match(
      await page.locator('.desk-character img[data-layer="body"]').getAttribute("class"),
      /세이지/,
    );
    assert.equal(await page.getByLabel("React 공부하기").isChecked(), true);
    await page.getByRole("button", { name: "프로필 수정" }).click();
    await page.getByLabel("화면 이름", { exact: true }).fill("공부친구");
    await page.getByRole("button", { name: "저장하기", exact: true }).click();
    await page
      .getByRole("heading", { name: "공부친구", exact: true })
      .waitFor();
    await page.setViewportSize({ width: 1280, height: 800 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: "/tmp/moyeogongbu-1280.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("로비: 방이 없으면 방 목록으로 안내하고, 물건을 가리키면 캐릭터가 그쪽을 본다", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    // 준비: 방이 하나도 없는 사용자. 1536 폭에서 캐릭터는 내 방 가운데에 서므로 휴대폰은 확실한 오른쪽, 모니터는 바로 아래다.
    const page = await browser.newPage({
      viewport: { width: 1536, height: 1024 },
    });
    await mockSupabase(page, { seedRoom: false });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/");
    await page.getByRole("heading", { name: "밍구", exact: true }).waitFor();
    // Story 009: 캐릭터는 레이어 시트를 칸으로 잘라 그리므로, 방향은 LayerStack의 data-direction으로 본다.
    const facing = (dir) => page.locator(`.desk-character [data-testid="character-layers"][data-direction="${dir}"]`).waitFor();
    await facing("down");

    // 실행과 확인: 휴대폰을 가리키면 오른쪽, 이어서 모니터를 가리키면 아래를 본다 (방향이 물건 위치를 따라 바뀐다)
    await page.locator(".desk-phone").hover();
    await facing("right");
    await page.locator(".desk-monitor").hover();
    await facing("down");

    // 실행과 확인: 출근할 방이 없으면 방 목록으로 안내한다
    await page.getByText("아직 출근할 회사 방이 없어요.").waitFor();
    await page.getByRole("link", { name: /방 만들거나 초대 코드로 들어가기/ }).click();
    await page.waitForURL(/\/rooms$/);
  } finally {
    await browser.close();
  }
});
