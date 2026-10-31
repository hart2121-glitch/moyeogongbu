import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GENDER_PRESETS, type Gender } from "../../../config/shop";
import { useSession } from "../../account/viewmodel/SessionContext";
import type { ItemSlot, ShopItem } from "../../shop/model/shop";
import { shopStore } from "../../shop/model/shopStore";
import { useShopItems } from "../../shop/viewmodel/useShop";
import { compactHome, homeSlotOf, unownedHome, type HomeLook } from "../../lobby/model/homeDecor";
import { defaultLook, type DeskSpot, type Look } from "../model/layers";
import { firstLookSavedMessage, lookSaveErrorMessage, lookSavedMessage } from "../model/look";

export const lookKey = (userId: string | undefined) => ["look", userId] as const;
export const homeKey = (userId: string | undefined) => ["home", userId] as const;

/**
 * 저장한 내 꾸밈. 아직 처음 꾸미기 전이면 data가 null이다.
 * @example const look = useMyLook().data ?? defaultLook();
 */
export function useMyLook() {
  const userId = useSession()?.user.id;
  return useQuery({ queryKey: lookKey(userId), queryFn: shopStore.myLook, enabled: !!userId });
}

/**
 * 적용한 내 방 꾸밈 (꾸미기 슬롯 계획 3절). 저장 전이면 빈 꾸밈(모든 자리가 기본)이다.
 * @example const home = useMyHome().data ?? {};
 */
export function useMyHome() {
  const userId = useSession()?.user.id;
  return useQuery({ queryKey: homeKey(userId), queryFn: shopStore.myHome, enabled: !!userId });
}

/** 칸에 아이템을 고른 꾸밈. 머리 모양은 뒷머리와 앞머리를 함께 바꾸고, 액세서리는 같은 것을 다시 고르면 벗는다. */
export function wearItem(look: Look, slot: ItemSlot, itemId: string): Look {
  if (slot === "hair") return { ...look, hair_back: itemId, hair_front: itemId };
  if (slot === "hair_color") return { ...look, hair_color: itemId };
  if (slot === "accessory") return { ...look, accessory: look.accessory === itemId ? null : itemId };
  if (slot === "desk_top") return placeOnDesk(look, "desk_left", itemId);
  if (slot === "desk_front") return placeOnDesk(look, "desk_front", itemId);
  return { ...look, [slot]: itemId };
}

/**
 * 내 책상 세트의 한 자리에 아이템을 놓는다. 같은 것을 다시 고르면 그 자리를 비운다.
 * @example placeOnDesk(defaultLook(), "desk_right", "desk-cat").desk_right // "desk-cat"
 */
export const placeOnDesk = (look: Look, spot: DeskSpot, itemId: string): Look => ({ ...look, [spot]: look[spot] === itemId ? null : itemId });

/**
 * 남녀를 바꾼 꾸밈. 눈매가 바뀌고, 처음 꾸미기에서는 그 남녀의 기본 머리 모양과 옷도 입힌다.
 * @example chooseGender(defaultLook(), "m", true).hair_front // "hair-short"
 */
export function chooseGender(look: Look, gender: Gender, withPreset: boolean): Look {
  if (!withPreset) return { ...look, gender };
  const preset = GENDER_PRESETS[gender];
  return { ...look, gender, hair_back: preset.hair, hair_front: preset.hair, outfit: preset.outfit };
}

/** 꾸밈에 들어간 아이템 중 사지 않은 것 (입어 보기 중인 것). */
export function unownedIn(look: Look, items: readonly ShopItem[]): ShopItem[] {
  const ids = new Set([
    look.body, look.face, look.hair_back, look.hair_front, look.hair_color, look.outfit, look.accessory,
    look.desk_left, look.desk_right, look.desk_front,
  ]);
  return items.filter((i) => ids.has(i.id) && !i.owned);
}

/** 아이템 칸 이름이 꾸밈(Look)의 같은 이름 칸인 것. 회사 방 공용 꾸밈(room_*)은 꾸밈에 없다. */
type LookField = "body" | "face" | "hair_color" | "outfit" | "accessory";
const LOOK_FIELDS: ReadonlySet<string> = new Set<LookField>(["body", "face", "hair_color", "outfit", "accessory"]);

