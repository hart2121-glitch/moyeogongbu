-- Story 006: 친구, 우편함, 알림, 공지 (`design/game-brief.md` "방과 친구").
-- 수치 기준은 src/features/friends/model/socialConfig.ts와 같다:
--   친구 최대 50명, 우편 보관 30일, 출석 보상 10코인.
-- 클라이언트는 표를 직접 고치지 못하고 아래 RPC만 쓴다. 조회는 본인과 관련된 줄만 열린다.
-- 계정 삭제: 모든 표가 auth.users(id)에 on delete cascade로 걸려 있어 함께 지워진다
-- (보낸 사람 sender_id, 알림의 actor_id도 같은 방식이라 상대 우편함에서도 사라진다).

create table public.social_rules (
  id boolean primary key default true check (id),
  -- 친구 최대 수 (socialConfig.friendCap). 보내는 쪽과 받는 쪽 모두에 적용한다.
  friend_cap integer not null check (friend_cap > 0),
  -- 우편 보관 일수 (socialConfig.mailDays). 지나면 받을 수 없고 목록 조회 때 지운다.
  mail_days integer not null check (mail_days > 0),
  -- 하루 첫 착석 출석 보상 코인 (socialConfig.attendanceCoins). 연속 보너스는 없다.
  attendance_coins integer not null check (attendance_coins >= 0),
  -- 같은 사람이 같은 방에 다시 들어와도 친구 입장 알림을 다시 보내지 않는 간격 (초).
  enter_notice_gap_seconds integer not null check (enter_notice_gap_seconds >= 0),
  -- 뽀모도로 종료, 자리 비움 확인 알림을 같은 종류로 다시 쌓지 않는 간격 (초).
  self_notice_gap_seconds integer not null check (self_notice_gap_seconds >= 0)
);

comment on table public.social_rules is '친구와 우편 수치의 서버 쪽 유일한 출처. 화면 쪽 짝은 socialConfig.ts.';

insert into public.social_rules (friend_cap, mail_days, attendance_coins, enter_notice_gap_seconds, self_notice_gap_seconds)
values (50, 30, 10, 600, 30);

alter table public.social_rules enable row level security;
revoke all on public.social_rules from anon, authenticated;

-- 대기 중인 친구 요청만 둔다. 수락, 거절, 차단하면 줄이 지워진다.
create table public.friend_requests (
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);
create index friend_requests_to on public.friend_requests (to_user);

-- 친구 관계. 한 쌍을 한 줄로 두려고 user_a < user_b로 맞춘다.
create table public.friendships (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);
create index friendships_b on public.friendships (user_b);

create table public.blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index blocks_blocked on public.blocks (blocked);

-- 우편. 받는 사람(user_id) 기준. ref는 종류별 중복 방지 열쇠다.
--   friend_request: ref = 보낸 사람 id, room_invite: ref = 방 id:보낸 사람 id, reward: ref = 'attendance:' || 공부 날짜.
create table public.mail (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('friend_request', 'room_invite', 'reward')),
  sender_id uuid null references auth.users (id) on delete cascade,
  room_id uuid null references public.rooms (id) on delete cascade,
  ref text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  claimed_at timestamptz null,
  constraint mail_once unique (user_id, kind, ref)
);
create index mail_user_created on public.mail (user_id, created_at desc);
create index mail_expires on public.mail (expires_at);

comment on table public.mail is '우편함. RPC로만 쓰고, 보관 기한이 지나면 cleanup_mail이 지운다.';

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('friend_entered', 'pomodoro_end', 'away_check')),
  actor_id uuid null references auth.users (id) on delete cascade,
  room_id uuid null references public.rooms (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);
create index notifications_user_created on public.notifications (user_id, created_at desc);

-- 로비 공지. 로그인한 사람은 누구나 읽는다. 쓰기는 운영(서비스 키)만 한다.
create table public.notices (
  id bigint generated always as identity primary key,
  tag text not null check (char_length(tag) between 1 and 8),
  title text not null check (char_length(title) between 1 and 60),
  body text not null default '',
  published_at timestamptz not null default now()
);

