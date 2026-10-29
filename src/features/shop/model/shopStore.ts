import { supabase } from "../../../lib/supabase";
import { fetchMyLook, saveLook } from "../../character/model/look";
import type { Look } from "../../character/model/layers";
import { buyItem, fetchShop } from "./shop";

/**
 * 앱이 쓰는 상점과 꾸밈 저장소. `shop.ts`, `look.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * @example const items = await shopStore.items();
 */
export const shopStore = {
  items: () => fetchShop(supabase),
  buy: (itemId: string) => buyItem(supabase, itemId),
  myLook: () => fetchMyLook(supabase),
  saveLook: (look: Look) => saveLook(supabase, look),
};

export type ShopStore = typeof shopStore;
