import { supabase } from "../../../lib/supabase";
import { acceptRoomInvite, claimMail, deleteMail, fetchMail, inviteToRoom } from "./mail";

/**
 * 앱이 쓰는 우편 저장소. `mail.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * @example const mail = await mailStore.list();
 */
export const mailStore = {
  list: () => fetchMail(supabase),
  claim: (id: number) => claimMail(supabase, id),
  acceptInvite: (id: number) => acceptRoomInvite(supabase, id),
  remove: (id: number) => deleteMail(supabase, id),
  invite: (roomId: string, friendId: string) => inviteToRoom(supabase, roomId, friendId),
};
