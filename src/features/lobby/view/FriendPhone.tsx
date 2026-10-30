import { CaretRight, Cat, UserPlus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import FriendList from "../../friends/view/FriendList";
import { useFriends } from "../../friends/viewmodel/useFriends";
import { ROUTES } from "../../shell/model/paths";
import DeskObject, { type LookHandler } from "./DeskObject";

/** 휴대폰: 친구 목록과 지금 상태. 친구가 없으면 친구 코드로 추가하는 곳으로 안내한다. */
export default function FriendPhone({ onLook }: { onLook: LookHandler }) {
  const query = useFriends();
  const empty = query.isSuccess && (query.data ?? []).length === 0;
  return (
    <DeskObject
      kind="phone"
      title="친구 목록"
      onLook={onLook}
      footer={
        !empty && (
          <Link className="desk-more" to={ROUTES.friends}>
            친구 목록 전체 보기 <CaretRight />
          </Link>
        )
      }
    >
      {empty ? (
        <div className="phone-empty">
          <Cat weight="duotone" />
          <p>
            아직 친구가 없어요.
            <br />
            친구 코드로 같이 출근할 친구를 불러 보세요.
          </p>
          <Link to={ROUTES.friends}>
            <UserPlus /> 친구 코드로 추가하기
          </Link>
        </div>
      ) : (
        <FriendList />
      )}
    </DeskObject>
  );
}