/** 이 아이템을 지금 입고 있는가. */
export const isWorn = (look: Look, item: Pick<ShopItem, "id" | "slot">) =>
  item.slot === "hair"
    ? look.hair_front === item.id
    : item.slot === "desk_top"
      ? look.desk_left === item.id || look.desk_right === item.id
      : item.slot === "desk_front"
        ? look.desk_front === item.id
        : LOOK_FIELDS.has(item.slot) && look[item.slot as LookField] === item.id;

/**
 * 꾸미기 화면 상태. 상태: 불러오는 중 → (처음 꾸미기 | 꾸미기). draft는 입어 보기용이며 저장 전에는 서버에 가지 않는다.
 * @param notify 결과를 알리는 토스트 함수
 * @example const c = useCustomize(toast.notify); c.wear(item); c.save();
 */
export function useCustomize(notify: (text: string) => void) {
  const userId = useSession()?.user.id;
  const queryClient = useQueryClient();
  const saved = useMyLook();
  const savedHome = useMyHome();
  const items = useShopItems();
  const [draft, setDraft] = useState<Look | null>(null);
  const [homeDraft, setHomeDraft] = useState<HomeLook | null>(null);
  const firstTime = saved.isSuccess && saved.data === null;
  const base = saved.data ?? defaultLook();
  const look = draft ?? base;
  const homeBase = savedHome.data ?? {};
  const home = homeDraft ?? homeBase;
  const list = items.data ?? [];
  const tryingOn = [...unownedIn(look, list), ...unownedHome(home, list)];
  const lookChanged = draft !== null && JSON.stringify(draft) !== JSON.stringify(base);
  const homeChanged = homeDraft !== null && JSON.stringify(compactHome(homeDraft)) !== JSON.stringify(compactHome(homeBase));
  // 캐릭터와 내 방을 한 번에 저장한다. 바뀐 쪽만 서버에 보낸다 (처음 꾸미기는 캐릭터를 꼭 저장한다).
  const save = useMutation({
    mutationFn: async () => ({
      look: firstTime || lookChanged ? await shopStore.saveLook(look) : null,
      home: homeChanged ? await shopStore.saveHome(home) : null,
    }),
    onSuccess: (next) => {
      if (next.look) queryClient.setQueryData(lookKey(userId), next.look);
      if (next.home) queryClient.setQueryData(homeKey(userId), next.home);
      setDraft(null);
      setHomeDraft(null);
      notify(firstTime ? firstLookSavedMessage : lookSavedMessage);
    },
    onError: () => notify(lookSaveErrorMessage),
  });
  return {
    loading: saved.isPending || savedHome.isPending || items.isPending,
    error: saved.isError || savedHome.isError || items.isError,
    retry: () => {
      void saved.refetch();
      void savedHome.refetch();
      void items.refetch();
    },
    firstTime,
    items: list,
    look,
    /** 꾸며 보는 내 방 (자리 → 아이템, 빠진 자리는 기본). */
    home,
    changed: lookChanged || homeChanged,
    tryingOn,
    saving: save.isPending,
    wear: (item: ShopItem) => {
      const homeSlot = homeSlotOf(item.slot);
      if (homeSlot) setHomeDraft({ ...home, [homeSlot]: item.id });
      else setDraft(wearItem(look, item.slot, item.id));
    },
    /** 내 책상 세트의 한 자리에 놓거나, 이미 놓인 것이면 치운다. */
    placeOnDesk: (spot: DeskSpot, item: ShopItem) => setDraft(placeOnDesk(look, spot, item.id)),
    /** 남녀 고르기. 처음 꾸미기에서는 기본 머리 모양과 옷도 바뀐다. */
    setGender: (gender: Gender) => setDraft(chooseGender(look, gender, firstTime)),
    reset: () => {
      setDraft(null);
      setHomeDraft(null);
    },
    /** 사지 않은 아이템이 들어 있으면 저장하지 않는다 (서버도 거절한다). */
    save: () => {
      if (tryingOn.length === 0) save.mutate();
    },
  };
}
