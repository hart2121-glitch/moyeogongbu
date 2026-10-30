-- Story 002: 공부 세션. 공부 시간은 서버 시각(now())으로만 기록한다.
-- 계정당 세션 하나(study_sessions)와 공부로 인정된 구간(study_intervals)을 둔다.
-- 수치 기준은 src/features/session/model/sessionConfig.ts와 같다:
--   하루 경계 한국 시간 오전 5시, 연결 끊김 유예 2분.
-- 클라이언트는 표를 직접 고치지 못하고 아래 RPC만 쓴다.

create table public.study_sessions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- 세션을 가진 탭의 임의 식별자. 새 탭이 넘겨받으면 바뀐다.
  tab_id text not null check (char_length(tab_id) between 8 and 64),
  state text not null check (state in ('studying', 'break', 'away', 'left')),
  state_since timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

comment on table public.study_sessions is '계정당 하나인 공부 세션. RPC로만 바뀌고 계정 삭제 시 연쇄 삭제된다.';

create table public.study_intervals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  -- null이면 지금 공부 중인 구간.
  ended_at timestamptz null check (ended_at is null or ended_at >= started_at)
);

comment on table public.study_intervals is '공부 시간으로 인정된 구간만 기록한다. 휴식, 자리 비움, 끊김 시간은 들어가지 않는다.';

-- 계정마다 열린 구간은 하나뿐이다.
create unique index study_intervals_one_open on public.study_intervals (user_id) where ended_at is null;
create index study_intervals_user_started on public.study_intervals (user_id, started_at);

alter table public.study_sessions enable row level security;
alter table public.study_intervals enable row level security;

create policy "본인 세션만 조회"
  on public.study_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "본인 공부 구간만 조회"
  on public.study_intervals for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.study_sessions from anon, authenticated;
revoke all on public.study_intervals from anon, authenticated;
grant select on public.study_sessions to authenticated;
grant select on public.study_intervals to authenticated;

-- 이전 탭이 세션을 빼앗겼는지 알 수 있도록 실시간 변경을 내보낸다.
alter publication supabase_realtime add table public.study_sessions;

-- 시각이 속한 공부 날짜. 한국 시간 오전 5시에 날짜가 바뀐다.
create or replace function public.study_day_of(t timestamptz)
returns date
language sql
immutable
set search_path = ''
as $$
  select ((t at time zone 'Asia/Seoul') - interval '5 hours')::date;
$$;

