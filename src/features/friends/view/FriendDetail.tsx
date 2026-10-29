import { AVATAR_SRC } from "../../character/model/character";
import type { Friend } from "../model/friends";

export default function FriendDetail({ friend }: { friend: Friend }) {
  return (
    <div className="friend-detail">
      <img src={AVATAR_SRC} alt="친구 캐릭터" />
      <h2>{friend.name}</h2>
      <p>{friend.place}</p>
      <p className="muted">
        친구 프로필 예시입니다. 실시간 친구 기능은 준비 중이에요.
      </p>
    </div>
  );
}
