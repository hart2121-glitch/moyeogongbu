/**
 * 할 일 제한 수치. 서버 `todo_rules` 행(하루 개수)과 `todos.text` 검사(1~50자)와 같은 값이다.
 * 바꾸려면 마이그레이션의 행과 이 파일을 함께 고친다.
 */
export const TODO_CONFIG = {
  /** 하루(오전 5시 경계)에 둘 수 있는 할 일 수. */
  dailyMax: 30,
  /** 할 일 하나의 최대 글자 수. */
  textMaxLength: 50,
} as const;
