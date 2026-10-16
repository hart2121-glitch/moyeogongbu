import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  House,
  Coffee,
  TShirt,
  Tote,
  ClipboardText,
  Users,
  BookOpen,
  Coin,
  Envelope,
  Bell,
  GearSix,
  X,
  Plus,
  CaretRight,
  PencilSimple,
  Cat,
  Monitor,
  GameController,
  Check,
  ArrowLeft,
  Flower,
  Star,
} from "@phosphor-icons/react";
import "@fontsource/gowun-dodum/400.css";
import "@fontsource/gowun-batang/400.css";
import "@fontsource/gowun-batang/700.css";
import "./styles.css";
import RoomPreview from "./components/RoomPreview";
import { roomPreviews } from "./roomPreviews";
import RoomList from "./study/RoomList";
import CompanyRoom from "./study/CompanyRoom";
import { useRooms } from "./study/useRooms";
import { DEMO_INVITATION } from "./study/rooms";
import "./study/study.css";

const menus = [
  ["스터디룸", House],
  ["공용 스터디카페", Coffee],
  ["캐릭터 꾸미기", TShirt],
  ["상점", Tote],
  ["공부 기록", ClipboardText],
  ["친구 목록", Users],
  ["가이드", BookOpen],
];
const friends = [
  { name: "하늘", status: "공부 중", place: "회사 테마 · 1층", icon: Monitor },
  {
    name: "지우",
    status: "스터디카페 · 2층",
    place: "스터디카페 · 2층",
    icon: Coffee,
  },
  {
    name: "도윤",
    status: "휴식 중",
    place: "잠시 쉬고 있어요",
    icon: GameController,
  },
];
const notices = [
  ["이벤트", "10월 출석 이벤트가 시작되었어요!"],
  ["업데이트", "새로운 가구가 추가되었어요!"],
  ["안내", "서비스 이용 수칙을 확인해 주세요."],
  ["이벤트", "스터디카페 확장 오픈!"],
];
function Panel({ title, children, className = "", action }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <span>
          <Cat size={20} />
          {title}
        </span>
        {action}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
function App() {
  const { rooms, createRoom, storageWarning } = useRooms();
  const [activeCompanyRoom, setActiveCompanyRoom] = useState(null);
  const [page, setPage] = useState("로비");
  const [room, setRoom] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, text: "자소서 쓰기", done: true },
    { id: 2, text: "포트폴리오 정리", done: true },
    { id: 3, text: "면접 후기 정리", done: false },
    { id: 4, text: "운동하기", done: false },
    { id: 5, text: "방 청소하기", done: false },
  ]);
  const [taskInput, setTaskInput] = useState("");
  const [outfit, setOutfit] = useState("라벤더");
  const [selectedOutfit, setSelectedOutfit] = useState("라벤더");
  const [coins, setCoins] = useState(1250);
  const [owned, setOwned] = useState([]);
  const [tip, setTip] = useState(true);
  const [nickname, setNickname] = useState("밍구");
  const [nameInput, setNameInput] = useState("밍구");
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll(
            '[role="dialog"] button:not(:disabled),[role="dialog"] input',
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [modal]);
  const notify = (text) => {
    setToast(text);
    window.clearTimeout(window.moyeogongbuToast);
    window.moyeogongbuToast = window.setTimeout(() => setToast(""), 3500);
  };
  const navigate = (label) => {
    setActiveCompanyRoom(null);
    setPage(label);
    setRoom(null);
  };
  const openCompanyRoom = (studyRoom) => {
    setRoom(null);
    setActiveCompanyRoom(studyRoom);
    setPage("회사 스터디룸");
  };
  const enterRoom = (theme) => {
    if (theme === "회사") {
      openCompanyRoom(
        rooms.find((r) => r.kind === "owned") || rooms[0] || DEMO_INVITATION,
      );
      return;
    }
    setRoom(theme);
    setPage("스터디룸");
  };
  const addTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: taskInput.trim(), done: false },
    ]);
    setTaskInput("");
    setModal(null);
  };
  const buy = (item, cost) => {
    if (owned.includes(item)) return;
    if (coins < cost) {
      notify("코인이 부족해요. 다음에 다시 들러 주세요!");
      return;
    }
    setCoins(coins - cost);
    setOwned([...owned, item]);
    notify(`${item} 구매 완료! 보관함에 담았어요.`);
  };
  const FriendList = ({ expanded = false }) => (
    <div className="friend-list">
      {friends.map((f, i) => (
        <button
          className="friend"
          key={f.name}
          onClick={() => setModal({ type: "friend", ...f })}
        >
          <img
            className={`friend-avatar avatar-${i}`}
            src="/assets/avatar.png"
            alt=""
          />
          <strong>{f.name}</strong>
          <span className={`presence ${i === 2 ? "away" : ""}`} />
          <span className="friend-status">
            {expanded ? f.place : f.status} …
          </span>
          <f.icon size={27} />
        </button>
      ))}
    </div>
  );
  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate("로비")}
          aria-label="모여공부 로비"
        >
          <Cat weight="duotone" />
          <span>모여공부</span>
        </button>
        <div className="top-actions">
          <span className="wallet">
            <Coin weight="duotone" />
            {coins.toLocaleString()}
          </span>
          <button aria-label="우편함" onClick={() => setModal("mail")}>
            <Envelope />
          </button>
          <button
            className="notification"
            aria-label="알림"
            onClick={() => setModal("notifications")}
          >
            <Bell />
            <i />
          </button>
          <button aria-label="설정" onClick={() => setModal("settings")}>
            <GearSix />
          </button>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <nav aria-label="주 메뉴">
            {menus.map(([label, Icon]) => (
              <button
                key={label}
                className={`nav-item ${page === label || (["로비", "회사 스터디룸"].includes(page) && label === "스터디룸") ? "active" : ""}`}
                aria-current={page === label ? "page" : undefined}
                onClick={() => navigate(label)}
              >
                <Icon weight="duotone" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <Flower /> 함께라서 더 좋은 공부
          </div>
        </aside>
        <main className="scene">
          <div className="scene-shade" />
          {page === "회사 스터디룸" && activeCompanyRoom ? (
            <CompanyRoom
              key={activeCompanyRoom.id}
              room={activeCompanyRoom}
              nickname={nickname}
              onExit={() => navigate("로비")}
            />
          ) : page === "로비" && !room ? (
            <div className="lobby">
              <div className="left-column">
                <Panel title="내 프로필" className="profile-panel">
                  <div className="profile-main">
                    <img
                      className={`profile-avatar outfit-${outfit}`}
                      src="/assets/avatar.png"
                      alt="보라색 리본을 단 밍구 캐릭터"
                    />
                    <div className="profile-info">
                      <div className="profile-name">
                        <h1>{nickname}</h1>
                        <button
                          aria-label="프로필 수정"
                          onClick={() => {
                            setNameInput(nickname);
                            setModal("profile");
                          }}
                        >
                          <PencilSimple />
                        </button>
                      </div>
                      <div className="profile-coins">
                        <Coin weight="duotone" />
                        {coins.toLocaleString()}
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
                <Panel title="빠른 입장하기" className="quick-panel">
                  <div className="theme-grid">
                    <button
                      className="theme-card"
                      aria-label="회사 테마로 가기"
                      onClick={() => enterRoom("회사")}
                    >
                      <RoomPreview preview={roomPreviews.office} />
                      <span>
                        <Tote weight="duotone" /> 회사 테마로 가기
                      </span>
                    </button>
                    <button
                      className="theme-card"
                      aria-label="학교 테마로 가기"
                      onClick={() => enterRoom("학교")}
                    >
                      <RoomPreview preview={roomPreviews.school} />
                      <span>
                        <BookOpen weight="duotone" /> 학교 테마로 가기
                      </span>
                    </button>
                  </div>
                  <button
                    className="cafe-button"
                    onClick={() => navigate("공용 스터디카페")}
                  >
                    <Coffee weight="duotone" /> 공용 스터디카페 가기
                    <CaretRight />
                  </button>
                </Panel>
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
                <Panel
                  title="오늘의 할 일"
                  className="tasks-panel"
                  action={
                    <button
                      className="add-task"
                      aria-label="할 일 추가"
                      onClick={() => setModal("task")}
                    >
                      <Plus />
                    </button>
                  }
                >
                  <ul className="task-list">
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() =>
                              setTasks(
                                tasks.map((t) =>
                                  t.id === task.id
                                    ? { ...t, done: !t.done }
                                    : t,
                                ),
                              )
                            }
                          />
                          <span>{task.text}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <Cat className="task-mascot" />
                </Panel>
                <Panel
                  title="최근 공지사항"
                  action={
                    <button
                      className="more"
                      onClick={() => setModal("notices")}
                    >
                      더보기 <CaretRight />
                    </button>
                  }
                >
                  <div className="notices">
                    {notices.map(([tag, title], i) => (
                      <button
                        key={title}
                        onClick={() => setModal({ type: "notice", tag, title })}
                      >
                        <span className={`tag tag-${i}`}>{tag}</span>
                        <span>{title}</span>
                        <CaretRight />
                      </button>
                    ))}
                  </div>
                </Panel>
                <Panel
                  title="친구 목록"
                  action={
                    <button
                      className="more"
                      onClick={() => navigate("친구 목록")}
                    >
                      더보기 <CaretRight />
                    </button>
                  }
                >
                  <FriendList />
                </Panel>
              </div>
            </div>
          ) : (
            <div className="page-area">
              <button className="back-button" onClick={() => navigate("로비")}>
                <ArrowLeft /> 로비로 돌아가기
              </button>
              <Panel
                title={room ? `${room} 테마 스터디룸` : page}
                className="content-panel"
              >
                {page === "스터디룸" && !room ? (
                  <RoomList
                    rooms={rooms}
                    createRoom={createRoom}
                    storageWarning={storageWarning}
                    onEnter={openCompanyRoom}
                  />
                ) : room ? (
                  <div className="room-content">
                    <span className="eyebrow">MY STUDY SPACE</span>
                    <h1>
                      {room === "회사"
                        ? "차분하게, 오늘의 목표를 향해"
                        : "다시 펼치는 나만의 공부 시간"}
                    </h1>
                    <p>
                      {room} 테마 스터디룸에 입장했어요. 편안하게 공부를 시작해
                      보세요.
                    </p>
                    <div
                      className={`room-art ${room === "학교" ? "school" : ""}`}
                    />
                    <div className="info-strip">
                      <span>
                        <Users /> 나 혼자 있는 공간
                      </span>
                      <span>
                        <BookOpen /> 자유 공부
                      </span>
                    </div>
                    <p className="muted">
                      첫 번째 버전에서는 테마 화면을 둘러볼 수 있어요.
                      <br />
                      실시간 함께 공부하기는 다음 단계에서 만나요.
                    </p>
                  </div>
                ) : page === "공용 스터디카페" ? (
                  <>
                    <div className="page-intro">
                      <span className="eyebrow">STUDY TOGETHER</span>
                      <h1>함께라서, 조금 더 집중되는 곳</h1>
                      <p>오늘의 마음에 맞는 자리를 골라 보세요.</p>
                    </div>
                    <div className="cafe-rooms">
                      {["창가 자리", "조용한 서재", "초록 정원"].map(
                        (name, i) => (
                          <button
                            className="cafe-room"
                            key={name}
                            onClick={() => enterRoom(name)}
                          >
                            <div className={`room-thumbnail room-${i}`} />
                            <h2>{name}</h2>
                            <p>자유 공부 · 테마 미리보기</p>
                            <span>
                              자리 둘러보기 <CaretRight />
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                    <p className="muted">
                      실시간 접속 인원과 채팅은 아직 연결되지 않았어요.
                    </p>
                  </>
                ) : page === "캐릭터 꾸미기" ? (
                  <>
                    <div className="page-intro">
                      <span className="eyebrow">MY LITTLE CHARACTER</span>
                      <h1>오늘은 어떤 분위기로 공부할까?</h1>
                      <p>좋아하는 색을 골라 나만의 캐릭터를 꾸며 보세요.</p>
                    </div>
                    <div className="customizer">
                      <div className="avatar-preview">
                        <img
                          className={`outfit-${selectedOutfit}`}
                          src="/assets/avatar.png"
                          alt={`${selectedOutfit} 캐릭터 미리보기`}
                        />
                        <strong>{nickname}</strong>
                        <span>{selectedOutfit} 스타일</span>
                      </div>
                      <div className="wardrobe">
                        <h2>내 스타일</h2>
                        <div className="outfit-options">
                          {["라벤더", "세이지", "로즈"].map((o) => (
                            <button
                              key={o}
                              aria-pressed={selectedOutfit === o}
                              className={selectedOutfit === o ? "selected" : ""}
                              onClick={() => setSelectedOutfit(o)}
                            >
                              <img
                                className={`outfit-${o}`}
                                src="/assets/avatar.png"
                                alt=""
                              />
                              {o}
                              {selectedOutfit === o && <Check />}
                            </button>
                          ))}
                        </div>
                        <p className="muted">
                          기본 제공 스타일 · 색상 미리보기
                        </p>
                        <button
                          className="primary"
                          onClick={() => {
                            setOutfit(selectedOutfit);
                            notify(`${selectedOutfit} 스타일을 적용했어요!`);
                          }}
                        >
                          이 스타일로 적용하기
                        </button>
                      </div>
                    </div>
                  </>
                ) : page === "상점" ? (
                  <>
                    <div className="page-intro">
                      <span className="eyebrow">LITTLE JOYS SHOP</span>
                      <h1>공부하는 일상에 작은 선물</h1>
                      <p>
                        차곡차곡 모은 코인으로 마음에 드는 소품을 골라 보세요.
                      </p>
                    </div>
                    <div className="shop-grid">
                      {[
                        ["포근한 고양이 쿠션", Cat, 300],
                        ["따뜻한 머그컵", Coffee, 200],
                        ["반짝이는 별 장식", Star, 450],
                        ["작은 꽃 화분", Flower, 350],
                      ].map(([name, Icon, cost]) => (
                        <div className="shop-item" key={name}>
                          <div className="item-art">
                            <Icon weight="duotone" />
                          </div>
                          <h2>{name}</h2>
                          <span className="price">
                            <Coin />
                            {cost}
                          </span>
                          <button
                            className="primary"
                            disabled={owned.includes(name)}
                            onClick={() => buy(name, cost)}
                          >
                            {owned.includes(name)
                              ? "보관함에 있어요"
                              : "구매하기"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="muted">
                      구매는 이번 방문 중에만 유지되는 체험 기능이에요.
                    </p>
                  </>
                ) : page === "공부 기록" ? (
                  <>
                    <div className="page-intro">
                      <span className="eyebrow">ONE STEP EVERY DAY</span>
                      <h1>작은 하루가 모여 큰 걸음으로</h1>
                      <p>오늘의 체크리스트부터 차근차근 시작해요.</p>
                    </div>
                    <div className="record-grid">
                      <div>
                        <ClipboardText />
                        <strong>
                          {tasks.filter((t) => t.done).length} / {tasks.length}
                        </strong>
                        <span>완료한 오늘의 할 일</span>
                      </div>
                      <div>
                        <BookOpen />
                        <strong>아직 기록이 없어요</strong>
                        <span>공부 시간 기록은 다음 단계에서 제공해요</span>
                      </div>
                    </div>
                    <div className="empty-state">
                      <Flower />
                      <h2>첫 기록을 기다리고 있어요</h2>
                      <p>
                        지금은 할 일을 완료하며 하루의 작은 성취를 확인해
                        보세요.
                      </p>
                      <button
                        className="primary"
                        onClick={() => navigate("로비")}
                      >
                        오늘의 할 일 보러 가기
                      </button>
                    </div>
                  </>
                ) : page === "친구 목록" ? (
                  <>
                    <div className="page-intro">
                      <span className="eyebrow">TOGETHER IS BETTER</span>
                      <h1>같이 공부하는 우리</h1>
                      <p>친구의 공부 공간을 살펴보세요.</p>
                    </div>
                    <FriendList expanded />
                    <p className="muted">
                      현재 친구와 상태는 화면 구성을 위한 예시예요. 친구
                      추가·메시지는 다음 단계에서 연결해요.
                    </p>
                  </>
                ) : (
                  <div className="guide">
                    <h1>모여공부에 오신 걸 환영해요</h1>
                    {[
                      [
                        "01",
                        "마음에 드는 공간 고르기",
                        "빠른 입장에서 회사나 학교 테마를 둘러보세요.",
                      ],
                      [
                        "02",
                        "오늘의 할 일 적기",
                        "로비 오른쪽 + 버튼으로 할 일을 추가하고, 완료하면 체크해요.",
                      ],
                      [
                        "03",
                        "나만의 모습 꾸미기",
                        "캐릭터 꾸미기에서 색을 고르고 적용해 보세요.",
                      ],
                    ].map(([n, t, d]) => (
                      <div key={n}>
                        <strong>{n}</strong>
                        <section>
                          <h2>{t}</h2>
                          <p>{d}</p>
                        </section>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          )}
          {tip && page === "로비" && !room && (
            <div className="encouragement">
              <button
                aria-label="응원 메시지 닫기"
                onClick={() => setTip(false)}
              >
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
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check />
          {toast}
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
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
                {typeof modal === "object"
                  ? modal.type === "friend"
                    ? "친구 프로필"
                    : modal.tag
                  : {
                      task: "오늘의 할 일 추가",
                      profile: "프로필 수정",
                      mail: "우편함",
                      notifications: "알림",
                      settings: "설정",
                      notices: "최근 공지사항",
                    }[modal]}
              </span>
              <button
                aria-label="닫기"
                onClick={() => setModal(null)}
                autoFocus
              >
                <X />
              </button>
            </div>
            <div className="panel-body">
              {modal === "task" ? (
                <form onSubmit={addTask}>
                  <label htmlFor="task">오늘 하고 싶은 일</label>
                  <input
                    id="task"
                    maxLength={40}
                    required
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="작은 목표를 적어 주세요"
                  />
                  <button className="primary">추가하기</button>
                </form>
              ) : modal === "profile" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!nameInput.trim()) return;
                    setNickname(nameInput.trim());
                    setModal(null);
                  }}
                >
                  <label htmlFor="nickname">닉네임</label>
                  <input
                    id="nickname"
                    required
                    maxLength={12}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                  <button className="primary">저장하기</button>
                </form>
              ) : modal === "notices" ? (
                <div className="notice-details">
                  {notices.map(([tag, title]) => (
                    <article key={title}>
                      <span className="tag">{tag}</span>
                      <h2>{title}</h2>
                      <p>
                        모여공부의 새로운 소식을 기다려 주세요. 현재는 첫 버전의
                        예시 공지입니다.
                      </p>
                    </article>
                  ))}
                </div>
              ) : typeof modal === "object" ? (
                modal.type === "friend" ? (
                  <div className="friend-detail">
                    <img src="/assets/avatar.png" alt="친구 캐릭터" />
                    <h2>{modal.name}</h2>
                    <p>{modal.place}</p>
                    <p className="muted">
                      친구 프로필 예시입니다. 실시간 친구 기능은 준비 중이에요.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2>{modal.title}</h2>
                    <p>모여공부에 오신 걸 환영해요!</p>
                    <p className="muted">
                      이 공지는 화면 구성을 위한 예시입니다. 실제 이벤트와
                      업데이트는 앞으로 만나요.
                    </p>
                  </>
                )
              ) : modal === "settings" ? (
                <>
                  <h2>편안한 공부를 위한 설정</h2>
                  <p>현재 버전은 소리 없이 사용할 수 있어요.</p>
                  <p className="muted">
                    로그인 없이 체험하는 첫 버전으로, 변경한 정보는 새로고침하면
                    초기화됩니다.
                  </p>
                </>
              ) : (
                <div className="empty-state">
                  <Envelope />
                  <h2>
                    {modal === "mail"
                      ? "도착한 편지가 없어요"
                      : "새로운 알림이 없어요"}
                  </h2>
                  <p>오늘도 나만의 속도로 공부해 보세요.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
