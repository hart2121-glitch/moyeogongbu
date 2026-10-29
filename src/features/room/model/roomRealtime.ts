import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * 방 하나의 Supabase Realtime 채널 (Story 004). 앱의 방 실시간 기능은 모두 이 모듈만 쓴다.
 *
 * - presence: 누가 방에 있는지와, 마지막으로 멈춘 위치 (늦게 들어온 사람이 처음 그릴 자리).
 *   걷는 도중에는 보내지 않고 도착할 때만 갱신한다.
 * - broadcast "move": 목적지만 (좌석, 이름 있는 지점, 바닥 좌표). 경로는 받는 쪽이
 *   같은 결정적 길찾기(`src/study/movementPlan.js`)로 다시 계산해 걷는 모습을 재생한다.
 * - broadcast "reaction": 정해진 반응 키만. 보내는 쪽과 받는 쪽이 모두 간격과 목록을 검사한다.
 * - broadcast "seats", "members": 좌석이나 멤버가 바뀌었으니 서버에서 다시 읽으라는 알림 (내용 없음).
 *
 * 공개 채널이라 broadcast의 보낸 사람(from)은 클라이언트가 적는다. 받는 쪽은 presence에 있는
 * 사람의 메시지만 받고, 좌석과 멤버는 언제나 서버 RPC 결과만 믿는다.
 */

/** presence에 싣는 내 캐릭터의 멈춘 상태. */
export interface PresenceMeta {
  userId: string;
  name: string;
  node: string;
  x: number;
  y: number;
  activity: string;
  seatId: number | null;
  direction: string;
}

export interface RoomChannelHandlers {
  /** 채널이 연결됐거나(true) 끊겼다(false). 브라우저 offline 이벤트도 끊김으로 본다. */
  onStatus: (connected: boolean) => void;
  /** 나를 뺀 방 안 사람들의 최신 상태. 들어오고 나가거나 누군가 멈출 때마다. */
  onPresence: (others: PresenceMeta[]) => void;
  onMove: (userId: string, move: unknown) => void;
  onReaction: (userId: string, key: unknown) => void;
  onSeatsChanged: () => void;
  onMembersChanged: () => void;
}

export interface RoomChannel {
  /** 내 멈춘 상태를 presence에 싣는다. 끊긴 동안 부르면 다시 연결될 때 싣는다. */
  track: (meta: PresenceMeta) => void;
  sendMove: (move: unknown) => void;
  sendReaction: (key: string) => void;
  notifySeats: () => void;
  notifyMembers: () => void;
  close: () => void;
}

/** 방 채널 이름. */
export const roomTopic = (roomId: string) => `room:${roomId}`;

/**
 * 방 채널에 들어간다.
 * @example const channel = openRoomChannel(supabase, room.id, userId, handlers); channel.sendMove(move);
 */
export function openRoomChannel(
  client: SupabaseClient,
  roomId: string,
  userId: string,
  handlers: RoomChannelHandlers,
): RoomChannel {
  let closed = false;
  let connected = false;
  let lastMeta: PresenceMeta | null = null;
  let known = new Set<string>();
  const channel: RealtimeChannel = client.channel(roomTopic(roomId), {
    config: { broadcast: { self: false }, presence: { key: userId } },
  });

  const setConnected = (value: boolean) => {
    if (closed || connected === value) return;
    connected = value;
    handlers.onStatus(value);
  };

  const fromKnown = (payload: unknown, run: (from: string, body: Record<string, unknown>) => void) => {
    const body = (payload ?? {}) as Record<string, unknown>;
    const from = body.from;
    if (typeof from !== "string" || from === userId || !known.has(from)) return;
    run(from, body);
  };

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceMeta>();
      const others: PresenceMeta[] = [];
      for (const [key, metas] of Object.entries(state)) {
        const meta = metas[metas.length - 1];
        if (key === userId || !meta || meta.userId !== key) continue;
        others.push(meta);
      }
      known = new Set(others.map((m) => m.userId));
      handlers.onPresence(others);
    })
    .on("broadcast", { event: "move" }, ({ payload }) =>
      fromKnown(payload, (from, body) => handlers.onMove(from, body.move)),
    )
    .on("broadcast", { event: "reaction" }, ({ payload }) =>
      fromKnown(payload, (from, body) => handlers.onReaction(from, body.key)),
    )
    .on("broadcast", { event: "seats" }, () => handlers.onSeatsChanged())
    .on("broadcast", { event: "members" }, () => handlers.onMembersChanged())
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConnected(true);
        if (lastMeta) void channel.track(lastMeta);
      } else {
        setConnected(false);
      }
    });

  const onOffline = () => setConnected(false);
  // 소켓이 끊김을 알아채기 전에 돌아왔으면 채널은 그대로 들어가 있다.
  const onOnline = () => {
    if (channel.state === "joined") {
      setConnected(true);
      if (lastMeta) void channel.track(lastMeta);
    }
  };
  window.addEventListener("offline", onOffline);
  window.addEventListener("online", onOnline);

  const send = (event: string, payload: Record<string, unknown>) => {
    if (closed || !connected) return;
    void channel.send({ type: "broadcast", event, payload: { from: userId, ...payload } });
  };

  return {
    track: (meta) => {
      lastMeta = meta;
      if (connected && !closed) void channel.track(meta);
    },
    sendMove: (move) => send("move", { move }),
    sendReaction: (key) => send("reaction", { key }),
    notifySeats: () => send("seats", {}),
    notifyMembers: () => send("members", {}),
    close: () => {
      closed = true;
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      void client.removeChannel(channel);
    },
  };
}
