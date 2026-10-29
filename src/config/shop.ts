/**
 * 캐릭터 아이템 id별 그림 레이어 표 (Story 007). 이 파일만 바꾸면 새 픽셀아트로 바꿔 끼울 수 있다.
 * 아이템 목록, 이름, 가격은 서버 `shop_items` 표가 정한다. 여기에는 가격을 두지 않는다.
 *
 * 레이어 출처(LayerSource):
 * - "base-sprite": 지금의 완성형 캐릭터 그림(정지, 걷기 프레임 전체)을 그대로 쓴다.
 * - { [poseKey]: 경로 }: 동작.방향.프레임(`idle.down.0`, `walk.down.2`, `portrait.down.0` 등)별 PNG.
 *   모든 레이어는 같은 87×110 캔버스, 같은 프레임 구성이어야 모든 동작에서 맞는다.
 * - 없음: 그 레이어는 그리지 않는다.
 *
 * placeholder: true 인 항목은 전용 픽셀아트가 아직 없어 기존 그림에 임시로 연결한 것이다.
 * 새 그림이 준비되면 layers에 프레임 경로를 넣고 placeholder를 false로 바꾼다. 그림을 새로 만들거나 자동 변환하지 않는다.
 */

/** 레이어 id. 서버 `character_looks` 열 이름과 같다. */
export type LayerId = "hair_back" | "body" | "outfit" | "face" | "hair_front" | "accessory";

export type LayerSource = "base-sprite" | Readonly<Record<string, string>>;

export interface ItemAsset {
  /** 전용 그림이 없어 기존 그림에 임시 연결했는가. */
  placeholder: boolean;
  /** 이 아이템이 그리는 레이어별 그림. 머리 아이템은 hair_back과 hair_front를 함께 가진다. */
  layers: Partial<Record<LayerId, LayerSource>>;
  /**
   * 임시 연결: 몸 레이어에 입히는 기존 색상 변형 클래스 (styles.css의 `.outfit-세이지`, `.outfit-로즈`).
   * 전용 의상 그림이 생기면 지운다.
   */
  bodyTint?: string;
}

/** 아이템 id → 그림. 표에 없는 id는 그리지 않는다 (서버에 새 아이템이 먼저 생겨도 화면이 깨지지 않는다). */
export const ITEM_ASSETS: Readonly<Record<string, ItemAsset>> = {
  // 기본 몸: 지금의 완성형 캐릭터 그림 전체. 몸, 얼굴, 머리, 옷이 한 장에 들어 있다.
  "body-basic": { placeholder: true, layers: { body: "base-sprite" } },
  // 아래는 모두 전용 레이어 그림이 아직 없다 (public/assets/characters/ASSETS-NEEDED.md).
  "face-basic": { placeholder: true, layers: {} },
  "hair-lavender": { placeholder: true, layers: {} },
  "hair-chestnut": { placeholder: true, layers: {} },
  "outfit-lavender": { placeholder: true, layers: {} },
  "outfit-sage": { placeholder: true, layers: {}, bodyTint: "outfit-세이지" },
  "outfit-rose": { placeholder: true, layers: {}, bodyTint: "outfit-로즈" },
  "outfit-hoodie": { placeholder: true, layers: {}, bodyTint: "outfit-세이지" },
  "outfit-cardigan": { placeholder: true, layers: {}, bodyTint: "outfit-로즈" },
  "outfit-suit": { placeholder: true, layers: {} },
  "hair-ponytail": { placeholder: true, layers: {} },
  "hair-short": { placeholder: true, layers: {} },
  "hair-wave": { placeholder: true, layers: {} },
  "hair-long": { placeholder: true, layers: {} },
  "acc-ribbon": { placeholder: true, layers: {} },
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
