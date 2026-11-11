import { Crown } from "@phosphor-icons/react";
import { useState, type CSSProperties, type FormEvent } from "react";
import { COMPANY_ROOM_ART, companyLayout } from "../../../study/companyLayout";
import { BOARD_DEFAULT_TEXT, DECOR_ITEM_ART, DECOR_SLOTS, boardTextError, type DecorSlot } from "../../../config/roomDecor";
import CharacterAvatar from "../../character/view/CharacterAvatar";
import { objectParticle } from "../../../lib/josa";
import { buyBlockReason, type ShopItem } from "../../shop/model/shop";
import CopyButton from "../../shell/view/CopyButton";
import Dialog from "../../shell/view/Dialog";
import type { MemberStatus, Room } from "../model/room";
import { ROOM_CONFIG } from "../model/roomConfig";
import { useOwnerTools } from "../viewmodel/useOwnerTools";
import { useRoomDecorShop } from "../viewmodel/useRoomDecorShop";
import "./ownerTools.css";

/**
 * 선택지 그림 창 (방 그림 1배). 아이템을 휴게실의 그 자리에 놓은 모습에서 자리 가운데를 보인다.
 * 러그는 가운데가 탁자에 가려 오른쪽 아래(테두리와 탁자 다리 둘레)를 보인다.
 */
const THUMB = { width: 96, height: 44 };
const THUMB_CENTER: Partial<Record<DecorSlot, { x: number; y: number }>> = { rug: { x: 150, y: 190 } };
const thumbAt = (slot: DecorSlot) => {
  const box = (companyLayout.decorSlots as readonly { id: string; box: { x: number; y: number; width: number; height: number } }[])
    .find((s) => s.id === slot)!.box;
  const center = THUMB_CENTER[slot] ?? { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const left = Math.round(center.x - THUMB.width / 2), top = Math.round(center.y - THUMB.height / 2);
  return {
    room: { backgroundImage: `url("${COMPANY_ROOM_ART}")`, backgroundPosition: `${-left}px ${-top}px` } as CSSProperties,
    item: { left: box.x - left, top: box.y - top } as CSSProperties,
  };
};

interface Props {
  room: Room;
  members: MemberStatus[];
  onChanged: () => void;
}

/**
 * 방장 도구: 방 오른쪽 열의 단추가 창을 연다. 방 이름 변경, 초대 코드 복사와 재발급, 화이트보드 문구, 휴게실 꾸미기, 강퇴(한 번 더 묻는다), 강퇴 풀기.
 * 휴게실 꾸미기는 자리마다 아이템을 고른다. 가진 아이템은 누르면 바로 놓이고, 사지 않은 아이템은 가격을 확인한 뒤 사서 놓는다.
 */
export default function OwnerTools(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="owner-tools-open" onClick={() => setOpen(true)}>
        <Crown weight="duotone" /> 방장 도구
      </button>
      {open && (
        <Dialog title="방장 도구" wide testId="owner-tools" icon={<Crown weight="duotone" />} onClose={() => setOpen(false)}>
          <OwnerToolsBody {...props} />
        </Dialog>
      )}
    </>
  );
}

