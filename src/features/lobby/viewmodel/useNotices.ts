import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import { noticeStore } from "../model/noticeStore";

/** 로비 공지 (서버). @example const notices = useNotices(); */
export function useNotices() {
  const userId = useSession()?.user.id;
  return useQuery({ queryKey: ["notices"], queryFn: noticeStore.list, enabled: !!userId }).data ?? [];
}
