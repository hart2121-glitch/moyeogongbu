import { Cat, Envelope, X } from "@phosphor-icons/react";
import FriendDetail from "../../friends/view/FriendDetail";
import NoticeDetail from "../../lobby/view/NoticeDetail";
import NoticeList from "../../lobby/view/NoticeList";
import TaskForm from "../../lobby/view/TaskForm";
import ProfileForm from "../../character/view/ProfileForm";
import { modalTitle } from "../model/modal";
import { useAppState } from "../viewmodel/AppStateContext";

function ModalBody() {
  const { modal: modalState } = useAppState();
  const { modal } = modalState;
  if (modal === "task") return <TaskForm />;
  if (modal === "profile") return <ProfileForm />;
  if (modal === "notices") return <NoticeList />;
  if (typeof modal === "object" && modal) {
    return modal.type === "friend" ? (
      <FriendDetail friend={modal} />
    ) : (
      <NoticeDetail title={modal.title} />
    );
  }
  if (modal === "settings") {
    return (
      <>
        <h2>편안한 공부를 위한 설정</h2>
        <p>현재 버전은 소리 없이 사용할 수 있어요.</p>
        <p className="muted">
          로그인 없이 체험하는 첫 버전으로, 변경한 정보는 새로고침하면
          초기화됩니다.
        </p>
      </>
    );
  }
  return (
    <div className="empty-state">
      <Envelope />
      <h2>
        {modal === "mail" ? "도착한 편지가 없어요" : "새로운 알림이 없어요"}
      </h2>
      <p>오늘도 나만의 속도로 공부해 보세요.</p>
    </div>
  );
}

export default function ModalHost() {
  const { modal, closeModal } = useAppState().modal;
  if (!modal) return null;
  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <section
        className="panel modal"
        role="dialog"
        aria-modal="true"
        aria-label="안내 창"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-heading">
          <span>
            <Cat />
            {modalTitle(modal)}
          </span>
          <button aria-label="닫기" onClick={closeModal} autoFocus>
            <X />
          </button>
        </div>
        <div className="panel-body">
          <ModalBody />
        </div>
      </section>
    </div>
  );
}
