// Story 006: 친구, 우편함, 알림 브라우저 테스트 (가짜 Supabase).
// 증거 스크린샷은 production/qa/evidence/story-006-friends-mail/에 남긴다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { createFakeServer, FAKE_USER_ID, mockSupabase, SECOND_USER_ID, SEED_ROOM } from "./supabaseMock.mjs";
import { friendPlace, normalizeFriendCode } from "../src/features/friends/model/friendText.ts";

// CI는 끝에 / 없이 넘기므로 붙여서 경로를 이어 쓴다.
const url = (process.env.APP_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const evidence = process.env.EVIDENCE_DIR_STORY_006 || "production/qa/evidence/story-006-friends-mail";
const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
const shot = async (page, name) => {
  mkdirSync(evidence, { recursive: true });
  await page.screenshot({ path: join(evidence, name), fullPage: true });
};

const SENA = "00000000-0000-4000-8000-00000000000c";
const NARAE = "00000000-0000-4000-8000-00000000000d";
const HARU = "00000000-0000-4000-8000-00000000000e";
const BLOCKED = "00000000-0000-4000-8000-00000000000f";
const NEW_FACE = "00000000-0000-4000-8000-000000000010";

test("친구 상태 문구: 같은 방 멤버만 방 이름, 코드 정리", () => {
  assert.equal(friendPlace({ state: "studying", inRoom: true, roomName: null }), "스터디룸에서 공부 중");
  assert.equal(friendPlace({ state: "break", inRoom: true, roomName: "우리 회사" }), "우리 회사에서 휴식 중");
  assert.equal(friendPlace({ state: "studying", inRoom: false, roomName: null }), "공부 중");
  assert.equal(normalizeFriendCode(" abcd 2345 ", 8), "ABCD2345");
  assert.equal(normalizeFriendCode("ABCD234", 8), null);
  assert.equal(normalizeFriendCode("ABCD234O", 8), null);
});

test("친구 목록, 코드로 추가, 우편함(요청, 초대, 보상), 알림, 차단 목록, 방 캐릭터로 친구 요청", async () => {
  const browser = await launch();
  const viewport = { width: 1440, height: 900 };
  try {
    const server = createFakeServer();
    const ctxA = await browser.newContext({ viewport });
    const a = await ctxA.newPage();
    const errors = [];
    a.on("pageerror", (e) => errors.push(e.message));
    const state = await mockSupabase(a, { server });

    // 친구 둘: 두리는 같은 방(SEED) 멤버라 방 이름이 보이고, 세나는 내가 멤버가 아닌 방에 있다.
    server.names.set(SECOND_USER_ID, "두리");
    server.addMember(SEED_ROOM.id, SECOND_USER_ID, "두리");
    server.addPresence(SEED_ROOM.id, SECOND_USER_ID);
    server.studyState.set(SECOND_USER_ID, { state: "studying", seconds: 3600 });
    server.addFriend(FAKE_USER_ID, SECOND_USER_ID);
    server.names.set(SENA, "세나");
    const senaRoom = server.addRoom({ name: "세나의 비밀 방", code: "SENA27", ownerId: SENA });
    server.addPresence(senaRoom, SENA);
    server.studyState.set(SENA, { state: "break", seconds: 0 });
    server.addFriend(FAKE_USER_ID, SENA);
    // 코드로 추가할 사람, 요청을 보낸 사람, 차단한 사람.
    server.names.set(NARAE, "나래");
    server.social.codes.set(NARAE, "QRST2345");
    server.names.set(HARU, "하루");
    server.social.requests.add(`${HARU}>${FAKE_USER_ID}`);
    server.addMail(FAKE_USER_ID, { kind: "friend_request", sender_id: HARU, days_left: 30 });
    const duriRoom = server.addRoom({ name: "두리네 회사", code: "DURI27", ownerId: SECOND_USER_ID });
    server.addMail(FAKE_USER_ID, { kind: "room_invite", sender_id: SECOND_USER_ID, room_id: duriRoom, days_left: 29 });
    server.addMail(FAKE_USER_ID, { kind: "reward", payload: { reward: "attendance", coins: 10 }, days_left: 12 });
    server.names.set(BLOCKED, "차단된이");
    server.social.blocks.set(FAKE_USER_ID, new Set([BLOCKED]));
    server.addNotification(FAKE_USER_ID, { kind: "friend_entered", actor_id: SECOND_USER_ID, room_id: SEED_ROOM.id });
    server.addNotification(FAKE_USER_ID, { kind: "pomodoro_end" });
    server.addNotification(FAKE_USER_ID, { kind: "away_check" });

    // 로비 친구 패널 (배치 그대로, 서버 데이터)
    await a.goto(url);
    const panel = a.locator(".friend-list").first();
    await panel.getByText("두리").waitFor();
    await panel.getByText("세나").waitFor();
    const panelText = await panel.innerText();
    assert.match(panelText, /공부 중/);
    assert.match(panelText, /휴식 중/);
    assert.ok(!panelText.includes("·"));
    await a.locator(".notices").getByText("10월 출석 이벤트가 시작되었어요!").waitFor();
    await shot(a, "lobby-friends.png");

    // /friends: 같은 방 멤버인 친구만 방 이름, 아니면 "스터디룸에서"
    await a.goto(`${url}friends`);
    const list = a.getByTestId("friend-list");
    await list.getByText(`${SEED_ROOM.name}에서 공부 중`).waitFor();
    await list.getByText("스터디룸에서 휴식 중").waitFor();
    assert.ok(!(await list.innerText()).includes("세나의 비밀 방"));
    await a.getByTestId("my-friend-code").getByText("ABCD2345").waitFor();
    await a.getByLabel("친구 코드").fill("qrst 2345");
    await a.getByRole("button", { name: "친구 요청 보내기" }).click();
    await a.getByText("친구 요청을 보냈어요.").waitFor();
    assert.ok(server.social.requests.has(`${FAKE_USER_ID}>${NARAE}`));
    assert.ok(server.social.mail.some((m) => m.user_id === NARAE && m.kind === "friend_request"));
    await a.getByLabel("친구 코드").fill("ZZZZ9999");
    await a.getByRole("button", { name: "친구 요청 보내기" }).click();
    await a.getByText("그 친구 코드를 가진 사람이 없어요. 코드를 다시 확인해 주세요.").waitFor();
    await shot(a, "friends-page-add-by-code.png");
    assert.ok(!(await a.locator("main").innerText()).includes("·"));

    // 우편함: 친구 요청, 방 초대, 보상(남은 기한)
    await a.getByRole("button", { name: /^우편함/ }).click();
    const box = a.getByTestId("mailbox");
    await box.getByText("하루님의 친구 요청").waitFor();
    await box.getByText("두리님이 두리네 회사에 초대했어요").waitFor();
    await box.getByText("출석 보상 10코인").waitFor();
    await box.getByText("남은 기한 12일").waitFor();
    assert.ok(!(await box.innerText()).includes("·"));
    await shot(a, "mailbox.png");
    const before = state.coins.balance;
    await box.locator(".mail-reward").getByRole("button", { name: "받기" }).click();
    await box.getByText("10코인을 받았어요.").waitFor();
    assert.equal(state.coins.balance, before + 10);
    await box.locator(".mail-friend_request").getByRole("button", { name: "수락" }).click();
    await box.getByText("친구가 되었어요.").waitFor();
    assert.ok(server.social.friends.has([FAKE_USER_ID, HARU].sort().join("|")));
    await shot(a, "mailbox-after-actions.png");
    // 방 초대에서 바로 입장
    await box.locator(".mail-room_invite").getByRole("button", { name: "바로 입장" }).click();
    await a.waitForURL(new RegExp(`/rooms/${duriRoom}$`));
    assert.ok(server.members.get(duriRoom).has(FAKE_USER_ID));
    await a.locator(".company-toolbar").getByText("두리네 회사").waitFor();

    // 알림 (종 아이콘)
    await a.goto(url);
    await a.getByRole("button", { name: "알림" }).click();
    const bell = a.getByTestId("notification-list");
    await bell.getByText(`두리님이 ${SEED_ROOM.name}에 들어왔어요`).waitFor();
    await bell.getByText("뽀모도로 공부 시간이 끝났어요").waitFor();
    await bell.getByText("자리에 있는지 확인을 요청했어요").waitFor();
    await shot(a, "notifications.png");
    await a.getByRole("button", { name: "닫기", exact: true }).click();

    // 설정의 차단 목록과 해제
    await a.getByRole("button", { name: "설정" }).click();
    const blocks = a.getByRole("region", { name: "차단 목록" });
    await blocks.getByText("차단된이").waitFor();
    await shot(a, "settings-block-list.png");
    await blocks.getByRole("button", { name: "차단 해제" }).click();
    await blocks.getByText("차단한 사람이 없어요.").waitFor();
    assert.ok(!server.social.blocks.get(FAKE_USER_ID).has(BLOCKED));
    await a.getByRole("button", { name: "닫기", exact: true }).click();

    // 같은 방 캐릭터를 눌러 친구 요청 (아직 친구가 아닌 새 멤버)
    const ctxB = await browser.newContext({ viewport });
    const b = await ctxB.newPage();
    b.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(b, { server, userId: NEW_FACE, displayName: "새봄", seedRoom: false });
    server.addMember(SEED_ROOM.id, NEW_FACE, "새봄");
    await a.goto(`${url}rooms/${SEED_ROOM.id}`);
    await a.locator(".company-toolbar").getByText(SEED_ROOM.name).waitFor();
    // 방 안의 친구(두리)에게 입장 알림이 남는다.
    assert.ok(server.social.notifications.some((n) => n.user_id === SECOND_USER_ID && n.kind === "friend_entered"));
    await a.getByRole("button", { name: "친구 초대" }).waitFor();
    await b.goto(`${url}rooms/${SEED_ROOM.id}`);
    const remote = a.getByTestId("remote-character");
    await remote.waitFor({ timeout: 20000 });
    await remote.click({ force: true });
    const request = remote.getByRole("button", { name: "친구 요청" });
    await request.waitFor();
    await shot(a, "room-character-friend-request.png");
    await request.click();
    await remote.getByText("요청을 보냈어요").waitFor();
    assert.ok(server.social.requests.has(`${FAKE_USER_ID}>${NEW_FACE}`));
    await shot(a, "room-character-friend-request-sent.png");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
