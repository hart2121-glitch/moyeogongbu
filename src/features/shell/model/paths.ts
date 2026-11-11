/** 화면별 주소. 메뉴, 라우터, 화면 이동이 모두 이 상수를 쓴다. */
export const ROUTES = {
  lobby: "/lobby",
  rooms: "/rooms",
  cafe: "/cafe",
  character: "/character",
  shop: "/shop",
  records: "/records",
  friends: "/friends",
  guide: "/guide",
  /** 로그인 화면. 로그인 없이 열린다. */
  login: "/login",
  /** 첫 로그인 때 화면 이름을 정하는 화면. */
  welcome: "/welcome",
  /** 개인정보 처리방침. 로그인 없이 열린다. */
  privacy: "/privacy",
} as const;

/** 회사 스터디룸 주소. 초대 코드는 재발급되므로 방 id를 쓴다. @example roomPath(room.id) */
export const roomPath = (roomId: string) => `${ROUTES.rooms}/${roomId}`;

/** 친구가 있는 카페로 가는 주소의 검색어 이름. */
export const CAFE_WITH_PARAM = "with";

/** 공용 카페 주소. 카페 id를 주면 그 카페(친구가 있는 곳)로. @example cafePath(friend.roomId) // "/cafe?with=..." */
export const cafePath = (roomId?: string) =>
  roomId ? `${ROUTES.cafe}?${CAFE_WITH_PARAM}=${encodeURIComponent(roomId)}` : ROUTES.cafe;
