import { DEFAULT_LOOK, faceSheet, hairSheet, ITEM_ASSETS, type Gender, type ItemAsset, type LayerId } from "../../../config/shop";
import { SHEET_FRAME } from "../../../study/characterSprites";

/**
 * 캐릭터 레이어 합성 규칙 (Story 007, Story 009).
 * 모든 레이어는 같은 23칸 시트(칸 56×72)이고, 같은 칸 번호로 잘라 (0,0)에 겹친다.
 */
export const CANVAS = { width: SHEET_FRAME.width, height: SHEET_FRAME.height } as const;

/** 뒤 → 앞 순서. 목 아래로 내려온 머리카락(뒷머리)은 몸 뒤에 그린다. */
export const LAYERS: readonly { id: LayerId; label: string; order: number }[] = [
  { id: "hair_back", label: "뒷머리", order: 0 },
  { id: "body", label: "몸", order: 10 },
  { id: "outfit", label: "의상", order: 20 },
  { id: "face", label: "얼굴", order: 30 },
  { id: "hair_front", label: "앞머리", order: 40 },
  { id: "accessory", label: "액세서리", order: 50 },
];

/** 저장되는 꾸밈. 값은 서버 `shop_items` id. 머리는 모양(hair_back, hair_front)과 색(hair_color)을 따로 고른다. */
export interface Look {
  body: string;
  face: string;
  hair_back: string;
  hair_front: string;
  hair_color: string;
  outfit: string;
  accessory: string | null;
  /** 남녀: 눈매를 정한다 (아이템은 누구나 쓴다). */
  gender: Gender;
}

export const defaultLook = (): Look => ({ ...DEFAULT_LOOK });

export interface ComposedLayer {
  id: LayerId;
  order: number;
  itemId: string | null;
  /** 이 레이어의 시트. 그림이 없으면 null. */
  sheet: string | null;
  className: string;
}

/**
 * 꾸밈으로 레이어 목록을 만든다. 칸 번호는 그리는 쪽이 고른다(characterSprites.js frameIndex).
 * @example composeLayers(defaultLook())[1].sheet // "/assets/characters/layers/body-basic.png"
 */
export function composeLayers(look: Look, assets: Readonly<Record<string, ItemAsset>> = ITEM_ASSETS): ComposedLayer[] {
  const tint = assets[look.outfit]?.bodyTint ?? "";
  return LAYERS.map(({ id, order }) => {
    const itemId = look[id];
    const source =
      id === "hair_back" || id === "hair_front"
        ? hairSheet(itemId ?? "", look.hair_color, id === "hair_front" ? "front" : "back")
        : id === "face"
          ? faceSheet(itemId ?? "", look.gender)
          : itemId ? assets[itemId]?.layers[id] : undefined;
    return { id, order, itemId, sheet: source?.sheet ?? null, className: id === "body" ? tint : "" };
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
  const hairColor = str("hair_color") ?? DEFAULT_LOOK.hair_color;
  const gender: Gender = str("gender") === "m" ? "m" : "f";
  return { body, face, hair_back: hairBack, hair_front: hairFront, hair_color: hairColor, outfit, accessory: str("accessory"), gender };
}
