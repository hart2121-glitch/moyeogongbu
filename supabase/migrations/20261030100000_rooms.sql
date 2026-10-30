-- Story 004: 실시간 6석 회사 방 (`design/game-brief.md` "방과 친구").
-- 방, 멤버, 강퇴 목록, 좌석, 접속(동시 인원)은 서버 표에 있고, 쓰기는 모두 아래 SECURITY DEFINER RPC로만 한다.
-- 이동과 반응은 Supabase Realtime 방 채널(broadcast, presence)로만 오가고 DB에는 남지 않는다.
-- 수치는 room_rules 한 줄이 서버 쪽 유일한 출처이고, 화면 쪽 짝은 src/features/room/model/roomConfig.ts다.
-- 둘 중 하나를 바꾸면 다른 쪽도 함께 바꾼다.

create table public.room_rules (
  id boolean primary key default true check (id),
  -- 한 사람이 만들 수 있는 방 수 (roomConfig.maxOwnedRooms).
  max_owned_rooms integer not null check (max_owned_rooms > 0),
  -- 방 멤버 최대 수, 방장 포함 (roomConfig.maxMembers).
  max_members integer not null check (max_members > 0),
  -- 동시에 방 안에 있을 수 있는 사람 수 (roomConfig.maxConcurrent).
  max_concurrent integer not null check (max_concurrent > 0),
  -- 좌석 수. room_seats.seat_no 검사(1..6)와 같아야 한다 (roomConfig.seatCount).
  seat_count integer not null check (seat_count between 1 and 6),
  -- 연결 끊김 유예 (초). 지나면 좌석과 접속 자리를 푼다 (roomConfig.reconnectGraceMs).
  grace_seconds integer not null check (grace_seconds > 0)
);

comment on table public.room_rules is '방 수치의 서버 쪽 유일한 출처. 화면 쪽 짝은 roomConfig.ts.';

insert into public.room_rules (max_owned_rooms, max_members, max_concurrent, seat_count, grace_seconds)
values (3, 6, 6, 6, 120);

alter table public.room_rules enable row level security;
revoke all on public.room_rules from anon, authenticated;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  -- 방장. 계정 삭제 때는 delete_account가 먼저 넘기거나 방을 지우므로 연쇄 삭제를 걸지 않는다.
  owner_id uuid not null references auth.users (id),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 20),
  -- 헷갈리는 0, O, 1, I, L을 뺀 31자에서 고른 6자리 초대 코드.
  invite_code text not null unique check (invite_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  created_at timestamptz not null default now()
);

comment on table public.rooms is '회사 스터디룸. 6석 고정. RPC로만 바뀐다.';

create index rooms_owner on public.rooms (owner_id);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

comment on table public.room_members is '방 멤버 (내 방 목록). 방장도 멤버다.';

create index room_members_user on public.room_members (user_id);

