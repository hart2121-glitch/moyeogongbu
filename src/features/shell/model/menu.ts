import { ROUTES } from "./paths";

export type MenuIcon =
  | "house"
  | "office"
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

/** 사이드바 메뉴. 순서가 화면 순서다. 로비는 집(내 방)이라 스터디룸과 따로 둔다 (2026-11-02 사용자 결정). */
export const MENU_ITEMS: readonly MenuItem[] = [
  { label: "내 방", path: ROUTES.lobby, icon: "house" },
  { label: "스터디룸", path: ROUTES.rooms, icon: "office" },
  { label: "공용 스터디카페", path: ROUTES.cafe, icon: "coffee" },
  { label: "캐릭터 꾸미기", path: ROUTES.character, icon: "tshirt" },
  { label: "공부 기록", path: ROUTES.records, icon: "clipboard" },
  { label: "친구 목록", path: ROUTES.friends, icon: "users" },
  { label: "가이드", path: ROUTES.guide, icon: "book" },
];

/**
 * 현재 주소에서 메뉴 항목의 강조 상태를 구한다.
 * `active`는 강조 표시, `current`는 aria-current 표시다.
 * 스터디룸 항목은 방 목록에서 current이고, 들어간 회사 스터디룸(/rooms/아이디)에서는 강조만 된다.
 * 로비(내 방)에서는 내 방 항목만 강조된다.
 * @example menuState("/lobby", "/rooms") // { active: false, current: false }
 * @example menuState("/rooms/abc", "/rooms") // { active: true, current: false }
 */
export function menuState(pathname: string, path: string) {
  const current = pathname === path;
  const active = current || (path === ROUTES.rooms && pathname.startsWith(`${ROUTES.rooms}/`));
  return { active, current };
}
