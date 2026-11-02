import type { SupabaseClient } from "@supabase/supabase-js";
import { socialRpc } from "../../friends/model/socialError";
import { HOME_DECOR } from "./homeDecorLayers";

/**
 * 로비 "내 방" 꾸밈 (꾸미기 슬롯 계획 3절, 2026-11-01 사용자 결정: 가구, 벽지, 바닥까지 바꾼다).
 * 방은 자리(slot)마다 층으로 나뉘어 있고(`homeDecorLayers.ts`, tools/art/home-decor.mjs), 자리마다 아이템 하나를 고른다.
 * 아이템 목록과 가격은 서버 `shop_items`(slot `home_<자리>`)가, 적용한 꾸밈은 `home_looks`가 정한다. 내 방은 나만 본다.
 */

/** 그림 상자 (방 그림 1배 좌표). */
export interface HomeLayer {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DecorData {
  size: { width: number; height: number };
  scale: number;
  base: string;
  draw: readonly string[];
  layers: Readonly<Record<string, Omit<HomeLayer, "id">>>;
  slots: Readonly<Record<string, readonly string[]>>;
  items: Readonly<Record<string, Readonly<Record<string, Omit<HomeLayer, "id"> | null>>>>;
}
const DATA = HOME_DECOR as unknown as DecorData;

export type HomeSlot =
  | "wallpaper" | "floor" | "curtains" | "frames" | "shelves" | "desk" | "desk_top" | "lamps"
  | "armchair" | "nightstands" | "nightstand_top" | "bed" | "blanket" | "plush" | "rug" | "floor_plant";

/** 적용한 내 방 꾸밈: 자리 → 아이템 id. 빠진 자리는 기본 아이템이다. */
export type HomeLook = Partial<Record<HomeSlot, string>>;

/** 꾸미기 화면의 줄 순서와 이름 (벽에서 바닥, 왼쪽에서 오른쪽). */
export const HOME_SLOTS: readonly { slot: HomeSlot; label: string }[] = [
  { slot: "wallpaper", label: "벽지" },
  { slot: "floor", label: "바닥" },
  { slot: "curtains", label: "커튼" },
  { slot: "frames", label: "벽 액자" },
  { slot: "shelves", label: "벽 선반" },
  { slot: "desk", label: "책상" },
  { slot: "desk_top", label: "책상 위" },
  { slot: "lamps", label: "스탠드" },
  { slot: "armchair", label: "안락의자" },
  { slot: "nightstands", label: "협탁" },
  { slot: "nightstand_top", label: "협탁 위" },
  { slot: "bed", label: "침대" },
  { slot: "blanket", label: "이불" },
  { slot: "plush", label: "침대 인형" },
  { slot: "rug", label: "러그" },
  { slot: "floor_plant", label: "바닥 화분" },
];

/** 자리마다 기본 아이템 (지금 그림 그대로, 무료). 서버 기본 아이템과 같다. */
export const DEFAULT_HOME: Readonly<Record<HomeSlot, string>> = {
  wallpaper: "home-wall-pink",
  floor: "home-floor-oak",
  curtains: "home-curtain-white",
  frames: "home-frames-wood",
  shelves: "home-shelves-wood",
  desk: "home-desk-wood",
  desk_top: "home-desktop-paper",
  lamps: "home-lamps-cream",
  armchair: "home-chair-cream",
  nightstands: "home-nightstand-wood",
  nightstand_top: "home-nighttop-plant",
  bed: "home-bed-wood",
  blanket: "home-blanket-sage",
  plush: "home-plush-cat",
  rug: "home-rug-cream",
  floor_plant: "home-plant-leaf",
};

/** 방 그림 크기 (1배)와 화면 배율, 바탕(빈 방) 그림. */
export const HOME_SIZE = DATA.size;
export const HOME_SCALE = DATA.scale;
export const HOME_BASE = DATA.base;

/** 아이템 칸(`home_<자리>`)이면 그 자리 이름. */
export const homeSlotOf = (itemSlot: string): HomeSlot | null =>
  itemSlot.startsWith("home_") ? (itemSlot.slice(5) as HomeSlot) : null;

/** 이 자리에 지금 고른 아이템 (없으면 기본). */
export const homeItem = (look: HomeLook, slot: HomeSlot) => look[slot] ?? DEFAULT_HOME[slot];

/**
 * 한 자리에 이 아이템을 놓았을 때 그 자리의 층들 (그리는 순서). 기본 아이템은 기본 층 그림, 판매 아이템은 그 그림을 쓰고,
 * 그림이 null인 층은 감춘다 (협탁 위 소품을 바꾸면 원래 작은 병을 감춘다).
 * @example slotLayers("rug", "home-rug-pink")[0].src // "/assets/home/room/decor/home-rug-pink-rug.png"
 */
export function slotLayers(slot: HomeSlot, itemId: string): HomeLayer[] {
  const art = DATA.items[itemId];
  return DATA.draw
    .filter((id) => DATA.slots[slot]?.includes(id))
    .flatMap((id) => {
      const chosen = art && id in art ? art[id] : DATA.layers[id];
      return chosen ? [{ id, ...chosen }] : [];
    });
}

/**
 * 내 방 전체의 층 (바탕 다음부터 그리는 순서). 자리마다 고른 아이템의 그림을 쓴다.
 * @example homeLayers({ wallpaper: "home-wall-mint" }).find((l) => l.id === "wall")?.src
 */
export function homeLayers(look: HomeLook): HomeLayer[] {
  const owner = new Map<string, HomeSlot>();
  for (const { slot } of HOME_SLOTS) for (const id of DATA.slots[slot] ?? []) owner.set(id, slot);
  const bySlot = new Map(HOME_SLOTS.map(({ slot }) => [slot, slotLayers(slot, homeItem(look, slot))]));
  return DATA.draw.flatMap((id) => {
    const slot = owner.get(id);
    const layer = slot ? bySlot.get(slot)?.find((l) => l.id === id) : undefined;
    return layer ? [layer] : [];
  });
}

/**
 * 꾸미기 선택지 그림에서 보일 방 부분 (1배 72×44 창의 왼쪽 위). 자리의 기본 층 가운데다. 벽지와 바닥은 빈 벽과 빈 마루,
 * 양쪽으로 떨어진 두 물건(스탠드, 협탁, 액자)은 가운데가 엉뚱한 곳이라 왼쪽 물건 둘레를, 침대는 칠이 보이는 머리판을 보인다.
 */
export const HOME_THUMB = { width: 72, height: 44 } as const;
const THUMB_AT: Partial<Record<HomeSlot, { x: number; y: number }>> = {
  wallpaper: { x: 30, y: 6 },
  floor: { x: 176, y: 108 },
  lamps: { x: 22, y: 50 },
  nightstands: { x: 113, y: 84 },
  frames: { x: 0, y: 12 },
  bed: { x: 162, y: 58 },
};
export function homeThumbOrigin(slot: HomeSlot): { x: number; y: number } {
  const fixed = THUMB_AT[slot];
  if (fixed) return fixed;
  const layers = slotLayers(slot, DEFAULT_HOME[slot]);
  const x0 = Math.min(...layers.map((l) => l.x)), x1 = Math.max(...layers.map((l) => l.x + l.width));
  const y0 = Math.min(...layers.map((l) => l.y)), y1 = Math.max(...layers.map((l) => l.y + l.height));
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)));
  return {
    x: clamp((x0 + x1) / 2 - HOME_THUMB.width / 2, HOME_SIZE.width - HOME_THUMB.width),
    y: clamp((y0 + y1) / 2 - HOME_THUMB.height / 2, HOME_SIZE.height - HOME_THUMB.height),
  };
}

