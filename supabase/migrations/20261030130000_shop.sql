-- Story 007: 상점과 캐릭터 꾸미기.
-- 판매 목록과 가격은 shop_items 표 하나에서만 정한다. 클라이언트 src/config/shop.ts는 아이템 id별 그림 레이어만 안다.
-- 구매, 꾸밈 저장, 환영 선물은 모두 서버 함수가 처리한다. 환불과 되팔기는 없다.

-- 환영 선물 코인 수 (우편으로 준다).
alter table public.coin_rules add column welcome_coins integer not null default 120 check (welcome_coins >= 0);

-- 원장 종류 확장: welcome (환영 선물, ref 'welcome'), purchase (구매, 음수 amount, ref 아이템 id).
alter table public.coin_ledger drop constraint coin_ledger_kind_check;
alter table public.coin_ledger add constraint coin_ledger_kind_check
  check (kind in ('study', 'pomodoro', 'todo', 'attendance', 'welcome', 'purchase'));
alter table public.coin_ledger add constraint coin_ledger_purchase_sign
  check (kind <> 'purchase' or amount < 0);

-- 아이템 목록. is_default는 가입하면 무료로 받는 기본 아이템 (가격 0, 상점에 안 나온다).
create table public.shop_items (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  slot text not null check (slot in ('body', 'face', 'hair', 'outfit', 'accessory')),
  name text not null check (char_length(name) between 1 and 20),
  price integer not null check (price >= 0),
  is_default boolean not null default false,
  sort integer not null default 0,
  constraint shop_items_default_free check ((is_default and price = 0) or (not is_default and price > 0)),
  -- 첫 출시 상점은 캐릭터 아이템만, 몸과 얼굴은 기본만 있다.
  constraint shop_items_sellable_slot check (is_default or slot in ('hair', 'outfit', 'accessory'))
);

comment on table public.shop_items is '캐릭터 아이템 목록과 가격의 유일한 출처. 액세서리 120~300, 의상과 머리 600~1500.';

insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('body-basic', 'body', '기본 몸', 0, true, 0),
  ('face-basic', 'face', '기본 얼굴', 0, true, 0),
  ('hair-lavender', 'hair', '라벤더 머리', 0, true, 0),
  ('hair-chestnut', 'hair', '밤색 머리', 0, true, 1),
  ('outfit-lavender', 'outfit', '라벤더 옷', 0, true, 0),
  ('outfit-sage', 'outfit', '세이지 옷', 0, true, 1),
  ('acc-ribbon', 'accessory', '보라 리본', 120, false, 10),
  ('acc-hairpin', 'accessory', '별 머리핀', 150, false, 11),
  ('acc-glasses', 'accessory', '동그란 안경', 180, false, 12),
  ('acc-headphones', 'accessory', '헤드폰', 220, false, 13),
  ('acc-scarf', 'accessory', '목도리', 260, false, 14),
  ('acc-beret', 'accessory', '베레모', 300, false, 15),
  ('outfit-rose', 'outfit', '로즈 옷', 600, false, 20),
  ('outfit-hoodie', 'outfit', '포근한 후드티', 900, false, 21),
  ('outfit-cardigan', 'outfit', '니트 가디건', 1200, false, 22),
  ('outfit-suit', 'outfit', '단정한 정장', 1500, false, 23),
  ('hair-ponytail', 'hair', '포니테일', 600, false, 30),
  ('hair-short', 'hair', '짧은 머리', 800, false, 31),
  ('hair-wave', 'hair', '웨이브 머리', 1100, false, 32),
  ('hair-long', 'hair', '긴 생머리', 1500, false, 33);

-- 산 아이템. 계정 삭제 시 연쇄 삭제된다. 한 사람이 같은 아이템을 두 번 가질 수 없다.
create table public.owned_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.shop_items (id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- 저장한 꾸밈. 행이 없으면 아직 처음 꾸미기 전이다. 머리는 한 아이템이 뒷머리와 앞머리를 함께 정한다.
create table public.character_looks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  body text not null references public.shop_items (id),
  face text not null references public.shop_items (id),
  hair_back text not null references public.shop_items (id),
  hair_front text not null references public.shop_items (id),
  outfit text not null references public.shop_items (id),
  accessory text null references public.shop_items (id),
  updated_at timestamptz not null default now()
);

