import { supabase } from "../../../lib/supabase";
import { fetchNotices } from "./notices";

/** 앱이 쓰는 공지 저장소. @example const list = await noticeStore.list(); */
export const noticeStore = {
  list: () => fetchNotices(supabase),
};
