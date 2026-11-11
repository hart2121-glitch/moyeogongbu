import { useState } from "react";
import { useSession } from "../../account/viewmodel/SessionContext";
import { carryOverAsked, markCarryOverAsked, type DayFlagStorage } from "../model/carryOver";
import { addDays, todayKey } from "../model/studyDay";
import { useDayTodos } from "./useDayTodos";

const memory = new Map<string, string>();

/**
 * 브라우저 저장소. 막혀 있으면(사생활 보호 창, 쿠키 차단) `window.localStorage`를 읽기만 해도 오류가 나므로,
 * 그때는 이번 방문 동안만 기억해 같은 날 다시 묻지 않는다.
 */
const storage: DayFlagStorage = {
  getItem: (key) => {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;
    } catch {
      /* 저장소를 쓸 수 없는 브라우저 */
    }
    return memory.get(key) ?? null;
  },
  setItem: (key, value) => {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* 저장소를 쓸 수 없는 브라우저 */
    }
  },
};

/**
 * 새 날 처음 오늘의 할 일을 열 때 어제의 미완료 할 일을 제안할지.
 * 하루에 한 번만 묻는다 (닫든 가져오든 `markAsked` 뒤로는 그날 다시 묻지 않는다).
 * @example const carry = useCarryOverPrompt(); if (carry.shouldAsk) { carry.markAsked(); open(); }
 */
export function useCarryOverPrompt() {
  const userId = useSession()?.user.id;
  const today = todayKey();
  const yesterday = addDays(today, -1);
  const [, setTick] = useState(0);
  const asked = !userId || carryOverAsked(storage, userId, today);
  const previous = useDayTodos(yesterday);
  const undone = previous.tasks.filter((t) => !t.done);
  return {
    shouldAsk: !asked && previous.loaded && undone.length > 0,
    markAsked: () => {
      if (!userId) return;
      markCarryOverAsked(storage, userId, today);
      setTick((n) => n + 1);
    },
  };
}