-- 공부 날짜가 시작하는 시각 (그날 한국 시간 오전 5시).
create or replace function public.study_day_start(d date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select (d + time '05:00') at time zone 'Asia/Seoul';
$$;

-- 계정의 공부 구간. 열린 구간은 끊김 유예(2분)가 지났으면 마지막 응답 시각에서, 아니면 지금 끝난 것으로 본다.
create or replace function public.study_effective_intervals(p_user uuid)
returns table (started_at timestamptz, ended_at timestamptz, is_open boolean)
language sql
stable
set search_path = ''
as $$
  select i.started_at,
         coalesce(
           i.ended_at,
           case when s.last_seen < now() - interval '2 minutes'
                then greatest(i.started_at, s.last_seen)
                else now() end
         ),
         i.ended_at is null and coalesce(s.last_seen >= now() - interval '2 minutes', false)
  from public.study_intervals i
  left join public.study_sessions s on s.user_id = i.user_id
  where i.user_id = p_user;
$$;

-- 구간을 오전 5시 경계로 나눠 날짜별 초를 낸다.
create or replace function public.study_split_by_day(p_user uuid, p_from date, p_to date, p_closed_only boolean)
returns table (day date, seconds bigint)
language sql
stable
set search_path = ''
as $$
  select g.d::date as day,
         sum(extract(epoch from
               least(iv.ended_at, public.study_day_start(g.d::date + 1))
               - greatest(iv.started_at, public.study_day_start(g.d::date))))::bigint
  from public.study_effective_intervals(p_user) iv
  cross join lateral generate_series(
    public.study_day_of(iv.started_at)::timestamp,
    public.study_day_of(iv.ended_at)::timestamp,
    interval '1 day') as g(d)
  where g.d::date between p_from and p_to
    and not (p_closed_only and iv.is_open)
    and least(iv.ended_at, public.study_day_start(g.d::date + 1))
        > greatest(iv.started_at, public.study_day_start(g.d::date))
  group by g.d::date
  order by 1;
$$;

-- 화면이 쓰는 현재 상태: 서버 시각, 오늘 날짜, 오늘 닫힌 구간의 초, 열린 구간의 시작.
create or replace function public.study_snapshot(p_user uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'server_now', now(),
    'day', public.study_day_of(now()),
    'closed_seconds', coalesce((
      select t.seconds from public.study_split_by_day(
        p_user, public.study_day_of(now()), public.study_day_of(now()), true) t), 0),
    'open_since', (select iv.started_at from public.study_effective_intervals(p_user) iv where iv.is_open),
    'state', s.state,
    'tab_id', s.tab_id)
  from (select 1) one
  left join public.study_sessions s on s.user_id = p_user;
$$;

-- 끊김 유예가 지난 세션의 열린 구간을 마지막 응답 시각에 닫는다. 닫았으면 true.
create or replace function public.study_settle_stale(p_user uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  seen timestamptz;
begin
  select s.last_seen into seen from public.study_sessions s where s.user_id = p_user;
  if seen is null or seen >= now() - interval '2 minutes' then
    return false;
  end if;
  update public.study_intervals i
     set ended_at = greatest(i.started_at, seen)
   where i.user_id = p_user and i.ended_at is null;
  return found;
end;
$$;

-- 이 탭이 세션 주인인지 확인하고 행을 잠근다. 다른 탭이 넘겨받았으면 session_taken 오류.
create or replace function public.study_lock_own(p_tab_id text)
returns public.study_sessions
language plpgsql
set search_path = ''
as $$
declare
  sess public.study_sessions;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  select * into sess from public.study_sessions s where s.user_id = auth.uid() for update;
  if sess.user_id is null or sess.tab_id <> p_tab_id then
    raise exception 'session_taken' using errcode = 'P0001';
  end if;
  return sess;
end;
$$;

-- 이 탭이 세션을 가진다 (새 탭, 새로고침, 다시 가져오기). 새 탭은 좌석 밖에서 시작하므로 측정은 멈춘다.
create or replace function public.claim_study_session(p_tab_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_tab_id is null or char_length(p_tab_id) not between 8 and 64 then
    raise exception '탭 식별자가 올바르지 않습니다' using errcode = '22023';
  end if;
  perform 1 from public.study_sessions s where s.user_id = auth.uid() for update;
  perform public.study_settle_stale(auth.uid());
  update public.study_intervals i set ended_at = now()
   where i.user_id = auth.uid() and i.ended_at is null;
  insert into public.study_sessions (user_id, tab_id, state, state_since, last_seen)
  values (auth.uid(), p_tab_id, 'break', now(), now())
  on conflict (user_id) do update
    set tab_id = excluded.tab_id, state = 'break', state_since = now(), last_seen = now();
  return public.study_snapshot(auth.uid());
end;
$$;

-- 상태 변경. 공부 중이 되면 구간을 열고, 휴식이나 퇴근이면 닫는다.
create or replace function public.set_study_state(p_tab_id text, p_state text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_state is null or p_state not in ('studying', 'break', 'left') then
    raise exception '상태가 올바르지 않습니다' using errcode = '22023';
  end if;
  perform public.study_lock_own(p_tab_id);
  perform public.study_settle_stale(auth.uid());
  if p_state = 'studying' then
    insert into public.study_intervals (user_id, started_at)
    select auth.uid(), now()
    where not exists (
      select 1 from public.study_intervals i where i.user_id = auth.uid() and i.ended_at is null);
  else
    update public.study_intervals i set ended_at = now()
     where i.user_id = auth.uid() and i.ended_at is null;
  end if;
  update public.study_sessions s
     set state = p_state,
         state_since = case when s.state = p_state then s.state_since else now() end,
         last_seen = now()
   where s.user_id = auth.uid();
  return public.study_snapshot(auth.uid());
end;
$$;

-- 연결 확인. 끊김 유예가 지난 뒤 돌아왔으면 끊긴 동안을 빼고, 공부 중이었으면 지금부터 다시 센다.
create or replace function public.heartbeat_study_session(p_tab_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sess public.study_sessions;
begin
  sess := public.study_lock_own(p_tab_id);
  if public.study_settle_stale(auth.uid()) and sess.state = 'studying' then
    insert into public.study_intervals (user_id, started_at) values (auth.uid(), now());
  end if;
  update public.study_sessions s set last_seen = now() where s.user_id = auth.uid();
  return public.study_snapshot(auth.uid());
end;
$$;

-- 자리 비움. 확인 문구를 띄운 시각(p_at)에 열린 구간을 닫아 응답을 기다린 시간을 뺀다.
-- p_at은 [구간 시작, 지금] 범위로 맞춘다.
create or replace function public.mark_study_away(p_tab_id text, p_at timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_at is null then
    raise exception '시각이 필요합니다' using errcode = '22023';
  end if;
  perform public.study_lock_own(p_tab_id);
  perform public.study_settle_stale(auth.uid());
  update public.study_intervals i
     set ended_at = greatest(i.started_at, least(p_at, now()))
   where i.user_id = auth.uid() and i.ended_at is null;
  update public.study_sessions s
     set state = 'away', state_since = now(), last_seen = now()
   where s.user_id = auth.uid();
  return public.study_snapshot(auth.uid());
end;
$$;

-- 날짜별 공부 시간 (초). 오전 5시를 넘는 구간은 두 날짜로 나뉜다.
create or replace function public.study_daily_totals(p_from date, p_to date)
returns table (day date, seconds bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 366 then
    raise exception '기간이 올바르지 않습니다' using errcode = '22023';
  end if;
  return query select t.day, t.seconds from public.study_split_by_day(auth.uid(), p_from, p_to, false) t;
end;
$$;

-- 내부 함수는 클라이언트가 직접 부르지 못한다.
revoke execute on function public.study_effective_intervals(uuid) from public, anon, authenticated;
revoke execute on function public.study_split_by_day(uuid, date, date, boolean) from public, anon, authenticated;
revoke execute on function public.study_snapshot(uuid) from public, anon, authenticated;
revoke execute on function public.study_settle_stale(uuid) from public, anon, authenticated;
revoke execute on function public.study_lock_own(text) from public, anon, authenticated;

revoke execute on function public.claim_study_session(text) from public, anon;
revoke execute on function public.set_study_state(text, text) from public, anon;
revoke execute on function public.heartbeat_study_session(text) from public, anon;
revoke execute on function public.mark_study_away(text, timestamptz) from public, anon;
revoke execute on function public.study_daily_totals(date, date) from public, anon;
grant execute on function public.claim_study_session(text) to authenticated;
grant execute on function public.set_study_state(text, text) to authenticated;
grant execute on function public.heartbeat_study_session(text) to authenticated;
grant execute on function public.mark_study_away(text, timestamptz) to authenticated;
grant execute on function public.study_daily_totals(date, date) to authenticated;
