import { ClipboardText, Coins, Timer } from "@phosphor-icons/react";
import { countDone } from "../../todos/model/tasks";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { formatDuration } from "../model/records";
import { useRecords } from "../viewmodel/useRecords";
import WeekBars from "./WeekBars";
import YearCalendar from "./YearCalendar";

/** 공부 기록 (`/records`). 본인 기록만 보이고 다른 사람과 비교하지 않는다. */
export default function RecordsPage() {
  const { tasks, modal } = useAppState();
  const records = useRecords();
  const openDay = (day: string) => modal.openModal({ type: "day", day });
  return (
    <PageFrame title="공부 기록">
      <div className="page-intro">
        <span className="eyebrow">ONE STEP EVERY DAY</span>
        <h1>작은 하루가 모여 큰 걸음으로</h1>
        <p>이 기록은 나만 볼 수 있어요. 하루는 한국 시간 오전 5시에 바뀌어요.</p>
      </div>
      <div className="record-grid record-today" data-testid="records-today">
        <div>
          <Timer />
          <strong>{records.loading ? "..." : formatDuration(records.today.seconds)}</strong>
          <span>오늘 공부 시간</span>
        </div>
        <div>
          <Coins />
          <strong>{records.loading ? "..." : records.today.coins}</strong>
          <span>오늘 받은 코인</span>
        </div>
        <div>
          <ClipboardText />
          <strong>
            {countDone(tasks.tasks)} / {tasks.tasks.length}
          </strong>
          <span>완료한 오늘의 할 일</span>
        </div>
      </div>
      {records.failed ? (
        <p className="records-message" role="alert">
          기록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.
        </p>
      ) : (
        <>
          <section className="records-section" aria-labelledby="records-week">
            <h2 id="records-week">최근 7일</h2>
            <p className="muted">막대를 누르면 그날 기록을 볼 수 있어요.</p>
            <WeekBars days={records.week} today={records.todayKey} onPick={openDay} />
          </section>
          <section className="records-section" aria-labelledby="records-year">
            <h2 id="records-year">1년 공부 달력</h2>
            <p className="muted">칸을 누르면 그날 기록을 볼 수 있어요.</p>
            <YearCalendar days={records.year} today={records.todayKey} onPick={openDay} />
          </section>
        </>
      )}
    </PageFrame>
  );
}
