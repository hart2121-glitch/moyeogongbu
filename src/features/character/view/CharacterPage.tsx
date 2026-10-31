import { Check, Coin } from "@phosphor-icons/react";
import { useEffect, useRef, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GENDER_PRESETS, ITEM_ASSETS, type Gender } from "../../../config/shop";
import { characterSprites } from "../../../study/characterSprites";
import { useProfile } from "../../account/viewmodel/useAccount";
import type { ItemSlot, ShopItem } from "../../shop/model/shop";
import { ROUTES } from "../../shell/model/paths";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { tryOnNotice } from "../model/look";
import type { Look } from "../model/layers";
import { isWorn, useCustomize, wearItem } from "../viewmodel/useCharacter";
import LayerStack from "./LayerStack";

/**
 * 꾸미기 칸. 색(머리 색, 눈)은 색 동그라미로, 나머지는 내 캐릭터에 입혀 본 작은 그림으로 고른다.
 * view가 head면 머리 부분을, body면 몸 부분을 잘라 보여 준다.
 */
const SLOTS: readonly { slot: ItemSlot; label: string; view: "swatch" | "head" | "body" }[] = [
  { slot: "hair", label: "머리 모양", view: "head" },
  { slot: "hair_color", label: "머리 색", view: "swatch" },
  { slot: "face", label: "눈", view: "swatch" },
  { slot: "outfit", label: "의상", view: "body" },
  { slot: "accessory", label: "액세서리", view: "head" },
];

/** 선택지 그림: 지금 모습에 이 아이템만 입힌 모습 (액세서리는 이미 쓰고 있어도 쓴 모습). */
const previewWith = (look: Look, item: ShopItem): Look =>
  item.slot === "accessory" ? { ...look, accessory: item.id } : wearItem(look, item.slot, item.id);

/** 선택지 상태 글: 기본, 보유 중, 입어 보기 가격. */
const ownership = (item: ShopItem) =>
  item.isDefault ? "기본" : item.owned ? "보유 중" : `입어 보기 ${item.price.toLocaleString()}코인`;

const BASE_SPRITE = characterSprites.idle.down[0];

/**
 * `/character`: 캐릭터 꾸미기. 상태: 불러오는 중, 불러오기 실패, 처음 꾸미기(기본 아이템에서 고르기), 꾸미기.
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
            ? "남녀를 고르면 기본 모습이 바뀌어요. 머리 모양 2종, 머리 색 3종, 눈 색 7종, 의상 3종을 무료로 드려요."
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
            <section className="wardrobe-slot" aria-label="성별">
              <h2>성별</h2>
              <div className="gender-toggle" role="group" aria-label="성별">
                {(Object.keys(GENDER_PRESETS) as Gender[]).map((g) => (
                  <button
                    key={g}
                    className={c.look.gender === g ? "selected" : ""}
                    aria-pressed={c.look.gender === g}
                    onClick={() => c.setGender(g)}
                  >
                    {GENDER_PRESETS[g].label}
                  </button>
                ))}
              </div>
            </section>
            {slots.map(({ slot, label, view }) => {
              const options = shown.filter((i) => i.slot === slot);
              const picked = options.find((i) => isWorn(c.look, i));
              return (
                <section key={slot} className="wardrobe-slot" aria-label={label}>
                  <h2>
                    {label}
                    {picked && <small className="picked-name">{picked.name}</small>}
                  </h2>
                  <div className={`outfit-options item-options ${view === "swatch" ? "swatch-options" : "thumb-options"}`}>
                    {options.map((item) => {
                      const worn = isWorn(c.look, item);
                      const state = ownership(item);
                      const asset = ITEM_ASSETS[item.id];
                      const soon = asset?.placeholder !== false;
                      return (
                        <button
                          key={item.id}
                          data-item={item.id}
                          aria-pressed={worn}
                          aria-label={`${item.name}, ${state}`}
                          title={`${item.name}, ${state}`}
                          className={`${view === "swatch" ? "swatch" : "thumb"} ${worn ? "selected" : ""} ${item.owned ? "" : "not-owned"}`}
                          onClick={() => c.wear(item)}
                        >
                          {view === "swatch" ? (
                            <span className="color-swatch" style={{ "--swatch": asset?.swatch ?? "#c0a98d" } as CSSProperties} />
                          ) : (
                            <>
                              <span className={`thumb-window thumb-${view}${soon ? " soon" : ""}`}>
                                <LayerStack look={previewWith(c.look, item)} label="" decorative className="thumb-stack" />
                                {soon && <span className="thumb-soon">준비 중</span>}
                              </span>
                              <small>{item.name}</small>
                            </>
                          )}
                          {!item.owned && <Coin className="price-mark" weight="fill" />}
                          {worn && <Check className="worn-mark" />}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
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