/** 사지 않은 아이템이 놓인 자리 (꾸며 보기 중). */
export const unownedHome = <T extends { id: string; slot: string; owned: boolean }>(look: HomeLook, items: readonly T[]) =>
  items.filter((item) => {
    const slot = homeSlotOf(item.slot);
    return slot !== null && homeItem(look, slot) === item.id && !item.owned;
  });

/** 기본 아이템인 자리는 빼고 서버에 보낸다 (빠진 자리는 기본). */
export const compactHome = (look: HomeLook): HomeLook =>
  Object.fromEntries(Object.entries(look).filter(([slot, item]) => item && item !== DEFAULT_HOME[slot as HomeSlot])) as HomeLook;

/** 내 방 꾸밈 (저장 전이면 빈 꾸밈). */
export const fetchMyHome = async (client: SupabaseClient): Promise<HomeLook> =>
  ((await socialRpc<HomeLook>(client, "get_my_home")) ?? {}) as HomeLook;

/** 내 방 꾸밈 저장. 산 아이템이나 기본 아이템만 받는다 (서버가 다시 확인한다). */
export const saveHome = async (client: SupabaseClient, look: HomeLook): Promise<HomeLook> =>
  ((await socialRpc<HomeLook>(client, "save_home", { p_parts: compactHome(look) })) ?? {}) as HomeLook;
