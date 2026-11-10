import { DISPLAY_NAME_RULE, MAX_DISPLAY_NAME_LENGTH } from "../model/account";
import "../../shell/view/controls.css";

/**
 * 화면 이름 입력칸과 글자 수 (예: 3/12). 규칙 문장은 화면에 쓰지 않고 보조 기술에만 알린다.
 * 글자 수는 서버와 같게 앞뒤 공백을 빼고 코드 포인트로 센다.
 * @example <DisplayNameField value={nameInput} onChange={setNameInput} />
 */
export default function DisplayNameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const count = [...value.trim()].length;
  return (
    <>
      <label htmlFor="display-name">화면 이름</label>
      <input
        id="display-name"
        required
        maxLength={MAX_DISPLAY_NAME_LENGTH}
        aria-describedby="display-name-rule"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="nickname"
      />
      <p className="field-count" aria-hidden="true">
        {count}/{MAX_DISPLAY_NAME_LENGTH}
      </p>
      <span id="display-name-rule" className="sr-only">
        {DISPLAY_NAME_RULE}
      </span>
    </>
  );
}
