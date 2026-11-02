-- 2026-11-02 사용자 결정: 꾸밈 아이템을 테마(브라운, 화이트, 블랙, 앤티크)로 묶어 서로 조합되게 하고, 혼자 튀는 파스텔 아이템
-- (민트, 하늘, 레몬 벽지, 분홍, 민트, 노랑 커튼, 민트, 분홍 스탠드 등)은 판매를 멈춘다. 이미 산 사람은 계속 쓴다 (그림도 남긴다).
-- 바닥에 데코타일과 대리석, 파케이를 더한다. 회사 방 휴게실 러그도 같은 테마로 바꾼다.
-- 내 방 그림은 물건별로 다시 떼어 냈다 (tools/art/home-decor.mjs): 아이템 그림에는 그 물건 픽셀만 있다.

alter table public.shop_items add column on_sale boolean not null default true;
alter table public.shop_items add column theme text check (theme in ('brown', 'white', 'black', 'antique'));
comment on column public.shop_items.on_sale is '상점에서 파는가. false면 새로 살 수 없고, 이미 산 사람과 기본 아이템만 목록에 보인다.';
comment on column public.shop_items.theme is '꾸밈 테마 (brown, white, black, antique). 꾸미기 화면이 테마 한 번에 놓기에 쓴다. 테마 없는 아이템은 null.';

-- 판매 아이템 갱신 (기존 행): 이름, 테마, 판매 여부, 진열 순서
update public.shop_items s set name = v.name, theme = v.theme, on_sale = v.on_sale, sort = v.sort
  from (values
  ('home-wall-pink', '분홍 점 벽지', null, true, 100),
  ('home-wall-mint', '민트 점 벽지', null, false, 105),
  ('home-wall-sky', '하늘 점 벽지', null, false, 106),
  ('home-wall-lemon', '레몬 점 벽지', null, false, 107),
  ('home-floor-oak', '원목 마루', null, true, 120),
  ('home-floor-walnut', '호두나무 마루', 'brown', true, 121),
  ('home-floor-maple', '밝은 원목 마루', 'white', true, 123),
  ('home-floor-gray', '회색 마루', 'black', true, 125),
  ('home-curtain-white', '아이보리 커튼', null, true, 140),
  ('home-curtain-pink', '분홍 커튼', null, false, 144),
  ('home-curtain-mint', '민트 커튼', null, false, 145),
  ('home-curtain-yellow', '노랑 커튼', null, false, 146),
  ('home-frames-wood', '나무 액자', null, true, 160),
  ('home-frames-white', '흰 액자', 'white', true, 162),
  ('home-frames-black', '검은 액자', 'black', true, 163),
  ('home-shelves-wood', '나무 벽 선반', null, true, 180),
  ('home-shelves-white', '흰 벽 선반', 'white', true, 182),
  ('home-desk-wood', '책장 달린 나무 책상', null, true, 200),
  ('home-desk-walnut', '호두나무 책상', 'brown', true, 201),
  ('home-desk-white', '흰 책상', 'white', true, 202),
  ('home-desktop-paper', '책상 위 종이', null, true, 220),
  ('home-desktop-book', '펼친 책', null, true, 221),
  ('home-desktop-notebook', '남색 공책', null, true, 222),
  ('home-lamps-cream', '크림 스탠드', null, true, 240),
  ('home-lamps-mint', '민트 스탠드', null, false, 244),
  ('home-lamps-pink', '분홍 스탠드', null, false, 245),
  ('home-chair-cream', '크림 안락의자', null, true, 260),
  ('home-chair-sage', '세이지 안락의자', null, true, 265),
  ('home-chair-mustard', '겨자 안락의자', null, true, 266),
  ('home-chair-sky', '하늘 안락의자', null, false, 267),
  ('home-nightstand-wood', '나무 협탁', null, true, 280),
  ('home-nightstand-walnut', '호두나무 협탁', 'brown', true, 281),
  ('home-nightstand-white', '흰 협탁', 'white', true, 282),
  ('home-nighttop-plant', '화분과 작은 병', null, true, 300),
  ('home-nighttop-clock', '알람시계와 책', null, true, 301),
  ('home-nighttop-vase', '튤립 꽃병', null, true, 302),
  ('home-bed-wood', '나무 침대', null, true, 320),
  ('home-bed-walnut', '호두나무 침대', 'brown', true, 321),
  ('home-bed-white', '흰 침대', 'white', true, 322),
  ('home-blanket-sage', '세이지 이불', null, true, 340),
  ('home-blanket-yellow', '겨자 이불', null, true, 345),
  ('home-blanket-pink', '분홍 이불', null, false, 346),
  ('home-blanket-sky', '하늘 이불', null, false, 347),
  ('home-plush-cat', '흰 고양이 인형', null, true, 360),
  ('home-plush-cheese', '치즈 고양이 인형', null, true, 361),
  ('home-plush-black', '검은 고양이 인형', null, true, 362),
  ('home-plush-gray', '회색 고양이 인형', null, true, 363),
  ('home-rug-cream', '크림 러그', null, true, 380),
  ('home-rug-pink', '분홍 러그', null, false, 385),
  ('home-rug-mint', '민트 러그', null, false, 386),
  ('home-rug-sky', '하늘 러그', null, false, 387),
  ('home-plant-leaf', '큰 잎 화분', null, true, 400),
  ('home-plant-maple', '붉은 잎 화분', null, true, 401),
  ('home-plant-whitepot', '흰 화분', null, true, 402)
  ) as v(id, name, theme, on_sale, sort)
 where s.id = v.id;

