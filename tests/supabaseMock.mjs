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
 * @returns 테스트가 확인할 수 있는 가짜 서버 상태 (profile, calls)
 */
export async function mockSupabase(page, { displayName = "밍구", signedIn = true } = {}) {
  const session = fakeSession();
  const state = {
    profile: { id: FAKE_USER_ID, display_name: displayName, friend_code: "ABCD2345" },
    calls: [],
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
  await page.route(`${SUPABASE_URL}/rest/v1/**`, (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    state.calls.push(`${request.method()} ${path}`);
    if (path.endsWith("/rpc/delete_account")) return route.fulfill({ status: 204, body: "" });
    if (path.endsWith("/profiles")) {
      if (request.method() === "PATCH") Object.assign(state.profile, request.postDataJSON());
      return json(route, state.profile);
    }
    return json(route, { message: "테스트 가짜 응답 없음" }, 404);
  });
  return state;
}
