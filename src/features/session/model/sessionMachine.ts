import type { SessionConfig } from "./sessionConfig";

/**
 * 공부 세션 상태 기계 (Story 002). 서버나 브라우저 없이 동작하는 순수 함수다.
 * 시각은 모두 서버 기준 밀리초이고 호출하는 쪽이 넣어 준다.
 * 노드 테스트가 이 파일을 바로 불러오므로 실행 시점 import는 두지 않는다 (설정은 인자로 받는다).
 */

/** 서버에 기록되는 상태. studying일 때만 공부 시간으로 센다. */
export type ServerState = "studying" | "break" | "away" | "left";

/** 답을 기다리는 안내. checkIn은 60분 체크인, pomodoroEnd는 뽀모도로 공부 종료 알림. */
export interface SessionPrompt {
  kind: "checkIn" | "pomodoroEnd";
  shownAt: number;
}

export interface Pomodoro {
  studyMs: number;
  breakMs: number;
  phase: "study" | "break";
  phaseEndsAt: number;
}

export interface SessionMachineState {
  seated: boolean;
  left: boolean;
  /** 자리 비움이면 확인 문구를 띄웠던 시각 (공부 시간은 여기서 끊긴다). */
  awaySince: number | null;
  prompt: SessionPrompt | null;
  lastInputAt: number;
  pomodoro: Pomodoro | null;
}

export type SessionEvent =
  | { type: "seat"; now: number }
  | { type: "unseat"; now: number }
  | { type: "leave"; now: number }
  | { type: "input"; now: number }
  | { type: "respond"; now: number }
  | { type: "tick"; now: number }
  | { type: "startPomodoro"; now: number; studyMinutes: number; breakMinutes: number }
  | { type: "stopPomodoro"; now: number };

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const KST_OFFSET = 9 * HOUR;

/**
 * 처음 상태: 방에 들어왔지만 아직 앉지 않았다.
 * @example let s = initialSessionState(Date.now());
 */
export function initialSessionState(now: number): SessionMachineState {
  return { seated: false, left: false, awaySince: null, prompt: null, lastInputAt: now, pomodoro: null };
}

/**
 * 서버에 보낼 상태. 뽀모도로 휴식 중에는 앉아 있어도 break.
 * @example serverStateOf(s) === "studying"
 */
export function serverStateOf(state: SessionMachineState): ServerState {
  if (state.left) return "left";
  if (state.awaySince !== null) return "away";
  if (state.seated && state.pomodoro?.phase !== "break") return "studying";
  return "break";
}

/**
 * 직접 설정 공부 시간을 검사한다. 범위를 벗어나거나 정수가 아니면 null.
 * @example validCustomMinutes(30, SESSION_CONFIG) // 30
 */
