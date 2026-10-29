import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { companyLayout } from "../../../study/companyLayout";
import { createSeatService } from "../../../study/seatService";
import { RoomError, type MemberStatus } from "../model/room";
import { REACTION_KEYS, ROOM_CONFIG } from "../model/roomConfig";
import type { PresenceMeta, RoomChannel } from "../model/roomRealtime";
import { createReactionGate, parseMove, type RoomMove } from "../model/roomRules";
import { roomStore } from "../model/roomStore";
import { roomsKey } from "./useMyRooms";

/** entering: 입장 중, ready: 방 안, full: 방이 가득 참, gone: 멤버가 아님(강퇴, 나감), error: 연결 실패. */
export type RoomPhase = "entering" | "ready" | "full" | "gone" | "error";

export interface ShownReaction {
  key: string;
  at: number;
}

const newTabId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * 실시간 회사 방 하나 (Story 004). 입장(동시 인원 판정), 연결 확인, 서버 좌석 저장소,
 * Realtime 채널(누가 있는지, 이동 목적지, 반응), 같은 방 사람들의 상태를 묶는다.
 * 다른 사람의 이동은 React 상태가 아닌 구독(`subscribeMoves`)으로 그 캐릭터에게만 전달한다.
 * @example const live = useRoomLive(room.id, userId, nickname);
 */
