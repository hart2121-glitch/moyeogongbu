import type { SupabaseClient } from "@supabase/supabase-js";

export interface Notice {
  tag: string;
  title: string;
  body?: string;
}

/** 로비 공지 (서버 `public.notices`). 최신순. @example const list = await fetchNotices(supabase); */
export async function fetchNotices(client: SupabaseClient, limit = 20): Promise<Notice[]> {
  const { data, error } = await client
    .from("notices")
    .select("tag, title, body")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notice[];
}
