import { Cat, Coffee, Coin, Flower, Star, type Icon } from "@phosphor-icons/react";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { SHOP_ITEMS, type ShopIcon } from "../model/shop";

const SHOP_ICONS: Record<ShopIcon, Icon> = {
  cat: Cat,
  coffee: Coffee,
  star: Star,
  flower: Flower,
};

export default function ShopPage() {
  const { owned, buy } = useAppState().shop;
  return (
    <PageFrame title="상점">
      <div className="page-intro">
        <span className="eyebrow">LITTLE JOYS SHOP</span>
        <h1>공부하는 일상에 작은 선물</h1>
        <p>차곡차곡 모은 코인으로 마음에 드는 소품을 골라 보세요.</p>
      </div>
      <div className="shop-grid">
        {SHOP_ITEMS.map(({ name, icon, cost }) => {
          const ItemIcon = SHOP_ICONS[icon];
          return (
            <div className="shop-item" key={name}>
              <div className="item-art">
                <ItemIcon weight="duotone" />
              </div>
              <h2>{name}</h2>
              <span className="price">
                <Coin />
                {cost}
              </span>
              <button
                className="primary"
                disabled={owned.includes(name)}
                onClick={() => buy(name, cost)}
              >
                {owned.includes(name) ? "보관함에 있어요" : "구매하기"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="muted">
        구매는 이번 방문 중에만 유지되는 체험 기능이에요.
      </p>
    </PageFrame>
  );
}
