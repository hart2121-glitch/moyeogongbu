import type { Room } from "../../room/model/room";

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
 * 로비 회사 빠른 입장 대상: 내가 만든 첫 방, 없으면 내 방 목록의 첫 방. 방이 없으면 undefined.
 * @example quickEnterRoom(rooms)?.id
 */
export function quickEnterRoom(rooms: readonly Room[]): Room | undefined {
  return rooms.find((r) => r.isOwner) || rooms[0];
}

/** 내 방 목록에서 id로 방을 찾는다. */
export const findRoomById = (rooms: readonly Room[], id: string) => rooms.find((r) => r.id === id);
