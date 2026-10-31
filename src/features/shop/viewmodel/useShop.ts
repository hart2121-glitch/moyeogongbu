import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import { coinKey, useCoinSummary } from "../../coins/viewmodel/useCoins";
import {
  alreadyOwnedMessage,
  buyErrorMessage,
  insufficientMessage,
  purchasedMessage,
  type ShopItem,
} from "../model/shop";
import { shopStore } from "../model/shopStore";

export const shopKey = (userId: string | undefined) => ["shop", userId] as const;

/**
 * 아이템 목록과 보유 여부 (서버 값).
 * @example const items = useShopItems().data ?? [];
 */
export function useShopItems() {
  const userId = useSession()?.user.id;
  return useQuery({ queryKey: shopKey(userId), queryFn: shopStore.items, enabled: !!userId });
}

/**
 * 꾸미기 화면의 구매 상태: 목록, 잔액, 구매. 결과는 토스트로 알리고, 잔액과 보유 목록은 서버에서 다시 읽는다.
 * @param notify 결과를 알리는 토스트 함수
 * @example const shop = useShop(toast.notify); shop.buy(item);
 */
export function useShop(notify: (text: string) => void) {
  const userId = useSession()?.user.id;
  const queryClient = useQueryClient();
  const items = useShopItems();
  const coins = useCoinSummary();
  const buy = useMutation({
    mutationFn: (item: ShopItem) => shopStore.buy(item.id),
    onSuccess: (result, item) => {
      if (result.status === "bought") notify(purchasedMessage(item.name));
      else if (result.status === "owned") notify(alreadyOwnedMessage);
      else notify(insufficientMessage);
    },
    onError: () => notify(buyErrorMessage),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: shopKey(userId) });
      void queryClient.invalidateQueries({ queryKey: coinKey(userId) });
    },
  });
  return {
    items: items.data ?? [],
    loading: items.isPending || coins.isPending,
    error: items.isError,
    retry: () => void items.refetch(),
    balance: coins.data?.balance ?? 0,
    buyingId: buy.isPending ? buy.variables?.id ?? null : null,
    buy: (item: ShopItem) => buy.mutate(item),
  };
}
