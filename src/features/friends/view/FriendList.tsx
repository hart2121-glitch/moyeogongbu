import {
  Coffee,
  GameController,
  Monitor,
  type Icon,
} from "@phosphor-icons/react";
import { AVATAR_SRC } from "../../character/model/character";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { friendIcon, friendPlace, friendStatusLabel, type FriendIcon } from "../model/friends";
import { useFriends } from "../viewmodel/useFriends";

const FRIEND_ICONS: Record<FriendIcon, Icon> = {
  monitor: Monitor,
  coffee: Coffee,
  gamepad: GameController,
};

/**
 * 친구 목록 (서버). 누르면 친구 프로필 모달이 열린다. 배치와 디자인은 로비 확정안 그대로다.
 * @example <FriendList expanded />
 */
export default function FriendList({ expanded = false }) {
  const { openModal } = useAppState().modal;
  const query = useFriends();
  const friends = query.data ?? [];
  return (
    <div className="friend-list" data-testid="friend-list">
      {query.isPending && <p className="muted">친구 목록을 불러오는 중이에요.</p>}
      {query.isError && <p className="muted">친구 목록을 불러오지 못했어요.</p>}
      {query.isSuccess && friends.length === 0 && (
        <p className="muted">아직 친구가 없어요. 친구 코드로 친구를 추가해 보세요.</p>
      )}
      {friends.map((f, i) => {
        const FriendIconView = FRIEND_ICONS[friendIcon(f.state)];
        return (
          <button
            className="friend"
            key={f.userId}
            onClick={() => openModal({ type: "friend", ...f })}
          >
            <img
              className={`friend-avatar avatar-${i % 3}`}
              src={AVATAR_SRC}
              alt=""
            />
            <strong>{f.name}</strong>
            <span
              className={`presence ${f.state === "away" ? "away" : ""} ${f.state === "offline" ? "offline" : ""}`}
            />
            <span className="friend-status">
              {expanded ? friendPlace(f) : friendStatusLabel(f.state)} …
            </span>
            <FriendIconView size={27} />
          </button>
        );
      })}
    </div>
  );
}
