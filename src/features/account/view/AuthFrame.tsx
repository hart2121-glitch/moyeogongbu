import type { ReactNode } from "react";
import Panel from "../../shell/view/Panel";
import "./authFrame.css";

/**
 * 로그인 전후 단계(로그인, 첫 화면 이름 설정)의 가운데 정렬 패널. 앱 틀과 로비는 보이지 않는다.
 * 집 현관처럼 벽지와 마루 위에 놓이고(authFrame.css), scene은 패널 위에 그리는 장면(예: 환영 화면의 방문 문패)이다.
 * @example <AuthFrame title="로그인">...</AuthFrame>
 */
export default function AuthFrame({
  title,
  children,
  scene,
}: {
  title: string;
  children: ReactNode;
  scene?: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-stack">
        {scene}
        <Panel title={title} className="modal">
          {children}
        </Panel>
      </div>
    </main>
  );
}
