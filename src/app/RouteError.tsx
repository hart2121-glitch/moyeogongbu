import { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";
import { ROUTES } from "../features/shell/model/paths";
import { isChunkLoadError, RELOAD_GUARD, shouldReload } from "./chunkReload";

/** 새로고침 기록. 저장소를 못 쓰는 브라우저(사생활 보호 창)에서는 새로고침하지 않는다. */
function claimReload(): boolean {
  try {
    if (!shouldReload(sessionStorage.getItem(RELOAD_GUARD.storageKey), Date.now())) return false;
    sessionStorage.setItem(RELOAD_GUARD.storageKey, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

/**
 * 화면을 그리다 실패했을 때 그 자리에 띄우는 카드. 앱 틀(상단 바, 사이드바)은 그대로 둔다.
 * 배포 뒤 예전 화면 파일을 찾지 못한 경우면 한 번 새로고침해 새 파일을 받는다.
 * @param full 앱 틀 밖(로그인 전, 첫 설정)에서 화면 전체에 띄울 때.
 */
export default function RouteError({ full = false }: { full?: boolean }) {
  const error = useRouteError();
  const [reloading] = useState(() => isChunkLoadError(error) && claimReload());
  useEffect(() => {
    if (reloading) window.location.reload();
    else console.error(error);
  }, [reloading, error]);
  return (
    <div className={full ? "route-error is-full" : "route-error"}>
      {reloading ? (
        <p role="status" className="route-error-quiet">새 화면을 받는 중이에요.</p>
      ) : (
        <section className="route-error-card" role="alert" data-testid="route-error">
          <p>화면을 불러오지 못했어요.</p>
          <div className="route-error-actions">
            <button type="button" className="primary" onClick={() => window.location.reload()}>
              다시 불러오기
            </button>
            {/* 앱을 처음부터 다시 받도록 주소로 이동한다 */}
            <a className="secondary-button" href={ROUTES.lobby}>
              내 방으로
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
