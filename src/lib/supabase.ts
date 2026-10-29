import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 필요해요. .env.example을 참고해 .env.development.local 또는 .env.production.local을 만들어 주세요.",
  );
}

/**
 * 앱 전체에서 공유하는 Supabase 클라이언트.
 * 개발과 운영은 Vite 모드별 환경 파일로 나뉜다 (`npm run dev`는 development, `npm run build`는 production).
 * Model 층의 저장소 구현만 이 클라이언트를 가져다 쓰고, View와 ViewModel은 직접 쓰지 않는다.
 */
export const supabase = createClient(url, anonKey);
