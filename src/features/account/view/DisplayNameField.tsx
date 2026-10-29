import { DISPLAY_NAME_RULE, MAX_DISPLAY_NAME_LENGTH } from "../model/account";

/**
 * 화면 이름 입력칸과 글자 수 규칙 안내.
 * @example <DisplayNameField value={nameInput} onChange={setNameInput} />
 */
export default function DisplayNameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
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
      />
      <p id="display-name-rule" className="muted">
        {DISPLAY_NAME_RULE}로 정해 주세요.
      </p>
    </>
  );
}
