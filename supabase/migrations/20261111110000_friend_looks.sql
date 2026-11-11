-- 친구 목록에 친구가 꾸민 모습을 더한다 (2026-11-11).
-- 친구 목록과 로비 휴대폰은 지금까지 모두 같은 예전 그림을 썼다. "꾸민 내 캐릭터가 어디서나 같은 모습으로 보인다"는
-- 제품 원칙대로 친구 줄에도 그 사람이 저장한 꾸밈(character_look_json)을 넣는다. 처음 꾸미기 전이면 null이다.
-- 나머지는 20261030120000_friends_mail.sql의 list_friends와 같다.

create or replace function public.list_friends()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := public.room_require_login();
begin
  return coalesce((
    select jsonb_agg(row_json order by sort_key, name nulls last, friend_id)
      from (
        select f.friend_id,
               public.social_name(f.friend_id) as name,
               case st.state when 'studying' then 0 when 'break' then 1 when 'away' then 2 else 3 end as sort_key,
               jsonb_build_object(
                 'user_id', f.friend_id,
                 'display_name', public.social_name(f.friend_id),
                 'state', st.state,
                 'in_room', pr.room_id is not null,
                 'room_id', case when public.is_room_member(pr.room_id) then pr.room_id end,
                 'room_name', case when public.is_room_member(pr.room_id) then rm.name end,
                 'look', public.character_look_json(f.friend_id),
                 'since', f.created_at) as row_json
          from (
            select case when x.user_a = me then x.user_b else x.user_a end as friend_id, x.created_at
              from public.friendships x where me in (x.user_a, x.user_b)) f
          left join lateral (
            select case
                     when s.user_id is null or s.state = 'left' then 'offline'
                     when s.last_seen < now() - public.room_grace() then 'offline'
                     else s.state end as state
              from (select 1) one
              left join public.study_sessions s on s.user_id = f.friend_id) st on true
          left join lateral (
            select p.room_id from public.room_presence p
             where p.user_id = f.friend_id and p.last_seen >= now() - public.room_grace()
             order by p.last_seen desc limit 1) pr on true
          left join public.rooms rm on rm.id = pr.room_id) rows), '[]'::jsonb);
end;
$$;
