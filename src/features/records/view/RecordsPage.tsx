import { BookOpen, ClipboardText, Flower } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { countDone } from "../../lobby/model/tasks";
import { ROUTES } from "../../shell/model/paths";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";

export default function RecordsPage() {
  const navigate = useNavigate();
  const { tasks } = useAppState().tasks;
  return (
    <PageFrame title="공부 기록">
      <div className="page-intro">
        <span className="eyebrow">ONE STEP EVERY DAY</span>
        <h1>작은 하루가 모여 큰 걸음으로</h1>
        <p>오늘의 체크리스트부터 차근차근 시작해요.</p>
      </div>
      <div className="record-grid">
        <div>
          <ClipboardText />
          <strong>
            {countDone(tasks)} / {tasks.length}
          </strong>
          <span>완료한 오늘의 할 일</span>
        </div>
        <div>
          <BookOpen />
          <strong>아직 기록이 없어요</strong>
          <span>공부 시간 기록은 다음 단계에서 제공해요</span>
        </div>
      </div>
      <div className="empty-state">
        <Flower />
        <h2>첫 기록을 기다리고 있어요</h2>
        <p>
          지금은 할 일을 완료하며 하루의 작은 성취를 확인해 보세요.
        </p>
        <button className="primary" onClick={() => navigate(ROUTES.lobby)}>
          오늘의 할 일 보러 가기
        </button>
      </div>
    </PageFrame>
  );
}
