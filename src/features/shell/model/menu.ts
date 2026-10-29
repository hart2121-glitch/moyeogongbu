import { ROUTES, THEME_ROOM_BASE } from "./paths";

export type MenuIcon =
  | "house"
  | "coffee"
  | "tshirt"
  | "tote"
  | "clipboard"
  | "users"
  | "book";

export interface MenuItem {
  label: string;
  path: string;
  icon: MenuIcon;
}

/** 사이드바 메뉴. 순서가 화면 순서다. */
export const MENU_ITEMS: readonly MenuItem[] = [
  { label: "스터디룸", path: ROUTES.rooms, icon: "house" },
  { label: "공용 스터디카페", path: ROUTES.cafe, icon: "coffee" },
  { label: "캐릭터 꾸미기", path: ROUTES.character, icon: "tshirt" },
  { label: "상점", path: ROUTES.shop, icon: "tote" },
  { label: "공부 기록", path: ROUTES.records, icon: "clipboard" },
  { label: "친구 목록", path: ROUTES.friends, icon: "users" },
  { label: "가이드", path: ROUTES.guide, icon: "book" },
];

/**
 * 현재 주소에서 메뉴 항목의 강조 상태를 구한다.
 * `active`는 강조 표시, `current`는 aria-current 표시다.
 * 스터디룸 항목은 로비와 회사 스터디룸에서도 강조되지만 aria-current는 갖지 않는다.
 * @example menuState("/lobby", "/rooms") // { active: true, current: false }
 */
export function menuState(pathname: string, path: string) {
  const isRoomsPage =
    pathname === ROUTES.rooms || pathname.startsWith(`${THEME_ROOM_BASE}/`);
  const current = path === ROUTES.rooms ? isRoomsPage : pathname === path;
  const active =
    current ||
    (path === ROUTES.rooms &&
      (pathname === ROUTES.lobby || pathname.startsWith(`${ROUTES.rooms}/`)));
  return { active, current };
}
