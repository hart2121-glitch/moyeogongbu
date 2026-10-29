import PageFrame from "../../shell/view/PageFrame";
import FriendList from "./FriendList";

export default function FriendsPage() {
  return (
    <PageFrame title="친구 목록">
      <div className="page-intro">
        <span className="eyebrow">TOGETHER IS BETTER</span>
        <h1>같이 공부하는 우리</h1>
        <p>친구의 공부 공간을 살펴보세요.</p>
      </div>
      <FriendList expanded />
      <p className="muted">
        현재 친구와 상태는 화면 구성을 위한 예시예요. 친구 추가·메시지는 다음
        단계에서 연결해요.
      </p>
    </PageFrame>
  );
}
