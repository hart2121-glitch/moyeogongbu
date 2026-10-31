import { useState, type FormEvent } from "react";
import { BOARD_DEFAULT_TEXT, DECOR_ITEM_ART, DECOR_SLOTS, boardTextError, type DecorSlot } from "../../../config/roomDecor";
import { buyBlockReason, type ShopItem } from "../../shop/model/shop";
import type { MemberStatus, Room } from "../model/room";
import { ROOM_CONFIG } from "../model/roomConfig";
import { useOwnerTools } from "../viewmodel/useOwnerTools";
import { useRoomDecorShop } from "../viewmodel/useRoomDecorShop";

interface Props {
  room: Room;
  members: MemberStatus[];
  onChanged: () => void;
}

/**
 * 방장 도구: 방 이름 변경, 초대 코드 재발급, 화이트보드 문구, 휴게실 꾸미기, 강퇴, 강퇴 풀기.
 * 휴게실 꾸미기는 자리마다 아이템을 고른다. 가진 아이템은 누르면 바로 놓이고, 사지 않은 아이템은 가격을 확인한 뒤 사서 놓는다.
 */
export default function OwnerTools({ room, members, onChanged }: Props) {
  const tools = useOwnerTools(room.id, room.isOwner, onChanged);
  const shop = useRoomDecorShop();
  const [name, setName] = useState(room.name);
  const [board, setBoard] = useState(room.boardText ?? "");
  const [confirming, setConfirming] = useState<ShopItem | null>(null);
  const [message, setMessage] = useState("");
  const run = async (action: () => Promise<void>, done: string) => {
    try {
      await action();
      setMessage(done);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처리하지 못했어요.");
    }
  };
  const rename = (e: FormEvent) => {
    e.preventDefault();
    void run(() => tools.rename(name), "방 이름을 바꿨어요.");
  };
  const writeBoard = (e: FormEvent) => {
    e.preventDefault();
    const error = boardTextError(board);
    if (error) setMessage(error);
    else void run(() => tools.writeBoard(board), board.trim() ? "화이트보드 문구를 바꿨어요." : "화이트보드를 기본 문구로 되돌렸어요.");
  };
  const place = (slot: DecorSlot, item: ShopItem) => {
    setConfirming(null);
    void run(() => tools.decorate(slot, item.id), `휴게실에 ${item.name}을(를) 놓았어요.`);
  };
  const buyAndPlace = (slot: DecorSlot, item: ShopItem) =>
    void run(async () => {
      const status = await shop.buy(item.id);
      if (status === "insufficient") throw new Error("코인이 조금 모자라요. 공부하며 코인을 모은 뒤 다시 들러 주세요.");
      setConfirming(null);
      await tools.decorate(slot, item.id);
    }, `${item.name}을(를) 사서 휴게실에 놓았어요.`);
  return (
    <details className="room-owner-tools" data-testid="owner-tools">
      <summary>방장 도구</summary>
      <form onSubmit={rename}>
        <label htmlFor="owner-room-name">방 이름</label>
        <input
          id="owner-room-name"
          maxLength={ROOM_CONFIG.nameMaxLength}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">이름 바꾸기</button>
      </form>
      <p>
        초대 코드 <code>{room.inviteCode}</code>{" "}
        <button type="button" onClick={() => void run(tools.reissue, "새 초대 코드를 만들었어요.")}>
          초대 코드 재발급
        </button>
      </p>
      <h2>화이트보드 문구</h2>
      <form className="owner-board" onSubmit={writeBoard}>
        <label htmlFor="owner-board-text">두 줄, 줄마다 12자까지</label>
        <textarea
          id="owner-board-text"
          rows={2}
          value={board}
          placeholder={BOARD_DEFAULT_TEXT}
          onChange={(e) => setBoard(e.target.value)}
        />
        <button type="submit">문구 바꾸기</button>
      </form>
      <h2>휴게실 꾸미기</h2>
      <p className="muted" data-testid="owner-decor-balance">
        지금 가진 코인 {shop.balance}
      </p>
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
                  onClick={() => (item.owned ? place(slot, item) : setConfirming(item))}
                >
                  <span className={`owner-decor-thumb owner-decor-thumb-${slot}`}>
                    {art && <img src={art} alt="" draggable={false} />}
                  </span>
                  <span>{item.name}</span>
                  <span className="muted">{placed ? "놓여 있어요" : item.owned ? "가지고 있어요" : `${item.price}코인`}</span>
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
                <button type="button" className="primary" onClick={() => buyAndPlace(slot, confirming)}>
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
      <h2>멤버</h2>
      <ul>
        {members.map((m) => (
          <li key={m.userId}>
            {m.displayName}
            {m.isOwner ? (
              " (방장)"
            ) : (
              <button
                type="button"
                onClick={() => void run(() => tools.kick(m.userId), `${m.displayName} 님을 강퇴했어요.`)}
                aria-label={`${m.displayName} 강퇴`}
              >
                강퇴
              </button>
            )}
          </li>
        ))}
      </ul>
      <h2>강퇴한 사람</h2>
      {tools.bans.length === 0 ? (
        <p className="muted">강퇴한 사람이 없어요.</p>
      ) : (
        <ul>
          {tools.bans.map((b) => (
            <li key={b.userId}>
              {b.displayName}
              <button
                type="button"
                onClick={() => void run(() => tools.unban(b.userId), `${b.displayName} 님을 풀어 줬어요.`)}
                aria-label={`${b.displayName} 풀어 주기`}
              >
                풀어 주기
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="muted">{message}</p>}
    </details>
  );
}
