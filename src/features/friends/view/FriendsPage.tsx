import { useState, type FormEvent } from "react";
import { useProfile } from "../../account/viewmodel/useAccount";
import PageFrame from "../../shell/view/PageFrame";
import { normalizeFriendCode } from "../model/friends";
import { SOCIAL_CONFIG } from "../model/socialConfig";
import { useFriendActions, useFriends } from "../viewmodel/useFriends";
import FriendList from "./FriendList";

const RESULT_TEXT = {
  sent: "친구 요청을 보냈어요.",
  accepted: "서로 요청해서 바로 친구가 되었어요.",
  already_friends: "이미 친구예요.",
} as const;

/** 친구 코드로 요청 보내기. 닉네임 검색은 없다. */
function AddFriendForm() {
  const { sendByCode } = useFriendActions();
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeFriendCode(code, SOCIAL_CONFIG.friendCodeLength);
    if (!normalized) {
      setNote(`친구 코드는 ${SOCIAL_CONFIG.friendCodeLength}자예요.`);
      return;
    }
    setPending(true);
    try {
      setNote(RESULT_TEXT[await sendByCode(normalized)]);
      setCode("");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "요청하지 못했어요.");
    } finally {
      setPending(false);
    }
  };
  return (
    <form className="friend-add" onSubmit={submit}>
      <label>
        친구 코드
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={SOCIAL_CONFIG.friendCodeLength + 4}
          placeholder="8자 코드"
          autoComplete="off"
        />
      </label>
      <button className="primary" type="submit" disabled={pending}>
        친구 요청 보내기
      </button>
      {note && <p role="status">{note}</p>}
    </form>
  );
}

export default function FriendsPage() {
  const code = useProfile().data?.friendCode;
  const count = useFriends().data?.length ?? 0;
  return (
    <PageFrame title="친구 목록">
      <div className="page-intro">
        <h1>같이 공부하는 우리</h1>
        <p>친구의 공부 공간을 살펴보세요.</p>
      </div>
      <div className="friend-tools">
        <p>
          내 친구 코드 <strong data-testid="my-friend-code">{code ?? "불러오는 중"}</strong>
        </p>
        <AddFriendForm />
        <p className="muted">
          친구 {count}명, 최대 {SOCIAL_CONFIG.friendCap}명
        </p>
      </div>
      <FriendList expanded />
      <p className="muted">같은 방 멤버인 친구만 방 이름이 보여요.</p>
    </PageFrame>
  );
}
