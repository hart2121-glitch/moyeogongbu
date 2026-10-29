// 브라우저 테스트용 가짜 로그인. 앱 코드에는 우회 장치가 없고, 테스트에서만
// supabase-js가 읽는 로컬 스토리지 세션을 심고 Supabase 요청에 가짜 응답을 준다.
// Story 004: 방 RPC의 메모리 가짜 서버(createFakeServer)와 Realtime 웹소켓 가짜(Phoenix 2.0.0)를 더한다.
// 같은 가짜 서버를 여러 페이지(서로 다른 사용자)에 넘기면 방, 좌석, presence, broadcast를 함께 쓴다.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

export const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";
export const SECOND_USER_ID = "00000000-0000-4000-8000-000000000002";
/** 기본으로 심는 방 (FAKE_USER_ID가 방장). 로비의 회사 빠른 입장이 들어가는 곳. */
export const SEED_ROOM = { id: "10000000-0000-4000-8000-000000000001", name: "함께하는 회사", code: "TEAM26" };

// 서버 room_rules와 같은 값.
const RULES = { maxOwned: 3, maxMembers: 6, maxConcurrent: 6, seats: 6, graceMs: 120_000 };

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

/** 만료가 먼 가짜 세션. 서명은 검증되지 않는다(요청은 모두 아래 route가 받는다). */
function fakeSession(userId) {
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24 * 365;
  const user = {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: `${userId.slice(-4)}@example.com`,
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: {},
    created_at: "2026-10-29T00:00:00Z",
  };
  const access_token = [
    b64url({ alg: "HS256", typ: "JWT" }),
    b64url({ sub: userId, role: "authenticated", aud: "authenticated", exp }),
    "test-signature",
  ].join(".");
  return { access_token, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600 * 24 * 365, expires_at: exp, user };
}

let roomSeq = 1;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * 방 RPC와 Realtime을 흉내 내는 메모리 서버. 판정 규칙은 `supabase/migrations/*_rooms.sql`과 같다.
 * 자바스크립트는 한 번에 한 요청만 처리하므로 claim_seat는 원자적이다.
 */
export function createFakeServer() {
  const server = {
    names: new Map(),
    rooms: new Map(),
    /** roomId -> Map(userId -> joinedAt) */
    members: new Map(),
    bans: new Map(),
    /** roomId -> [{ userId, lastSeen }] (index = seatNo - 1) */
    seats: new Map(),
    /** roomId -> Map(`${userId}|${tabId}` -> { userId, lastSeen }) */
    presence: new Map(),
    tasks: new Map(),
    studyState: new Map(),
    /** Realtime 구독: { ws, topic, key } */
    subs: new Set(),
    /** topic -> Map(key -> meta) */
    realtimePresence: new Map(),
    broadcasts: [],
    addRoom({ id = `10000000-0000-4000-8000-${String(++roomSeq).padStart(12, "0")}`, name, code, ownerId }) {
      server.rooms.set(id, { id, name, invite_code: code, owner_id: ownerId, created_at: Date.now() });
      server.members.set(id, new Map([[ownerId, Date.now()]]));
      server.bans.set(id, new Set());
      server.seats.set(id, Array.from({ length: RULES.seats }, () => ({ userId: null, lastSeen: 0 })));
      server.presence.set(id, new Map());
      return id;
    },
    addMember(roomId, userId, name) {
      if (name) server.names.set(userId, name);
      server.members.get(roomId).set(userId, Date.now() + server.members.get(roomId).size);
    },
    /** 이 사용자가 방 안에 있는 것처럼 접속 줄을 넣는다 (동시 인원 시험용). */
    addPresence(roomId, userId) {
      server.presence.get(roomId).set(`${userId}|fake-tab-0001`, { userId, lastSeen: Date.now() });
    },
    /** 연결이 끊긴 지 ms만큼 지난 것처럼 마지막 응답 시각을 당긴다. */
    age(userId, ms) {
      for (const seats of server.seats.values()) for (const s of seats) if (s.userId === userId) s.lastSeen -= ms;
      for (const map of server.presence.values()) for (const p of map.values()) if (p.userId === userId) p.lastSeen -= ms;
    },
    seatHolder: (roomId, seatNo) => {
      const s = server.seats.get(roomId)?.[seatNo - 1];
      return s && s.userId && s.lastSeen >= Date.now() - RULES.graceMs ? s.userId : null;
    },
    nextCode() {
      let code;
      do code = Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
      while ([...server.rooms.values()].some((r) => r.invite_code === code));
      return code;
    },
  };
  return server;
}

