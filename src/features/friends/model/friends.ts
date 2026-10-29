export type FriendIcon = "monitor" | "coffee" | "gamepad";

export interface Friend {
  name: string;
  status: string;
  place: string;
  icon: FriendIcon;
}

/** 화면 구성을 위한 예시 친구. 서버 연결 전까지 고정 데이터다. */
export const FRIENDS: readonly Friend[] = [
  { name: "하늘", status: "공부 중", place: "회사 테마 · 1층", icon: "monitor" },
  {
    name: "지우",
    status: "스터디카페 · 2층",
    place: "스터디카페 · 2층",
    icon: "coffee",
  },
  {
    name: "도윤",
    status: "휴식 중",
    place: "잠시 쉬고 있어요",
    icon: "gamepad",
  },
];

/** 자리를 비운 친구 표시(presence away)가 붙는 목록 위치. */
export const AWAY_FRIEND_INDEX = 2;
