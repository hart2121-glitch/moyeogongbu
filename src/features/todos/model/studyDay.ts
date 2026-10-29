import { SESSION_CONFIG } from "../../session/model/sessionConfig";
import { studyDayOf } from "./dayMath";

export { addDays, dayLabel, studyDayOf } from "./dayMath";

/** 지금 시각의 공부 날짜 (YYYY-MM-DD, 한국 시간 오전 5시 경계). */
export const todayKey = () => studyDayOf(Date.now(), SESSION_CONFIG.dayBoundaryHourKst);
