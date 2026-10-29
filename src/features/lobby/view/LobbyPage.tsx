import {
  BookOpen,
  Cat,
  CaretRight,
  Coffee,
  Coin,
  Flower,
  PencilSimple,
  Plus,
  Tote,
  X,
} from "@phosphor-icons/react";
import { useEffect } from "react";
import { useCarryOverPrompt } from "../../todos/viewmodel/useCarryOver";
import { useNavigate } from "react-router-dom";
import RoomPreview from "../../../components/RoomPreview";
import { roomPreviews } from "../../../roomPreviews";
import { AVATAR_SRC } from "../../character/model/character";
import { bodyTintOf } from "../../character/model/layers";
import { useMyLook } from "../../character/viewmodel/useCharacter";
import { useProfile } from "../../account/viewmodel/useAccount";
import FriendList from "../../friends/view/FriendList";
import { useRoomNavigation } from "../../rooms/viewmodel/useRoomNavigation";
import { ROUTES } from "../../shell/model/paths";
import Panel from "../../shell/view/Panel";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { useNotices } from "../viewmodel/useNotices";
import { useCoinSummary } from "../../coins/viewmodel/useCoins";
import PendingSettlementPopup from "../../coins/view/PendingSettlementPopup";

function ProfilePanel() {
  const { modal } = useAppState();
  const look = useMyLook().data;
  const balance = useCoinSummary().data?.balance ?? 0;
  const displayName = useProfile().data?.displayName;
  return (
    <Panel title="내 프로필" className="profile-panel">
      <div className="profile-main">
        <img
          className={`profile-avatar ${bodyTintOf(look)}`}
          data-look-outfit={look?.outfit ?? ""}
          src={AVATAR_SRC}
          alt="보라색 리본을 단 밍구 캐릭터"
        />
        <div className="profile-info">
          <div className="profile-name">
            <h1>{displayName}</h1>
            <button
              aria-label="프로필 수정"
              onClick={() => modal.openModal("profile")}
            >
              <PencilSimple />
            </button>
          </div>
          <div className="profile-coins">
            <Coin weight="duotone" />
            {balance.toLocaleString()}
          </div>
          <div className="level">
            <span>Lv. 12</span>
            <div className="level-track">
              <div />
            </div>
          </div>
        </div>
      </div>
      <div className="status-message">
        오늘도 좋은 하루가 될거야 !<Flower />
      </div>
    </Panel>
  );
}

function QuickEnterPanel() {
  const navigate = useNavigate();
  const { enterQuickCompanyRoom, enterTheme } = useRoomNavigation();
  return (
    <Panel title="빠른 입장하기" className="quick-panel">
      <div className="theme-grid">
        <button
          className="theme-card"
          aria-label="회사 테마로 가기"
          onClick={enterQuickCompanyRoom}
        >
          <RoomPreview preview={roomPreviews.office} />
          <span>
            <Tote weight="duotone" /> 회사 테마로 가기
          </span>
        </button>
        <button
          className="theme-card"
          aria-label="학교 테마로 가기"
          onClick={() => enterTheme("학교")}
        >
          <RoomPreview preview={roomPreviews.school} />
          <span>
            <BookOpen weight="duotone" /> 학교 테마로 가기
          </span>
        </button>
      </div>
      <button className="cafe-button" onClick={() => navigate(ROUTES.cafe)}>
        <Coffee weight="duotone" /> 공용 스터디카페 가기
        <CaretRight />
      </button>
    </Panel>
  );
}

function TasksPanel() {
  const { tasks, modal } = useAppState();
  // 새 날 처음 오늘의 할 일을 볼 때 어제의 미완료 할 일을 한 번 제안한다 (Story 005).
  const carry = useCarryOverPrompt();
  const busy = modal.modal !== null;
  useEffect(() => {
    if (!carry.shouldAsk || busy) return;
    carry.markAsked();
    modal.openModal("carry");
  }, [carry.shouldAsk, busy]);
  return (
    <Panel
      title="오늘의 할 일"
      className="tasks-panel"
      action={
        <button
          className="add-task"
          aria-label="할 일 추가"
          onClick={() => modal.openModal("task")}
        >
          <Plus />
        </button>
      }
    >
      <ul className="task-list">
        {tasks.tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => tasks.toggle(task.id)}
              />
              <span>{task.text}</span>
            </label>
          </li>
        ))}
      </ul>
      <Cat className="task-mascot" />
    </Panel>
  );
}

function NoticesPanel() {
  const { openModal } = useAppState().modal;
  const notices = useNotices().slice(0, 4);
  return (
    <Panel
      title="최근 공지사항"
      action={
        <button className="more" onClick={() => openModal("notices")}>
          더보기 <CaretRight />
        </button>
      }
    >
      <div className="notices">
        {notices.map(({ tag, title, body }, i) => (
          <button
            key={title}
            onClick={() => openModal({ type: "notice", tag, title, body })}
          >
            <span className={`tag tag-${i}`}>{tag}</span>
            <span>{title}</span>
            <CaretRight />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function FriendsPanel() {
  const navigate = useNavigate();
  return (
    <Panel
      title="친구 목록"
      action={
        <button className="more" onClick={() => navigate(ROUTES.friends)}>
          더보기 <CaretRight />
        </button>
      }
    >
      <FriendList />
    </Panel>
  );
}

function Encouragement() {
  const { dismissTip } = useAppState().tip;
  return (
    <div className="encouragement">
      <button aria-label="응원 메시지 닫기" onClick={dismissTip}>
        <X />
      </button>
      <Cat weight="duotone" />
      <p>
        오늘도
        <br />
        조금씩,
        <br />잘 하고 있어 !
      </p>
      <Flower />
    </div>
  );
}

/** 로비 화면. 확정 디자인이므로 구조와 클래스 이름을 바꾸지 않는다. */
export default function LobbyPage() {
  const { tip } = useAppState().tip;
  return (
    <>
      <div className="lobby">
        <div className="left-column">
          <ProfilePanel />
          <QuickEnterPanel />
          <div className="daily-note">
            <span className="note-pin" />
            <p>오늘의 한마디</p>
            <strong>
              꾸준히 하는
              <br />
              네가 멋있다 !
            </strong>
            <Cat weight="duotone" />
          </div>
        </div>
        <div className="center-column">
          <div className="date-card">
            10
            <br />
            <strong>14</strong>
            <span>TUE</span>
          </div>
          <div className="speech">
            오늘도 화이팅 ! <span>♥</span>
          </div>
        </div>
        <div className="right-column">
          <TasksPanel />
          <NoticesPanel />
          <FriendsPanel />
        </div>
      </div>
      {tip && <Encouragement />}
      <PendingSettlementPopup />
    </>
  );
}
