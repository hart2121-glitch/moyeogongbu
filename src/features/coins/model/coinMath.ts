/**
 * 코인 계산 순수 함수 (Story 003, `design/game-brief.md` "세션과 보상").
 * 적립은 서버(`*_coins.sql`)가 하고, 여기 함수는 서버와 같은 식으로 화면 표시만 계산한다.
 * 수치는 서버 `coin_rules`에서 받은 값을 인자로 받는다 (코드에 수치를 두지 않는다).
 * 노드 테스트가 바로 불러오므로 실행 시점 import는 두지 않는다.
 */

/** 서버 `coin_rules`에서 받은 표시용 규칙. */
export interface CoinRules {
  studyCoinsPerMinute: number;
  studyDailyCoinCap: number;
  pomodoroBonus: number;
  pomodoroMinStudyMinutes: number;
  pomodoroMaxStudyMinutes: number;
  pomodoroDailyMax: number;
  todoCoins: number;
  todoDailyMax: number;
}

/** 하루 코인을 종류별로 나눈 값. */
export interface CoinsByKind {
  study: number;
  pomodoro: number;
  todo: number;
}

/**
 * 하루 공부 초에 해당하는 공부 코인. 다 찬 1분마다 주고, 남은 초는 버리지 않고 같은 날 다음 계산에 남는다.
 * 하루 상한을 넘지 않는다. 서버 식 `least(floor(seconds / 60) * rate, cap)`과 같다.
 * @example studyCoins(3599, rules) // 59
 */
export function studyCoins(seconds: number, rules: CoinRules): number {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  return Math.min(minutes * rules.studyCoinsPerMinute, rules.studyDailyCoinCap);
}

/**
 * 오늘 코인 합계 (화면 표시용). 공부 코인은 지금 흐르는 공부 초로 다시 계산하고, 보너스는 서버 값을 쓴다.
 * @example todayCoins({ study: 10, pomodoro: 5, todo: 4 }, 900, rules) // 15 + 5 + 4
 */
export function todayCoins(server: CoinsByKind, liveSeconds: number, rules: CoinRules): number {
  return studyCoins(liveSeconds, rules) + server.pomodoro + server.todo;
}

/** 서버에 보낼 뽀모도로 보너스 요청. */
export interface PomodoroClaim {
  /** 사이클 공부 단계가 시작된 서버 시각 (밀리초). */
  cycleStartedAt: number;
  studyMinutes: number;
}

/**
 * 뽀모도로 공부 단계가 막 끝났으면 보너스 요청을 만든다. 같은 사이클은 한 번만 (이미 보낸 종료 시각이면 null).
 * 공부 시간이 규칙의 최소보다 짧으면 요청하지 않는다. 서버가 실제 공부 구간과 하루 횟수를 다시 검사한다.
 * @param lastClaimedEnd 지난번에 요청한 사이클의 종료 시각
 * @example nextPomodoroClaim(machine.prompt, machine.pomodoro, sentRef.current, rules)
 */
export function nextPomodoroClaim(
  prompt: { kind: string; shownAt: number } | null,
  pomodoro: { studyMs: number } | null,
  lastClaimedEnd: number | null,
  rules: Pick<CoinRules, "pomodoroMinStudyMinutes" | "pomodoroMaxStudyMinutes">,
): PomodoroClaim | null {
  if (!prompt || prompt.kind !== "pomodoroEnd" || !pomodoro) return null;
  if (prompt.shownAt === lastClaimedEnd) return null;
  const studyMinutes = pomodoro.studyMs / 60_000;
  if (
    !Number.isInteger(studyMinutes) ||
    studyMinutes < rules.pomodoroMinStudyMinutes ||
    studyMinutes > rules.pomodoroMaxStudyMinutes
  ) {
    return null;
  }
  return { cycleStartedAt: prompt.shownAt - pomodoro.studyMs, studyMinutes };
}
