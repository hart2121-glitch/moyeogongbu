import { useQueryClient } from "@tanstack/react-query";
import type { DecorSlot } from "../../../config/roomDecor";
import { useSession } from "../../account/viewmodel/SessionContext";
import { coinKey, useCoinSummary } from "../../coins/viewmodel/useCoins";
import type { BuyResult } from "../../shop/model/shop";
import { shopStore } from "../../shop/model/shopStore";
import { shopKey, useShopItems } from "../../shop/viewmodel/useShop";

/**
 * 방장 도구의 휴게실 꾸밈 상점: 자리마다 아이템과 보유 여부, 지금 가진 코인, 사기. 산 뒤에는 목록과 잔액을 서버에서 다시 읽는다.
 * 공용 꾸밈은 방장 코인으로 사고, 산 아이템은 그 사람 것이라 방장을 넘겨도 가지고 있다.
 * @example const shop = useRoomDecorShop(); const rugs = shop.itemsFor("rug");
 */
export function useRoomDecorShop() {
  const userId = useSession()?.user.id;
  const queryClient = useQueryClient();
  const items = useShopItems().data ?? [];
  const balance = useCoinSummary().data?.balance ?? 0;
  return {
    balance,
    itemsFor: (slot: DecorSlot) => items.filter((item) => item.slot === `room_${slot}`),
    buy: async (itemId: string): Promise<BuyResult["status"]> => {
      try {
        return (await shopStore.buy(itemId)).status;
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: shopKey(userId) }),
          queryClient.invalidateQueries({ queryKey: coinKey(userId) }),
        ]);
      }
    },
  };
}