insert into public.notices (tag, title, body, published_at) values
  ('이벤트', '10월 출석 이벤트가 시작되었어요!', '하루 첫 착석 때 출석 보상 10코인이 우편함으로 와요.', now() - interval '1 minute'),
  ('업데이트', '새로운 가구가 추가되었어요!', '회사 스터디룸에 새 가구가 곧 놓일 예정이에요.', now() - interval '2 minutes'),
  ('안내', '서비스 이용 수칙을 확인해 주세요.', '서로를 배려하며 조용히 함께 공부해요.', now() - interval '3 minutes'),
  ('이벤트', '스터디카페 확장 오픈!', '스터디카페는 픽셀아트가 준비되는 대로 열려요.', now() - interval '4 minutes');

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.mail enable row level security;
alter table public.notifications enable row level security;
alter table public.notices enable row level security;

create policy "본인이 보내거나 받은 요청만 조회" on public.friend_requests for select to authenticated
  using ((select auth.uid()) in (from_user, to_user));
create policy "본인 친구 관계만 조회" on public.friendships for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));
create policy "본인 차단 목록만 조회" on public.blocks for select to authenticated
  using ((select auth.uid()) = blocker);
create policy "본인 우편만 조회" on public.mail for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "본인 알림만 조회" on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "공지는 로그인하면 조회" on public.notices for select to authenticated
  using (true);

revoke all on public.friend_requests, public.friendships, public.blocks, public.mail,
  public.notifications, public.notices from anon, authenticated;
grant select on public.friend_requests, public.friendships, public.blocks, public.mail,
  public.notifications, public.notices to authenticated;

-- 내부 도우미 -------------------------------------------------------------

create or replace function public.social_rules_row()
returns public.social_rules
language sql
stable
set search_path = ''
as $$
  select * from public.social_rules where id;
$$;

create or replace function public.social_are_friends(p_a uuid, p_b uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
     where f.user_a = least(p_a, p_b) and f.user_b = greatest(p_a, p_b));
$$;

