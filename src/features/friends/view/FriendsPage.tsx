import { IdentificationBadge, UserPlus } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useProfile } from "../../account/viewmodel/useAccount";
import CopyButton from "../../shell/view/CopyButton";
import PageFrame from "../../shell/view/PageFrame";
import { normalizeFriendCode } from "../model/friends";
import { SOCIAL_CONFIG } from "../model/socialConfig";
import { useFriendActions, useFriends } from "../viewmodel/useFriends";
import FriendList from "./FriendList";
import "./friends.css";

const RESULT_TEXT = {
  sent: "친구 요청을 보냈어요.",
  accepted: "서로 요청해서 바로 친구가 되었어요.",
  already_friends: "이미 친구예요.",
} as const;

/**
 * 내 친구 코드와 복사 단추. 이름표가 "친구 코드" 입력칸(친구 추가)과 겹치지 않도록
 * 이 묶음과 복사 단추에는 "친구 코드"라는 이름을 붙이지 않는다.
 */
function MyCodeCard() {
  const code = useProfile().data?.friendCode;
  return (
    <section className="friend-card">
      <h2>
        <IdentificationBadge /> 내 친구 코드
      </h2>
      <div className="friend-code-row">
        <strong className="friend-code" data-testid="my-friend-code">
          {code ?? "불러오는 중"}
        </strong>
        <CopyButton text={code} label="코드 복사" />
      </div>
    </section>
  );
}

/** 친구 코드로 요청 보내기. 닉네임 검색은 없다. */
function AddFriendForm() {
  const { sendByCode } = useFriendActions();
  const [code, setCode] = useState("");
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const normalized = normalizeFriendCode(code, SOCIAL_CONFIG.friendCodeLength);
    if (!normalized) {
      setNote({ text: `친구 코드는 ${SOCIAL_CONFIG.friendCodeLength}자예요.`, error: true });
      return;
    }
    setPending(true);
    try {
      setNote({ text: RESULT_TEXT[await sendByCode(normalized)], error: false });
      setCode("");
    } catch (error) {
      setNote({ text: error instanceof Error ? error.message : "요청하지 못했어요.", error: true });
    } finally {
      setPending(false);
    }
  };
  return (
    <form className="friend-card" onSubmit={submit} aria-labelledby="add-friend-title">
      <h2 id="add-friend-title">
        <UserPlus /> 친구 추가
      </h2>
      <label htmlFor="friend-code-input">친구 코드</label>
      <div className="friend-add-row">
        <input
          id="friend-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={SOCIAL_CONFIG.friendCodeLength + 4}
          placeholder={`${SOCIAL_CONFIG.friendCodeLength}자 코드`}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="primary" type="submit" disabled={pending}>
          친구 요청 보내기
        </button>
      </div>
      {note && (
        <p className={`friend-note${note.error ? " is-error" : ""}`} role="status">
          {note.text}
        </p>
      )}
    </form>
  );
}

/** `/friends`: 내 친구 코드, 코드로 친구 추가, 친구 목록과 지금 상태. */
export default function FriendsPage() {
  const count = useFriends().data?.length ?? 0;
  return (
    <PageFrame title="친구 목록">
      <div className="page-intro">
        <h1>같이 공부하는 우리</h1>
      </div>
      <div className="friend-cards">
        <MyCodeCard />
        <AddFriendForm />
      </div>
      <section className="friend-section" aria-labelledby="friend-list-title">
        <h2 id="friend-list-title">
          친구{" "}
          <small>
            {count}/{SOCIAL_CONFIG.friendCap}
          </small>
        </h2>
        <FriendList expanded />
      </section>
    </PageFrame>
  );
}
