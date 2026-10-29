import type { Friend } from "../../friends/model/friends";

/** 열려 있는 모달. 닫혀 있으면 null. */
export type ModalState =
  | null
  | "task"
  | "profile"
  | "mail"
  | "notifications"
  | "settings"
  | "notices"
  | ({ type: "friend" } & Friend)
  | { type: "notice"; tag: string; title: string };

type OpenModal = NonNullable<ModalState>;

const STRING_MODAL_TITLES = {
  task: "오늘의 할 일 추가",
  profile: "프로필 수정",
  mail: "우편함",
  notifications: "알림",
  settings: "설정",
  notices: "최근 공지사항",
} as const;

/**
 * 모달 머리글 제목.
 * @example modalTitle("mail") // "우편함"
 */
export function modalTitle(modal: OpenModal): string {
  if (typeof modal === "string") return STRING_MODAL_TITLES[modal];
  return modal.type === "friend" ? "친구 프로필" : modal.tag;
}
