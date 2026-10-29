/**
 * 공부 세션 수치 설정 (Story 002, `design/game-brief.md` "세션과 보상").
 * 하루 경계와 끊김 유예는 DB 마이그레이션 `*_study_sessions.sql`과 같아야 한다.
 */
export interface SessionConfig {
  /** 앱 안 입력이 이 시간 동안 없으면 체크인 문구를 띄운다. */
  checkInAfterMs: number;
  /** 체크인이나 뽀모도로 종료 알림에 이 시간 안에 답이 없으면 자리 비움. */
  responseWaitMs: number;
  /** 뽀모도로 프리셋 (분). */
  pomodoroPresets: readonly { id: string; studyMinutes: number; breakMinutes: number }[];
  /** 직접 설정 공부 시간 범위 (분). */
  customStudyMinutes: { min: number; max: number };
  /** 직접 설정할 때의 휴식 시간 (분). */
  customBreakMinutes: number;
  /** 하루가 바뀌는 한국 시간 (시). */
  dayBoundaryHourKst: number;
  /** 연결이 끊겨도 측정을 이어 주는 시간. 서버 RPC가 판정한다. */
  disconnectGraceMs: number;
  /** 서버에 살아 있음을 알리는 간격. 유예보다 충분히 짧아야 한다. */
  heartbeatMs: number;
  /** 입력 감지를 모델에 전달하는 최소 간격. */
  inputThrottleMs: number;
}

const MINUTE = 60_000;

export const SESSION_CONFIG: SessionConfig = {
  checkInAfterMs: 60 * MINUTE,
  responseWaitMs: 5 * MINUTE,
  pomodoroPresets: [
    { id: "25-5", studyMinutes: 25, breakMinutes: 5 },
    { id: "50-10", studyMinutes: 50, breakMinutes: 10 },
  ],
  customStudyMinutes: { min: 20, max: 60 },
  customBreakMinutes: 5,
  dayBoundaryHourKst: 5,
  disconnectGraceMs: 2 * MINUTE,
  heartbeatMs: 30_000,
  inputThrottleMs: 5_000,
};
