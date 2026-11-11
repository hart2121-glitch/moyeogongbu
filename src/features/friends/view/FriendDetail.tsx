import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { defaultLook } from "../../character/model/layers";
import LayerStack from "../../character/view/LayerStack";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { friendPlace, friendRoomPath, type Friend } from "../model/friends";
import { useFriendActions } from "../viewmodel/useFriends";
import "./friends.css";

type Pending = "unfriend" | "block" | null;

/**
 * 친구 프로필 모달: 꾸민 모습, 있는 곳, 같은 방이면 같이 공부하기, 친구 끊기(상대에게 알리지 않음), 차단.
 * 끊기와 차단은 한 번 더 묻는다.
 */
export default function FriendDetail({ friend }: { friend: Friend }) {
  const { closeModal } = useAppState().modal;
  const navigate = useNavigate();
  const actions = useFriendActions();
  const [confirm, setConfirm] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");
  const run = async (work: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await work();
      closeModal();
    } catch (error) {
      setFailed(error instanceof Error ? error.message : "처리하지 못했어요.");
      setBusy(false);
    }
  };
  const target = friendRoomPath(friend);
  const join = () => {
    closeModal();
    if (target) navigate(target);
  };
  return (
    <div className="friend-detail">
      <div className="friend-detail-figure">
        <LayerStack look={friend.look ?? defaultLook()} label={`${friend.name}의 캐릭터`} />
      </div>
      <h2>{friend.name}</h2>
      <p className="friend-detail-place">
        <i className={`presence ${friend.state}`} aria-hidden="true" />
        {friendPlace(friend)}
      </p>
      {failed && <p role="alert">{failed}</p>}
      {confirm ? (
        <div className="friend-confirm">
          <p>{confirm === "unfriend" ? `${friend.name}님과 친구를 끊을까요?` : `${friend.name}님을 차단할까요?`}</p>
          <div>
            <button
              className="primary danger"
              disabled={busy}
              onClick={() => run(() => (confirm === "unfriend" ? actions.unfriend(friend.userId) : actions.block(friend.userId)))}
            >
              {confirm === "unfriend" ? "끊기" : "차단"}
            </button>
            <button className="secondary-button" disabled={busy} onClick={() => setConfirm(null)}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="friend-detail-actions">
          {target && (
            <button className="primary" onClick={join}>
              같이 공부하기
            </button>
          )}
          <button className="secondary-button" onClick={() => setConfirm("unfriend")}>
            친구 끊기
          </button>
          <button className="primary danger" onClick={() => setConfirm("block")}>
            차단하기
          </button>
        </div>
      )}
    </div>
  );
}
