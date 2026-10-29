import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../shell/model/paths";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { useAccountActions } from "../viewmodel/useAccount";

/** 설정 모달 내용: 화면 이름 변경, 로그아웃, 계정 삭제(확인 단계 포함), 개인정보 처리방침. */
export default function SettingsPanel() {
  const { openModal } = useAppState().modal;
  const { signOut, deleteAccount, pending, failed } = useAccountActions();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (confirmingDelete) {
    return (
      <>
        <h2>계정을 삭제할까요?</h2>
        <p>
          계정과 프로필이 영구히 삭제되고 되돌릴 수 없어요.
          <br />
          친구 코드도 다시 발급되지 않아요.
        </p>
        {failed && <p role="alert">삭제하지 못했어요. 다시 시도해 주세요.</p>}
        <div className="settings-actions">
          <button
            className="primary"
            onClick={() => setConfirmingDelete(false)}
            disabled={pending}
          >
            취소
          </button>
          <button
            className="primary danger"
            onClick={deleteAccount}
            disabled={pending}
          >
            영구 삭제하기
          </button>
        </div>
      </>
    );
  }
  return (
    <>
      <h2>편안한 공부를 위한 설정</h2>
      <p>현재 버전은 소리 없이 사용할 수 있어요.</p>
      {failed && <p role="alert">처리하지 못했어요. 다시 시도해 주세요.</p>}
      <div className="settings-actions">
        <button className="primary" onClick={() => openModal("profile")}>
          화면 이름 변경
        </button>
        <button className="primary" onClick={signOut} disabled={pending}>
          로그아웃
        </button>
        <button
          className="primary danger"
          onClick={() => setConfirmingDelete(true)}
        >
          계정 삭제
        </button>
      </div>
      <p className="muted">
        <Link to={ROUTES.privacy}>개인정보 처리방침</Link>
      </p>
    </>
  );
}
