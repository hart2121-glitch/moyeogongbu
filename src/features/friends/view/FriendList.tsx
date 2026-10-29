import {
  Coffee,
  GameController,
  Monitor,
  type Icon,
} from "@phosphor-icons/react";
import { AVATAR_SRC } from "../../character/model/character";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { AWAY_FRIEND_INDEX, FRIENDS, type FriendIcon } from "../model/friends";

const FRIEND_ICONS: Record<FriendIcon, Icon> = {
  monitor: Monitor,
  coffee: Coffee,
  gamepad: GameController,
};

/**
 * 친구 목록. 누르면 친구 프로필 모달이 열린다.
 * @example <FriendList expanded />
 */
export default function FriendList({ expanded = false }) {
  const { openModal } = useAppState().modal;
  return (
    <div className="friend-list">
      {FRIENDS.map((f, i) => {
        const FriendIconView = FRIEND_ICONS[f.icon];
        return (
          <button
            className="friend"
            key={f.name}
            onClick={() => openModal({ type: "friend", ...f })}
          >
            <img
              className={`friend-avatar avatar-${i}`}
              src={AVATAR_SRC}
              alt=""
            />
            <strong>{f.name}</strong>
            <span
              className={`presence ${i === AWAY_FRIEND_INDEX ? "away" : ""}`}
            />
            <span className="friend-status">
              {expanded ? f.place : f.status} …
            </span>
            <FriendIconView size={27} />
          </button>
        );
      })}
    </div>
  );
}
