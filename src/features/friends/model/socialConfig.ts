/**
 * 친구, 우편, 알림 수치 (Story 006). 서버 쪽 짝은 `public.social_rules`
 * (`supabase/migrations/20261030120000_friends_mail.sql`)이고 두 값은 같아야 한다.
 */
export const SOCIAL_CONFIG = {
  /** 친구 최대 수. 보내는 쪽과 받는 쪽 모두. */
  friendCap: 50,
  /** 우편 보관 일수. 지나면 받을 수 없고 지워진다. */
  mailDays: 30,
  /** 하루(오전 5시 기준) 첫 착석 출석 보상 코인. */
  attendanceCoins: 10,
  /** 친구 코드 글자 수 (Story 001 발급값). */
  friendCodeLength: 8,
  /** 친구 상태를 다시 읽는 간격. */
  friendPollMs: 30_000,
  /** 상단 우편, 알림 표시를 다시 읽는 간격. */
  inboxPollMs: 30_000,
} as const;