export function useRoomLive(roomId: string, userId: string, nickname: string) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<RoomPhase>("entering");
  const [connected, setConnected] = useState(false);
  const [others, setOthers] = useState<PresenceMeta[]>([]);
  const [reactions, setReactions] = useState<Record<string, ShownReaction>>({});
  const tab = useRef("");
  const channel = useRef<RoomChannel | null>(null);
  const names = useRef(new Map<string, string>());
  const moveListeners = useRef(new Map<string, Set<(move: RoomMove) => void>>());
  const receiveGate = useRef(createReactionGate(REACTION_KEYS, ROOM_CONFIG.reactionIntervalMs));
  const sendGate = useRef(createReactionGate(REACTION_KEYS, ROOM_CONFIG.reactionIntervalMs));
  const nicknameRef = useRef(nickname);
  nicknameRef.current = nickname;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const lost = useCallback((e: unknown) => {
    if (e instanceof RoomError && e.code === "not_member") setPhase("gone");
  }, []);

  const service = useMemo(
    () =>
      createSeatService({
        ownerId: userId,
        claim: (seat: number) => roomStore.claimSeat(roomId, seat),
        release: () => roomStore.releaseSeat(roomId),
        fetchSeats: async () => {
          try {
            return (await roomStore.heartbeat(roomId, tab.current)).seats;
          } catch (e) {
            lost(e);
            throw e;
          }
        },
        nameOf: (id: string) => names.current.get(id) ?? (id === userId ? nicknameRef.current : "다른 사람"),
        onChanged: () => channel.current?.notifySeats(),
      }),
    [roomId, userId, lost],
  );

  const members = useQuery({
    queryKey: ["room-members", roomId],
    queryFn: () => roomStore.memberStatus(roomId),
    enabled: phase === "ready",
    refetchInterval: ROOM_CONFIG.memberStatusRefreshMs,
    retry: false,
  });
  useEffect(() => {
    if (members.error) lost(members.error);
  }, [members.error, lost]);
  useEffect(() => {
    if (!members.data) return;
    names.current = new Map(members.data.map((m) => [m.userId, m.displayName]));
    service.renamed();
  }, [members.data, service]);

  const show = useCallback((id: string, key: string) => {
    const at = Date.now();
    setReactions((old) => ({ ...old, [id]: { key, at } }));
    window.setTimeout(
      () =>
        setReactions((old) => {
          if (old[id]?.at !== at) return old;
          const next = { ...old };
          delete next[id];
          return next;
        }),
      ROOM_CONFIG.reactionDisplayMs,
    );
  }, []);

  useEffect(() => {
    // StrictMode에서 효과가 두 번 돌아도 앞 탭의 퇴장이 뒤 탭의 입장을 지우지 않도록 실행마다 탭 식별자를 새로 쓴다.
    const tabId = newTabId();
    tab.current = tabId;
    let cancelled = false;
    let timer = 0;
    let previous = new Set<string>();
    setPhase("entering");
    roomStore
      .enter(roomId, tabId)
      .then((state) => {
        if (cancelled) return;
        service.apply(state.seats);
        setPhase("ready");
        channel.current = roomStore.openChannel(roomId, userId, {
          onStatus: (value) => {
            setConnected(value);
            if (value) service.refresh().catch(() => undefined);
          },
          onPresence: (list) => {
            const ids = new Set(list.map((m) => m.userId));
            if ([...previous].some((id) => !ids.has(id)))
              window.setTimeout(() => service.refresh().catch(() => undefined), ROOM_CONFIG.seatRefreshDelayMs);
            if ([...ids].some((id) => !previous.has(id)))
              void queryClient.invalidateQueries({ queryKey: ["room-members", roomId] });
            previous = ids;
            setOthers(list);
          },
          onMove: (from, raw) => {
            const move = parseMove(raw, companyLayout.nodes, ROOM_CONFIG.seatCount);
            if (move) moveListeners.current.get(from)?.forEach((fn) => fn(move));
          },
          onReaction: (from, key) => {
            if (receiveGate.current(from, key, Date.now())) show(from, key as string);
          },
          onSeatsChanged: () => void service.refresh().catch(() => undefined),
          onMembersChanged: () => {
            void queryClient.invalidateQueries({ queryKey: ["room-members", roomId] });
            void queryClient.invalidateQueries({ queryKey: roomsKey(userId) });
          },
        });
        timer = window.setInterval(() => void service.refresh().catch(() => undefined), ROOM_CONFIG.heartbeatMs);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof RoomError && (e.code === "room_full" || e.code === "members_full")) setPhase("full");
        else if (e instanceof RoomError && e.code === "not_member") setPhase("gone");
        else setPhase("error");
      });
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      channel.current?.close();
      channel.current = null;
      setConnected(false);
      void roomStore.exit(roomId, tabId).catch(() => undefined);
    };
  }, [roomId, userId, service, queryClient, show]);

  // 좌석 저장소는 닫지 않는다: StrictMode의 효과 재실행이 닫힌 저장소를 남기지 않게 (구독은 useSeatOccupancy가 푼다).

  const statusOf = useCallback(
    (id: string): MemberStatus | undefined => members.data?.find((m) => m.userId === id),
    [members.data],
  );

  return {
    phase,
    connected,
    seatService: service,
    others,
    reactions,
    members: members.data ?? [],
    statusOf,
    /** 다른 사람의 이동 목적지를 받는다. @returns 구독 해제 */
    subscribeMoves: useCallback((id: string, fn: (move: RoomMove) => void) => {
      const set = moveListeners.current.get(id) ?? new Set();
      set.add(fn);
      moveListeners.current.set(id, set);
      return () => void set.delete(fn);
    }, []),
    /** 내 목적지를 보낸다 (경로는 받는 쪽이 계산). */
    sendMove: useCallback((move: RoomMove) => channel.current?.sendMove(move), []),
    /** 내 멈춘 상태를 싣는다. */
    track: useCallback((meta: Omit<PresenceMeta, "userId" | "name">) => {
      channel.current?.track({ ...meta, userId, name: nicknameRef.current });
    }, [userId]),
    /** 반응 보내기. 5초 안에 다시 누르면 false. */
    sendReaction: useCallback(
      (key: string) => {
        if (phaseRef.current !== "ready" || !sendGate.current(userId, key, Date.now())) return false;
        channel.current?.sendReaction(key);
        show(userId, key);
        return true;
      },
      [userId, show],
    ),
    notifyMembers: useCallback(() => channel.current?.notifyMembers(), []),
  };
}

export type RoomLive = ReturnType<typeof useRoomLive>;
