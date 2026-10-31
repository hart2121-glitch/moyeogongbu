import type { SupabaseClient } from "@supabase/supabase-js";
import { socialRpc } from "../../friends/model/socialError";

/**
 * 상점 (Story 007). 목록, 가격, 보유 여부, 구매 판정은 모두 서버(`shop_items`, `buy_item`)가 정한다.
 * 첫 출시 상점은 캐릭터 아이템(액세서리, 의상, 머리 모양, 머리 색)과 내 책상 세트(책상 소품, 책상 스티커)를 판다.
 */

export type ItemSlot = "body" | "face" | "hair" | "hair_color" | "outfit" | "accessory" | "desk_top" | "desk_front";

export interface ShopItem {
  id: string;
  slot: ItemSlot;
  name: string;
  price: number;
  /** 가입하면 무료로 받는 기본 아이템 (상점에 안 나온다). */
  isDefault: boolean;
  owned: boolean;
}

export type BuyResult =
  | { status: "bought"; balance: number }
  | { status: "owned"; balance: number }
  | { status: "insufficient"; balance: number };

/** 상점 진열 순서와 칸 이름. */
export const SHOP_SLOTS: readonly { slot: ItemSlot; label: string }[] = [
  { slot: "accessory", label: "액세서리" },
  { slot: "outfit", label: "의상" },
  { slot: "hair", label: "머리 모양" },
  { slot: "hair_color", label: "머리 색" },
  { slot: "desk_top", label: "책상 소품" },
  { slot: "desk_front", label: "책상 스티커" },
];

interface ItemRow {
  id: string;
  slot: ItemSlot;
  name: string;
  price: number;
  is_default: boolean;
  owned: boolean;
}

/** 모든 아이템과 내 보유 여부. */
export const fetchShop = async (client: SupabaseClient): Promise<ShopItem[]> =>
  ((await socialRpc<ItemRow[]>(client, "get_shop")) ?? []).map((r) => ({
    id: r.id,
    slot: r.slot,
    name: r.name,
    price: Number(r.price) || 0,
    isDefault: !!r.is_default,
    owned: !!r.owned,
  }));

/** 구매. 코인 차감과 중복 방지는 서버가 한 번에 처리한다. */
export const buyItem = async (client: SupabaseClient, itemId: string): Promise<BuyResult> => {
  const r = await socialRpc<{ status: BuyResult["status"]; balance: number }>(client, "buy_item", { p_item: itemId });
  return { status: r.status, balance: Number(r.balance) || 0 };
};

/** 상점에 진열하는 아이템 (기본 아이템 제외). */
export const sellable = (items: readonly ShopItem[]) => items.filter((i) => !i.isDefault);

/**
 * 구매 버튼을 막는 이유. 살 수 있으면 null.
 * @example buyBlockReason({ owned: false, price: 300 } as ShopItem, 120) // "180코인이 더 모이면 살 수 있어요."
 */
export function buyBlockReason(item: Pick<ShopItem, "owned" | "price">, balance: number): string | null {
  if (item.owned) return "보유 중";
  if (balance < item.price) return `${(item.price - balance).toLocaleString()}코인이 더 모이면 살 수 있어요.`;
  return null;
}

export const purchasedMessage = (item: string, slot?: ItemSlot) =>
  `${item}을(를) 샀어요! 꾸미기에서 바로 ${isDeskSlot(slot) ? "책상에 놓을" : "입어 볼"} 수 있어요.`;

/** 내 책상 세트 아이템(책상 소품, 책상 스티커)인가. 캐릭터가 입는 대신 책상에 놓는다. */
export const isDeskSlot = (slot: ItemSlot | undefined) => slot === "desk_top" || slot === "desk_front";
export const insufficientMessage = "코인이 조금 모자라요. 공부하며 코인을 모은 뒤 다시 들러 주세요.";
export const alreadyOwnedMessage = "이미 가지고 있는 아이템이에요.";
export const buyErrorMessage = "구매하지 못했어요. 잠시 뒤에 다시 시도해 주세요.";
