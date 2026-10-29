-- Story 003: 시급 코인과 퇴근 정산 (`design/game-brief.md` "세션과 보상").
-- 코인은 서버만 계산하고 기록한다. 클라이언트는 원장을 읽기만 하고 아래 RPC만 부른다.
-- 모든 수치는 coin_rules 한 줄에 있다. 바꾸려면 이 행만 고친다 (코드에는 수치를 두지 않는다).

-- 보상 규칙. 한 줄만 있을 수 있다.
create table public.coin_rules (
  id boolean primary key default true check (id),
  -- 다 찬 1분마다 주는 코인 (시급 = 60배).
  study_coins_per_minute integer not null check (study_coins_per_minute >= 0),
  -- 하루 공부 코인 상한. 600이면 1분당 1코인 기준 10시간.
  study_daily_coin_cap integer not null check (study_daily_coin_cap >= 0),
  pomodoro_bonus integer not null check (pomodoro_bonus >= 0),
  pomodoro_min_study_minutes integer not null check (pomodoro_min_study_minutes > 0),
  pomodoro_max_study_minutes integer not null,
  pomodoro_daily_max integer not null check (pomodoro_daily_max >= 0),
  -- 서버와 화면 시계 차이, 착석 요청 지연을 봐 주는 여유 (초).
  pomodoro_slack_seconds integer not null check (pomodoro_slack_seconds >= 0),
  -- 공부 단계가 끝난 뒤 이 시간 안에 보너스를 요청해야 한다 (초).
  pomodoro_claim_window_seconds integer not null check (pomodoro_claim_window_seconds > 0),
  todo_coins integer not null check (todo_coins >= 0),
  todo_daily_max integer not null check (todo_daily_max >= 0),
  check (pomodoro_max_study_minutes >= pomodoro_min_study_minutes)
);

comment on table public.coin_rules is '코인 보상 수치의 유일한 출처. 화면은 get_coin_summary로 읽는다.';

insert into public.coin_rules (
  study_coins_per_minute, study_daily_coin_cap,
  pomodoro_bonus, pomodoro_min_study_minutes, pomodoro_max_study_minutes, pomodoro_daily_max,
  pomodoro_slack_seconds, pomodoro_claim_window_seconds,
  todo_coins, todo_daily_max)
values (1, 600, 5, 20, 60, 10, 30, 300, 2, 10);

alter table public.coin_rules enable row level security;
revoke all on public.coin_rules from anon, authenticated;

-- 코인 원장. 잔액은 amount의 합이다. 같은 (계정, 종류, ref)는 한 번만 들어간다.
--   study: ref = 공부 날짜, 그날 공부 초에서 다시 계산해 같은 행을 고친다.
--   pomodoro: ref = 사이클 시작 시각 (epoch 초).
--   todo: ref = 할 일 id.
-- Story 007의 환영 선물, 구매(음수 amount)는 kind 검사를 넓혀 추가한다.
create table public.coin_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('study', 'pomodoro', 'todo')),
  amount integer not null,
  ref text not null,
  created_at timestamptz not null default now(),
  constraint coin_ledger_once unique (user_id, kind, ref)
);

comment on table public.coin_ledger is '코인 적립 내역. 서버 함수만 쓰고, 계정 삭제 시 연쇄 삭제된다.';

create index coin_ledger_user_day on public.coin_ledger (user_id, day);

alter table public.coin_ledger enable row level security;

create policy "본인 코인 내역만 조회"
  on public.coin_ledger for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.coin_ledger from anon, authenticated;
grant select on public.coin_ledger to authenticated;

-- 할 일 (Story 003은 오늘 목록만. 날짜 이동, 하루 30개, 가져오기는 Story 005).
create table public.todos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default public.study_day_of(now()),
  text text not null check (char_length(text) <= 50 and char_length(btrim(text)) >= 1),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.todos is '날짜별 할 일. 완료하면 트리거가 코인을 준다. 계정 삭제 시 연쇄 삭제된다.';

create index todos_user_day on public.todos (user_id, day);

alter table public.todos enable row level security;

