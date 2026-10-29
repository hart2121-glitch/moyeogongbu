export interface Notice {
  tag: string;
  title: string;
}

/** 화면 구성을 위한 예시 공지. 서버 연결 전까지 고정 데이터다. */
export const NOTICES: readonly Notice[] = [
  { tag: "이벤트", title: "10월 출석 이벤트가 시작되었어요!" },
  { tag: "업데이트", title: "새로운 가구가 추가되었어요!" },
  { tag: "안내", title: "서비스 이용 수칙을 확인해 주세요." },
  { tag: "이벤트", title: "스터디카페 확장 오픈!" },
];