comment on table public.owned_items is '산 캐릭터 아이템. buy_item만 쓰고, 계정 삭제 시 연쇄 삭제된다.';
comment on table public.character_looks is '적용한 꾸밈. save_look만 쓰고, 계정 삭제 시 연쇄 삭제된다.';

alter table public.shop_items enable row level security;
alter table public.owned_items enable row level security;
alter table public.character_looks enable row level security;

create policy "아이템 목록은 누구나 로그인하면 조회" on public.shop_items for select to authenticated using (true);
create policy "본인 보유 아이템만 조회" on public.owned_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "본인 꾸밈만 조회" on public.character_looks for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.shop_items, public.owned_items, public.character_looks from anon, authenticated;
grant select on public.shop_items, public.owned_items, public.character_looks to authenticated;

-- 이 사람이 이 칸에 이 아이템을 쓸 수 있는가 (기본 아이템이거나 산 아이템).
create or replace function public.shop_can_use(p_user uuid, p_item text, p_slot text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shop_items i
     where i.id = p_item and i.slot = p_slot
       and (i.is_default or exists (
         select 1 from public.owned_items o where o.user_id = p_user and o.item_id = i.id)));
$$;

-- 꾸밈 JSON. 저장 전이면 null.
create or replace function public.character_look_json(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'body', l.body, 'face', l.face, 'hair_back', l.hair_back, 'hair_front', l.hair_front,
           'outfit', l.outfit, 'accessory', l.accessory, 'updated_at', l.updated_at)
    from public.character_looks l where l.user_id = p_user;
$$;

-- 상점과 꾸미기 화면용 목록: 모든 아이템, 가격, 보유 여부.
create or replace function public.get_shop()
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
             'id', i.id, 'slot', i.slot, 'name', i.name, 'price', i.price,
             'is_default', i.is_default,
             'owned', i.is_default or o.item_id is not null)
           order by i.sort, i.id)
      from public.shop_items i
      left join public.owned_items o on o.item_id = i.id and o.user_id = auth.uid()), '[]'::jsonb);
end;
$$;

-- 구매. 같은 사람의 구매는 프로필 행 잠금으로 줄을 세워, 잔액 확인과 차감, 중복 확인이 한 번에 처리된다.
-- 거절은 오류 대신 status로 돌려준다: bought | owned | insufficient.
create or replace function public.buy_item(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.shop_items;
  v_balance integer;
begin
  perform public.room_require_login();
  select * into v_item from public.shop_items i where i.id = p_item;
  if v_item.id is null or v_item.is_default then
    raise exception 'no_item' using errcode = 'P0001';
  end if;
  perform 1 from public.profiles p where p.id = auth.uid() for update;
  perform public.coin_refresh_study(auth.uid());
  select coalesce(sum(l.amount), 0)::int into v_balance from public.coin_ledger l where l.user_id = auth.uid();
  if exists (select 1 from public.owned_items o where o.user_id = auth.uid() and o.item_id = v_item.id) then
    return jsonb_build_object('status', 'owned', 'balance', v_balance, 'price', v_item.price);
  end if;
  if v_balance < v_item.price then
    return jsonb_build_object('status', 'insufficient', 'balance', v_balance, 'price', v_item.price);
  end if;
  insert into public.owned_items (user_id, item_id) values (auth.uid(), v_item.id);
  insert into public.coin_ledger (user_id, day, kind, amount, ref)
  values (auth.uid(), public.study_day_of(now()), 'purchase', -v_item.price, v_item.id);
  return jsonb_build_object('status', 'bought', 'balance', v_balance - v_item.price, 'price', v_item.price);
end;
$$;

-- 꾸밈 저장. 기본 아이템이나 산 아이템만, 각자 맞는 칸에만 쓸 수 있다. 입어 보기만 한 아이템은 거절한다.
create or replace function public.save_look(
  p_body text, p_face text, p_hair_back text, p_hair_front text, p_outfit text, p_accessory text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  perform public.room_require_login();
  if not (public.shop_can_use(me, p_body, 'body')
          and public.shop_can_use(me, p_face, 'face')
          and public.shop_can_use(me, p_hair_back, 'hair')
          and public.shop_can_use(me, p_hair_front, 'hair')
          and public.shop_can_use(me, p_outfit, 'outfit')
          and (p_accessory is null or public.shop_can_use(me, p_accessory, 'accessory'))) then
    raise exception 'not_owned' using errcode = 'P0001';
  end if;
  insert into public.character_looks (user_id, body, face, hair_back, hair_front, outfit, accessory, updated_at)
  values (me, p_body, p_face, p_hair_back, p_hair_front, p_outfit, p_accessory, now())
  on conflict (user_id) do update
    set body = excluded.body, face = excluded.face, hair_back = excluded.hair_back,
        hair_front = excluded.hair_front, outfit = excluded.outfit, accessory = excluded.accessory,
        updated_at = now();
  return public.character_look_json(me);
end;
$$;

create or replace function public.get_my_look()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  return public.character_look_json(auth.uid());
end;
$$;

-- 같은 방 사람들의 상태에 꾸밈(look)을 더한다. 방 멤버만 볼 수 있다 (room_require_member).
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
             'current_task', case when c.shared then c.task end,
             'look', public.character_look_json(m.user_id))
           order by m.joined_at, m.user_id)
      from public.room_members m
      join public.rooms r on r.id = m.room_id
      left join public.profiles p on p.id = m.user_id
      left join public.study_sessions s on s.user_id = m.user_id
      left join public.study_current_tasks c on c.user_id = m.user_id
     where m.room_id = p_room), '[]'::jsonb);