create policy "본인 할 일 조회" on public.todos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "본인 할 일 추가" on public.todos for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "본인 할 일 수정" on public.todos for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "본인 할 일 삭제" on public.todos for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.todos from anon, authenticated;
grant select, delete on public.todos to authenticated;
-- 추가는 글자만 (계정, 날짜, 완료 여부는 서버 기본값). 수정은 글자와 완료 여부만.
grant insert (text) on public.todos to authenticated;
grant update (text, done) on public.todos to authenticated;

-- 정산하지 않은 가장 최근 공부 날짜. 공부를 시작하면 채우고, 퇴근 정산이나 지난 정산을 닫으면 비운다.
alter table public.study_sessions add column unsettled_day date null;

-- 보상 규칙 한 줄.
create or replace function public.coin_rules_row()
returns public.coin_rules
language sql
stable
set search_path = ''
as $$
  select r from public.coin_rules r where r.id;
$$;

-- 공부 코인을 날짜별 공부 초에서 다시 계산한다. 여러 번 불러도 결과가 같다.
-- coins(day) = least(floor(seconds / 60) * rate, cap). 남은 초는 그날 안에서만 이어진다.
-- 마지막으로 계산한 날부터 오늘까지 고친다 (자리 비움 소급으로 줄어든 날은 줄인다).
create or replace function public.coin_refresh_study(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.coin_rules := public.coin_rules_row();
  v_today date := public.study_day_of(now());
  v_from date;
begin
  select max(l.day) into v_from from public.coin_ledger l where l.user_id = p_user and l.kind = 'study';
  if v_from is null then
    select public.study_day_of(min(i.started_at)) into v_from
      from public.study_intervals i where i.user_id = p_user;
  end if;
  if v_from is null then
    return;
  end if;
  v_from := least(greatest(v_from, v_today - 366), v_today);

  insert into public.coin_ledger as l (user_id, day, kind, amount, ref)
  select p_user, t.day, 'study',
         least((t.seconds / 60) * r.study_coins_per_minute, r.study_daily_coin_cap)::integer,
         t.day::text
    from public.study_split_by_day(p_user, v_from, v_today, false) t
  on conflict (user_id, kind, ref) do update
    set amount = excluded.amount
    where l.amount <> excluded.amount;

  update public.coin_ledger l set amount = 0
   where l.user_id = p_user and l.kind = 'study' and l.day between v_from and v_today and l.amount <> 0
     and not exists (
       select 1 from public.study_split_by_day(p_user, v_from, v_today, false) t where t.day = l.day);
end;
$$;

-- 하루 정산 내용: 공부 초, 종류별 코인, 그날 합계, 잔액.
create or replace function public.coin_day_summary(p_user uuid, p_day date)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'day', p_day,
    'study_seconds', coalesce((
      select t.seconds from public.study_split_by_day(p_user, p_day, p_day, false) t), 0),
    'coins', jsonb_build_object(
      'study', coalesce(sum(l.amount) filter (where l.kind = 'study'), 0),
      'pomodoro', coalesce(sum(l.amount) filter (where l.kind = 'pomodoro'), 0),
      'todo', coalesce(sum(l.amount) filter (where l.kind = 'todo'), 0)),
    'total', coalesce(sum(l.amount), 0),
    'balance', (select coalesce(sum(b.amount), 0) from public.coin_ledger b where b.user_id = p_user))
  from public.coin_ledger l
  where l.user_id = p_user and l.day = p_day and l.kind in ('study', 'pomodoro', 'todo');
$$;

-- 화면 표시용 규칙 (수치는 여기서만 읽는다).
create or replace function public.coin_rules_json()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'study_coins_per_minute', r.study_coins_per_minute,
    'study_daily_coin_cap', r.study_daily_coin_cap,
    'pomodoro_bonus', r.pomodoro_bonus,
    'pomodoro_min_study_minutes', r.pomodoro_min_study_minutes,
    'pomodoro_max_study_minutes', r.pomodoro_max_study_minutes,
    'pomodoro_daily_max', r.pomodoro_daily_max,
    'todo_coins', r.todo_coins,
    'todo_daily_max', r.todo_daily_max)
  from public.coin_rules r where r.id;
