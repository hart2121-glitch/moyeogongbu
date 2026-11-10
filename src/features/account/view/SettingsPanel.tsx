import { useState } from "react";
import { Link } from "react-router-dom";
import BlockList from "../../friends/view/BlockList";
import { ROUTES } from "../../shell/model/paths";
import CopyButton from "../../shell/view/CopyButton";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { useAccountActions, useProfile } from "../viewmodel/useAccount";
import "./settings.css";

type Permission = NotificationPermission | "unsupported";
const readPermission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

/** 브라우저 알림(뽀모도로 종료, 자리 비움 확인) 허용 상태와 켜기 단추. 거절한 뒤에는 브라우저 설정에서만 바꿀 수 있다. */
function NotificationRow() {
  const [permission, setPermission] = useState<Permission>(readPermission);
  const label =
    permission === "granted"
      ? "켜져 있어요"
      : permission === "denied"
        ? "브라우저에서 막혀 있어요"
        : permission === "unsupported"
          ? "이 브라우저는 지원하지 않아요"
          : "꺼져 있어요";
  return (
    <div className="settings-row">
      <span>브라우저 알림</span>
      <strong>{label}</strong>
      {permission === "default" && (
        <button className="secondary-button" onClick={() => void Notification.requestPermission().then(setPermission)}>
          켜기
        </button>
      )}
    </div>
  );
}

/** 설정 모달 내용: 계정(화면 이름, 친구 코드), 브라우저 알림, 차단 목록, 개인정보 처리방침, 로그아웃, 계정 삭제(확인 단계 포함). */
export default function SettingsPanel() {
  const { openModal } = useAppState().modal;
  const profile = useProfile().data;
  const { signOut, deleteAccount, pending, failed } = useAccountActions();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (confirmingDelete) {
    return (
      <div className="settings">
        <h2>계정을 삭제할까요?</h2>
        <p>
          계정과 프로필이 영구히 삭제되고 되돌릴 수 없어요.
          <br />
          친구 코드도 다시 발급되지 않아요.
        </p>
        {failed && <p role="alert">삭제하지 못했어요. 다시 시도해 주세요.</p>}
        <div className="settings-actions">
          <button className="secondary-button" onClick={() => setConfirmingDelete(false)} disabled={pending}>
            취소
          </button>
          <button className="primary danger" onClick={deleteAccount} disabled={pending}>
            영구 삭제하기
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="settings">
      {failed && <p role="alert">처리하지 못했어요. 다시 시도해 주세요.</p>}
      <section className="settings-group" aria-labelledby="settings-account">
        <h3 id="settings-account">계정</h3>
        <div className="settings-row">
          <span>화면 이름</span>
          <strong>{profile?.displayName ?? ""}</strong>
          <button className="secondary-button" onClick={() => openModal("profile")}>
            화면 이름 변경
          </button>
        </div>
        <div className="settings-row">
          <span>친구 코드</span>
          <strong className="settings-code">{profile?.friendCode ?? ""}</strong>
          <CopyButton text={profile?.friendCode} label="내 친구 코드 복사" />
        </div>
      </section>
      <section className="settings-group" aria-labelledby="settings-alerts">
        <h3 id="settings-alerts">알림</h3>
        <NotificationRow />
      </section>
      <BlockList />
      <div className="settings-foot">
        <Link to={ROUTES.privacy}>개인정보 처리방침</Link>
        <div>
          <button className="secondary-button" onClick={signOut} disabled={pending}>
            로그아웃
          </button>
          <button className="primary danger" onClick={() => setConfirmingDelete(true)}>
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
