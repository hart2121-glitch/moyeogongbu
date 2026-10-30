/** 공부 기록 자료형 (Story 005). */

/** 하루 기록. */
export interface DayRecord {
  /** 공부 날짜 (YYYY-MM-DD, 오전 5시 경계). */
  day: string;
  seconds: number;
  /** 그날 받은 코인 (공부, 뽀모도로, 할 일). */
  coins: number;
  todosDone: number;
}

/** 날짜 상세. */
export interface DayDetail {
  day: string;
  studySeconds: number;
  coins: { study: number; pomodoro: number; todo: number };
  total: number;
  /** 그날 완료한 할 일 글자, 만든 순서. */
  todosDone: string[];
}