class RpcError extends Error {}
const fail = (code) => {
  throw new RpcError(code);
};

function roomRpc(server, me, name, args) {
  const now = Date.now();
  const fresh = (t) => t >= now - RULES.graceMs;
  const room = server.rooms.get(args.p_room);
  const isMember = (id) => !!server.members.get(id)?.has(me);
  const requireMember = () => {
    if (!room || !isMember(room.id)) fail("not_member");
  };
  const requireOwner = () => {
    if (!room || room.owner_id !== me) fail("not_owner");
  };
  const json = (r) => ({
    id: r.id,
    name: r.name,
    invite_code: r.invite_code,
    owner_id: r.owner_id,
    is_owner: r.owner_id === me,
    member_count: server.members.get(r.id).size,
    online_count: new Set([...server.presence.get(r.id).values()].filter((p) => fresh(p.lastSeen)).map((p) => p.userId)).size,
  });
  const sweep = (id) => {
    for (const s of server.seats.get(id)) if (s.userId && !fresh(s.lastSeen)) Object.assign(s, { userId: null, lastSeen: 0 });
    for (const [k, p] of server.presence.get(id)) if (!fresh(p.lastSeen)) server.presence.get(id).delete(k);
  };
  const state = (id) => ({
    server_now: new Date().toISOString(),
    seats: server.seats.get(id).map((s, i) => ({ seat_no: i + 1, user_id: s.userId && fresh(s.lastSeen) ? s.userId : null })),
    online: [...new Set([...server.presence.get(id).values()].map((p) => p.userId))],
  });
  const touch = (id, tab) => {
    const map = server.presence.get(id);
    const others = new Set([...map.values()].filter((p) => p.userId !== me).map((p) => p.userId));
    if (![...map.values()].some((p) => p.userId === me) && others.size >= RULES.maxConcurrent) fail("room_full");
    map.set(`${me}|${tab}`, { userId: me, lastSeen: now });
    for (const s of server.seats.get(id)) if (s.userId === me) s.lastSeen = now;
  };
  const removeMember = (id, user) => {
    for (const s of server.seats.get(id)) if (s.userId === user) Object.assign(s, { userId: null, lastSeen: 0 });
    for (const [k, p] of server.presence.get(id)) if (p.userId === user) server.presence.get(id).delete(k);
    server.members.get(id).delete(user);
    const r = server.rooms.get(id);
    if (r.owner_id === user) {
      const next = [...server.members.get(id)].sort((a, b) => a[1] - b[1])[0];
      if (next) r.owner_id = next[0];
      else server.rooms.delete(id);
    }
  };
  switch (name) {
    case "list_my_rooms":
      return [...server.rooms.values()]
        .filter((r) => isMember(r.id))
        .sort((a, b) => server.members.get(a.id).get(me) - server.members.get(b.id).get(me))
        .map(json);
    case "create_room": {
      const n = String(args.p_name ?? "").trim();
      if (n.length < 1 || n.length > 20) fail("invalid_name");
      if ([...server.rooms.values()].filter((r) => r.owner_id === me).length >= RULES.maxOwned) fail("room_limit");
      return json(server.rooms.get(server.addRoom({ name: n, code: server.nextCode(), ownerId: me })));
    }
    case "join_by_code": {
      const code = String(args.p_code ?? "").trim().toUpperCase();
      const r = [...server.rooms.values()].find((x) => x.invite_code === code);
      if (!r) fail("invalid_code");
      if (isMember(r.id)) return json(r);
      if (server.bans.get(r.id).has(me)) fail("banned");
      if (server.members.get(r.id).size >= RULES.maxMembers) fail("members_full");
      server.addMember(r.id, me);
      return json(r);
    }
    case "leave_room":
      requireMember();
      removeMember(room.id, me);
      return null;
    case "rename_room": {
      requireOwner();
      const n = String(args.p_name ?? "").trim();
      if (n.length < 1 || n.length > 20) fail("invalid_name");
      room.name = n;
      return json(room);
    }
    case "reissue_code":
      requireOwner();
      room.invite_code = server.nextCode();
      return json(room);
    case "kick_member":
      requireOwner();
      if (args.p_user === me) fail("invalid_member");
      removeMember(room.id, args.p_user);
      server.bans.get(room.id).add(args.p_user);
      return null;
    case "unban_member":
      requireOwner();
      server.bans.get(room.id).delete(args.p_user);
      return null;
    case "list_room_bans":
      requireOwner();
      return [...server.bans.get(room.id)].map((u) => ({ user_id: u, display_name: server.names.get(u) ?? null }));
    case "enter_room":
    case "heartbeat_room":
      requireMember();
      sweep(room.id);
      touch(room.id, args.p_tab_id);
      return state(room.id);
    case "exit_room": {
      if (!room) return null;
      server.presence.get(room.id).delete(`${me}|${args.p_tab_id}`);
      if (![...server.presence.get(room.id).values()].some((p) => p.userId === me))
        for (const s of server.seats.get(room.id)) if (s.userId === me) Object.assign(s, { userId: null, lastSeen: 0 });
      return null;
    }
    case "claim_seat": {
      requireMember();
      const seat = server.seats.get(room.id)[args.p_seat - 1];
      if (!seat) fail("invalid_seat");
      if (![...server.presence.get(room.id).values()].some((p) => p.userId === me && fresh(p.lastSeen))) fail("not_in_room");
      if (seat.userId && seat.userId !== me && fresh(seat.lastSeen)) return false;
      for (const s of server.seats.get(room.id)) if (s.userId === me) Object.assign(s, { userId: null, lastSeen: 0 });
      Object.assign(seat, { userId: me, lastSeen: now });
      return true;
    }
    case "release_seat":
      if (room) for (const s of server.seats.get(room.id)) if (s.userId === me) Object.assign(s, { userId: null, lastSeen: 0 });
      return null;
    case "room_member_status":
      requireMember();
      return [...server.members.get(room.id)]
        .sort((a, b) => a[1] - b[1])
        .map(([u]) => {
          const study = server.studyState.get(u) ?? { state: "left", seconds: 0 };
          const task = server.tasks.get(u);
          return {
            user_id: u,
            display_name: server.names.get(u) ?? null,
            is_owner: room.owner_id === u,
            state: study.state,
            today_seconds: study.seconds,
            current_task: task?.shared ? task.task : null,
          };
        });
    case "set_current_task": {
      const task = String(args.p_task ?? "").trim() || null;
      server.tasks.set(me, { task, shared: !!args.p_shared });
      return { task, shared: !!args.p_shared };
    }
    case "my_current_task":
      return server.tasks.get(me) ?? { task: null, shared: false };
  }
  return undefined;
}

