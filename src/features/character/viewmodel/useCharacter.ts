import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "../../account/viewmodel/SessionContext";
import type { ItemSlot, ShopItem } from "../../shop/model/shop";
import { shopStore } from "../../shop/model/shopStore";
import { useShopItems } from "../../shop/viewmodel/useShop";
import { defaultLook, type Look } from "../model/layers";
import { firstLookSavedMessage, lookSaveErrorMessage, lookSavedMessage } from "../model/look";

export const lookKey = (userId: string | undefined) => ["look", userId] as const;

/**
 * 저장한 내 꾸밈. 아직 처음 꾸미기 전이면 data가 null이다.
 * @example const look = useMyLook().data ?? defaultLook();
 */
export function useMyLook() {
  const userId = useSession()?.user.id;
  return useQuery({ queryKey: lookKey(userId), queryFn: shopStore.myLook, enabled: !!userId });
}

/** 칸에 아이템을 고른 꾸밈. 머리는 뒷머리와 앞머리를 함께 바꾸고, 액세서리는 같은 것을 다시 고르면 벗는다. */
export function wearItem(look: Look, slot: ItemSlot, itemId: string): Look {
  if (slot === "hair") return { ...look, hair_back: itemId, hair_front: itemId };
  if (slot === "accessory") return { ...look, accessory: look.accessory === itemId ? null : itemId };
  return { ...look, [slot]: itemId };
}

/** 꾸밈에 들어간 아이템 중 사지 않은 것 (입어 보기 중인 것). */
export function unownedIn(look: Look, items: readonly ShopItem[]): ShopItem[] {
  const ids = new Set([look.body, look.face, look.hair_back, look.hair_front, look.outfit, look.accessory]);
  return items.filter((i) => ids.has(i.id) && !i.owned);
}

/** 이 아이템을 지금 입고 있는가. */
export const isWorn = (look: Look, item: Pick<ShopItem, "id" | "slot">) =>
  item.slot === "hair" ? look.hair_front === item.id : look[item.slot] === item.id;

/**
 * 꾸미기 화면 상태. 상태: 불러오는 중 → (처음 꾸미기 | 꾸미기). draft는 입어 보기용이며 저장 전에는 서버에 가지 않는다.
 * @param notify 결과를 알리는 토스트 함수
 * @example const c = useCustomize(toast.notify); c.wear(item); c.save();
 */
export function useCustomize(notify: (text: string) => void) {
  const userId = useSession()?.user.id;
  const queryClient = useQueryClient();
  const saved = useMyLook();
  const items = useShopItems();
  const [draft, setDraft] = useState<Look | null>(null);
  const firstTime = saved.isSuccess && saved.data === null;
  const base = saved.data ?? defaultLook();
  const look = draft ?? base;
  const list = items.data ?? [];
  const tryingOn = unownedIn(look, list);
  const save = useMutation({
    mutationFn: (next: Look) => shopStore.saveLook(next),
    onSuccess: (next) => {
      queryClient.setQueryData(lookKey(userId), next);
      setDraft(null);
      notify(firstTime ? firstLookSavedMessage : lookSavedMessage);
    },
    onError: () => notify(lookSaveErrorMessage),
  });
  return {
    loading: saved.isPending || items.isPending,
    error: saved.isError || items.isError,
    retry: () => {
      void saved.refetch();
      void items.refetch();
    },
    firstTime,
    items: list,
    look,
    changed: draft !== null && JSON.stringify(draft) !== JSON.stringify(base),
    tryingOn,
    saving: save.isPending,
    wear: (item: ShopItem) => setDraft(wearItem(look, item.slot, item.id)),
    reset: () => setDraft(null),
    /** 사지 않은 아이템이 들어 있으면 저장하지 않는다 (서버도 거절한다). */
    save: () => {
      if (tryingOn.length === 0) save.mutate(look);
    },
  };
}