export function validCustomMinutes(value: number, config: SessionConfig): number | null {
  const { min, max } = config.customStudyMinutes;
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function restartPomodoro(p: Pomodoro, now: number): Pomodoro {
  return { ...p, phase: "study", phaseEndsAt: now + p.studyMs };
}

/** 시간이 흐른 만큼 응답 대기, 뽀모도로 단계, 체크인을 처리한다. */
function advance(state: SessionMachineState, now: number, config: SessionConfig): SessionMachineState {
  let next = state;
  // 응답 대기 시간이 지나면 자리 비움. 뽀모도로 단계 전환보다 먼저 본다.
  if (next.prompt && now - next.prompt.shownAt >= config.responseWaitMs) {
    next = { ...next, awaySince: next.prompt.shownAt, prompt: null };
  }
  if (next.pomodoro && next.awaySince === null && !next.left) {
    let p = next.pomodoro;
    let prompt = next.prompt;
    while (now >= p.phaseEndsAt) {
      if (p.phase === "study") {
        prompt = { kind: "pomodoroEnd", shownAt: p.phaseEndsAt };
        p = { ...p, phase: "break", phaseEndsAt: p.phaseEndsAt + p.breakMs };
      } else {
        p = { ...p, phase: "study", phaseEndsAt: p.phaseEndsAt + p.studyMs };
      }
      // 오래 멈춰 있던 탭: 지난 알림의 대기 시간도 이미 지났으면 자리 비움으로 끝낸다.
      if (prompt && now - prompt.shownAt >= config.responseWaitMs) {
        return { ...next, pomodoro: p, prompt: null, awaySince: prompt.shownAt };
      }
    }
    if (p !== next.pomodoro) next = { ...next, pomodoro: p, prompt };
  }
  if (
    !next.pomodoro &&
    !next.prompt &&
    next.seated &&
    next.awaySince === null &&
    !next.left &&
    now - next.lastInputAt >= config.checkInAfterMs
  ) {
    next = { ...next, prompt: { kind: "checkIn", shownAt: now } };
  }
  return next;
}

/**
 * 사건 하나를 적용한 새 상태를 돌려준다. 입력 상태는 바꾸지 않는다.
 * @example s = sessionReducer(s, { type: "seat", now }, SESSION_CONFIG);
 */
export function sessionReducer(
  state: SessionMachineState,
  event: SessionEvent,
  config: SessionConfig,
): SessionMachineState {
  const now = event.now;
  const s = advance(state, now, config);
  const withoutCheckIn = s.prompt?.kind === "checkIn" ? null : s.prompt;
  switch (event.type) {
    case "tick":
      return s;
    case "seat":
      // 다시 앉으면 자리 비움이 풀리고 체크인 시계도 새로 시작한다.
      return {
        ...s,
        seated: true,
        left: false,
        awaySince: null,
        lastInputAt: now,
        prompt: withoutCheckIn,
        pomodoro: s.awaySince !== null && s.pomodoro ? restartPomodoro(s.pomodoro, now) : s.pomodoro,
      };
    case "unseat":
      return { ...s, seated: false, prompt: withoutCheckIn };
    case "leave":
      return { ...s, seated: false, left: true, prompt: null, pomodoro: null, awaySince: null };
    case "input":
      return s.prompt ? s : { ...s, lastInputAt: now };
    case "respond":
      if (s.awaySince !== null) {
        return {
          ...s,
          awaySince: null,
          lastInputAt: now,
          pomodoro: s.pomodoro ? restartPomodoro(s.pomodoro, now) : null,
        };
      }
      return { ...s, prompt: null, lastInputAt: now };
    case "startPomodoro":
      return {
        ...s,
        prompt: withoutCheckIn,
        lastInputAt: now,
        pomodoro: {
          studyMs: event.studyMinutes * MINUTE,
          breakMs: event.breakMinutes * MINUTE,
          phase: "study",
          phaseEndsAt: now + event.studyMinutes * MINUTE,
        },
      };
    case "stopPomodoro":
      return {
        ...s,
        lastInputAt: now,
        pomodoro: null,
        prompt: s.prompt?.kind === "pomodoroEnd" ? null : s.prompt,
      };
  }
}

/**
 * 시각이 속한 공부 날짜의 시작 시각 (한국 시간 오전 5시). 한국은 일광 절약 시간이 없어 +9시간 고정이다.
 * @example dayStartOf(Date.parse("2026-10-30T19:30:00Z"), SESSION_CONFIG) // Date.parse("2026-10-30T20:00:00Z") - 하루
 */
export function dayStartOf(now: number, config: SessionConfig): number {
  const shift = KST_OFFSET - config.dayBoundaryHourKst * HOUR;
  return Math.floor((now + shift) / DAY) * DAY - shift;
}

/**
 * 오늘 공부한 초. 서버가 준 오늘의 닫힌 구간 합계에, 열린 구간 중 오늘 경계 이후 부분을 더한다.
 * @example todaySeconds({ closedSeconds: 60, openSince: now - 5000 }, now, SESSION_CONFIG) // 65
 */
export function todaySeconds(
  totals: { closedSeconds: number; openSince: number | null },
  now: number,
  config: SessionConfig,
): number {
  if (totals.openSince === null) return totals.closedSeconds;
  const from = Math.max(totals.openSince, dayStartOf(now, config));
  return totals.closedSeconds + Math.max(0, Math.floor((now - from) / 1000));
}
