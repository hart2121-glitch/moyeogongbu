/**
 * 화면 오류 판정. 배포 뒤 예전 탭이 사라진 화면 파일을 찾으면 브라우저마다 다른 문구로 실패한다.
 * Chrome "Failed to fetch dynamically imported module", Firefox "error loading dynamically imported module",
 * Safari "Importing a module script failed", Vite "Unable to preload CSS".
 */
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

/** 나눠 받는 화면 파일을 받지 못한 오류인지. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return CHUNK_ERROR.test(message);
}

export const RELOAD_GUARD = { storageKey: "moyeogongbu.reloadedAt", withinMs: 10_000 } as const;

/**
 * 새 파일을 받으려고 한 번 새로고침해도 되는지. 방금 새로고침했는데 또 실패하면 멈춘다(무한 새로고침 방지).
 * @example shouldReload(null, 50_000) // true
 * @example shouldReload("45000", 50_000) // false (5초 전에 새로고침함)
 */
export function shouldReload(lastReloadedAt: string | null, now: number): boolean {
  const last = Number(lastReloadedAt);
  return !lastReloadedAt || !Number.isFinite(last) || now - last > RELOAD_GUARD.withinMs;
}
