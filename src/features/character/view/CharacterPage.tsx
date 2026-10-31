import { CaretLeft, CaretRight, Check, Coin, Desk, Eye, PersonSimpleWalk, Scissors, Sparkle, TShirt, type Icon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DESK_ITEM_ART, GENDER_PRESETS, ITEM_ASSETS, type Gender } from "../../../config/shop";
import { characterSprites, WALK_FRAME_MS, WALK_FRAMES } from "../../../study/characterSprites";
import { useProfile } from "../../account/viewmodel/useAccount";
import { isDeskSlot, type ItemSlot, type ShopItem } from "../../shop/model/shop";
import { ROUTES } from "../../shell/model/paths";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { tryOnNotice } from "../model/look";
import type { DeskSpot, Look } from "../model/layers";
import { isWorn, useCustomize, wearItem } from "../viewmodel/useCharacter";
import DeskPreview from "./DeskPreview";
import LayerStack from "./LayerStack";

type TabId = "hair" | "face" | "outfit" | "accessory" | "desk";
type Direction = "down" | "right" | "up" | "left";

/**
 * 꾸미기 탭. 한 번에 한 탭의 선택지만 보인다. 머리 탭에는 머리 모양과 머리 색이 함께 있다.
 * 칸의 view가 swatch면 색 동그라미로, head면 머리 부분을, body면 몸 부분을 잘라 내 캐릭터에 입혀 본 그림으로, desk면 소품 그림으로 고른다.
 * 책상 탭은 내 책상 세트의 자리(spot)마다 한 줄이다. 책상 소품은 왼쪽과 오른쪽 어느 자리에나 놓을 수 있다.
 */
const TABS: readonly {
  id: TabId;
  label: string;
  icon: Icon;
  slots: readonly { slot: ItemSlot; label: string; view: "swatch" | "head" | "body" | "desk"; spot?: DeskSpot }[];
}[] = [
  {
    id: "hair",
    label: "머리",
    icon: Scissors,
    slots: [
      { slot: "hair", label: "머리 모양", view: "head" },
      { slot: "hair_color", label: "머리 색", view: "swatch" },
    ],
  },
  { id: "face", label: "눈", icon: Eye, slots: [{ slot: "face", label: "눈 색", view: "swatch" }] },
  { id: "outfit", label: "의상", icon: TShirt, slots: [{ slot: "outfit", label: "의상", view: "body" }] },
  { id: "accessory", label: "액세서리", icon: Sparkle, slots: [{ slot: "accessory", label: "액세서리", view: "head" }] },
  {
    id: "desk",
    label: "책상",
    icon: Desk,
    slots: [
      { slot: "desk_top", spot: "desk_left", label: "왼쪽 소품", view: "desk" },
      { slot: "desk_top", spot: "desk_right", label: "오른쪽 소품", view: "desk" },
      { slot: "desk_front", spot: "desk_front", label: "앞면 스티커", view: "desk" },
    ],
  },
];

const tabOf = (slot: ItemSlot): TabId => TABS.find((t) => t.slots.some((s) => s.slot === slot))?.id ?? "hair";

/** 미리보기 돌리기 순서: 오른쪽으로 돌리면 정면, 오른쪽, 뒤, 왼쪽 차례로 바라본다. */
const TURN: readonly Direction[] = ["down", "right", "up", "left"];
const FACING_LABEL: Record<Direction, string> = { down: "앞모습", right: "오른쪽 옆모습", up: "뒷모습", left: "왼쪽 옆모습" };

/** 선택지 그림: 지금 모습에 이 아이템만 입힌 모습 (액세서리는 이미 쓰고 있어도 쓴 모습). */
const previewWith = (look: Look, item: ShopItem): Look =>
  item.slot === "accessory" ? { ...look, accessory: item.id } : wearItem(look, item.slot, item.id);

/** 선택지 상태 글: 기본, 보유 중, 입어 보기(책상 아이템은 놓아 보기) 가격. */
const ownership = (item: ShopItem) =>
  item.isDefault
    ? "기본"
    : item.owned
      ? "보유 중"
      : `${isDeskSlot(item.slot) ? "놓아 보기" : "입어 보기"} ${item.price.toLocaleString()}코인`;

