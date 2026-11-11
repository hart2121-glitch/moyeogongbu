import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import "./controls.css";

/**
 * 글자를 클립보드에 복사하는 작은 보조 단추. 복사하면 2초 동안 "복사했어요"로 바뀐다.
 * 클립보드 권한이 없으면 아무 일도 하지 않는다(글자는 화면에 있어 직접 고를 수 있다).
 * @example <CopyButton text={friendCode} label="친구 코드 복사" />
 */
export default function CopyButton({ text, label = "복사" }: { text: string | null | undefined; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // 권한이 없거나 보안 문맥이 아니면 조용히 둔다.
    }
  };
  return (
    <button
      type="button"
      className="secondary-button copy-button"
      onClick={() => void copy()}
      disabled={!text}
      aria-label={copied ? "복사했어요" : label}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? "복사했어요" : "복사"}</span>
    </button>
  );
}
