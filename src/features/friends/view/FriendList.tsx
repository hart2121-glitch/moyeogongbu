import { CaretRight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import CharacterAvatar from "../../character/view/CharacterAvatar";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { friendPlace, friendRoomPath, friendStatusLabel } from "../model/friends";
import { useFriends } from "../viewmodel/useFriends";
import "./friends.css";

/**
 * 친구 목록 (서버). 줄마다 친구가 꾸민 얼굴, 이름, 지금 상태를 보이고, 누르면 친구 프로필 모달이 열린다.
 * 넓은 목록(친구 화면)에서는 친구가 내가 멤버인 방에 있으면 그 방으로 바로 가는 단추를 붙인다.
 * @example <FriendList expanded />
 */
export default function FriendList({ expanded = false }) {
  const { openModal } = useAppState().modal;
  const navigate = useNavigate();
  const query = useFriends();
  const friends = query.data ?? [];
  return (
    <div className={`friend-list${expanded ? " is-expanded" : ""}`} data-testid="friend-list">
      {query.isPending && <p className="muted">친구 목록을 불러오는 중이에요.</p>}
      {query.isError && <p className="muted">친구 목록을 불러오지 못했어요.</p>}
      {query.isSuccess && friends.length === 0 && <p className="muted">아직 친구가 없어요.</p>}
      {friends.length > 0 && (
        <ul>
          {friends.map((f) => (
            <li className="friend" key={f.userId} data-state={f.state}>
              <button className="friend-main" onClick={() => openModal({ type: "friend", ...f })}>
                <CharacterAvatar look={f.look} scale={expanded ? 2 : 1} />
                <span className="friend-text">
                  <strong>{f.name}</strong>
                  <span className="friend-status">
                    <i className={`presence ${f.state}`} aria-hidden="true" />
                    {expanded ? friendPlace(f) : friendStatusLabel(f.state)}
                  </span>
                </span>
                {expanded && <CaretRight className="friend-more" aria-hidden="true" />}
              </button>
              {expanded && friendRoomPath(f) && (
                <button className="primary friend-join" onClick={() => navigate(friendRoomPath(f)!)}>
                  같이 공부하기
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
