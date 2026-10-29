import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../../shell/model/paths";
import { useAccountStatus } from "../viewmodel/useAccount";
import AuthFrame from "./AuthFrame";

/**
 * 로그인이 필요한 화면의 접근 제어 레이아웃 라우트.
 * 로그아웃 상태면 `/login`, 화면 이름이 없으면 `/welcome`, 이름이 있으면 하위 화면을 연다.
 */
export default function RequireAccount() {
  const { status, retry } = useAccountStatus();
  const onWelcome = useLocation().pathname === ROUTES.welcome;
  if (status === "loading") return null;
  if (status === "signedOut") return <Navigate to={ROUTES.login} replace />;
  if (status === "error") {
    return (
      <AuthFrame title="연결 오류">
        <p>프로필을 불러오지 못했어요.</p>
        <button className="primary" onClick={retry}>
          다시 시도하기
        </button>
      </AuthFrame>
    );
  }
  if (status === "needsName" && !onWelcome)
    return <Navigate to={ROUTES.welcome} replace />;
  if (status === "ready" && onWelcome)
    return <Navigate to={ROUTES.lobby} replace />;
  return <Outlet />;
}