const BASE_SPRITE = characterSprites.idle.down[0];

/** 움직임 줄이기 설정이면 걷기를 반복하지 않고 한 발 내디딘 칸에 멈춘다. */
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * `/character`: 캐릭터 꾸미기. 상태: 불러오는 중, 불러오기 실패, 처음 꾸미기(기본 아이템에서 고르기), 꾸미기.
 * 왼쪽은 마루 위에 선 큰 미리보기(돌려 보기, 걷기, 남녀), 오른쪽은 머리, 눈, 의상, 액세서리 탭.
 * 선택지에는 이름을 쓰지 않고, 고른 것과 가리킨 것의 이름만 칸 제목 옆에 보인다.
 * 사지 않은 아이템은 입어 볼 수만 있고 저장되지 않는다.
 */
export default function CharacterPage() {
  const { toast } = useAppState();
  const c = useCustomize(toast.notify);
  const navigate = useNavigate();
  const displayName = useProfile().data?.displayName;
  const tabs = c.firstTime ? TABS.filter((t) => t.id !== "accessory" && t.id !== "desk") : TABS;
  const shown = c.firstTime ? c.items.filter((i) => i.isDefault) : c.items;
  const trying = c.tryingOn.map((i) => i.name).join(", ");
  const [tab, setTab] = useState<TabId>("hair");
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  const [facing, setFacing] = useState<Direction>("down");
  const [walking, setWalking] = useState(false);
  const [frame, setFrame] = useState(0);
  const [hovered, setHovered] = useState<ShopItem | null>(null);
  // 책상 탭은 같은 소품이 왼쪽과 오른쪽 두 줄에 나오므로, 가리킨 줄(spot)까지 기억해 그 줄 제목에만 이름을 보인다.
  const [hoveredSpot, setHoveredSpot] = useState<DeskSpot | undefined>(undefined);
  const point = (item: ShopItem, spot?: DeskSpot) => {
    setHovered(item);
    setHoveredSpot(spot);
  };
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  // 상점의 "입어 보기"는 `?try=아이템id`로 들어온다. 목록이 오면 한 번만 입혀 보고 그 탭을 연다.
  const [params] = useSearchParams();
  const tried = useRef(false);
  useEffect(() => {
    const item = c.items.find((i) => i.id === params.get("try"));
    if (tried.current || !item || c.firstTime) return;
    tried.current = true;
    c.wear(item);
    setTab(tabOf(item.slot));
  }, [c.items, c.firstTime, params]);
  // 걷기 미리보기: 방 안 캐릭터와 같은 간격으로 프레임을 넘긴다.
  useEffect(() => {
    if (!walking) return setFrame(0);
    if (reducedMotion()) return setFrame(1);
    const timer = setTimeout(() => setFrame((f) => (f + 1) % WALK_FRAMES), WALK_FRAME_MS);
    return () => clearTimeout(timer);
  }, [walking, frame]);
  const turn = (step: 1 | -1) => setFacing((d) => TURN[(TURN.indexOf(d) + step + TURN.length) % TURN.length]);
  // 탭 목록은 왼쪽, 오른쪽 화살표로 옮겨 다닌다.
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.id === active.id);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };
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
            <div className="preview-stage">
              {active.id === "desk" ? (
                <DeskPreview look={c.look} label={`${displayName ?? "내"} 책상 미리보기`} />
              ) : (
                <>
                  <span className="preview-shadow" aria-hidden />
                  <LayerStack
                    look={c.look}
                    baseSrc={BASE_SPRITE}
                    action={walking ? "walk" : "idle"}
                    direction={facing}
                    frame={frame}
                    label={`${displayName ?? "내"} 캐릭터 미리보기, ${FACING_LABEL[facing]}`}
                    className="preview-layers"
                  />
                </>
              )}
            </div>
            <div className="preview-controls" hidden={active.id === "desk"}>
              <button className="icon-button" aria-label="왼쪽으로 돌리기" title="왼쪽으로 돌리기" onClick={() => turn(-1)}>
                <CaretLeft weight="bold" />
              </button>
              <button className={`walk-toggle${walking ? " selected" : ""}`} aria-pressed={walking} onClick={() => setWalking((w) => !w)}>
                <PersonSimpleWalk weight="bold" />
                걷기
              </button>
              <button className="icon-button" aria-label="오른쪽으로 돌리기" title="오른쪽으로 돌리기" onClick={() => turn(1)}>
                <CaretRight weight="bold" />
              </button>
            </div>
            <strong>{displayName}</strong>
            <div className="gender-toggle" role="group" aria-label="성별">
              {(Object.keys(GENDER_PRESETS) as Gender[]).map((g) => (
                <button key={g} className={c.look.gender === g ? "selected" : ""} aria-pressed={c.look.gender === g} onClick={() => c.setGender(g)}>
                  {GENDER_PRESETS[g].label}
                </button>
              ))}
            </div>
            <span className={c.tryingOn.length ? "try-on-note" : ""}>{c.tryingOn.length ? tryOnNotice : c.changed ? "바꾼 모습이에요. 저장하면 적용돼요." : "지금 적용된 모습"}</span>
          </div>
          <div className="wardrobe">
            <div className="wardrobe-tabs" role="tablist" aria-label="꾸밀 곳" onKeyDown={onTabKey}>
              {tabs.map(({ id, label, icon: TabIcon }) => (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[id] = el;
                  }}
                  id={`wardrobe-tab-${id}`}
                  role="tab"
                  aria-selected={active.id === id}
                  aria-controls={`wardrobe-panel-${id}`}
                  tabIndex={active.id === id ? 0 : -1}
                  onClick={() => setTab(id)}
                >
                  <TabIcon weight={active.id === id ? "fill" : "regular"} />
                  {label}
                </button>
              ))}
            </div>
            <div className="wardrobe-panel" role="tabpanel" id={`wardrobe-panel-${active.id}`} aria-labelledby={`wardrobe-tab-${active.id}`}>
              {active.slots.map(({ slot, label, view, spot }) => {
                const options = shown.filter((i) => i.slot === slot);
                const wornHere = (item: ShopItem) => (spot ? c.look[spot] === item.id : isWorn(c.look, item));
                const picked = options.find(wornHere);
                const pointed = hovered && hovered.slot === slot && hoveredSpot === spot ? hovered : null;
                return (
                  <section key={spot ?? slot} className="wardrobe-slot" aria-label={label}>
                    <h2>
                      {label}
                      {pointed ? (
                        <small className="picked-name pointing">
                          {pointed.name}, {ownership(pointed)}
                        </small>
                      ) : (
                        picked && <small className="picked-name">{picked.name}</small>
                      )}
                    </h2>
                    <div
                      className={`item-options ${view === "swatch" ? "swatch-options" : view === "desk" ? `desk-options${spot === "desk_front" ? " sticker-options" : ""}` : "thumb-options"}`}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {options.map((item) => {
                        const worn = wornHere(item);
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
                            onClick={() => (spot ? c.placeOnDesk(spot, item) : c.wear(item))}
                            onMouseEnter={() => point(item, spot)}
                            onFocus={() => point(item, spot)}
                            onBlur={() => setHovered(null)}
                          >
                            {view === "swatch" ? (
                              <span className="color-swatch" style={{ "--swatch": asset?.swatch ?? "#c0a98d" } as CSSProperties} />
                            ) : view === "desk" ? (
                              <img className="desk-thumb" src={DESK_ITEM_ART[item.id]} alt="" draggable={false} />
                            ) : (
                              <span className={`thumb-window thumb-${asset?.thumb ?? view}${soon ? " soon" : ""}`}>
                                <LayerStack look={previewWith(c.look, item)} label="" decorative className="thumb-stack" />
                                {soon && <span className="thumb-soon">준비 중</span>}
                              </span>
                            )}
                            {!item.owned && <Coin className="price-mark" weight="fill" />}
                            {worn && <Check className="worn-mark" weight="bold" />}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
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
