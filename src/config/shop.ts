/**
 * 캐릭터 아이템 id별 그림 레이어 표 (Story 007, Story 009). 이 파일만 바꾸면 새 도트 그림으로 바꿔 끼울 수 있다.
 * 아이템 목록, 이름, 가격은 서버 `shop_items` 표가 정한다. 여기에는 가격을 두지 않는다.
 *
 * 레이어 그림은 `tools/art/build-character.mjs`가 만든 23칸 시트(칸 56×72)다. 모든 레이어가 같은 칸 구성이라
 * 같은 칸 번호(src/study/characterSprites.js의 frameIndex)로 겹치면 모든 동작에서 맞는다.
 *
 * placeholder: true 인 항목은 전용 도트 그림이 아직 없어 그리지 않거나 임시 색상만 입힌 것이다.
 */

/** 레이어 id. 서버 `character_looks` 열 이름과 같다. */
export type LayerId = "hair_back" | "body" | "outfit" | "face" | "hair_front" | "accessory";

/** 레이어 시트 경로. */
export interface LayerSource {
  sheet: string;
}

export interface ItemAsset {
  /** 전용 그림이 없어 그리지 않거나 임시로 연결했는가. */
  placeholder: boolean;
  /** 이 아이템이 그리는 레이어별 시트. 머리 아이템은 hair_back과 hair_front를 함께 가진다. */
  layers: Partial<Record<LayerId, LayerSource>>;
  /** 임시 연결: 전용 그림이 없는 의상의 대체 색상 클래스. 전용 그림이 생기면 지운다. */
  bodyTint?: string;
}

const sheet = (name: string): LayerSource => ({ sheet: `/assets/characters/layers/${name}.png` });
/** 눈 색 아이템: 얼굴 레이어 시트 하나. */
const face = (id: string): ItemAsset => ({ placeholder: false, layers: { face: sheet(id) } });
/** 머리 아이템: 같은 이름의 뒷머리와 앞머리 시트 한 쌍. */
const hair = (id: string): ItemAsset => ({ placeholder: false, layers: { hair_back: sheet(`${id}-back`), hair_front: sheet(`${id}-front`) } });

/** 아이템 id → 그림. 표에 없는 id는 그리지 않는다 (서버에 새 아이템이 먼저 생겨도 화면이 깨지지 않는다). */
export const ITEM_ASSETS: Readonly<Record<string, ItemAsset>> = {
  // 기본 몸: 머리카락과 눈, 입이 없는 몸, 회색 바디슈트.
  "body-basic": { placeholder: false, layers: { body: sheet("body-basic") } },
  // 기본 얼굴(보라 눈): 승인 시안 N1의 눈과 입 (art-src/characters/src/face/basic).
  "face-basic": face("face-basic"),
  // 아래 눈 색은 기본 얼굴의 눈동자 색만 바꿨다 (art-src/characters/src/recolor/<id>.json).
  "face-black": face("face-black"),
  "face-brown": face("face-brown"),
  "face-amber": face("face-amber"),
  "face-green": face("face-green"),
  "face-blue": face("face-blue"),
  "face-gray": face("face-gray"),
  "hair-lavender": hair("hair-lavender"),
  // 아래 머리 색은 라벤더 머리의 색만 바꿨다 (art-src/characters/src/recolor/<id>.json).
  "hair-chestnut": hair("hair-chestnut"),
  "hair-black": hair("hair-black"),
  "hair-gray": hair("hair-gray"),
  "hair-ashgray": hair("hair-ashgray"),
  "hair-white": hair("hair-white"),
  "hair-blonde": hair("hair-blonde"),
  "hair-red": hair("hair-red"),
  "hair-pink": hair("hair-pink"),
  "hair-skyblue": hair("hair-skyblue"),
  // 교복: 완성 캐릭터에서 임시로 떼어 냈다 (art-src/characters/src/outfit/uniform/FROM-FULL-CHARACTER).
  "outfit-lavender": { placeholder: false, layers: { outfit: sheet("outfit-uniform") } },
  "acc-ribbon": { placeholder: false, layers: { accessory: sheet("acc-ribbon") } },
  // 아래는 전용 레이어 그림이 아직 없다.
  "outfit-sage": { placeholder: true, layers: {}, bodyTint: "outfit-세이지" },
  "outfit-rose": { placeholder: true, layers: {}, bodyTint: "outfit-로즈" },
  "outfit-hoodie": { placeholder: true, layers: {}, bodyTint: "outfit-세이지" },
  "outfit-cardigan": { placeholder: true, layers: {}, bodyTint: "outfit-로즈" },
  "outfit-suit": { placeholder: true, layers: {} },
  "hair-ponytail": { placeholder: true, layers: {} },
  "hair-short": { placeholder: true, layers: {} },
  "hair-wave": { placeholder: true, layers: {} },
  "hair-long": { placeholder: true, layers: {} },
  "acc-hairpin": { placeholder: true, layers: {} },
  "acc-glasses": { placeholder: true, layers: {} },
  "acc-headphones": { placeholder: true, layers: {} },
  "acc-scarf": { placeholder: true, layers: {} },
  "acc-beret": { placeholder: true, layers: {} },
};

/** 아직 저장한 꾸밈이 없을 때 보여 주는 모습 (서버 기본 아이템 id). */
export const DEFAULT_LOOK = {
  body: "body-basic",
  face: "face-basic",
  hair_back: "hair-lavender",
  hair_front: "hair-lavender",
  outfit: "outfit-lavender",
  accessory: null,
} as const;
