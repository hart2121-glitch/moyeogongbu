import type { SupabaseClient } from "@supabase/supabase-js";
import { socialRpc } from "../../friends/model/socialError";
import { toLook, type Look } from "./layers";

/** 저장한 꾸밈. 아직 처음 꾸미기 전이면 null. */
export const fetchMyLook = async (client: SupabaseClient): Promise<Look | null> =>
  toLook(await socialRpc<unknown>(client, "get_my_look"));

/** 꾸밈 저장. 기본 아이템이나 산 아이템만 서버가 받는다 (아니면 not_owned). */
export const saveLook = async (client: SupabaseClient, look: Look): Promise<Look | null> =>
  toLook(
    await socialRpc<unknown>(client, "save_look", {
      p_body: look.body,
      p_face: look.face,
      p_hair_back: look.hair_back,
      p_hair_front: look.hair_front,
      p_hair_color: look.hair_color,
      p_outfit: look.outfit,
      p_accessory: look.accessory,
      p_gender: look.gender,
    }),
  );

export const lookSavedMessage = "꾸민 모습을 저장했어요!";
export const firstLookSavedMessage = "반가워요! 이 모습으로 시작할게요.";
export const tryOnNotice = "입어 보는 중이에요. 사지 않은 아이템은 저장되지 않아요.";
export const lookSaveErrorMessage = "저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.";
