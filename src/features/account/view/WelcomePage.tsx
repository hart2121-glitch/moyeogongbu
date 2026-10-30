import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../shell/model/paths";
import { useDisplayNameForm } from "../viewmodel/useAccount";
import AuthFrame from "./AuthFrame";
import DisplayNameField from "./DisplayNameField";
import DoorNameplate from "./DoorNameplate";

/** 첫 로그인 단계: 화면 이름을 정하고 만 14세 이상임을 확인한다. 적는 이름이 방문 문패에 바로 새겨진다. */
export default function WelcomePage() {
  const navigate = useNavigate();
  const form = useDisplayNameForm("");
  const [isOver14, setIsOver14] = useState(false);
  return (
    <AuthFrame title="처음 오셨네요" scene={<DoorNameplate name={form.nameInput} />}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (isOver14 && (await form.save()))
            navigate(ROUTES.lobby, { replace: true });
        }}
      >
        <h2>화면 이름을 정해 주세요</h2>
        <DisplayNameField value={form.nameInput} onChange={form.setNameInput} />
        <label className="check-row">
          <input
            type="checkbox"
            required
            checked={isOver14}
            onChange={(e) => setIsOver14(e.target.checked)}
          />
          만 14세 이상입니다
        </label>
        <p className="muted">
          만 14세 미만은 가입할 수 없어요.{" "}
          <Link to={ROUTES.privacy}>개인정보 처리방침</Link>
        </p>
        {form.failed && (
          <p role="alert">저장하지 못했어요. 다시 시도해 주세요.</p>
        )}
        <button
          className="primary"
          disabled={!form.valid || !isOver14 || form.saving}
          aria-describedby="welcome-hint"
        >
          시작하기
        </button>
        {(!form.valid || !isOver14) && (
          <p className="muted" id="welcome-hint" role="status">
            {!form.valid ? "화면 이름을 적으면 시작할 수 있어요." : "만 14세 이상인지 확인해 주시면 시작할 수 있어요."}
          </p>
        )}
      </form>
    </AuthFrame>
  );
}
