-- Story 001: 계정 프로필, 친구 코드, 계정 삭제.
-- 내부 식별은 auth.users의 UUID이고, 프로필은 가입과 동시에 트리거로 만들어진다.

-- 친구 코드 문자 집합: 헷갈리는 0, O, 1, I, L을 뺀 대문자와 숫자 31자.
create or replace function public.generate_friend_code()
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
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles p where p.friend_code = code);
  end loop;
  return code;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- 첫 로그인 직후에는 null이고, 이름 설정 단계에서 정한다.
  display_name text null
    check (display_name = btrim(display_name) and char_length(display_name) between 1 and 12),
  -- 계정마다 고정된 8자 친구 코드. 재발급하지 않는다.
  friend_code text not null unique
    check (friend_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$'),
  created_at timestamptz not null default now()
);

comment on table public.profiles is '계정별 프로필. 행은 auth.users 가입 트리거만 만들고, 계정 삭제 시 연쇄 삭제된다.';

alter table public.profiles enable row level security;

create policy "본인 프로필만 조회"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "본인 프로필만 수정"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 클라이언트는 화면 이름만 바꿀 수 있다. id와 friend_code는 열 권한으로 막는다.
-- 행 추가와 삭제 정책은 두지 않는다 (트리거와 연쇄 삭제만 사용).
revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- 가입 트리거: 새 계정에 화면 이름이 비어 있는 프로필과 친구 코드를 만든다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, friend_code)
  values (new.id, null, public.generate_friend_code());
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.generate_friend_code() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 계정 삭제: 호출한 본인의 auth.users 행을 지운다. 프로필은 연쇄 삭제된다.
-- 이후 스토리가 만드는 데이터는 auth.users(id)에 on delete cascade 외래 키를 걸거나,
-- 연쇄로 지울 수 없는 정리가 필요하면 이 함수에 삭제 문을 덧붙인다.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
