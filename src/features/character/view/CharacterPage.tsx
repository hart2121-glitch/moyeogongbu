import { Check } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { characterSprites } from "../../../study/characterSprites";
import { useProfile } from "../../account/viewmodel/useAccount";
import type { ItemSlot } from "../../shop/model/shop";
import { ROUTES } from "../../shell/model/paths";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { tryOnNotice } from "../model/look";
import { isWorn, useCustomize } from "../viewmodel/useCharacter";
import LayerStack from "./LayerStack";

const SLOTS: readonly { slot: ItemSlot; label: string }[] = [
  { slot: "hair", label: "머리" },
  { slot: "outfit", label: "의상" },
  { slot: "accessory", label: "액세서리" },
];

const BASE_SPRITE = characterSprites.idle.down[0];

/**
 * `/character`: 캐릭터 꾸미기. 상태: 불러오는 중, 불러오기 실패, 처음 꾸미기(기본 머리 2종과 의상 2종에서 고르기), 꾸미기.
 * 사지 않은 아이템은 입어 볼 수만 있고 저장되지 않는다.
 */
export default function CharacterPage() {
  const { toast } = useAppState();
  const c = useCustomize(toast.notify);
  const navigate = useNavigate();
  const displayName = useProfile().data?.displayName;
  const slots = c.firstTime ? SLOTS.filter((s) => s.slot !== "accessory") : SLOTS;
  const shown = c.firstTime ? c.items.filter((i) => i.isDefault) : c.items;
  const trying = c.tryingOn.map((i) => i.name).join(", ");
  // 상점의 "입어 보기"는 `?try=아이템id`로 들어온다. 목록이 오면 한 번만 입혀 본다.
  const [params] = useSearchParams();
  const tried = useRef(false);
  useEffect(() => {
    const item = c.items.find((i) => i.id === params.get("try"));
    if (tried.current || !item || c.firstTime) return;
    tried.current = true;
    c.wear(item);
  }, [c.items, c.firstTime, params]);
  return (
    <PageFrame title="캐릭터 꾸미기">
      <div className="page-intro">
        <h1>{c.firstTime ? "처음 꾸미기" : "오늘은 어떤 모습으로 공부할까?"}</h1>
        <p>
          {c.firstTime
            ? "기본 머리 2종과 의상 2종을 무료로 드려요. 마음에 드는 모습을 골라 시작해 보세요."
            : "산 아이템은 바로 적용하고, 사지 않은 아이템은 입어 볼 수 있어요."}
        </p>
      </div>
      {c.loading ? (
        <p className="muted">꾸미기 정보를 불러오는 중이에요.</p>
      ) : c.error ? (
        <div className="shop-error">
          <p>꾸미기 정보를 불러오지 못했어요.</p>
          <button className="primary" onClick={c.retry}>
            다시 불러오기
          </button>
        </div>
      ) : (
        <div className="customizer">
          <div className="avatar-preview">
            <LayerStack look={c.look} baseSrc={BASE_SPRITE} label={`${displayName ?? "내"} 캐릭터 미리보기`} />
            <strong>{displayName}</strong>
            <span className={c.tryingOn.length ? "try-on-note" : ""}>{c.tryingOn.length ? tryOnNotice : c.changed ? "바꾼 모습이에요. 저장하면 적용돼요." : "지금 적용된 모습"}</span>
          </div>
          <div className="wardrobe">
            {slots.map(({ slot, label }) => (
              <section key={slot} className="wardrobe-slot" aria-label={label}>
                <h2>{label}</h2>
                <div className="outfit-options item-options">
                  {shown
                    .filter((i) => i.slot === slot)
                    .map((item) => {
                      const worn = isWorn(c.look, item);
                      return (
                        <button
                          key={item.id}
                          data-item={item.id}
                          aria-pressed={worn}
                          className={`${worn ? "selected" : ""} ${item.owned ? "" : "not-owned"}`}
                          onClick={() => c.wear(item)}
                        >
                          <strong>{item.name}</strong>
                          <small>{item.isDefault ? "기본" : item.owned ? "보유 중" : `입어 보기 ${item.price.toLocaleString()}코인`}</small>
                          {worn && <Check />}
                        </button>
                      );
                    })}
                </div>
              </section>
            ))}
            {c.tryingOn.length > 0 && (
              <p className="buy-reason" role="status">
                입어 본 {trying}은(는) 상점에서 산 뒤 저장할 수 있어요.
              </p>
            )}
            <div className="customize-actions">
              <button
                className="primary"
                disabled={c.saving || c.tryingOn.length > 0 || (!c.firstTime && !c.changed)}
                onClick={c.save}
              >
                {c.firstTime ? "이 모습으로 시작하기" : "이 모습으로 저장하기"}
              </button>
              {c.changed && (
                <button className="secondary-button" onClick={c.reset}>
                  원래대로
                </button>
              )}
              {c.tryingOn.length > 0 && (
                <button className="secondary-button" onClick={() => navigate(ROUTES.shop)}>
                  상점으로 가기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
