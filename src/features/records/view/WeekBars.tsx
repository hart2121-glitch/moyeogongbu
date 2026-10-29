import { dayLabel } from "../../todos/model/studyDay";
import { formatDuration, weekdayLabel, type DayRecord } from "../model/records";

/** 막대 높이의 최소 기준 (1시간). 모두 짧은 날이어도 막대가 꽉 차 보이지 않게 한다. */
const MIN_SCALE_SECONDS = 3_600;

/**
 * 최근 7일 막대그래프. 막대를 누르면 그날 상세를 연다.
 * @example <WeekBars days={week} today={today} onPick={openDay} />
 */
export default function WeekBars({
  days,
  today,
  onPick,
}: {
  days: DayRecord[];
  today: string;
  onPick: (day: string) => void;
}) {
  const scale = Math.max(MIN_SCALE_SECONDS, ...days.map((d) => d.seconds));
  return (
    <div className="week-bars" role="group" aria-label="최근 7일 공부 시간">
      {days.map((d) => (
        <button
          key={d.day}
          type="button"
          className={`week-bar${d.day === today ? " is-today" : ""}`}
          aria-label={`${dayLabel(d.day)} ${weekdayLabel(d.day)}요일 ${formatDuration(d.seconds)}`}
          onClick={() => onPick(d.day)}
        >
          <span className="week-bar-value">{formatDuration(d.seconds)}</span>
          <span className="week-bar-track">
            <span className="week-bar-fill" style={{ height: `${Math.round((d.seconds / scale) * 100)}%` }} />
          </span>
          <span className="week-bar-day">{d.day === today ? "오늘" : weekdayLabel(d.day)}</span>
        </button>
      ))}
    </div>
  );
}
