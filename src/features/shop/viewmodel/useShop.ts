import { useState } from "react";
import {
  INITIAL_COINS,
  INSUFFICIENT_COINS_MESSAGE,
  purchase,
  purchasedMessage,
  type Wallet,
} from "../model/shop";

/**
 * 코인과 보관함. 값은 메모리에만 유지된다.
 * @param notify 결과를 알리는 토스트 함수
 * @example const { coins, owned, buy } = useShop(notify);
 */
export function useShop(notify: (text: string) => void) {
  const [wallet, setWallet] = useState<Wallet>({
    coins: INITIAL_COINS,
    owned: [],
  });
  const buy = (item: string, cost: number) => {
    const result = purchase(wallet, item, cost);
    if (result.status === "owned") return;
    if (result.status === "insufficient") {
      notify(INSUFFICIENT_COINS_MESSAGE);
      return;
    }
    setWallet(result.wallet);
    notify(purchasedMessage(item));
  };
  return { coins: wallet.coins, owned: wallet.owned, buy };
}
