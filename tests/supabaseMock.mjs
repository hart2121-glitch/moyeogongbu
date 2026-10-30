// 브라우저 테스트용 가짜 로그인. 앱 코드에는 우회 장치가 없고, 테스트에서만
// supabase-js가 읽는 로컬 스토리지 세션을 심고 Supabase 요청에 가짜 응답을 준다.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

export const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

/** 만료가 먼 가짜 세션. 서명은 검증되지 않는다(요청은 모두 아래 route가 받는다). */
function fakeSession() {
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24 * 365;
  const user = {
    id: FAKE_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "tester@example.com",
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: {},
    created_at: "2026-10-29T00:00:00Z",
  };
  const access_token = [
    b64url({ alg: "HS256", typ: "JWT" }),
    b64url({ sub: FAKE_USER_ID, role: "authenticated", aud: "authenticated", exp }),
    "test-signature",
  ].join(".");
  return { access_token, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600 * 24 * 365, expires_at: exp, user };
}

/**
 * 페이지에 로그인 상태와 Supabase 가짜 응답을 건다. page.goto 전에 부른다.
 * @param {import("@playwright/test").Page} page
 * @param {{ displayName?: string | null, signedIn?: boolean }} [options]
 * @returns 테스트가 확인할 수 있는 가짜 서버 상태 (profile, study, calls)
 */
export async function mockSupabase(page, { displayName = "밍구", signedIn = true } = {}) {
  const session = fakeSession();
  const state = {
    profile: { id: FAKE_USER_ID, display_name: displayName, friend_code: "ABCD2345" },
    // 공부 세션 RPC의 가짜 서버. 시각은 테스트 프로세스의 실제 시각이다.
    study: { tabId: null, state: null, closedSeconds: 0, openSince: null },
    calls: [],
  };
  const studySnapshot = () => ({
    server_now: new Date().toISOString(),
    day: new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10),
    closed_seconds: state.study.closedSeconds,
    open_since: state.study.openSince ? new Date(state.study.openSince).toISOString() : null,
    state: state.study.state,
    tab_id: state.study.tabId,
  });
  const closeStudy = (at) => {
    if (state.study.openSince === null) return;
    const end = Math.min(Date.now(), Math.max(state.study.openSince, at));
    state.study.closedSeconds += Math.floor((end - state.study.openSince) / 1000);
    state.study.openSince = null;
  };
  const studyRpc = (name, args) => {
    if (name === "claim_study_session") {
      closeStudy(Date.now());
      Object.assign(state.study, { tabId: args.p_tab_id, state: "break" });
    } else if (args.p_tab_id !== state.study.tabId) {
      return { status: 400, body: { code: "P0001", message: "session_taken" } };
    } else if (name === "set_study_state") {
      if (args.p_state === "studying") state.study.openSince ??= Date.now();
      else closeStudy(Date.now());
      state.study.state = args.p_state;
    } else if (name === "mark_study_away") {
      closeStudy(Date.parse(args.p_at));
      state.study.state = "away";
    }
    return { status: 200, body: studySnapshot() };
  };
  if (signedIn) {
    await page.addInitScript(
      ([key, value]) => {
        if (!sessionStorage.getItem("mock-seeded")) {
          localStorage.setItem(key, value);
          sessionStorage.setItem("mock-seeded", "1");
        }
      },
      [STORAGE_KEY, JSON.stringify(session)],
    );
  }
  const json = (route, body, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  await page.route(`${SUPABASE_URL}/auth/v1/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    state.calls.push(`${route.request().method()} ${path}`);
    if (path.endsWith("/user")) return json(route, session.user);
    if (path.endsWith("/token")) return json(route, session);
    if (path.endsWith("/logout")) return route.fulfill({ status: 204, body: "" });
    return json(route, {});
  });
  // 실시간 연결은 받기만 하고 답하지 않는다 (탭 넘겨받기 알림은 오지 않음).
  await page.routeWebSocket(/\/realtime\/v1\/websocket/, () => {});
  await page.route(`${SUPABASE_URL}/rest/v1/**`, (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    state.calls.push(`${request.method()} ${path}`);
    if (path.endsWith("/rpc/delete_account")) return route.fulfill({ status: 204, body: "" });
    const rpc = path.match(/\/rpc\/(claim_study_session|set_study_state|heartbeat_study_session|mark_study_away)$/);
    if (rpc) {
      const { status, body } = studyRpc(rpc[1], request.postDataJSON() ?? {});
      return json(route, body, status);
    }
    if (path.endsWith("/profiles")) {
      if (request.method() === "PATCH") Object.assign(state.profile, request.postDataJSON());
      return json(route, state.profile);
    }
    return json(route, { message: "테스트 가짜 응답 없음" }, 404);
  });
  return state;
}
