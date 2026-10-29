import PageFrame from "../../shell/view/PageFrame";
import { GUIDE_STEPS } from "../model/guide";

export default function GuidePage() {
  return (
    <PageFrame title="가이드">
      <div className="guide">
        <h1>모여공부에 오신 걸 환영해요</h1>
        {GUIDE_STEPS.map(([n, t, d]) => (
          <div key={n}>
            <strong>{n}</strong>
            <section>
              <h2>{t}</h2>
              <p>{d}</p>
            </section>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
