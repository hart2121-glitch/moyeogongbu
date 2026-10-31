-- Story 009, 꾸미기 슬롯 계획 3절: 로비 "내 방" 꾸밈 (2026-11-01 사용자 결정: 가구, 벽지, 바닥까지 한 번에 바꾼다).
-- 내 방은 열여섯 자리로 나눈다. 자리마다 지금 그림이 무료 기본 아이템이고, 판매 아이템은 같은 그림의 색과 칠을 바꾸거나
-- (벽지, 바닥, 천, 나무 가구) 같은 자리에 다른 물건을 놓는다 (책상 위, 협탁 위). 내 방은 나만 보므로 같은 방 사람에게는 보내지 않는다.
-- 내 책상 세트(회사 방 책상)와는 따로다 (2026-11-01 사용자 결정: 내 방 책상은 따로).

alter table public.shop_items drop constraint shop_items_slot_check;
alter table public.shop_items add constraint shop_items_slot_check
  check (slot in ('body', 'face', 'hair', 'hair_color', 'outfit', 'accessory', 'desk_top', 'desk_front',
                  'room_cushions', 'room_table', 'room_rug', 'room_mat')
         or slot ~ '^home_[a-z_]{1,20}$');
alter table public.shop_items drop constraint shop_items_sellable_slot;
alter table public.shop_items add constraint shop_items_sellable_slot
  check (is_default or slot in ('hair', 'hair_color', 'outfit', 'accessory', 'desk_top', 'desk_front',
                                'room_cushions', 'room_table', 'room_rug', 'room_mat')
         or slot ~ '^home_[a-z_]{1,20}$');

comment on table public.shop_items is
  '아이템 목록과 가격의 유일한 출처. 액세서리 120~300, 머리 색 300, 의상과 머리 모양 600~1500, 책상 소품 180~600, '
  '공용 가구 900~3000, 내 방 소품 240~600, 내 방 가구와 벽지, 바닥 900~1500.';

insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('home-wall-pink', 'home_wallpaper', '분홍 점 벽지', 0, true, 100),
  ('home-wall-mint', 'home_wallpaper', '민트 점 벽지', 900, false, 101),
  ('home-wall-sky', 'home_wallpaper', '하늘 점 벽지', 900, false, 102),
  ('home-wall-lemon', 'home_wallpaper', '레몬 점 벽지', 900, false, 103),
  ('home-floor-oak', 'home_floor', '원목 마루', 0, true, 105),
  ('home-floor-maple', 'home_floor', '밝은 원목 마루', 900, false, 106),
  ('home-floor-walnut', 'home_floor', '호두나무 마루', 1200, false, 107),
  ('home-floor-gray', 'home_floor', '회색 마루', 1200, false, 108),
  ('home-curtain-white', 'home_curtains', '흰 망사 커튼', 0, true, 110),
  ('home-curtain-pink', 'home_curtains', '분홍 커튼', 480, false, 111),
  ('home-curtain-mint', 'home_curtains', '민트 커튼', 480, false, 112),
  ('home-curtain-yellow', 'home_curtains', '노랑 커튼', 480, false, 113),
  ('home-frames-wood', 'home_frames', '나무 액자', 0, true, 115),
  ('home-frames-white', 'home_frames', '흰 액자', 360, false, 116),
  ('home-frames-black', 'home_frames', '검은 액자', 360, false, 117),
  ('home-shelves-wood', 'home_shelves', '나무 벽 선반', 0, true, 120),
  ('home-shelves-white', 'home_shelves', '흰 벽 선반', 480, false, 121),
  ('home-desk-wood', 'home_desk', '책장 달린 나무 책상', 0, true, 125),
  ('home-desk-white', 'home_desk', '흰 책상', 1200, false, 126),
  ('home-desk-walnut', 'home_desk', '호두나무 책상', 1200, false, 127),
  ('home-desktop-paper', 'home_desk_top', '책상 위 종이', 0, true, 130),
  ('home-desktop-book', 'home_desk_top', '펼친 책', 240, false, 131),
  ('home-desktop-notebook', 'home_desk_top', '하늘 공책', 240, false, 132),
  ('home-lamps-cream', 'home_lamps', '크림 스탠드', 0, true, 135),
  ('home-lamps-mint', 'home_lamps', '민트 스탠드', 360, false, 136),
  ('home-lamps-pink', 'home_lamps', '분홍 스탠드', 360, false, 137),
  ('home-chair-cream', 'home_armchair', '크림 안락의자', 0, true, 140),
  ('home-chair-sage', 'home_armchair', '세이지 안락의자', 900, false, 141),
  ('home-chair-sky', 'home_armchair', '하늘 안락의자', 900, false, 142),
  ('home-chair-mustard', 'home_armchair', '겨자 안락의자', 900, false, 143),
  ('home-nightstand-wood', 'home_nightstands', '나무 협탁', 0, true, 145),
  ('home-nightstand-white', 'home_nightstands', '흰 협탁', 900, false, 146),
  ('home-nightstand-walnut', 'home_nightstands', '호두나무 협탁', 900, false, 147),
  ('home-nighttop-plant', 'home_nightstand_top', '화분과 작은 병', 0, true, 150),
  ('home-nighttop-clock', 'home_nightstand_top', '알람시계와 책', 240, false, 151),
  ('home-nighttop-vase', 'home_nightstand_top', '튤립 꽃병', 300, false, 152),
  ('home-bed-wood', 'home_bed', '나무 침대', 0, true, 155),
  ('home-bed-white', 'home_bed', '흰 침대', 1500, false, 156),
  ('home-bed-walnut', 'home_bed', '호두나무 침대', 1500, false, 157),
  ('home-blanket-sage', 'home_blanket', '세이지 이불', 0, true, 160),
  ('home-blanket-pink', 'home_blanket', '분홍 이불', 600, false, 161),
  ('home-blanket-sky', 'home_blanket', '하늘 이불', 600, false, 162),
  ('home-blanket-yellow', 'home_blanket', '겨자 이불', 600, false, 163),
  ('home-plush-cat', 'home_plush', '흰 고양이 인형', 0, true, 165),
  ('home-plush-cheese', 'home_plush', '치즈 고양이 인형', 240, false, 166),
  ('home-plush-black', 'home_plush', '검은 고양이 인형', 240, false, 167),
  ('home-plush-gray', 'home_plush', '회색 고양이 인형', 240, false, 168),
  ('home-rug-cream', 'home_rug', '크림 러그', 0, true, 170),
  ('home-rug-pink', 'home_rug', '분홍 러그', 600, false, 171),
  ('home-rug-mint', 'home_rug', '민트 러그', 600, false, 172),
  ('home-rug-sky', 'home_rug', '하늘 러그', 600, false, 173),
  ('home-plant-leaf', 'home_floor_plant', '큰 잎 화분', 0, true, 175),
  ('home-plant-maple', 'home_floor_plant', '붉은 잎 화분', 480, false, 176),
  ('home-plant-whitepot', 'home_floor_plant', '흰 화분', 360, false, 177);

