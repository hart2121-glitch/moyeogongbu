-- Story 011: 공용 스터디카페 (2026-11-10 사용자 결정: 초대 코드 없이 누구나 들어오는 실시간 공용 방).
-- 카페는 rooms 줄(kind = 'cafe')이다. 방장과 초대 코드가 없고, 좌석 6개와 동시 인원 6명은 회사 방 규칙(room_rules)과 같다.
-- 한 카페가 차면 같은 모양의 카페를 하나 더 연다. 카페 멤버는 "지금 그 카페에 있는 사람"이다:
--   join_cafe가 멤버로 넣고, 접속(presence)이 유예(room_grace)보다 오래 끊긴 사람은 room_sweep이 멤버에서 뺀다.
-- 그래서 enter_room, heartbeat_room, claim_seat, room_member_status 같은 회사 방 RPC를 그대로 쓴다.
-- 카페는 내 방 목록에 나오지 않고, 방장 도구(이름, 코드, 꾸밈, 화이트보드, 강퇴)와 친구 초대는 쓸 수 없다.

alter table public.rooms add column kind text not null default 'company' check (kind in ('company', 'cafe'));
alter table public.rooms alter column owner_id drop not null;
alter table public.rooms alter column invite_code drop not null;
alter table public.rooms add constraint rooms_cafe_has_no_owner check ((kind = 'cafe') = (owner_id is null));
alter table public.rooms add constraint rooms_cafe_has_no_code check ((kind = 'cafe') = (invite_code is null));

comment on column public.rooms.kind is 'company: 초대 코드로 들어오는 회사 방. cafe: 누구나 들어오는 공용 스터디카페 (방장, 코드 없음).';

-- 방장 확인: 방장이 없는 카페에서는 늘 not_owner (null 비교가 통과되지 않게 is distinct from).
create or replace function public.room_require_owner(p_room uuid)
returns public.rooms
language plpgsql
set search_path = ''
as $$
declare
  r public.rooms;
begin
  perform public.room_require_login();
  select * into r from public.rooms x where x.id = p_room for update;
  if r.id is null or r.owner_id is distinct from auth.uid() then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  return r;
end;
$$;

-- 화면용 방 정보에 종류(kind)를 더한다. 나머지는 20261101110000_room_decor.sql과 같다.
create or replace function public.room_json(p_room uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'kind', r.kind,
    'name', r.name,
    'invite_code', r.invite_code,
    'owner_id', r.owner_id,
    'is_owner', coalesce(r.owner_id = auth.uid(), false),
    'created_at', r.created_at,
    'member_count', (select count(*) from public.room_members m where m.room_id = r.id),
    'online_count', (select count(distinct p.user_id) from public.room_presence p
                      where p.room_id = r.id and p.last_seen >= now() - public.room_grace()),
    'board_text', r.board_text,
    'decor', jsonb_build_object('cushions', r.decor_cushions, 'table', r.decor_table,
                                'rug', r.decor_rug, 'mat', r.decor_mat))
  from public.rooms r where r.id = p_room;
$$;

-- 유예가 지난 좌석과 접속 줄을 정리한다. 카페에서는 들어온 지 유예가 지났는데 접속한 탭이 없는 사람을 멤버에서 뺀다.
create or replace function public.room_sweep(p_room uuid)
returns void
language sql
set search_path = ''
as $$
  update public.room_seats s set user_id = null, last_seen = null
   where s.room_id = p_room and s.user_id is not null and s.last_seen < now() - public.room_grace();
  delete from public.room_presence p
   where p.room_id = p_room and p.last_seen < now() - public.room_grace();
  delete from public.room_members m
   using public.rooms r
   where r.id = p_room and r.kind = 'cafe' and m.room_id = p_room
     and m.joined_at < now() - public.room_grace()
     and not exists (select 1 from public.room_presence p where p.room_id = p_room and p.user_id = m.user_id);
$$;

-- 내 방 목록: 회사 방만 (카페는 목록에 남기지 않는다).
create or replace function public.list_my_rooms()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  return coalesce((
    select jsonb_agg(public.room_json(m.room_id) order by m.joined_at, m.room_id)
      from public.room_members m
      join public.rooms r on r.id = m.room_id and r.kind = 'company'
     where m.user_id = auth.uid()), '[]'::jsonb);
end;
$$;

