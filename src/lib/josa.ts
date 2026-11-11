/**
 * 한국어 조사. 마지막 글자가 한글 음절이면 받침에 맞춰 고르고, 아니면 두 꼴을 함께 쓴다.
 * @example objectParticle("카멜 러그") // "카멜 러그를"
 * @example objectParticle("소파 쿠션") // "소파 쿠션을"
 */
export function objectParticle(word: string): string {
  const last = word.slice(-1);
  const index = last ? last.charCodeAt(0) - 0xac00 : -1;
  if (index < 0 || index > 11171) return `${word}을(를)`;
  return `${word}${index % 28 === 0 ? "를" : "을"}`;
}
