import { DEMO_INVITATION } from "../../../study/rooms";

/** 로컬 스터디룸. 저장 형식은 `src/study/rooms.js`가 정한다. */
export interface StudyRoom {
  id: string;
  name: string;
  code: string;
  kind: string;
  theme: string;
  capacity: number;
}

/** 공용 스터디카페에서 고를 수 있는 자리. */
export const CAFE_ROOM_NAMES = ["창가 자리", "조용한 서재", "초록 정원"] as const;

/** 테마 스터디룸 하나의 제목 문구와 그림 종류. */
export interface ThemeRoom {
  name: string;
  heading: string;
  art: "" | "school";
}

const READY_HEADING = "다시 펼치는 나만의 공부 시간";

/** 둘러볼 수 있는 테마 스터디룸. 학교와 카페 자리 세 곳. */
export const THEME_ROOMS: readonly ThemeRoom[] = [
  { name: "학교", heading: READY_HEADING, art: "school" },
  ...CAFE_ROOM_NAMES.map(
    (name): ThemeRoom => ({ name, heading: READY_HEADING, art: "" }),
  ),
];

/** 이름에 맞는 테마 스터디룸. 없으면 undefined. */
export const findThemeRoom = (name: string) =>
  THEME_ROOMS.find((t) => t.name === name);

/**
 * 로비 회사 빠른 입장 대상: 내가 만든 첫 방, 없으면 첫 방, 없으면 기본 초대 방.
 * @example quickEnterRoom(rooms).code
 */
export function quickEnterRoom(rooms: readonly StudyRoom[]): StudyRoom {
  return rooms.find((r) => r.kind === "owned") || rooms[0] || DEMO_INVITATION;
}

/**
 * 주소의 초대 코드로 방을 찾는다. 기본 초대 방 코드는 항상 유효하다.
 * @example findRoomByCode(rooms, "MOYEO6")
 */
export function findRoomByCode(
  rooms: readonly StudyRoom[],
  code: string,
): StudyRoom | undefined {
  const upper = code.toUpperCase();
  return (
    rooms.find((r) => r.code === upper) ||
    (DEMO_INVITATION.code === upper ? DEMO_INVITATION : undefined)
  );
}
