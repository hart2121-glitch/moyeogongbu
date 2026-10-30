import { useState } from "react";
import { useFriendActions, useFriends } from "../viewmodel/useFriends";

/** 같은 방 캐릭터 카드의 "친구 요청" (Story 006). 이미 친구면 표시만 한다. */
export default function FriendRequestAction({ userId }: { userId: string }) {
  const friends = useFriends().data ?? [];
  const { sendTo } = useFriendActions();
  const [note, setNote] = useState("");
  if (friends.some((f) => f.userId === userId)) return <span>친구</span>;
  if (note) return <span role="status">{note}</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        sendTo(userId)
          .then((r) => setNote(r === "accepted" ? "친구가 되었어요" : r === "already_friends" ? "친구" : "요청을 보냈어요"))
          .catch((error) => setNote(error instanceof Error ? error.message : "요청하지 못했어요"));
      }}
    >
      친구 요청
    </button>
  );
}
