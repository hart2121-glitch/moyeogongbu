import { Coin, Lamp, PaintBucket, Scissors, Sparkle, Sticker, TShirt, type Icon } from "@phosphor-icons/react";
import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { DESK_ITEM_ART, ITEM_ASSETS } from "../../../config/shop";
import { ROUTES } from "../../shell/model/paths";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { SHOP_SLOTS, buyBlockReason, isDeskSlot, sellable, type ItemSlot } from "../model/shop";
import { useShop } from "../viewmodel/useShop";

const SLOT_ICONS: Partial<Record<ItemSlot, Icon>> = {
  accessory: Sparkle,
  outfit: TShirt,
  hair: Scissors,
  hair_color: PaintBucket,
  desk_top: Lamp,
  desk_front: Sticker,
};

/** 사기 전에 꾸미기에서 해 보는 일: 책상 아이템은 책상에 놓아 보고, 나머지는 입어 본다. */
const tryLabel = (slot: ItemSlot) => (isDeskSlot(slot) ? "놓아 보기" : "입어 보기");

/**
 * `/shop`: 캐릭터 아이템과 내 책상 세트 상점. 가격과 보유 여부, 잔액은 서버 값이다. 책상 아이템은 꾸미기 책상 탭에서 놓아 볼 수 있다.
 * 되팔기와 환불이 없으므로 "구매하기"는 카드 안에서 한 번 더 확인을 받는다. 사지 않은 아이템은 꾸미기에서 입어 볼 수 있다.
 */
export default function ShopPage() {
  const { toast } = useAppState();
  const shop = useShop(toast.notify);
  const navigate = useNavigate();
  const items = sellable(shop.items);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  return (
    <PageFrame title="상점">
      <div className="page-intro">
        <h1>공부하며 모은 코인으로 나를 꾸며요</h1>
        <p>
          지금 가진 코인 <strong className="shop-balance" data-testid="shop-balance">{shop.balance.toLocaleString()}</strong>
        </p>
      </div>
      {shop.loading ? (
        <p className="muted">상점을 불러오는 중이에요.</p>
      ) : shop.error ? (
        <div className="shop-error">
          <p>상점을 불러오지 못했어요.</p>
          <button className="primary" onClick={shop.retry}>
            다시 불러오기
          </button>
        </div>
      ) : (
        SHOP_SLOTS.map(({ slot, label }) => {
          const ItemIcon = SLOT_ICONS[slot] ?? Sparkle;
          return (
            <section className="shop-section" key={slot} aria-label={label}>
              <h2>{label}</h2>
              <div className="shop-grid">
                {items
                  .filter((i) => i.slot === slot)
                  .map((item) => {
                    const reason = buyBlockReason(item, shop.balance);
                    const buying = shop.buyingId === item.id;
                    return (
                      <div className="shop-item" key={item.id} data-item={item.id}>
                        <div className="item-art">
                          {ITEM_ASSETS[item.id]?.swatch ? (
                            <span className="color-swatch" style={{ "--swatch": ITEM_ASSETS[item.id]?.swatch } as CSSProperties} />
                          ) : DESK_ITEM_ART[item.id] ? (
                            <img className={`desk-item-art slot-${item.slot}`} src={DESK_ITEM_ART[item.id]} alt="" draggable={false} />
                          ) : (
                            <ItemIcon weight="duotone" />
                          )}
                        </div>
                        <h3>{item.name}</h3>
                        <span className="price">
                          <Coin />
                          {item.price.toLocaleString()}
                        </span>
                        {confirmingId === item.id && !item.owned ? (
                          <div className="buy-confirm" role="group" aria-label={`${item.name} 구매 확인`}>
                            <p>
                              코인 {shop.balance.toLocaleString()}에서{" "}
                              <strong>{(shop.balance - item.price).toLocaleString()}</strong>으로 줄어요.
                              <br />
                              환불할 수 없어요.
                            </p>
                            <button
                              className="primary"
                              aria-label={`${item.name} 사기`}
                              disabled={shop.buyingId !== null}
                              onClick={() => {
                                shop.buy(item);
                                setConfirmingId(null);
                              }}
                            >
                              사기
                            </button>
                            <button className="secondary-button" onClick={() => setConfirmingId(null)}>
                              그만두기
                            </button>
                          </div>
                        ) : (
                          <button
                            className="primary"
                            aria-label={`${item.name} ${item.owned ? "보유 중" : "구매하기"}`}
                            disabled={!!reason || shop.buyingId !== null}
                            onClick={() => setConfirmingId(item.id)}
                          >
                            {item.owned ? "보유 중" : buying ? "사는 중" : "구매하기"}
                          </button>
                        )}
                        {!item.owned && confirmingId !== item.id && (
                          <button
                            className="try-on-link"
                            aria-label={`${item.name} ${tryLabel(item.slot)}`}
                            onClick={() => navigate(`${ROUTES.character}?try=${encodeURIComponent(item.id)}`)}
                          >
                            {tryLabel(item.slot)}
                          </button>
                        )}
                        {reason && !item.owned && <p className="buy-reason">{reason}</p>}
                      </div>
                    );
                  })}
              </div>
            </section>
          );
        })
      )}
      <p className="muted shop-note">
        산 아이템은 되팔거나 환불할 수 없어요. 사기 전에 꾸미기에서 입어 볼 수 있어요.
      </p>
      <button className="secondary-button" onClick={() => navigate(ROUTES.character)}>
        꾸미기에서 입어 보기
      </button>
    </PageFrame>
  );
}