create or replace function public.social_friend_count(p_user uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::int from public.friendships f where p_user in (f.user_a, f.user_b);
$$;

create or replace function public.social_mail_expiry()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select now() + make_interval(days => (public.social_rules_row()).mail_days);
$$;

-- 보관 기한이 지난 우편을 지운다 (pg_cron 없이 우편함을 열 때 부른다).
create or replace function public.cleanup_mail()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  n integer;
begin
  delete from public.mail m where m.expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.social_name(p_user uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select p.display_name from public.profiles p where p.id = p_user;
$$;

-- 두 사람을 친구로 묶는다. 어느 쪽이든 상한이면 friend_cap / friend_cap_other.
create or replace function public.social_make_friends(p_me uuid, p_other uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  r public.social_rules := public.social_rules_row();
begin
  -- 두 사람의 친구 수 검사가 겹치지 않도록 계정 순서대로 잠근다.
  perform pg_advisory_xact_lock(hashtextextended('friends:' || least(p_me, p_other)::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('friends:' || greatest(p_me, p_other)::text, 0));
  if public.social_are_friends(p_me, p_other) then
    return;
  end if;
  if public.social_friend_count(p_me) >= r.friend_cap then
    raise exception 'friend_cap' using errcode = 'P0001';
  end if;
  if public.social_friend_count(p_other) >= r.friend_cap then
    raise exception 'friend_cap_other' using errcode = 'P0001';
  end if;
  insert into public.friendships (user_a, user_b) values (least(p_me, p_other), greatest(p_me, p_other))
  on conflict do nothing;
  delete from public.friend_requests q
   where (q.from_user = p_me and q.to_user = p_other) or (q.from_user = p_other and q.to_user = p_me);
  delete from public.mail m
   where m.kind = 'friend_request'
     and ((m.user_id = p_me and m.sender_id = p_other) or (m.user_id = p_other and m.sender_id = p_me));
end;
$$;

-- 친구 요청 공통 처리. 결과: sent, accepted(상대가 먼저 보낸 요청이 있어 바로 친구), already_friends.
-- 상대가 나를 차단했으면 아무것도 남기지 않고 sent를 돌려준다 (차단 사실을 알리지 않는다).
create or replace function public.social_request(p_target uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  me uuid := public.room_require_login();
  r public.social_rules := public.social_rules_row();
begin
  if p_target is null or not exists (select 1 from public.profiles p where p.id = p_target) then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  if p_target = me then
    raise exception 'self' using errcode = 'P0001';
  end if;
  if public.social_are_friends(me, p_target) then
    return jsonb_build_object('status', 'already_friends');
  end if;
  if exists (select 1 from public.blocks b where b.blocker = me and b.blocked = p_target) then
    raise exception 'you_blocked' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.blocks b where b.blocker = p_target and b.blocked = me) then
    return jsonb_build_object('status', 'sent');
  end if;
  if exists (select 1 from public.friend_requests q where q.from_user = p_target and q.to_user = me) then
    perform public.social_make_friends(me, p_target);
    return jsonb_build_object('status', 'accepted');
  end if;
  if public.social_friend_count(me) >= r.friend_cap then
    raise exception 'friend_cap' using errcode = 'P0001';
  end if;
  insert into public.friend_requests (from_user, to_user) values (me, p_target)
  on conflict (from_user, to_user) do nothing;
  insert into public.mail (user_id, kind, sender_id, ref, payload, expires_at)
  values (p_target, 'friend_request', me, me::text, '{}'::jsonb, public.social_mail_expiry())
  on conflict (user_id, kind, ref) do nothing;
  return jsonb_build_object('status', 'sent');
end;
$$;

-- 공개 RPC: 친구 --------------------------------------------------------

-- 8자 친구 코드로 요청 보내기. 닉네임 검색은 없다.
create or replace function public.send_friend_request(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
begin
  perform public.room_require_login();
  select p.id into v_target from public.profiles p
   where p.friend_code = upper(btrim(coalesce(p_code, '')));
  if v_target is null then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  return public.social_request(v_target);
end;
$$;

-- 같은 방 캐릭터를 눌러 요청 보내기. 함께 멤버인 방이 있어야 한다.
create or replace function public.send_friend_request_to(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  if not exists (
    select 1 from public.room_members a
      join public.room_members b on b.room_id = a.room_id
     where a.user_id = auth.uid() and b.user_id = p_user) then
    raise exception 'not_same_room' using errcode = 'P0001';
  end if;
  return public.social_request(p_user);
end;
$$;

-- 받은 요청에 답하기: accept, reject, block.
create or replace function public.respond_friend_request(p_from uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.room_require_login();
begin
  if p_action is null or p_action not in ('accept', 'reject', 'block') then
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  if p_action = 'block' then
    perform public.block_user(p_from);
    return jsonb_build_object('status', 'blocked');
  end if;
  if not exists (select 1 from public.friend_requests q where q.from_user = p_from and q.to_user = me) then
    delete from public.mail m where m.user_id = me and m.kind = 'friend_request' and m.sender_id = p_from;
    raise exception 'no_request' using errcode = 'P0001';
  end if;
  if p_action = 'accept' then
    perform public.social_make_friends(me, p_from);
    return jsonb_build_object('status', 'accepted');
  end if;
  delete from public.friend_requests q where q.from_user = p_from and q.to_user = me;
  delete from public.mail m where m.user_id = me and m.kind = 'friend_request' and m.sender_id = p_from;
  return jsonb_build_object('status', 'rejected');
end;
$$;

-- 친구 끊기. 상대에게 알리지 않는다.
create or replace function public.unfriend(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.room_require_login();
begin
  delete from public.friendships f where f.user_a = least(me, p_user) and f.user_b = greatest(me, p_user);
end;
$$;

-- 차단. 친구 관계, 오가는 요청, 그 사람이 보낸 우편을 지운다.
create or replace function public.block_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.room_require_login();
begin
  if p_user is null or p_user = me or not exists (select 1 from public.profiles p where p.id = p_user) then
    raise exception 'invalid_user' using errcode = 'P0001';
  end if;
  insert into public.blocks (blocker, blocked) values (me, p_user) on conflict do nothing;
  delete from public.friendships f where f.user_a = least(me, p_user) and f.user_b = greatest(me, p_user);
  delete from public.friend_requests q
   where (q.from_user = me and q.to_user = p_user) or (q.from_user = p_user and q.to_user = me);
  delete from public.mail m
   where (m.user_id = me and m.sender_id = p_user and m.kind in ('friend_request', 'room_invite'))
      or (m.user_id = p_user and m.sender_id = me and m.kind = 'friend_request');
end;
$$;

create or replace function public.unblock_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  delete from public.blocks b where b.blocker = auth.uid() and b.blocked = p_user;
end;
$$;

create or replace function public.list_blocks()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'user_id', b.blocked, 'display_name', public.social_name(b.blocked), 'blocked_at', b.created_at)
           order by b.created_at desc)
      from public.blocks b where b.blocker = auth.uid()), '[]'::jsonb);
end;
$$;

-- 친구 목록과 상태. 상태는 Story 002 공부 세션: studying, break, away(자리 비움 또는 응답 끊김), offline.
-- 친구가 지금 있는 방은 내가 그 방 멤버일 때만 이름을 준다 (room_name). 아니면 in_room만 true.
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

-- 공개 RPC: 우편 --------------------------------------------------------

-- 방 초대 보내기. 방 멤버는 누구나, 친구에게만. 멤버가 6명으로 가득 찬 방은 room_full.
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

-- 우편함 목록. 먼저 기한이 지난 우편을 지운다. 남은 일수(days_left)는 올림으로 센다.
create or replace function public.list_mail()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  perform public.cleanup_mail();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', m.id,
             'kind', m.kind,
             'sender_id', m.sender_id,
             'sender_name', public.social_name(m.sender_id),
             'room_id', m.room_id,
             'room_name', r.name,
             'payload', m.payload,
             'created_at', m.created_at,
             'expires_at', m.expires_at,
             'days_left', greatest(0, ceil(extract(epoch from (m.expires_at - now())) / 86400))::int,
             'claimed', m.claimed_at is not null)
           order by m.created_at desc, m.id desc)
      from public.mail m
      left join public.rooms r on r.id = m.room_id
     where m.user_id = auth.uid()), '[]'::jsonb);