-- 공용 카페에 들어간다. 카페 정보를 돌려주고, 그 뒤로는 회사 방과 같은 enter_room, heartbeat_room을 쓴다.
-- p_room이 있으면 그 카페(친구가 있는 카페)로, 없으면 이미 있던 카페, 아니면 자리가 남은 카페 가운데 사람이 가장 많은 곳,
-- 모두 찼으면 새 카페를 연다. 한 사람은 카페 하나에만 있다. 고른 카페가 가득 찼으면 cafe_full.
create or replace function public.join_cafe(p_room uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rr public.room_rules := public.room_rules_row();
  me uuid := public.room_require_login();
  v_id uuid;
  v_current uuid;
  v_room uuid;
begin
  -- 카페 입장은 하나씩 처리해 같은 카페가 6명을 넘지 않게 한다.
  perform pg_advisory_xact_lock(hashtextextended('cafe-join', 0));
  for v_id in select r.id from public.rooms r where r.kind = 'cafe' loop
    perform public.room_sweep(v_id);
  end loop;
  select m.room_id into v_current
    from public.room_members m join public.rooms r on r.id = m.room_id and r.kind = 'cafe'
   where m.user_id = me
   order by m.joined_at desc limit 1;

  if p_room is not null then
    if not exists (select 1 from public.rooms r where r.id = p_room and r.kind = 'cafe') then
      raise exception 'no_cafe' using errcode = 'P0001';
    end if;
    v_room := p_room;
  elsif v_current is not null then
    v_room := v_current;
  else
    select r.id into v_room
      from public.rooms r
     where r.kind = 'cafe'
       and (select count(*) from public.room_members m where m.room_id = r.id) < rr.max_concurrent
     order by (select count(*) from public.room_members m where m.room_id = r.id) desc, r.created_at, r.id
     limit 1;
    if v_room is null then
      insert into public.rooms (kind, owner_id, name, invite_code)
      values ('cafe', null, '공용 스터디카페', null)
      returning id into v_room;
      insert into public.room_seats (room_id, seat_no)
      select v_room, g from generate_series(1, rr.seat_count) g;
    end if;
  end if;

  if not exists (select 1 from public.room_members m where m.room_id = v_room and m.user_id = me) then
    if (select count(*) from public.room_members m where m.room_id = v_room) >= rr.max_concurrent then
      raise exception 'cafe_full' using errcode = 'P0001';
    end if;
    -- 다른 카페에 있었으면 거기서 나온다.
    for v_id in
      select m.room_id from public.room_members m join public.rooms r on r.id = m.room_id and r.kind = 'cafe'
       where m.user_id = me and m.room_id <> v_room
    loop
      perform public.room_remove_member(v_id, me);
    end loop;
    insert into public.room_members (room_id, user_id) values (v_room, me);
  end if;
  return public.room_json(v_room);
end;
$$;

-- 지금 공용 카페에 있는 사람 수 (로비 모니터).
create or replace function public.cafe_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct p.user_id)::integer
    from public.room_presence p
    join public.rooms r on r.id = p.room_id and r.kind = 'cafe'
   where p.last_seen >= now() - public.room_grace();
$$;

-- 친구 목록: 친구가 공용 카페에 있으면 내가 그 카페 멤버가 아니어도 카페 id와 이름을 준다 (누구나 들어올 수 있는 곳).
-- room_kind를 더한다. 나머지는 20261111110000_friend_looks.sql과 같다.
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
                 'room_id', case when rm.kind = 'cafe' or public.is_room_member(pr.room_id) then pr.room_id end,
                 'room_name', case when rm.kind = 'cafe' or public.is_room_member(pr.room_id) then rm.name end,
                 'room_kind', rm.kind,
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

-- 방 초대: 카페는 초대 코드가 없어 초대하지 않는다 (cafe_no_invite). 나머지는 20261030120000_friends_mail.sql과 같다.
create or replace function public.invite_to_room(p_room uuid, p_friend uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rr public.room_rules := public.room_rules_row();
begin
  perform public.room_require_member(p_room);
  if exists (select 1 from public.rooms r where r.id = p_room and r.kind = 'cafe') then
    raise exception 'cafe_no_invite' using errcode = 'P0001';
  end if;
  if not public.social_are_friends(auth.uid(), p_friend) then
    raise exception 'not_friend' using errcode = 'P0001';
  end if;
  if (select count(*) from public.room_members m where m.room_id = p_room) >= rr.max_members then
    raise exception 'room_full' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.room_members m where m.room_id = p_room and m.user_id = p_friend) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  insert into public.mail (user_id, kind, sender_id, room_id, ref, payload, expires_at)
  values (p_friend, 'room_invite', auth.uid(), p_room, p_room::text || ':' || auth.uid()::text,
          '{}'::jsonb, public.social_mail_expiry())
  on conflict (user_id, kind, ref) do update
    set created_at = now(), expires_at = excluded.expires_at, claimed_at = null;
  return jsonb_build_object('status', 'sent');
end;
$$;

revoke execute on function public.join_cafe(uuid) from public, anon;
revoke execute on function public.cafe_count() from public, anon;
grant execute on function public.join_cafe(uuid) to authenticated;
grant execute on function public.cafe_count() to authenticated;

insert into public.notices (tag, title, body, published_at) values
  ('업데이트', '공용 스터디카페가 열렸어요',
   '초대 코드 없이 누구나 들어와 함께 공부해요. 한 카페에 여섯 명까지 앉고, 자리가 차면 옆 카페가 열려요.',
   '2026-11-11 09:01:30+09');
