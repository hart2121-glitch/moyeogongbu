/** 캐릭터 이미지 경로. 색상 스타일은 CSS 클래스로 입힌다. */
export const AVATAR_SRC = "/assets/avatar.png";

export const OUTFITS = ["라벤더", "세이지", "로즈"] as const;
export type Outfit = (typeof OUTFITS)[number];

export const DEFAULT_OUTFIT: Outfit = "라벤더";
export const outfitAppliedMessage = (outfit: string) =>
  `${outfit} 스타일을 적용했어요!`;