$$;

-- 오늘의 코인과 잔액, 표시용 규칙.
create or replace function public.get_coin_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  perform public.coin_refresh_study(auth.uid());
  return public.coin_day_summary(auth.uid(), public.study_day_of(now()))
         || jsonb_build_object('rules', public.coin_rules_json());
end;
$$;

-- 뽀모도로 완주 보너스. 사이클 시작부터 공부 단계 끝까지 끊김 없이 공부한 구간이 있어야 한다.
-- 같은 사이클은 한 번만, 겹치는 사이클은 안 되고, 하루 최대 횟수가 있다. 거절은 오류 대신 이유로 돌려준다.
create or replace function public.claim_pomodoro_bonus(p_cycle_started_at timestamptz, p_study_minutes integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.coin_rules := public.coin_rules_row();
  v_day date := public.study_day_of(now());
  v_end timestamptz;
  v_slack interval := make_interval(secs => r.pomodoro_slack_seconds);
  v_awarded boolean;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_cycle_started_at is null or p_study_minutes is null
     or p_study_minutes not between r.pomodoro_min_study_minutes and r.pomodoro_max_study_minutes then
    raise exception '뽀모도로 사이클이 올바르지 않습니다' using errcode = '22023';
  end if;
  -- 같은 계정의 요청을 하나씩 처리한다 (하루 최대 횟수 검사용).
  perform pg_advisory_xact_lock(hashtextextended('coin:' || auth.uid()::text, 0));
  v_end := p_cycle_started_at + make_interval(mins => p_study_minutes);
  if v_end > now() + v_slack then
    return jsonb_build_object('awarded', false, 'reason', 'not_finished');
  end if;
  if v_end < now() - make_interval(secs => r.pomodoro_claim_window_seconds) then
    return jsonb_build_object('awarded', false, 'reason', 'expired');
  end if;
  if not exists (
    select 1 from public.study_effective_intervals(auth.uid()) iv
     where iv.started_at <= p_cycle_started_at + v_slack
       and iv.ended_at >= v_end - v_slack) then
    return jsonb_build_object('awarded', false, 'reason', 'not_covered');
  end if;
  -- 이미 받은 사이클이나, 마지막 보너스 이전에 시작한 사이클 (겹침).
  if exists (
    select 1 from public.coin_ledger l
     where l.user_id = auth.uid() and l.kind = 'pomodoro'
       and l.created_at > p_cycle_started_at + v_slack) then
    return jsonb_build_object('awarded', false, 'reason', 'duplicate');
  end if;
  if (select count(*) from public.coin_ledger l
       where l.user_id = auth.uid() and l.kind = 'pomodoro' and l.day = v_day) >= r.pomodoro_daily_max then
    return jsonb_build_object('awarded', false, 'reason', 'daily_max');
  end if;
  insert into public.coin_ledger (user_id, day, kind, amount, ref)
  values (auth.uid(), v_day, 'pomodoro', r.pomodoro_bonus,
          extract(epoch from date_trunc('second', p_cycle_started_at))::bigint::text)
  on conflict (user_id, kind, ref) do nothing;
  v_awarded := found;
  return jsonb_build_object('awarded', v_awarded, 'reason', case when v_awarded then null else 'duplicate' end);
end;
$$;

-- 할 일 완료 보상. 완료하면 주고 (그날 최대 개수까지), 완료 취소나 삭제면 회수한다.
create or replace function public.coin_todo_award()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.coin_rules;
  v_day date := public.study_day_of(now());
begin
  if tg_op = 'DELETE' then
    delete from public.coin_ledger l
     where l.user_id = old.user_id and l.kind = 'todo' and l.ref = old.id::text;
    return old;
  end if;
  if new.done and not old.done then
    r := public.coin_rules_row();
    perform pg_advisory_xact_lock(hashtextextended('coin:' || new.user_id::text, 0));
    if (select count(*) from public.coin_ledger l
         where l.user_id = new.user_id and l.kind = 'todo' and l.day = v_day) < r.todo_daily_max then
      insert into public.coin_ledger (user_id, day, kind, amount, ref)
      values (new.user_id, v_day, 'todo', r.todo_coins, new.id::text)
      on conflict (user_id, kind, ref) do nothing;
    end if;
  elsif old.done and not new.done then
    delete from public.coin_ledger l
     where l.user_id = new.user_id and l.kind = 'todo' and l.ref = new.id::text;
  end if;
  return new;
end;
$$;

create trigger todos_coin_award
  after update of done or delete on public.todos
  for each row execute function public.coin_todo_award();

-- 퇴근 정산. 정산 표시를 비우고 정산 내용을 돌려준다 (자정 아닌 오전 5시를 넘겼으면 최근 날짜).
create or replace function public.settle_study()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  perform public.coin_refresh_study(auth.uid());
  select s.unsettled_day into v_day from public.study_sessions s where s.user_id = auth.uid() for update;
  update public.study_sessions s set unsettled_day = null where s.user_id = auth.uid();
  return public.coin_day_summary(auth.uid(), coalesce(v_day, public.study_day_of(now())));
end;
$$;

-- 퇴근 없이 닫았던 가장 최근 하루의 정산. 없거나 아직 다른 화면에서 공부 중이면 null.
create or replace function public.pending_settlement()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sess public.study_sessions;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  select * into sess from public.study_sessions s where s.user_id = auth.uid() for update;
  if sess.user_id is null or sess.unsettled_day is null then
    return null;
  end if;
  if sess.state <> 'left' and sess.last_seen >= now() - interval '2 minutes' then
    return null;
  end if;
  perform public.study_settle_stale(auth.uid());
  perform public.coin_refresh_study(auth.uid());
  return public.coin_day_summary(auth.uid(), sess.unsettled_day);
end;
$$;

-- 지난 정산 팝업을 닫았다. 그사이 더 최근 날짜가 생겼으면 그대로 둔다.
create or replace function public.dismiss_settlement(p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  update public.study_sessions s set unsettled_day = null
   where s.user_id = auth.uid() and s.unsettled_day = p_day;
end;
$$;

-- Story 002 RPC에 공부 코인 갱신과 정산 표시를 더한다 (동작은 그대로).
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
  perform public.coin_refresh_study(auth.uid());
  return public.study_snapshot(auth.uid());
end;
$$;

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
         last_seen = now(),
         unsettled_day = case when p_state = 'studying' then public.study_day_of(now()) else s.unsettled_day end
   where s.user_id = auth.uid();
  perform public.coin_refresh_study(auth.uid());
  return public.study_snapshot(auth.uid());
end;
$$;

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
  update public.study_sessions s
     set last_seen = now(),
         unsettled_day = case when s.state = 'studying' then public.study_day_of(now()) else s.unsettled_day end
   where s.user_id = auth.uid();
  perform public.coin_refresh_study(auth.uid());
  return public.study_snapshot(auth.uid());
end;
$$;

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
  perform public.coin_refresh_study(auth.uid());
  return public.study_snapshot(auth.uid());
end;
$$;

-- 내부 함수는 클라이언트가 직접 부르지 못한다.
revoke execute on function public.coin_rules_row() from public, anon, authenticated;
revoke execute on function public.coin_refresh_study(uuid) from public, anon, authenticated;
revoke execute on function public.coin_day_summary(uuid, date) from public, anon, authenticated;
revoke execute on function public.coin_rules_json() from public, anon, authenticated;
revoke execute on function public.coin_todo_award() from public, anon, authenticated;

revoke execute on function public.get_coin_summary() from public, anon;
revoke execute on function public.claim_pomodoro_bonus(timestamptz, integer) from public, anon;
revoke execute on function public.settle_study() from public, anon;
revoke execute on function public.pending_settlement() from public, anon;
revoke execute on function public.dismiss_settlement(date) from public, anon;
grant execute on function public.get_coin_summary() to authenticated;
grant execute on function public.claim_pomodoro_bonus(timestamptz, integer) to authenticated;
grant execute on function public.settle_study() to authenticated;
grant execute on function public.pending_settlement() to authenticated;
grant execute on function public.dismiss_settlement(date) to authenticated;
