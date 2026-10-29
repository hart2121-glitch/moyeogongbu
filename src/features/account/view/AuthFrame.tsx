import type { ReactNode } from "react";
import Panel from "../../shell/view/Panel";

/**
 * 로그인 전후 단계(로그인, 첫 화면 이름 설정)의 가운데 정렬 패널. 앱 틀과 로비는 보이지 않는다.
 * @example <AuthFrame title="로그인">...</AuthFrame>
 */
export default function AuthFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <Panel title={title} className="modal">
        {children}
      </Panel>
    </main>
  );
}