create table public.room_bans (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  banned_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

comment on table public.room_bans is '강퇴된 사람. 방장이 풀어 주기 전에는 같은 방에 다시 들어올 수 없다.';

create table public.room_seats (
  room_id uuid not null references public.rooms (id) on delete cascade,
  seat_no smallint not null check (seat_no between 1 and 6),
  -- 앉은 사람. 마지막 응답(last_seen)이 유예보다 오래되면 빈자리로 본다.
  user_id uuid null references auth.users (id) on delete set null,
  last_seen timestamptz null,
  primary key (room_id, seat_no)
);

comment on table public.room_seats is '방마다 6줄. 좌석 점유는 claim_seat만 정한다.';

-- 한 사람은 한 방에서 한 자리만.
create unique index room_seats_one_per_user on public.room_seats (room_id, user_id) where user_id is not null;

create table public.room_presence (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tab_id text not null check (char_length(tab_id) between 8 and 64),
  last_seen timestamptz not null default now(),
  primary key (room_id, user_id, tab_id)
);

comment on table public.room_presence is '방 안에 있는 탭. 동시 인원 판정에 쓴다. 유예가 지난 줄은 무시하고 지운다.';

-- "지금 하는 일". 공개(shared)한 경우에만 같은 방 멤버에게 보인다. Story 005가 할 일과 이을 수 있다.
create table public.study_current_tasks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  task text null check (task is null or (task = btrim(task) and char_length(task) between 1 and 50)),
  shared boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.study_current_tasks is '계정별 지금 하는 일. set_current_task로만 바뀐다.';

-- 호출한 사람이 방 멤버인지. RLS 정책이 쓰며, 자기 멤버십만 알려 준다.
create or replace function public.is_room_member(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members m where m.room_id = p_room and m.user_id = auth.uid());
$$;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_bans enable row level security;
alter table public.room_seats enable row level security;
alter table public.room_presence enable row level security;
alter table public.study_current_tasks enable row level security;

create policy "멤버만 방 조회" on public.rooms for select to authenticated
  using (public.is_room_member(id));
create policy "멤버만 멤버 목록 조회" on public.room_members for select to authenticated
  using (public.is_room_member(room_id));
create policy "멤버만 좌석 조회" on public.room_seats for select to authenticated
  using (public.is_room_member(room_id));
create policy "멤버만 접속 조회" on public.room_presence for select to authenticated
  using (public.is_room_member(room_id));
create policy "방장만 강퇴 목록 조회" on public.room_bans for select to authenticated
  using (exists (select 1 from public.rooms r where r.id = room_id and r.owner_id = (select auth.uid())));
create policy "본인 지금 하는 일 조회" on public.study_current_tasks for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.rooms, public.room_members, public.room_bans, public.room_seats,
  public.room_presence, public.study_current_tasks from anon, authenticated;
grant select on public.rooms, public.room_members, public.room_bans, public.room_seats,
  public.room_presence, public.study_current_tasks to authenticated;

-- 내부 함수 ---------------------------------------------------------------

create or replace function public.room_rules_row()
returns public.room_rules
language sql
stable
set search_path = ''
as $$
  select r from public.room_rules r where r.id;
$$;

create or replace function public.room_grace()
returns interval
language sql
stable
set search_path = ''
as $$
  select make_interval(secs => r.grace_seconds) from public.room_rules r where r.id;
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms r where r.invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.room_require_login()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  return auth.uid();
end;
$$;

create or replace function public.room_require_member(p_room uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.room_require_login();
  if not exists (
    select 1 from public.room_members m where m.room_id = p_room and m.user_id = auth.uid()) then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
end;
$$;

-- 방 줄을 잠그고 방장인지 확인한다.
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
  if r.id is null or r.owner_id <> auth.uid() then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  return r;
end;
$$;

-- 화면용 방 정보 (호출한 사람 기준).
create or replace function public.room_json(p_room uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'invite_code', r.invite_code,
    'owner_id', r.owner_id,
    'is_owner', r.owner_id = auth.uid(),
    'created_at', r.created_at,
    'member_count', (select count(*) from public.room_members m where m.room_id = r.id),
    'online_count', (select count(distinct p.user_id) from public.room_presence p
                      where p.room_id = r.id and p.last_seen >= now() - public.room_grace()))
  from public.rooms r where r.id = p_room;
$$;

-- 좌석과 접속한 사람. 유예가 지난 좌석은 빈자리로 보낸다.
create or replace function public.room_state(p_room uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'server_now', now(),
    'seats', coalesce((
      select jsonb_agg(jsonb_build_object(
               'seat_no', s.seat_no,
               'user_id', case when s.last_seen >= now() - public.room_grace() then s.user_id end)
             order by s.seat_no)
        from public.room_seats s where s.room_id = p_room), '[]'::jsonb),
    'online', coalesce((
      select jsonb_agg(distinct p.user_id) from public.room_presence p
       where p.room_id = p_room and p.last_seen >= now() - public.room_grace()), '[]'::jsonb));
$$;

-- 멤버 한 명을 방에서 뺀다. 방장이었으면 가장 오래 함께한 멤버에게 넘기고, 남은 사람이 없으면 방을 지운다.
create or replace function public.room_remove_member(p_room uuid, p_user uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_owner uuid;
  v_next uuid;
begin
  select r.owner_id into v_owner from public.rooms r where r.id = p_room for update;
  update public.room_seats s set user_id = null, last_seen = null
   where s.room_id = p_room and s.user_id = p_user;
  delete from public.room_presence p where p.room_id = p_room and p.user_id = p_user;
  delete from public.room_members m where m.room_id = p_room and m.user_id = p_user;
  if v_owner = p_user then
    select m.user_id into v_next from public.room_members m
     where m.room_id = p_room order by m.joined_at, m.user_id limit 1;
    if v_next is null then
      delete from public.rooms r where r.id = p_room;
    else
      update public.rooms r set owner_id = v_next where r.id = p_room;
    end if;
  end if;
end;
$$;

-- 유예가 지난 좌석과 접속 줄을 정리한다.
create or replace function public.room_sweep(p_room uuid)
returns void
language sql
set search_path = ''
as $$
  update public.room_seats s set user_id = null, last_seen = null
   where s.room_id = p_room and s.user_id is not null and s.last_seen < now() - public.room_grace();
  delete from public.room_presence p
   where p.room_id = p_room and p.last_seen < now() - public.room_grace();
$$;

-- 이 탭을 접속 목록에 넣는다. 다른 사람이 이미 동시 인원만큼 있으면 room_full.
create or replace function public.room_touch_presence(p_room uuid, p_tab_id text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  r public.room_rules := public.room_rules_row();
begin
  if p_tab_id is null or char_length(p_tab_id) not between 8 and 64 then
    raise exception '탭 식별자가 올바르지 않습니다' using errcode = '22023';
  end if;
  if not exists (select 1 from public.room_presence p where p.room_id = p_room and p.user_id = auth.uid())
     and (select count(distinct p.user_id) from public.room_presence p
           where p.room_id = p_room and p.user_id <> auth.uid()) >= r.max_concurrent then
    raise exception 'room_full' using errcode = 'P0001';
  end if;
  insert into public.room_presence (room_id, user_id, tab_id, last_seen)
  values (p_room, auth.uid(), p_tab_id, now())
  on conflict (room_id, user_id, tab_id) do update set last_seen = now();
end;
$$;

-- 클라이언트 RPC -----------------------------------------------------------

-- 내 방 목록 (멤버인 방, 들어온 순서).
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
      from public.room_members m where m.user_id = auth.uid()), '[]'::jsonb);
end;
$$;

-- 방 만들기. 한 사람당 room_rules.max_owned_rooms개까지.
create or replace function public.create_room(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.room_rules := public.room_rules_row();
  v_name text := btrim(coalesce(p_name, ''));
  v_room uuid;
begin
  perform public.room_require_login();
  if char_length(v_name) not between 1 and 20 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('room-owner:' || auth.uid()::text, 0));
  if (select count(*) from public.rooms x where x.owner_id = auth.uid()) >= r.max_owned_rooms then
    raise exception 'room_limit' using errcode = 'P0001';
  end if;
  insert into public.rooms (owner_id, name, invite_code)
  values (auth.uid(), v_name, public.generate_invite_code())
  returning id into v_room;
  insert into public.room_members (room_id, user_id) values (v_room, auth.uid());
  insert into public.room_seats (room_id, seat_no)
  select v_room, g from generate_series(1, r.seat_count) g;
  return public.room_json(v_room);
end;
$$;

-- 초대 코드로 들어가기. 이미 멤버면 그 방을 돌려준다. 강퇴됐으면 banned, 멤버가 다 찼으면 members_full.
create or replace function public.join_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.room_rules := public.room_rules_row();
  v_room public.rooms;
begin
  perform public.room_require_login();
  select * into v_room from public.rooms x
   where x.invite_code = upper(btrim(coalesce(p_code, ''))) for update;
  if v_room.id is null then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.room_members m where m.room_id = v_room.id and m.user_id = auth.uid()) then
    return public.room_json(v_room.id);
  end if;
  if exists (select 1 from public.room_bans b where b.room_id = v_room.id and b.user_id = auth.uid()) then
    raise exception 'banned' using errcode = 'P0001';
  end if;
  if (select count(*) from public.room_members m where m.room_id = v_room.id) >= r.max_members then
    raise exception 'members_full' using errcode = 'P0001';
  end if;
  insert into public.room_members (room_id, user_id) values (v_room.id, auth.uid());
  return public.room_json(v_room.id);
end;
$$;

-- 방 나가기 (내 방 목록에서 빠진다). 방장이 나가면 가장 오래 함께한 멤버가 방장이 된다.
create or replace function public.leave_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_member(p_room);
  perform public.room_remove_member(p_room, auth.uid());
end;
$$;

create or replace function public.rename_room(p_room uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
begin
  perform public.room_require_owner(p_room);
  if char_length(v_name) not between 1 and 20 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  update public.rooms r set name = v_name where r.id = p_room;
  return public.room_json(p_room);
end;
$$;

-- 초대 코드 재발급. 이전 코드로는 더 들어올 수 없다 (이미 멤버인 사람은 그대로).
create or replace function public.reissue_code(p_room uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_owner(p_room);
  update public.rooms r set invite_code = public.generate_invite_code() where r.id = p_room;
  return public.room_json(p_room);
end;
$$;

-- 강퇴: 멤버에서 빼고 강퇴 목록에 넣는다.
create or replace function public.kick_member(p_room uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_owner(p_room);
  if p_user is null or p_user = auth.uid() then
    raise exception 'invalid_member' using errcode = '22023';
  end if;
  if not exists (select 1 from public.room_members m where m.room_id = p_room and m.user_id = p_user) then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
  perform public.room_remove_member(p_room, p_user);
  insert into public.room_bans (room_id, user_id) values (p_room, p_user)
  on conflict (room_id, user_id) do nothing;
end;
$$;

create or replace function public.unban_member(p_room uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_owner(p_room);
  delete from public.room_bans b where b.room_id = p_room and b.user_id = p_user;
end;
$$;

-- 강퇴 목록 (방장만). 다른 사람 프로필은 RLS로 읽을 수 없어 이름을 함께 준다.
create or replace function public.list_room_bans(p_room uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_owner(p_room);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'user_id', b.user_id, 'display_name', p.display_name, 'banned_at', b.banned_at)
           order by b.banned_at)
      from public.room_bans b left join public.profiles p on p.id = b.user_id
     where b.room_id = p_room), '[]'::jsonb);
end;
$$;

-- 방에 들어간다 (이 탭을 접속 목록에 넣는다). 7번째 사람이면 room_full.
create or replace function public.enter_room(p_room uuid, p_tab_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_member(p_room);
  -- 같은 방의 입장을 하나씩 처리해 동시 인원 검사가 겹치지 않게 한다.
  perform 1 from public.rooms r where r.id = p_room for update;
  perform public.room_sweep(p_room);
  perform public.room_touch_presence(p_room, p_tab_id);
  update public.room_seats s set last_seen = now()
   where s.room_id = p_room and s.user_id = auth.uid();
  return public.room_state(p_room);
end;
$$;

-- 연결 확인. 유예 안이면 접속과 좌석을 이어 가고, 지났으면 좌석이 풀린 상태를 돌려준다.
create or replace function public.heartbeat_room(p_room uuid, p_tab_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_member(p_room);
  perform 1 from public.rooms r where r.id = p_room for update;
  perform public.room_sweep(p_room);
  perform public.room_touch_presence(p_room, p_tab_id);
  update public.room_seats s set last_seen = now()
   where s.room_id = p_room and s.user_id = auth.uid();
  return public.room_state(p_room);
end;
$$;

-- 방에서 나온다 (탭을 닫거나 퇴근). 다른 탭이 남아 있지 않으면 좌석도 푼다.
create or replace function public.exit_room(p_room uuid, p_tab_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  delete from public.room_presence p
   where p.room_id = p_room and p.user_id = auth.uid() and p.tab_id = p_tab_id;
  if not exists (select 1 from public.room_presence p where p.room_id = p_room and p.user_id = auth.uid()) then
    update public.room_seats s set user_id = null, last_seen = null
     where s.room_id = p_room and s.user_id = auth.uid();
  end if;
end;
$$;

-- 좌석 잡기. 방마다 하나씩 처리해 두 사람이 같은 자리를 눌러도 한 명만 앉는다.
-- 앉은 사람의 마지막 응답이 유예(2분)보다 오래됐으면 빈자리로 본다. 한 사람은 한 자리만 가진다.
create or replace function public.claim_seat(p_room uuid, p_seat integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.room_rules := public.room_rules_row();
  v_seat public.room_seats;
begin
  perform public.room_require_member(p_room);
  if p_seat is null or p_seat not between 1 and r.seat_count then
    raise exception 'invalid_seat' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('room-seats:' || p_room::text, 0));
  if not exists (
    select 1 from public.room_presence p
     where p.room_id = p_room and p.user_id = auth.uid() and p.last_seen >= now() - public.room_grace()) then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  select * into v_seat from public.room_seats s where s.room_id = p_room and s.seat_no = p_seat for update;
  if v_seat.user_id is not null and v_seat.user_id <> auth.uid()
     and v_seat.last_seen >= now() - public.room_grace() then
    return false;
  end if;
  update public.room_seats s set user_id = null, last_seen = null
   where s.room_id = p_room and s.user_id = auth.uid() and s.seat_no <> p_seat;
  update public.room_seats s set user_id = auth.uid(), last_seen = now()
   where s.room_id = p_room and s.seat_no = p_seat;
  return true;
end;
$$;

create or replace function public.release_seat(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  update public.room_seats s set user_id = null, last_seen = null
   where s.room_id = p_room and s.user_id = auth.uid();
end;
$$;

-- 같은 방 멤버의 이름, 상태, 오늘 공부 시간(Story 002 날짜 계산), 공개한 지금 하는 일.
-- 호출한 사람이 그 방 멤버일 때만 돌려준다.
create or replace function public.room_member_status(p_room uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.room_require_member(p_room);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'user_id', m.user_id,
             'display_name', p.display_name,
             'is_owner', r.owner_id = m.user_id,
             'joined_at', m.joined_at,
             'state', case
                        when s.user_id is null or s.state = 'left' then 'left'
                        when s.last_seen < now() - public.room_grace() then 'away'
                        else s.state end,
             'today_seconds', coalesce((
               select t.seconds from public.study_split_by_day(
                 m.user_id, public.study_day_of(now()), public.study_day_of(now()), false) t), 0),
             'current_task', case when c.shared then c.task end)
           order by m.joined_at, m.user_id)
      from public.room_members m
      join public.rooms r on r.id = m.room_id
      left join public.profiles p on p.id = m.user_id
      left join public.study_sessions s on s.user_id = m.user_id
      left join public.study_current_tasks c on c.user_id = m.user_id
     where m.room_id = p_room), '[]'::jsonb);
end;
$$;

-- 지금 하는 일 저장. 빈 글자는 지운다.
create or replace function public.set_current_task(p_task text, p_shared boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task text := nullif(btrim(coalesce(p_task, '')), '');
begin
  perform public.room_require_login();
  if v_task is not null and char_length(v_task) > 50 then
    raise exception 'invalid_task' using errcode = '22023';
  end if;
  insert into public.study_current_tasks (user_id, task, shared, updated_at)
  values (auth.uid(), v_task, coalesce(p_shared, false), now())
  on conflict (user_id) do update
    set task = excluded.task, shared = excluded.shared, updated_at = now();
  return jsonb_build_object('task', v_task, 'shared', coalesce(p_shared, false));
end;
$$;

create or replace function public.my_current_task()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  return coalesce((
    select jsonb_build_object('task', c.task, 'shared', c.shared)
      from public.study_current_tasks c where c.user_id = auth.uid()),
    jsonb_build_object('task', null, 'shared', false));
end;
$$;

-- Story 001의 계정 삭제를 넓힌다: 내가 방장인 방은 가장 오래 함께한 멤버에게 넘기고,
-- 남은 사람이 없으면 방을 지운 뒤 계정을 지운다. 멤버, 좌석, 접속, 강퇴 줄은 연쇄로 정리된다.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  for v_room in select r.id from public.rooms r where r.owner_id = auth.uid() order by r.created_at loop
    perform public.room_remove_member(v_room, auth.uid());
  end loop;
  delete from auth.users where id = auth.uid();
end;
$$;

-- 권한 -------------------------------------------------------------------

revoke execute on function public.room_rules_row() from public, anon, authenticated;
revoke execute on function public.room_grace() from public, anon, authenticated;
revoke execute on function public.generate_invite_code() from public, anon, authenticated;
revoke execute on function public.room_require_login() from public, anon, authenticated;
revoke execute on function public.room_require_member(uuid) from public, anon, authenticated;
revoke execute on function public.room_require_owner(uuid) from public, anon, authenticated;
revoke execute on function public.room_json(uuid) from public, anon, authenticated;
revoke execute on function public.room_state(uuid) from public, anon, authenticated;
revoke execute on function public.room_remove_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.room_sweep(uuid) from public, anon, authenticated;
revoke execute on function public.room_touch_presence(uuid, text) from public, anon, authenticated;

-- RLS 정책이 호출하므로 authenticated만 실행할 수 있다 (자기 멤버십만 알려 준다).
revoke execute on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

revoke execute on function public.list_my_rooms() from public, anon;
revoke execute on function public.create_room(text) from public, anon;
revoke execute on function public.join_by_code(text) from public, anon;
revoke execute on function public.leave_room(uuid) from public, anon;
revoke execute on function public.rename_room(uuid, text) from public, anon;
revoke execute on function public.reissue_code(uuid) from public, anon;
revoke execute on function public.kick_member(uuid, uuid) from public, anon;
revoke execute on function public.unban_member(uuid, uuid) from public, anon;
revoke execute on function public.list_room_bans(uuid) from public, anon;
revoke execute on function public.enter_room(uuid, text) from public, anon;
revoke execute on function public.heartbeat_room(uuid, text) from public, anon;
revoke execute on function public.exit_room(uuid, text) from public, anon;
revoke execute on function public.claim_seat(uuid, integer) from public, anon;
revoke execute on function public.release_seat(uuid) from public, anon;
revoke execute on function public.room_member_status(uuid) from public, anon;
revoke execute on function public.set_current_task(text, boolean) from public, anon;
revoke execute on function public.my_current_task() from public, anon;
revoke execute on function public.delete_account() from public, anon;

grant execute on function public.list_my_rooms() to authenticated;
grant execute on function public.create_room(text) to authenticated;
grant execute on function public.join_by_code(text) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.rename_room(uuid, text) to authenticated;
grant execute on function public.reissue_code(uuid) to authenticated;
grant execute on function public.kick_member(uuid, uuid) to authenticated;
grant execute on function public.unban_member(uuid, uuid) to authenticated;
grant execute on function public.list_room_bans(uuid) to authenticated;
grant execute on function public.enter_room(uuid, text) to authenticated;
grant execute on function public.heartbeat_room(uuid, text) to authenticated;
grant execute on function public.exit_room(uuid, text) to authenticated;
grant execute on function public.claim_seat(uuid, integer) to authenticated;
grant execute on function public.release_seat(uuid) to authenticated;
grant execute on function public.room_member_status(uuid) to authenticated;
grant execute on function public.set_current_task(text, boolean) to authenticated;
grant execute on function public.my_current_task() to authenticated;
grant execute on function public.delete_account() to authenticated;