// Realtime (Phoenix 직렬화 2.0.0). 클라이언트 → 서버 broadcast는 바이너리(kind 3), 서버 → 클라이언트는 JSON 배열.
function realtime(server, ws) {
  const send = (target, msg) => {
    try {
      target.send(JSON.stringify(msg));
    } catch {
      /* 닫힌 소켓 */
    }
  };
  const subsOf = (topic) => [...server.subs].filter((s) => s.topic === topic);
  const presenceOf = (topic) => {
    if (!server.realtimePresence.has(topic)) server.realtimePresence.set(topic, new Map());
    return server.realtimePresence.get(topic);
  };
  let refSeq = 0;
  const leave = (sub) => {
    server.subs.delete(sub);
    const map = presenceOf(sub.topic);
    const meta = map.get(sub.key);
    if (meta && sub.tracked) {
      map.delete(sub.key);
      for (const other of subsOf(sub.topic))
        send(other.ws, [null, null, sub.topic, "presence_diff", { joins: {}, leaves: { [sub.key]: { metas: [meta] } } }]);
    }
  };
  ws.onMessage((raw) => {
    if (typeof raw !== "string") {
      const buf = Buffer.from(raw);
      if (buf[0] !== 3) return;
      const [jl, rl, tl, el, ml] = [buf[1], buf[2], buf[3], buf[4], buf[5]];
      let o = 7 + jl + rl;
      const topic = buf.subarray(o, o + tl).toString("utf8");
      o += tl;
      const event = buf.subarray(o, o + el).toString("utf8");
      o += el + ml;
      const payload = JSON.parse(buf.subarray(o).toString("utf8"));
      server.broadcasts.push({ topic, event, payload });
      for (const other of subsOf(topic))
        if (other.ws !== ws) send(other.ws, [null, null, topic, "broadcast", { type: "broadcast", event, payload }]);
      return;
    }
    const [joinRef, ref, topic, event, payload] = JSON.parse(raw);
    const reply = (response = {}) => send(ws, [joinRef, ref, topic, "phx_reply", { status: "ok", response }]);
    if (topic === "phoenix") return reply();
    const sub = [...server.subs].find((s) => s.ws === ws && s.topic === topic);
    if (event === "phx_join") {
      if (sub) leave(sub);
      const next = { ws, topic, key: payload?.config?.presence?.key || `anon-${++refSeq}`, tracked: false };
      server.subs.add(next);
      reply({
        postgres_changes: (payload?.config?.postgres_changes ?? []).map((c, i) => ({ ...c, id: i + 1 })),
      });
      const state = Object.fromEntries([...presenceOf(topic)].map(([k, meta]) => [k, { metas: [meta] }]));
      send(ws, [joinRef, null, topic, "presence_state", state]);
      return;
    }
    if (event === "phx_leave") {
      if (sub) leave(sub);
      return reply();
    }
    if (event === "presence" && sub) {
      if (payload?.event === "track") {
        const meta = { ...payload.payload, phx_ref: `ref-${++refSeq}` };
        const old = presenceOf(topic).get(sub.key);
        presenceOf(topic).set(sub.key, meta);
        sub.tracked = true;
        for (const other of subsOf(topic))
          send(other.ws, [null, null, topic, "presence_diff", {
            joins: { [sub.key]: { metas: [meta] } },
            leaves: old ? { [sub.key]: { metas: [old] } } : {},
          }]);
      } else if (payload?.event === "untrack") {
        leave(sub);
        server.subs.add({ ...sub, tracked: false });
      }
      return reply();
    }
    if (event === "broadcast") {
      for (const other of subsOf(topic)) if (other.ws !== ws) send(other.ws, [null, null, topic, "broadcast", payload]);
      return reply();
    }
    return reply();
  });
  ws.onClose(() => {
    for (const sub of [...server.subs]) if (sub.ws === ws) leave(sub);
  });
}