insert into public.shop_items (id, slot, name, price, is_default, sort, theme) values
  ('home-wall-stripe', 'home_wallpaper', '베이지 줄무늬 벽지', 900, false, 101, 'brown'),
  ('home-wall-white', 'home_wallpaper', '흰 벽지', 900, false, 102, 'white'),
  ('home-wall-charcoal', 'home_wallpaper', '차콜 벽지', 900, false, 103, 'black'),
  ('home-wall-damask', 'home_wallpaper', '다마스크 벽지', 1200, false, 104, 'antique'),
  ('home-floor-tile-beige', 'home_floor', '베이지 데코타일', 1200, false, 122, 'brown'),
  ('home-floor-marble-white', 'home_floor', '흰 대리석', 1500, false, 124, 'white'),
  ('home-floor-tile-gray', 'home_floor', '회색 데코타일', 1200, false, 126, 'black'),
  ('home-floor-marble-black', 'home_floor', '검은 대리석', 1500, false, 127, 'black'),
  ('home-floor-parquet', 'home_floor', '파케이 마루', 1500, false, 128, 'antique'),
  ('home-curtain-linen', 'home_curtains', '베이지 리넨 커튼', 480, false, 141, 'brown'),
  ('home-curtain-charcoal', 'home_curtains', '차콜 커튼', 480, false, 142, 'black'),
  ('home-curtain-burgundy', 'home_curtains', '버건디 벨벳 커튼', 600, false, 143, 'antique'),
  ('home-frames-walnut', 'home_frames', '호두나무 액자', 360, false, 161, 'brown'),
  ('home-frames-gold', 'home_frames', '금색 액자', 480, false, 164, 'antique'),
  ('home-shelves-walnut', 'home_shelves', '호두나무 벽 선반', 480, false, 181, 'brown'),
  ('home-shelves-black', 'home_shelves', '검은 벽 선반', 480, false, 183, 'black'),
  ('home-desk-black', 'home_desk', '검은 책상', 1200, false, 203, 'black'),
  ('home-desk-antique', 'home_desk', '앤티크 책상', 1500, false, 204, 'antique'),
  ('home-lamps-white', 'home_lamps', '흰 스탠드', 360, false, 241, 'white'),
  ('home-lamps-black', 'home_lamps', '검은 스탠드', 360, false, 242, 'black'),
  ('home-lamps-brass', 'home_lamps', '황동 스탠드', 480, false, 243, 'antique'),
  ('home-chair-leather', 'home_armchair', '브라운 가죽 안락의자', 1200, false, 261, 'brown'),
  ('home-chair-white', 'home_armchair', '흰 안락의자', 900, false, 262, 'white'),
  ('home-chair-charcoal', 'home_armchair', '차콜 안락의자', 900, false, 263, 'black'),
  ('home-chair-velvet', 'home_armchair', '버건디 벨벳 안락의자', 1200, false, 264, 'antique'),
  ('home-nightstand-black', 'home_nightstands', '검은 협탁', 900, false, 283, 'black'),
  ('home-nightstand-antique', 'home_nightstands', '앤티크 협탁', 1200, false, 284, 'antique'),
  ('home-bed-black', 'home_bed', '검은 침대', 1500, false, 323, 'black'),
  ('home-bed-antique', 'home_bed', '앤티크 침대', 1500, false, 324, 'antique'),
  ('home-blanket-camel', 'home_blanket', '카멜 이불', 600, false, 341, 'brown'),
  ('home-blanket-white', 'home_blanket', '흰 이불', 600, false, 342, 'white'),
  ('home-blanket-charcoal', 'home_blanket', '차콜 이불', 600, false, 343, 'black'),
  ('home-blanket-burgundy', 'home_blanket', '버건디 이불', 600, false, 344, 'antique'),
  ('home-rug-camel', 'home_rug', '카멜 러그', 600, false, 381, 'brown'),
  ('home-rug-ivory', 'home_rug', '아이보리 러그', 600, false, 382, 'white'),
  ('home-rug-charcoal', 'home_rug', '차콜 러그', 600, false, 383, 'black'),
  ('home-rug-persian', 'home_rug', '페르시안 러그', 600, false, 384, 'antique');