end;
$$;

-- 환영 선물: 프로필이 만들어지면 (가입 트리거) 우편 한 통. ref 'welcome'이라 한 사람에 한 번뿐이다.
create or replace function public.shop_welcome_mail()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.mail (user_id, kind, ref, payload, expires_at)
  values (new.id, 'reward', 'welcome',
          jsonb_build_object('reward', 'welcome',
                             'coins', coalesce((select r.welcome_coins from public.coin_rules r limit 1), 120)),
          public.social_mail_expiry())
  on conflict (user_id, kind, ref) do nothing;
  return new;
end;
$$;

create trigger profiles_welcome_mail
  after insert on public.profiles
  for each row execute function public.shop_welcome_mail();

-- 이미 있는 계정에도 한 번 보낸다.
insert into public.mail (user_id, kind, ref, payload, expires_at)
select p.id, 'reward', 'welcome',
       jsonb_build_object('reward', 'welcome',
                          'coins', coalesce((select r.welcome_coins from public.coin_rules r limit 1), 120)),
       public.social_mail_expiry()
  from public.profiles p
on conflict (user_id, kind, ref) do nothing;

-- 보상 받기: 출석은 kind attendance (ref 공부 날짜), 환영 선물은 kind welcome (ref 'welcome'). 두 번 눌러도 한 번만 들어간다.
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
  v_kind text;
  v_ref text;
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
  v_amount := (v.payload ->> 'coins')::int;
  if v.payload ->> 'reward' = 'welcome' then
    v_kind := 'welcome';
    v_ref := 'welcome';
    v_day := public.study_day_of(now());
  else
    v_kind := 'attendance';
    v_day := (v.payload ->> 'day')::date;
    v_ref := v_day::text;
  end if;
  insert into public.coin_ledger (user_id, day, kind, amount, ref)
  values (auth.uid(), v_day, v_kind, v_amount, v_ref)
  on conflict (user_id, kind, ref) do nothing;
  if not found then
    v_amount := 0;
  end if;
  update public.mail m set claimed_at = now() where m.id = v.id;
  return jsonb_build_object('status', 'claimed', 'amount', v_amount);
end;
$$;

revoke execute on function public.shop_can_use(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.character_look_json(uuid) from public, anon, authenticated;
revoke execute on function public.shop_welcome_mail() from public, anon, authenticated;
revoke execute on function public.get_shop() from public, anon;
revoke execute on function public.buy_item(text) from public, anon;
revoke execute on function public.save_look(text, text, text, text, text, text) from public, anon;
revoke execute on function public.get_my_look() from public, anon;
revoke execute on function public.room_member_status(uuid) from public, anon;
revoke execute on function public.claim_mail(bigint) from public, anon;

grant execute on function public.get_shop() to authenticated;
grant execute on function public.buy_item(text) to authenticated;
grant execute on function public.save_look(text, text, text, text, text, text) to authenticated;
grant execute on function public.get_my_look() to authenticated;
grant execute on function public.room_member_status(uuid) to authenticated;
grant execute on function public.claim_mail(bigint) to authenticated;
