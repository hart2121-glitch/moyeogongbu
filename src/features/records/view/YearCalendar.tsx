import { useRef, useState, type KeyboardEvent } from "react";
import { addDays, dayLabel } from "../../todos/model/studyDay";
import { calendarWeeks, formatDuration, heatLevel, type DayRecord } from "../model/records";
import { RECORDS_CONFIG } from "../model/recordsConfig";

const LEVEL_LABELS = ["0분", "1시간 미만", "1~3시간", "3~6시간", "6시간 이상"];
const WEEKDAY_MARKS = ["월", "", "수", "", "금", "", ""];
const KEY_STEPS: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };

/**
 * 1년 잔디 달력 (월요일 시작 주 열). 칸을 누르면 그날 상세를 연다.
 * 칸은 하나만 Tab으로 들어가고, 화살표로 날짜를 옮긴다.
 * @example <YearCalendar days={year} today={today} onPick={openDay} />
 */
export default function YearCalendar({
  days,
  today,
  onPick,
}: {
  days: DayRecord[];
  today: string;
  onPick: (day: string) => void;
}) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const weeks = calendarWeeks(days[0].day, days[days.length - 1].day);
  const [focusDay, setFocusDay] = useState(today);
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const onKeyDown = (e: KeyboardEvent) => {
    const step = KEY_STEPS[e.key];
    if (!step) return;
    const next = addDays(focusDay, step);
    if (!byDay.has(next)) return;
    e.preventDefault();
    setFocusDay(next);
    cells.current.get(next)?.focus();
  };
  return (
    <div className="year-calendar">
      <div className="year-grid" role="group" aria-label="1년 공부 달력" onKeyDown={onKeyDown}>
        <div className="year-week year-weekdays" aria-hidden="true">
          <span className="year-month" />
          {WEEKDAY_MARKS.map((w, i) => (
            <span key={i} className="year-weekday">
              {w}
            </span>
          ))}
        </div>
        {weeks.map((week, i) => {
          const first = week.find((d) => d !== null && (i === 0 || d.endsWith("-01")));
          return (
            <div key={i} className="year-week">
              <span className="year-month" aria-hidden="true">
                {first ? `${Number(first.slice(5, 7))}월` : ""}
              </span>
              {week.map((day, j) => {
                if (!day) return <span key={j} className="year-cell is-empty" />;
                const record = byDay.get(day)!;
                const label = `${dayLabel(day)} ${formatDuration(record.seconds)}`;
                return (
                  <button
                    key={day}
                    ref={(el) => {
                      if (el) cells.current.set(day, el);
                      else cells.current.delete(day);
                    }}
                    type="button"
                    tabIndex={day === focusDay ? 0 : -1}
                    className={`year-cell heat-${heatLevel(record.seconds, RECORDS_CONFIG)}${day === today ? " is-today" : ""}`}
                    aria-label={label}
                    title={label}
                    onFocus={() => setFocusDay(day)}
                    onClick={() => onPick(day)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <ul className="heat-legend" aria-label="진하기 구간">
        {LEVEL_LABELS.map((label, level) => (
          <li key={label}>
            <span className={`year-cell heat-${level}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