update public.shop_items s set name = v.name, theme = v.theme, on_sale = v.on_sale
  from (values
  ('rug-beige', '베이지 러그', null, true),
  ('rug-pink', '분홍 러그', null, false),
  ('rug-mint', '민트 러그', null, false),
  ('rug-sky', '하늘 러그', null, false)
  ) as v(id, name, theme, on_sale)
 where s.id = v.id;
insert into public.shop_items (id, slot, name, price, is_default, sort, theme)
select v.id, 'room_rug', v.name, v.price, false, base.sort + v.n, v.theme
  from (values
    ('rug-camel', '카멜 러그', 1800, 'brown', 1),
    ('rug-ivory', '아이보리 러그', 1800, 'white', 2),
    ('rug-charcoal', '차콜 러그', 2000, 'black', 3),
    ('rug-persian', '페르시안 러그', 2400, 'antique', 4)
  ) as v(id, name, price, theme, n)
  cross join (select max(sort) as sort from public.shop_items where slot = 'room_rug') base;

-- 상점과 꾸미기 화면용 목록: 파는 아이템, 기본 아이템, 이미 산 아이템. 가격, 보유 여부, 테마.
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
             'owned', i.is_default or o.item_id is not null,
             'theme', i.theme)
           order by i.sort, i.id)
      from public.shop_items i
      left join public.owned_items o on o.item_id = i.id and o.user_id = auth.uid()
     where i.on_sale or i.is_default or o.item_id is not null), '[]'::jsonb);
end;
$$;

-- 구매. 판매를 멈춘 아이템은 없는 아이템처럼 거절한다 (no_item). 나머지는 이전과 같다.
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
  if v_item.id is null or v_item.is_default or not v_item.on_sale then
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

revoke execute on function public.get_shop() from public, anon;
revoke execute on function public.buy_item(text) from public, anon;
grant execute on function public.get_shop() to authenticated;
grant execute on function public.buy_item(text) to authenticated;
