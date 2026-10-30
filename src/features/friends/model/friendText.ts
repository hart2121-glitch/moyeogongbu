/**
 * 친구 화면 문구와 입력 정리 (순수 함수, 서버 호출 없음). 테스트가 직접 가져다 쓴다.
 */

export type FriendState = "studying" | "break" | "away" | "offline";
export type FriendIcon = "monitor" | "coffee" | "gamepad";

const STATE_LABEL: Record<FriendState, string> = {
  studying: "공부 중",
  break: "휴식 중",
  away: "자리 비움",
  offline: "오프라인",
};

const STATE_ICON: Record<FriendState, FriendIcon> = {
  studying: "monitor",
  break: "coffee",
  away: "gamepad",
  offline: "gamepad",
};

/** @example friendStatusLabel("break") // "휴식 중" */
export const friendStatusLabel = (state: FriendState) => STATE_LABEL[state] ?? STATE_LABEL.offline;

/** @example friendIcon("studying") // "monitor" */
export const friendIcon = (state: FriendState) => STATE_ICON[state] ?? "gamepad";

/**
 * 친구가 있는 곳 문구. 같은 방 멤버가 아니면 방 이름 대신 "스터디룸에서"만 쓴다.
 * @example friendPlace({ ...f, inRoom: true, roomName: null, state: "studying" }) // "스터디룸에서 공부 중"
 */
export function friendPlace(friend: { state: FriendState; inRoom: boolean; roomName: string | null }): string {
  const label = friendStatusLabel(friend.state);
  if (friend.state === "offline") return "지금은 접속하지 않았어요";
  if (!friend.inRoom) return label;
  return `${friend.roomName ?? "스터디룸"}에서 ${label}`;
}

const CODE_ALPHABET = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;

/**
 * 친구 코드 입력 정리. 공백을 빼고 대문자로 바꾸며, length자(SOCIAL_CONFIG.friendCodeLength) 형식이 아니면 null.
 * @example normalizeFriendCode(" abcd2345 ", 8) // "ABCD2345"
 */
export function normalizeFriendCode(input: string, length: number): string | null {
  const code = input.replace(/\s+/g, "").toUpperCase();
  return code.length === length && CODE_ALPHABET.test(code) ? code : null;
}
