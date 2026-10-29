import { BookOpen, Users } from "@phosphor-icons/react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "../../shell/model/paths";
import PageFrame from "../../shell/view/PageFrame";
import { useThemeRoomRoute } from "../viewmodel/useRoomRoutes";

/** `/themes/:theme`: 학교와 카페 자리의 테마 둘러보기 화면. */
export default function ThemeRoomPage() {
  const theme = useThemeRoomRoute();
  if (!theme) return <Navigate to={ROUTES.rooms} replace />;
  return (
    <PageFrame title={`${theme.name} 테마 스터디룸`}>
      <div className="room-content">
        <span className="eyebrow">MY STUDY SPACE</span>
        <h1>{theme.heading}</h1>
        <p>
          {theme.name} 테마 스터디룸에 입장했어요. 편안하게 공부를 시작해
          보세요.
        </p>
        <div className={`room-art ${theme.art}`} />
        <div className="info-strip">
          <span>
            <Users /> 나 혼자 있는 공간
          </span>
          <span>
            <BookOpen /> 자유 공부
          </span>
        </div>
        <p className="muted">
          첫 번째 버전에서는 테마 화면을 둘러볼 수 있어요.
          <br />
          실시간 함께 공부하기는 다음 단계에서 만나요.
        </p>
      </div>
    </PageFrame>
  );
}