end;
$$;

-- 보상 받기. Story 003 원장(kind attendance, ref 공부 날짜)에 넣는다. 두 번 눌러도 한 번만 들어간다.
create or replace function public.claim_mail(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.mail;
  v_day date;
  v_amount integer;
begin
  perform public.room_require_login();
  select * into v from public.mail m where m.id = p_id and m.user_id = auth.uid() for update;
  if v.id is null or v.kind <> 'reward' then
    raise exception 'no_mail' using errcode = 'P0001';
  end if;
  if v.claimed_at is not null then
    return jsonb_build_object('status', 'already_claimed', 'amount', 0);
  end if;
  if v.expires_at <= now() then
    raise exception 'mail_expired' using errcode = 'P0001';
  end if;
  v_day := (v.payload ->> 'day')::date;
  v_amount := (v.payload ->> 'coins')::int;
  insert into public.coin_ledger (user_id, day, kind, amount, ref)
  values (auth.uid(), v_day, 'attendance', v_amount, v_day::text)
  on conflict (user_id, kind, ref) do nothing;
  if not found then
    v_amount := 0;
  end if;
  update public.mail m set claimed_at = now() where m.id = v.id;
  return jsonb_build_object('status', 'claimed', 'amount', v_amount);
end;
$$;

-- 방 초대 받기: Story 004 규칙(강퇴, 멤버 6명)으로 멤버가 되고 방 정보를 돌려준다.
create or replace function public.accept_room_invite(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rr public.room_rules := public.room_rules_row();
  v public.mail;
begin
  perform public.room_require_login();
  select * into v from public.mail m where m.id = p_id and m.user_id = auth.uid() for update;
  if v.id is null or v.kind <> 'room_invite' or v.room_id is null then
    raise exception 'no_mail' using errcode = 'P0001';
  end if;
  if v.expires_at <= now() then
    raise exception 'mail_expired' using errcode = 'P0001';
  end if;
  perform 1 from public.rooms x where x.id = v.room_id for update;
  if not exists (select 1 from public.room_members m where m.room_id = v.room_id and m.user_id = auth.uid()) then
    if exists (select 1 from public.room_bans b where b.room_id = v.room_id and b.user_id = auth.uid()) then
      raise exception 'banned' using errcode = 'P0001';
    end if;
    if (select count(*) from public.room_members m where m.room_id = v.room_id) >= rr.max_members then
      raise exception 'members_full' using errcode = 'P0001';
    end if;
    insert into public.room_members (room_id, user_id) values (v.room_id, auth.uid());
  end if;
  update public.mail m set claimed_at = now() where m.id = v.id;
  return public.room_json(v.room_id);
end;
$$;

-- 우편 지우기 (초대 거절, 받은 보상 정리). 받지 않은 보상은 지울 수 없다.
create or replace function public.delete_mail(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  delete from public.mail m
   where m.id = p_id and m.user_id = auth.uid()
     and m.kind <> 'friend_request'
     and not (m.kind = 'reward' and m.claimed_at is null);
end;
$$;

-- 하루(오전 5시) 첫 착석: 공부 구간이 처음 열릴 때 출석 보상 우편을 하루 한 번 만든다.
create or replace function public.social_attendance_mail()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.social_rules := public.social_rules_row();
  v_day date := public.study_day_of(new.started_at);
begin
  insert into public.mail (user_id, kind, ref, payload, expires_at)
  values (new.user_id, 'reward', 'attendance:' || v_day::text,
          jsonb_build_object('reward', 'attendance', 'day', v_day, 'coins', r.attendance_coins),
          public.social_mail_expiry())
  on conflict (user_id, kind, ref) do nothing;
  return new;
end;
$$;

create trigger study_intervals_attendance_mail
  after insert on public.study_intervals
  for each row execute function public.social_attendance_mail();

-- 코인 원장에 출석 보상 종류를 더한다 (Story 003 원장 경로).
alter table public.coin_ledger drop constraint coin_ledger_kind_check;
alter table public.coin_ledger add constraint coin_ledger_kind_check
  check (kind in ('study', 'pomodoro', 'todo', 'attendance'));

-- 공개 RPC: 알림 --------------------------------------------------------

-- 내 화면의 세션 흐름이 띄운 알림 (뽀모도로 종료, 자리 비움 확인)을 종 목록에 남긴다.
create or replace function public.push_notification(p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.social_rules := public.social_rules_row();
begin
  perform public.room_require_login();
  if p_kind is null or p_kind not in ('pomodoro_end', 'away_check') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.notifications n
     where n.user_id = auth.uid() and n.kind = p_kind
       and n.created_at > now() - make_interval(secs => r.self_notice_gap_seconds)) then
    return;
  end if;
  insert into public.notifications (user_id, kind) values (auth.uid(), p_kind);
end;
$$;

create or replace function public.list_notifications()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', n.id, 'kind', n.kind,
             'actor_name', public.social_name(n.actor_id),
             'room_id', n.room_id,
             'room_name', r.name,
             'created_at', n.created_at,
             'read', n.read_at is not null)
           order by n.created_at desc, n.id desc)
      from (select * from public.notifications x where x.user_id = auth.uid()
             order by x.created_at desc, x.id desc limit 50) n
      left join public.rooms r on r.id = n.room_id), '[]'::jsonb);