/**
 * 페이지에 로그인 상태와 Supabase 가짜 응답을 건다. page.goto 전에 부른다.
 * 서로 다른 사용자를 같은 방에 넣으려면 같은 `server`를 넘기고 페이지마다 다른 브라우저 컨텍스트를 쓴다
 * (같은 컨텍스트는 로그인 저장소를 함께 쓴다).
 * @param {import("@playwright/test").Page} page
 * @param {{ displayName?: string | null, signedIn?: boolean, balance?: number, pendingSettlement?: object | null,
 *   server?: ReturnType<typeof createFakeServer>, userId?: string, seedRoom?: boolean }} [options]
 * @returns 테스트가 확인할 수 있는 가짜 서버 상태 (profile, study, coins, todos, calls, server)
 */
export async function mockSupabase(
  page,
  {
    displayName = "밍구",
    signedIn = true,
    balance = 340,
    pendingSettlement = null,
    server = createFakeServer(),
    userId = FAKE_USER_ID,
    seedRoom = userId === FAKE_USER_ID,
  } = {},
) {
  const session = fakeSession(userId);
  server.names.set(userId, displayName);
  if (seedRoom && !server.rooms.has(SEED_ROOM.id))
    server.addRoom({ id: SEED_ROOM.id, name: SEED_ROOM.name, code: SEED_ROOM.code, ownerId: userId });
  const state = {
    profile: { id: userId, display_name: displayName, friend_code: "ABCD2345" },
    // 공부 세션 RPC의 가짜 서버. 시각은 테스트 프로세스의 실제 시각이다.
    study: { tabId: null, state: null, closedSeconds: 0, openSince: null },
    calls: [],
    // 코인 RPC의 가짜 서버 (Story 003). 규칙 수치는 서버 coin_rules 기본값과 같다.
    coins: { balance, todo: 0, pomodoro: 0 },
    pending: pendingSettlement,
    todos: [],
    server,
  };
  const rules = {
    study_coins_per_minute: 1,
    study_daily_coin_cap: 600,
    pomodoro_bonus: 5,
    pomodoro_min_study_minutes: 20,
    pomodoro_max_study_minutes: 60,
    pomodoro_daily_max: 10,
    todo_coins: 2,
    todo_daily_max: 10,
  };
  const daySummary = () => {
    const study = Math.min(Math.floor(state.study.closedSeconds / 60), rules.study_daily_coin_cap);
    const total = study + state.coins.pomodoro + state.coins.todo;
    return {
      day: new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10),
      study_seconds: state.study.closedSeconds,
      coins: { study, pomodoro: state.coins.pomodoro, todo: state.coins.todo },
      total,
      balance: state.coins.balance + total,
    };
  };
  const coinRpc = (name, args) => {
    if (name === "get_coin_summary") return { ...daySummary(), rules };
    if (name === "settle_study") return daySummary();
    if (name === "pending_settlement") return state.pending;
    if (name === "dismiss_settlement") {
      if (state.pending?.day === args.p_day) state.pending = null;
      return null;
    }
    return { awarded: false, reason: "not_covered" };
  };
  let nextTodoId = 1;
  const todoId = (url) => Number(new URL(url).searchParams.get("id")?.replace("eq.", ""));
  const todoRoute = (request) => {
    const method = request.method();
    if (method === "GET") return state.todos.map(({ id, text, done }) => ({ id, text, done }));
    if (method === "POST") {
      const row = { id: nextTodoId++, text: request.postDataJSON().text, done: false };
      state.todos.push(row);
      return [row];
    }
    const id = todoId(request.url());
    const todo = state.todos.find((t) => t.id === id);
    if (method === "PATCH" && todo) {
      const { done } = request.postDataJSON();
      if (done !== undefined && done !== todo.done) state.coins.todo += done ? rules.todo_coins : -rules.todo_coins;
      Object.assign(todo, request.postDataJSON());
    }
    if (method === "DELETE") state.todos = state.todos.filter((t) => t.id !== id);
    return null;
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
    // 같은 방 사람들의 상태 표시용 (room_member_status).
    const open = state.study.openSince ? Math.floor((Date.now() - state.study.openSince) / 1000) : 0;
    server.studyState.set(userId, { state: state.study.state, seconds: state.study.closedSeconds + open });
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
  await page.routeWebSocket(/\/realtime\/v1\/websocket/, (ws) => realtime(server, ws));
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
    const coin = path.match(/\/rpc\/(get_coin_summary|settle_study|pending_settlement|dismiss_settlement|claim_pomodoro_bonus)$/);
    if (coin) return json(route, coinRpc(coin[1], request.postDataJSON() ?? {}));
    const room = path.match(/\/rpc\/(\w+)$/);
    if (room) {
      try {
        const body = roomRpc(server, userId, room[1], request.postDataJSON() ?? {});
        if (body !== undefined) return json(route, body);
      } catch (e) {
        if (e instanceof RpcError) return json(route, { code: "P0001", message: e.message }, 400);
        throw e;
      }
    }
    if (path.endsWith("/todos")) {
      const body = todoRoute(request);
      return body === null ? route.fulfill({ status: 204, body: "" }) : json(route, body, request.method() === "POST" ? 201 : 200);
    }
    if (path.endsWith("/profiles")) {
      if (request.method() === "PATCH") Object.assign(state.profile, request.postDataJSON());
      return json(route, state.profile);
    }
    return json(route, { message: "테스트 가짜 응답 없음" }, 404);
  });
  return state;
}
