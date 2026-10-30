/**
 * 실시간 회사 방 수치 (Story 004, `design/game-brief.md` "방과 친구").
 * 서버 쪽 짝은 `supabase/migrations/*_rooms.sql`의 `room_rules` 한 줄이다.
 * 방 수, 멤버 수, 동시 인원, 좌석 수, 유예는 둘을 함께 고친다 (서버가 최종 판정, 화면은 안내용).
 * 반응 목록과 시간은 화면만 쓰고, 받는 쪽도 같은 목록과 간격으로 걸러 낸다.
 */
export const ROOM_CONFIG = {
  /** 한 사람이 만들 수 있는 방 (room_rules.max_owned_rooms). */
  maxOwnedRooms: 3,
  /** 방 멤버 최대 수, 방장 포함 (room_rules.max_members). */
  maxMembers: 6,
  /** 동시에 방 안에 있을 수 있는 사람 (room_rules.max_concurrent). */
  maxConcurrent: 6,
  /** 좌석 수 (room_rules.seat_count). */
  seatCount: 6,
  /** 방 이름 글자 수 (rooms.name 검사). */
  nameMaxLength: 20,
  /** 초대 코드 길이 (rooms.invite_code 검사). */
  inviteCodeLength: 6,
  /** "지금 하는 일" 글자 수 (study_current_tasks.task 검사). */
  taskMaxLength: 50,
  /** 연결이 끊긴 뒤 같은 자리를 지켜 주는 시간 (room_rules.grace_seconds). */
  reconnectGraceMs: 120_000,
  /** 접속과 좌석 연결 확인 간격. 유예(2분)보다 충분히 짧아야 한다. */
  heartbeatMs: 20_000,
  /** 같은 방 사람들의 상태, 오늘 공부 시간을 다시 읽는 간격. */
  memberStatusRefreshMs: 30_000,
  /** 반응이 머리 위에 떠 있는 시간. */
  reactionDisplayMs: 3_000,
  /** 같은 사람이 반응을 보낼 수 있는 최소 간격 (보내는 쪽과 받는 쪽 모두 검사). */
  reactionIntervalMs: 5_000,
  /** 누군가 나간 뒤 좌석을 다시 읽기까지 기다리는 시간 (나간 사람의 좌석 해제가 끝나도록). */
  seatRefreshDelayMs: 400,
} as const;

/**
 * 보낼 수 있는 반응. 키는 전송값이고 label은 지금 화면 표시, name은 버튼 이름(화면 낭독과 마우스 올림)이다.
 * 나중에 픽셀아트 아이콘으로 바꿀 때는 label 대신 그림을 그리면 되고 키는 그대로 둔다.
 */
export const REACTIONS = [
  { key: "thumbs", label: "👍", name: "좋아요", kind: "emoji" },
  { key: "fire", label: "🔥", name: "불타오르네", kind: "emoji" },
  { key: "clap", label: "👏", name: "박수", kind: "emoji" },
  { key: "coffee", label: "☕", name: "커피 한잔", kind: "emoji" },
  { key: "muscle", label: "💪", name: "힘내요", kind: "emoji" },
  { key: "heart", label: "❤️", name: "하트", kind: "emoji" },
  { key: "cheer", label: "화이팅", name: "화이팅", kind: "phrase" },
  { key: "goodjob", label: "수고했어요", name: "수고했어요", kind: "phrase" },
  { key: "rest", label: "잠깐 쉬어요", name: "잠깐 쉬어요", kind: "phrase" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

/** 보낼 수 있는 반응 키 (받는 쪽 검사에도 쓴다). */
export const REACTION_KEYS: readonly string[] = REACTIONS.map((r) => r.key);

/** 반응 키의 화면 표시. 모르는 키면 빈 글자. */
export const reactionLabel = (key: string) => REACTIONS.find((r) => r.key === key)?.label ?? "";
