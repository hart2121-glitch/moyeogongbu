-- Story 005: 공부 기록과 날짜별 할 일.
-- 할 일 수치는 todo_rules 한 줄에 있다 (화면 쪽 같은 값: src/features/todos/model/todoConfig.ts).
-- 글자 수 1~50자는 todos.text 검사(Story 003)가 이미 막는다.
-- 기록은 본인 것만 읽는다. 모든 함수는 auth.uid() 기준이고 다른 사람 id를 받지 않는다.

create table public.todo_rules (
  id boolean primary key default true check (id),
  daily_max integer not null check (daily_max > 0),
  text_max integer not null check (text_max > 0)
);

comment on table public.todo_rules is '할 일 제한 수치의 유일한 출처. 하루 개수와 글자 수.';

insert into public.todo_rules (daily_max, text_max) values (30, 50);

alter table public.todo_rules enable row level security;
revoke all on public.todo_rules from anon, authenticated;

-- 하루 개수 제한. 추가할 때와 날짜를 옮길 때 그 날짜의 개수를 센다.
-- 같은 사람의 동시 추가가 함께 통과하지 않게 계정별 잠금을 건다.
create or replace function public.todo_enforce_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
begin
  if tg_op = 'UPDATE' and new.day = old.day then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('todos:' || new.user_id::text, 0));
  select r.daily_max into v_max from public.todo_rules r where r.id;
  if (select count(*) from public.todos t
       where t.user_id = new.user_id and t.day = new.day and t.id <> new.id) >= v_max then
    raise exception 'todo_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger todos_enforce_limit
  before insert or update of day on public.todos
  for each row execute function public.todo_enforce_limit();

-- 날짜별 기록 (본인). 공부 시간(오전 5시 경계, 지금 공부 중인 구간 포함), 그날 받은 코인, 완료한 할 일 수.
-- 기록이 하나도 없는 날은 행이 없다. 화면이 0으로 채운다.
create or replace function public.get_study_records(p_from date, p_to date)
returns table (day date, seconds bigint, coins bigint, todos_done bigint)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then
    raise exception '기간이 올바르지 않습니다' using errcode = '22023';
  end if;
  perform public.coin_refresh_study(auth.uid());
  return query
  with s as (
    select t.day, t.seconds from public.study_split_by_day(auth.uid(), p_from, p_to, false) t
  ), c as (
    select l.day, sum(l.amount)::bigint as amount
      from public.coin_ledger l
     where l.user_id = auth.uid() and l.day between p_from and p_to
       and l.kind in ('study', 'pomodoro', 'todo')
     group by l.day
  ), d as (
    select t.day, count(*)::bigint as n
      from public.todos t
     where t.user_id = auth.uid() and t.done and t.day between p_from and p_to
     group by t.day
  ), days as (
    select s.day from s union select c.day from c union select d.day from d
  )
  select days.day, coalesce(s.seconds, 0)::bigint, coalesce(c.amount, 0)::bigint, coalesce(d.n, 0)::bigint
    from days
    left join s on s.day = days.day
    left join c on c.day = days.day
    left join d on d.day = days.day
   order by 1;
end;
$$;

-- 하루 상세 (본인): 공부 시간, 종류별 코인, 완료한 할 일 글자.
create or replace function public.get_record_day(p_day date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_day is null then
    raise exception '날짜가 필요합니다' using errcode = '22023';
  end if;
  perform public.coin_refresh_study(auth.uid());
  return public.coin_day_summary(auth.uid(), p_day)
    || jsonb_build_object('todos_done', (
      select coalesce(jsonb_agg(t.text order by t.created_at, t.id), '[]'::jsonb)
        from public.todos t
       where t.user_id = auth.uid() and t.day = p_day and t.done));
end;
$$;

-- 지난 날짜의 미완료 할 일을 오늘로 옮긴다. 본인 것, 완료하지 않은 것, 오늘 이전 날짜만 옮기고
-- 나머지 id는 건너뛴다. 옮긴 뒤 오늘이 하루 개수를 넘으면 하나도 옮기지 않는다 (todo_limit).
-- 옮긴 개수를 돌려준다.
create or replace function public.carry_over_todos(p_ids bigint[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := public.study_day_of(now());
  v_max integer;
  v_moving integer;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_ids is null or cardinality(p_ids) = 0 then
    return 0;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('todos:' || auth.uid()::text, 0));
  select r.daily_max into v_max from public.todo_rules r where r.id;
  select count(*) into v_moving from public.todos t
   where t.id = any (p_ids) and t.user_id = auth.uid() and not t.done and t.day < v_today;
  if v_moving = 0 then
    return 0;
  end if;
  if (select count(*) from public.todos t where t.user_id = auth.uid() and t.day = v_today) + v_moving > v_max then
    raise exception 'todo_limit' using errcode = 'P0001';
  end if;
  update public.todos t set day = v_today
   where t.id = any (p_ids) and t.user_id = auth.uid() and not t.done and t.day < v_today;
  return v_moving;
end;
$$;

revoke execute on function public.todo_enforce_limit() from public, anon, authenticated;
revoke execute on function public.get_study_records(date, date) from public, anon;
revoke execute on function public.get_record_day(date) from public, anon;
revoke execute on function public.carry_over_todos(bigint[]) from public, anon;
grant execute on function public.get_study_records(date, date) to authenticated;
grant execute on function public.get_record_day(date) to authenticated;
grant execute on function public.carry_over_todos(bigint[]) to authenticated;