-- 적용한 내 방 꾸밈: 자리 이름(slot에서 home_을 뺀 것) → 아이템 id. 빠진 자리는 기본 아이템이다.
create table public.home_looks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  parts jsonb not null default '{}'::jsonb check (jsonb_typeof(parts) = 'object'),
  updated_at timestamptz not null default now()
);
comment on table public.home_looks is '적용한 내 방 꾸밈. save_home만 쓰고, 계정 삭제 시 연쇄 삭제된다.';
alter table public.home_looks enable row level security;
create policy "본인 내 방만 조회" on public.home_looks for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.home_looks from anon, authenticated;
grant select on public.home_looks to authenticated;

-- 내 방 꾸밈 (저장 전이면 빈 객체).
create or replace function public.get_my_home()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.room_require_login();
  return coalesce((select h.parts from public.home_looks h where h.user_id = auth.uid()), '{}'::jsonb);
end;
$$;

-- 내 방 꾸밈 저장. 자리마다 그 자리의 기본 아이템이거나 산 아이템이어야 한다.
create or replace function public.save_home(p_parts jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  v_slot text;
  v_item text;
begin
  perform public.room_require_login();
  if p_parts is null or jsonb_typeof(p_parts) <> 'object' then
    raise exception 'invalid_home' using errcode = '22023';
  end if;
  for v_slot, v_item in select key, value from jsonb_each_text(p_parts) loop
    if v_slot !~ '^[a-z_]{1,20}$' or not public.shop_can_use(me, v_item, 'home_' || v_slot) then
      raise exception 'not_owned' using errcode = 'P0001';
    end if;
  end loop;
  insert into public.home_looks (user_id, parts, updated_at) values (me, p_parts, now())
  on conflict (user_id) do update set parts = excluded.parts, updated_at = now();
  return p_parts;
end;
$$;

revoke execute on function public.get_my_home() from public, anon;
grant execute on function public.get_my_home() to authenticated;
revoke execute on function public.save_home(jsonb) from public, anon;
grant execute on function public.save_home(jsonb) to authenticated;
