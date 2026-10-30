import { DEFAULT_LOOK, ITEM_ASSETS, type ItemAsset, type LayerId } from "../../../config/shop";

/**
 * 캐릭터 레이어 합성 규칙 (Story 007). `src/character-preview/model.js`의 구조를 게임 안으로 옮긴 것이다.
 * 모든 레이어는 같은 캔버스(87×110)의 (0,0)에 겹치고, 같은 자세 키(동작.방향.프레임)로 그림을 고른다.
 */
export const CANVAS = { width: 87, height: 110 } as const;

/** 뒤 → 앞 순서. */
export const LAYERS: readonly { id: LayerId; label: string; order: number }[] = [
  { id: "hair_back", label: "뒷머리", order: 0 },
  { id: "body", label: "몸", order: 10 },
  { id: "outfit", label: "의상", order: 20 },
  { id: "face", label: "얼굴", order: 30 },
  { id: "hair_front", label: "앞머리", order: 40 },
  { id: "accessory", label: "액세서리", order: 50 },
];

/** 저장되는 꾸밈. 값은 서버 `shop_items` id. */
export interface Look {
  body: string;
  face: string;
  hair_back: string;
  hair_front: string;
  outfit: string;
  accessory: string | null;
}

export const defaultLook = (): Look => ({ ...DEFAULT_LOOK });

/** @example poseKey("idle", "down", 0) // "idle.down.0" */
export const poseKey = (action: string, direction: string, frame: number) => `${action}.${direction}.${frame}`;

export interface ComposedLayer {
  id: LayerId;
  order: number;
  itemId: string | null;
  /** 이 자세에 그릴 그림. 없으면 null. */
  src: string | null;
  className: string;
}

/**
 * 꾸밈과 자세로 레이어 목록을 만든다. baseSrc는 "base-sprite" 레이어가 쓸 지금 프레임의 완성형 그림이다.
 * @example composeLayers(look, "idle.down.0", "/assets/characters/idle-down.png.png")
 */
export function composeLayers(
  look: Look,
  key: string,
  baseSrc: string,
  assets: Readonly<Record<string, ItemAsset>> = ITEM_ASSETS,
): ComposedLayer[] {
  const tint = assets[look.outfit]?.bodyTint ?? "";
  return LAYERS.map(({ id, order }) => {
    const itemId = look[id];
    const source = itemId ? assets[itemId]?.layers[id] : undefined;
    const src = !source ? null : source === "base-sprite" ? baseSrc : source[key] ?? null;
    return { id, order, itemId, src, className: id === "body" ? tint : "" };
  });
}

/** 몸 레이어에 입히는 임시 색상 클래스 (전용 의상 그림 전까지). */
export const bodyTintOf = (look: Look | null | undefined) => (look ? ITEM_ASSETS[look.outfit]?.bodyTint ?? "" : "");

/** 서버 JSON → Look. 모양이 맞지 않으면 null (아직 처음 꾸미기 전). */
export function toLook(row: unknown): Look | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : null);
  const body = str("body"), face = str("face"), hairBack = str("hair_back"), hairFront = str("hair_front"), outfit = str("outfit");
  if (!body || !face || !hairBack || !hairFront || !outfit) return null;
  return { body, face, hair_back: hairBack, hair_front: hairFront, outfit, accessory: str("accessory") };
}