function OwnerToolsBody({ room, members, onChanged }: Props) {
  const tools = useOwnerTools(room.id, room.isOwner, onChanged);
  const shop = useRoomDecorShop();
  const [name, setName] = useState(room.name);
  const [board, setBoard] = useState(room.boardText ?? "");
  const [confirming, setConfirming] = useState<ShopItem | null>(null);
  const [kicking, setKicking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const run = async (action: () => Promise<void>, done: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      setMessage({ text: done, error: false });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "처리하지 못했어요.", error: true });
    } finally {
      setBusy(false);
    }
  };
  const rename = (e: FormEvent) => {
    e.preventDefault();
    void run(() => tools.rename(name), "방 이름을 바꿨어요.");
  };
  const writeBoard = (e: FormEvent) => {
    e.preventDefault();
    const error = boardTextError(board);
    if (error) setMessage({ text: error, error: true });
    else void run(() => tools.writeBoard(board), board.trim() ? "화이트보드 문구를 바꿨어요." : "화이트보드를 기본 문구로 되돌렸어요.");
  };
  const place = (slot: DecorSlot, item: ShopItem) => {
    setConfirming(null);
    void run(() => tools.decorate(slot, item.id), `휴게실에 ${objectParticle(item.name)} 놓았어요.`);
  };
  const buyAndPlace = (slot: DecorSlot, item: ShopItem) =>
    void run(async () => {
      const status = await shop.buy(item.id);
      if (status === "insufficient") throw new Error("코인이 조금 모자라요. 공부하며 코인을 모은 뒤 다시 들러 주세요.");
      setConfirming(null);
      await tools.decorate(slot, item.id);
    }, `${objectParticle(item.name)} 사서 휴게실에 놓았어요.`);
  const kick = (m: MemberStatus) =>
    void run(async () => {
      await tools.kick(m.userId);
      setKicking(null);
    }, `${m.displayName} 님을 강퇴했어요.`);

  return (
    <div className="owner-tools">
      <section className="owner-group" aria-labelledby="owner-info">
        <h3 id="owner-info">방 정보</h3>
        <form className="owner-line" onSubmit={rename}>
          <label htmlFor="owner-room-name">방 이름</label>
          <input
            id="owner-room-name"
            maxLength={ROOM_CONFIG.nameMaxLength}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit" className="secondary-button" disabled={busy || !name.trim() || name.trim() === room.name}>
            이름 바꾸기
          </button>
        </form>
        <div className="owner-line">
          <span className="owner-label">초대 코드</span>
          <code className="owner-code">{room.inviteCode}</code>
          <CopyButton text={room.inviteCode} label="초대 코드 복사" />
          <button type="button" className="secondary-button" disabled={busy} onClick={() => void run(tools.reissue, "새 초대 코드를 만들었어요.")}>
            초대 코드 재발급
          </button>
        </div>
      </section>

      <section className="owner-group" aria-labelledby="owner-board-title">
        <h3 id="owner-board-title">화이트보드 문구</h3>
        <form className="owner-board" onSubmit={writeBoard}>
          <label htmlFor="owner-board-text">두 줄, 줄마다 12자까지</label>
          <div className="owner-line">
            <textarea
              id="owner-board-text"
              rows={2}
              value={board}
              placeholder={BOARD_DEFAULT_TEXT}
              onChange={(e) => setBoard(e.target.value)}
            />
            <button type="submit" className="secondary-button" disabled={busy}>
              문구 바꾸기
            </button>
          </div>
        </form>
      </section>

      <section className="owner-group" aria-labelledby="owner-decor-title">
        <div className="owner-group-head">
          <h3 id="owner-decor-title">휴게실 꾸미기</h3>
          <span className="owner-balance" data-testid="owner-decor-balance">
            지금 가진 코인 {shop.balance}
          </span>
        </div>
        {DECOR_SLOTS.map(({ slot, label }) => (
          <fieldset key={slot} className="owner-decor-row" data-slot={slot}>
            <legend>{label}</legend>
            <div className="owner-decor-options">
              {shop.itemsFor(slot).map((item) => {
                const art = DECOR_ITEM_ART[item.id];
                const placed = room.decor[slot] === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="owner-decor-option"
                    data-item={item.id}
                    aria-pressed={placed}
                    aria-label={`${label}, ${item.name}${item.owned ? "" : `, ${item.price}코인`}`}
                    disabled={busy}
                    onClick={() => (item.owned ? place(slot, item) : setConfirming(item))}
                  >
                    <span className={`owner-decor-thumb owner-decor-thumb-${slot}`} style={thumbAt(slot).room}>
                      {art && <img src={art} alt="" draggable={false} style={thumbAt(slot).item} />}
                    </span>
                    <span>{item.name}</span>
                    <span className="owner-decor-state">{placed ? "놓여 있어요" : item.owned ? "가지고 있어요" : `${item.price}코인`}</span>
                  </button>
                );
              })}
            </div>
            {confirming && shop.itemsFor(slot).some((item) => item.id === confirming.id) && (
              <div className="buy-confirm" role="group" aria-label={`${confirming.name} 구매 확인`}>
                <p>
                  {confirming.name}, {confirming.price}코인이에요. 방장 코인으로 사고, 사면 되돌릴 수 없어요.
                </p>
                {buyBlockReason(confirming, shop.balance) ? (
                  <p>{buyBlockReason(confirming, shop.balance)}</p>
                ) : (
                  <button type="button" className="primary" disabled={busy} onClick={() => buyAndPlace(slot, confirming)}>
                    {confirming.name} 사서 놓기
                  </button>
                )}
                <button type="button" className="secondary-button" onClick={() => setConfirming(null)}>
                  그만두기
                </button>
              </div>
            )}
          </fieldset>
        ))}
      </section>

      <section className="owner-group" aria-labelledby="owner-members">
        <h3 id="owner-members">
          멤버 {members.length}/{ROOM_CONFIG.maxMembers}
        </h3>
        <ul className="owner-members">
          {members.map((m) => (
            <li key={m.userId}>
              <CharacterAvatar look={m.look} />
              <strong>{m.displayName}</strong>
              {m.isOwner ? (
                <span className="owner-badge">방장</span>
              ) : kicking === m.userId ? (
                <span className="owner-kick-confirm" role="group" aria-label={`${m.displayName} 강퇴 확인`}>
                  <span>내보낼까요?</span>
                  <button type="button" className="primary danger" disabled={busy} onClick={() => kick(m)}>
                    강퇴
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setKicking(null)}>
                    취소
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => setKicking(m.userId)}
                  aria-label={`${m.displayName} 강퇴`}
                >
                  강퇴
                </button>
              )}
            </li>
          ))}
        </ul>
        <h3>강퇴한 사람</h3>
        {tools.bans.length === 0 ? (
          <p className="muted">강퇴한 사람이 없어요.</p>
        ) : (
          <ul className="owner-members">
            {tools.bans.map((b) => (
              <li key={b.userId}>
                <strong>{b.displayName}</strong>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => void run(() => tools.unban(b.userId), `${b.displayName} 님을 풀어 줬어요.`)}
                  aria-label={`${b.displayName} 풀어 주기`}
                >
                  풀어 주기
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {message && (
        <p className={`owner-message${message.error ? " is-error" : ""}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
