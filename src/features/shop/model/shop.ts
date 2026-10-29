export type ShopIcon = "cat" | "coffee" | "star" | "flower";

export interface ShopItem {
  name: string;
  icon: ShopIcon;
  cost: number;
}

/** 처음 보유한 코인. */
export const INITIAL_COINS = 1250;

export const SHOP_ITEMS: readonly ShopItem[] = [
  { name: "포근한 고양이 쿠션", icon: "cat", cost: 300 },
  { name: "따뜻한 머그컵", icon: "coffee", cost: 200 },
  { name: "반짝이는 별 장식", icon: "star", cost: 450 },
  { name: "작은 꽃 화분", icon: "flower", cost: 350 },
];

export const INSUFFICIENT_COINS_MESSAGE =
  "코인이 부족해요. 다음에 다시 들러 주세요!";
export const purchasedMessage = (item: string) =>
  `${item} 구매 완료! 보관함에 담았어요.`;

export interface Wallet {
  coins: number;
  owned: readonly string[];
}

export type PurchaseResult =
  | { status: "owned" }
  | { status: "insufficient" }
  | { status: "bought"; wallet: Wallet };

/**
 * 구매 규칙. 이미 가진 물건은 다시 살 수 없고, 코인이 모자라면 살 수 없다.
 * @example purchase({ coins: 1250, owned: [] }, "따뜻한 머그컵", 200)
 */
export function purchase(
  wallet: Wallet,
  item: string,
  cost: number,
): PurchaseResult {
  if (wallet.owned.includes(item)) return { status: "owned" };
  if (wallet.coins < cost) return { status: "insufficient" };
  return {
    status: "bought",
    wallet: { coins: wallet.coins - cost, owned: [...wallet.owned, item] },
  };
}
