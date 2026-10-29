import { Link, Navigate } from "react-router-dom";
import { ROUTES } from "../../shell/model/paths";
import { useSession } from "../viewmodel/SessionContext";
import { useSignIn } from "../viewmodel/useAccount";
import AuthFrame from "./AuthFrame";

/** 로그인 화면. 이미 로그인했으면 로비로 보낸다 (화면 이름이 없으면 접근 제어가 이름 설정으로 보낸다). */
export default function LoginPage() {
  const session = useSession();
  const { signIn, pending, failed } = useSignIn();
  if (session) return <Navigate to={ROUTES.lobby} replace />;
  return (
    <AuthFrame title="로그인">
      <h2>모여공부에 오신 걸 환영해요</h2>
      <p>Google 계정으로 로그인하고 함께 공부해요.</p>
      <button
        className="primary"
        onClick={signIn}
        disabled={pending || session === undefined}
      >
        Google로 로그인
      </button>
      {failed && <p role="alert">로그인을 시작하지 못했어요. 다시 시도해 주세요.</p>}
      <p className="muted">
        <Link to={ROUTES.privacy}>개인정보 처리방침</Link>
      </p>
    </AuthFrame>
  );
}
