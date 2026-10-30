import { useState } from "react";
import { Bell, DoorOpen, Timer } from "@phosphor-icons/react";
import { SESSION_CONFIG } from "../model/sessionConfig";
import { validCustomMinutes } from "../model/sessionMachine";
import type { StudySession } from "../viewmodel/useStudySession";

const STATE_LABEL = {
  studying: "공부 중",
  break: "쉬는 중",
  away: "자리 비움",
  left: "퇴근",
} as const;

const clockText = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const remainingText = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

interface Props {
  session: StudySession;
  /** 캐릭터를 휴게실로 보낸다. 사용자가 버튼을 눌렀을 때만 부른다. */
  onGoLounge: () => void;
  canGoLounge: boolean;
}

/**
 * 회사 방의 공부 세션 툴바 (Story 002). 방 그림 속 타이머와 음악 패널은 정적 그림이고, 실제 시간은 여기에만 표시한다.
 */
export default function StudySessionBar({ session, onGoLounge, canGoLounge }: Props) {
  const [picking, setPicking] = useState(false);
  const [custom, setCustom] = useState(String(SESSION_CONFIG.customStudyMinutes.min));
  const { min, max } = SESSION_CONFIG.customStudyMinutes;
  const customMinutes = validCustomMinutes(Number(custom), SESSION_CONFIG);
  const start = (study: number, rest: number) => {
    session.startPomodoro(study, rest);
    setPicking(false);
  };

  if (session.link === "taken") {
    return (
      <div className="room-error" role="alert" data-testid="session-taken">
        <p>다른 곳에서 접속했어요. 이 화면에서는 공부 시간을 기록하지 않아요.</p>
        <div className="company-controls">
          <button onClick={session.takeBack}>여기서 계속하기</button>
        </div>
      </div>
    );
  }

  const pomodoro = session.pomodoro;
  return (
    <section className="movement-status" aria-label="공부 세션" data-testid="study-session">
      <div className="company-controls">
        <p role="timer" aria-label="오늘 공부 시간" data-testid="today-study-time">
          오늘 공부 <strong>{clockText(session.todaySeconds)}</strong>
        </p>
        <p data-testid="session-state">
          {session.link === "connecting"
            ? "기록 연결 중"
            : session.link === "error"
              ? "기록에 연결하지 못했어요"
              : STATE_LABEL[session.state]}
        </p>
        {pomodoro && (
          <p data-testid="pomodoro-status">
            뽀모도로 {pomodoro.phase === "study" ? "공부" : "휴식"}{" "}
            {remainingText(pomodoro.remainingMs)} 남음
          </p>
        )}
        {pomodoro ? (
          <button onClick={session.stopPomodoro}>
            <Timer /> 뽀모도로 끄기
          </button>
        ) : (
          <button onClick={() => setPicking((v) => !v)} aria-expanded={picking}>
            <Timer /> 뽀모도로
          </button>
        )}
        {session.notificationPermission === "default" && (
          <button onClick={() => void session.requestNotifications()}>
            <Bell /> 알림 받기
          </button>
        )}
      </div>
      {picking && !pomodoro && (
        <div className="company-controls" role="group" aria-label="뽀모도로 선택">
          {SESSION_CONFIG.pomodoroPresets.map((p) => (
            <button key={p.id} onClick={() => start(p.studyMinutes, p.breakMinutes)}>
              {p.studyMinutes}분 공부, {p.breakMinutes}분 휴식
            </button>
          ))}
          <label>
            직접 설정 (공부 {min}~{max}분){" "}
            <input
              type="number"
              min={min}
              max={max}
              step={1}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </label>
          <button
            disabled={customMinutes === null}
            onClick={() => customMinutes && start(customMinutes, SESSION_CONFIG.customBreakMinutes)}
          >
            {customMinutes ?? min}분 공부, {SESSION_CONFIG.customBreakMinutes}분 휴식 시작
          </button>
        </div>
      )}
      {session.prompt && (
        <div className="room-created" role="alertdialog" aria-label="안부 확인" data-testid="session-prompt">
          <p>{session.promptText}</p>
          <div className="company-controls">
            {session.prompt.kind === "pomodoroEnd" && (
              <button onClick={onGoLounge} disabled={!canGoLounge}>
                <DoorOpen /> 휴게실로 가기
              </button>
            )}
            <button onClick={session.respond}>
              {session.prompt.kind === "checkIn" ? "계속할게요" : "확인했어요"}
            </button>
          </div>
        </div>
      )}
      {session.state === "away" && !session.prompt && (
        <div className="room-created" role="status" data-testid="session-away">
          <p>잠시 자리를 비운 것 같아 공부 시간을 멈췄어요.</p>
          <div className="company-controls">
            <button onClick={session.respond}>다시 공부하기</button>
          </div>
        </div>
      )}
    </section>
  );
}
