/**
 * 회사 방 공용 꾸밈 (꾸미기 슬롯 계획 2절, 2026-11-01 사용자 결정). 방장이 휴게실 소파 쿠션, 탁자 위, 러그, 출입구 매트를
 * 고르고 화이트보드 문구를 쓴다. 자리 위치와 크기는 `src/study/companyFinalLayout.js`의 decorSlots, 아이템 목록과 가격은
 * 서버 `shop_items`(slot `room_<자리>`)가 정한다. 그림은 `tools/art/company-room.mjs`(기본)와 `tools/art/company-decor.mjs`(판매)가 만든다.
 */

export type DecorSlot = "rug" | "cushions" | "table" | "mat";

/** 그리는 순서 (러그가 맨 아래, 탁자 위 소품은 쿠션보다 앞). 방장 도구의 줄 순서와 이름도 이것을 따른다. */
export const DECOR_SLOTS: readonly { slot: DecorSlot; label: string }[] = [
  { slot: "cushions", label: "소파 쿠션" },
  { slot: "table", label: "탁자 위" },
  { slot: "rug", label: "휴게실 러그" },
  { slot: "mat", label: "출입구 매트" },
];
export const DECOR_DRAW_ORDER: readonly DecorSlot[] = ["rug", "cushions", "table", "mat"];

export type RoomDecor = Record<DecorSlot, string>;

/** 방을 만들 때의 꾸밈 (서버 기본값과 같다). 방 그림과 같은 모습이다. */
export const DEFAULT_DECOR: RoomDecor = { cushions: "cushions-cat", table: "table-cat", rug: "rug-beige", mat: "mat-cat" };

/** 아이템 그림 (자리 크기의 투명 그림). 기본 러그는 방 그림 그대로라 그림이 없다. */
export const DECOR_ITEM_ART: Readonly<Record<string, string>> = Object.fromEntries(
  [
    "cushions-cat", "cushions-heart", "cushions-star", "cushions-check",
    "table-cat", "table-tea", "table-cake", "table-flower",
    "rug-pink", "rug-mint", "rug-sky",
    "mat-cat", "mat-stripe", "mat-paw", "mat-heart",
  ].map((id) => [id, `/assets/rooms/lounge/${id}.png`]),
);

/** 방장이 아무것도 쓰지 않았을 때의 화이트보드 문구. */
export const BOARD_DEFAULT_TEXT = "오늘도\n수고했어요!";
/** 화이트보드 문구 한도 (서버 set_room_board와 같다). */
export const BOARD_LIMITS = { lines: 2, lineLength: 12 } as const;

/**
 * 화이트보드 문구가 한도 안인지. 줄바꿈으로 두 줄까지, 줄마다 12자까지.
 * @example boardTextError("오늘도\n화이팅") // null
 */
export function boardTextError(text: string): string | null {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  if (lines.length > BOARD_LIMITS.lines || lines.some((line) => line.trim().length > BOARD_LIMITS.lineLength))
    return `화이트보드에는 ${BOARD_LIMITS.lines}줄, 줄마다 ${BOARD_LIMITS.lineLength}자까지 쓸 수 있어요.`;
  return null;
}
