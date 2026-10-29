import { useState } from "react";
import { AVATAR_SRC } from "../../character/model/character";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { friendPlace, type Friend } from "../model/friends";
import { useFriendActions } from "../viewmodel/useFriends";

/** 친구 프로필 모달: 있는 곳, 친구 끊기(상대에게 알리지 않음), 차단. */
export default function FriendDetail({ friend }: { friend: Friend }) {
  const { closeModal } = useAppState().modal;
  const actions = useFriendActions();
  const [failed, setFailed] = useState("");
  const run = async (work: () => Promise<unknown>) => {
    try {
      await work();
      closeModal();
    } catch (error) {
      setFailed(error instanceof Error ? error.message : "처리하지 못했어요.");
    }
  };
  return (
    <div className="friend-detail">
      <img src={AVATAR_SRC} alt="친구 캐릭터" />
      <h2>{friend.name}</h2>
      <p>{friendPlace(friend)}</p>
      {failed && <p role="alert">{failed}</p>}
      <div className="settings-actions">
        <button className="primary" onClick={() => run(() => actions.unfriend(friend.userId))}>
          친구 끊기
        </button>
        <button className="primary danger" onClick={() => run(() => actions.block(friend.userId))}>
          차단하기
        </button>
      </div>
      <p className="muted">친구를 끊어도 상대에게 알림이 가지 않아요.</p>
    </div>
  );
}
