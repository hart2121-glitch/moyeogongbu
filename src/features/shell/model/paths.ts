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

/** 테마 스터디룸 주소의 앞부분. 예: `/themes/학교` */
export const THEME_ROOM_BASE = "/themes";

/** 회사 스터디룸 주소. @example roomPath("MOYEO6") // "/rooms/MOYEO6" */
export const roomPath = (code: string) => `${ROUTES.rooms}/${code}`;

/** 테마 스터디룸 주소. @example themeRoomPath("학교") // "/themes/%ED%95%99%EA%B5%90" */
export const themeRoomPath = (theme: string) =>
  `${THEME_ROOM_BASE}/${encodeURIComponent(theme)}`;
