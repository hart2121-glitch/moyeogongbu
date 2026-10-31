import type { ReactNode } from "react";
import Panel from "../../shell/view/Panel";
import "./authFrame.css";

/**
 * 로그인 전후 단계(로그인, 첫 화면 이름 설정)의 틀. 앱 틀과 로비는 보이지 않는다.
 * 벽지와 마루 위에(authFrame.css) 집 현관 장면(scene, EntranceScene)을 액자로 걸고 그 옆에 패널을 둔다. 좁은 화면에서는 위아래로 쌓는다.
 * @example <AuthFrame title="로그인" scene={<EntranceScene sign="모여공부" />}>...</AuthFrame>
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