end;
$$;

create or replace function public.mark_notifications_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  update public.notifications n set read_at = now() where n.user_id = auth.uid() and n.read_at is null;
end;
$$;

-- 상단 아이콘 표시용: 받지 않은 우편 수, 읽지 않은 알림 수.
create or replace function public.inbox_counts()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'mail', (select count(*) from public.mail m
              where m.user_id = auth.uid() and m.claimed_at is null and m.expires_at > now()),
    'notifications', (select count(*) from public.notifications n
                       where n.user_id = auth.uid() and n.read_at is null));
$$;

-- Story 004 enter_room에 친구 입장 알림을 더한다 (동작은 그대로).
-- 이 탭이 들어오기 전 이미 방 안에 있지 않았으면, 방 안에 접속해 있는 내 친구에게 알림을 남긴다.
-- 같은 사람, 같은 방은 enter_notice_gap_seconds 안에 다시 알리지 않는다 (새로고침, 재접속).
create or replace function public.enter_room(p_room uuid, p_tab_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sr public.social_rules := public.social_rules_row();
  v_was_here boolean;
begin
  perform public.room_require_member(p_room);
  -- 같은 방의 입장을 하나씩 처리해 동시 인원 검사가 겹치지 않게 한다.
  perform 1 from public.rooms r where r.id = p_room for update;
  perform public.room_sweep(p_room);
  v_was_here := exists (
    select 1 from public.room_presence p
     where p.room_id = p_room and p.user_id = auth.uid() and p.last_seen >= now() - public.room_grace());
  perform public.room_touch_presence(p_room, p_tab_id);
  update public.room_seats s set last_seen = now()
   where s.room_id = p_room and s.user_id = auth.uid();
  if not v_was_here then
    insert into public.notifications (user_id, kind, actor_id, room_id)
    select distinct p.user_id, 'friend_entered', auth.uid(), p_room
      from public.room_presence p
     where p.room_id = p_room and p.user_id <> auth.uid()
       and p.last_seen >= now() - public.room_grace()
       and public.social_are_friends(auth.uid(), p.user_id)
       and not exists (
         select 1 from public.notifications n
          where n.user_id = p.user_id and n.kind = 'friend_entered'
            and n.actor_id = auth.uid() and n.room_id = p_room
            and n.created_at > now() - make_interval(secs => sr.enter_notice_gap_seconds));
  end if;
  return public.room_state(p_room);
end;
$$;

-- 권한 -------------------------------------------------------------------

revoke execute on function public.social_rules_row() from public, anon, authenticated;
revoke execute on function public.social_are_friends(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.social_friend_count(uuid) from public, anon, authenticated;
revoke execute on function public.social_mail_expiry() from public, anon, authenticated;
revoke execute on function public.cleanup_mail() from public, anon, authenticated;
revoke execute on function public.social_name(uuid) from public, anon, authenticated;
revoke execute on function public.social_make_friends(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.social_request(uuid) from public, anon, authenticated;
revoke execute on function public.social_attendance_mail() from public, anon, authenticated;

revoke execute on function public.send_friend_request(text) from public, anon;
revoke execute on function public.send_friend_request_to(uuid) from public, anon;
revoke execute on function public.respond_friend_request(uuid, text) from public, anon;
revoke execute on function public.unfriend(uuid) from public, anon;
revoke execute on function public.block_user(uuid) from public, anon;
revoke execute on function public.unblock_user(uuid) from public, anon;
revoke execute on function public.list_blocks() from public, anon;
revoke execute on function public.list_friends() from public, anon;
revoke execute on function public.invite_to_room(uuid, uuid) from public, anon;
revoke execute on function public.list_mail() from public, anon;
revoke execute on function public.claim_mail(bigint) from public, anon;
revoke execute on function public.accept_room_invite(bigint) from public, anon;
revoke execute on function public.delete_mail(bigint) from public, anon;
revoke execute on function public.push_notification(text) from public, anon;
revoke execute on function public.list_notifications() from public, anon;
revoke execute on function public.mark_notifications_read() from public, anon;
revoke execute on function public.inbox_counts() from public, anon;
revoke execute on function public.enter_room(uuid, text) from public, anon;

grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.send_friend_request_to(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, text) to authenticated;
grant execute on function public.unfriend(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.list_blocks() to authenticated;
grant execute on function public.list_friends() to authenticated;
grant execute on function public.invite_to_room(uuid, uuid) to authenticated;
grant execute on function public.list_mail() to authenticated;
grant execute on function public.claim_mail(bigint) to authenticated;
grant execute on function public.accept_room_invite(bigint) to authenticated;
grant execute on function public.delete_mail(bigint) to authenticated;
grant execute on function public.push_notification(text) to authenticated;
grant execute on function public.list_notifications() to authenticated;
grant execute on function public.mark_notifications_read() to authenticated;
grant execute on function public.inbox_counts() to authenticated;
grant execute on function public.enter_room(uuid, text) to authenticated;
