-- Story 009, 꾸미기 슬롯 계획 2절: 회사 방 공용 꾸밈 (2026-11-01 사용자 결정).
-- 방장이 휴게실 소파 쿠션, 탁자 위, 러그, 출입구 매트를 자기 코인으로 산 아이템으로 갈아 끼우고, 화이트보드 문구를 무료로 쓴다.
-- 같은 방 사람 모두에게 같게 보인다 (room_json에 실어 보내고, 바꾼 뒤 방장 화면이 멤버에게 다시 읽으라고 알린다).
-- 방장이 바뀌어도 꾸밈은 남는다. 새 방장은 기본 아이템이나 자기가 산 아이템으로만 바꿀 수 있다.

alter table public.shop_items drop constraint shop_items_slot_check;
alter table public.shop_items add constraint shop_items_slot_check
  check (slot in ('body', 'face', 'hair', 'hair_color', 'outfit', 'accessory', 'desk_top', 'desk_front',
                  'room_cushions', 'room_table', 'room_rug', 'room_mat'));
alter table public.shop_items drop constraint shop_items_sellable_slot;
alter table public.shop_items add constraint shop_items_sellable_slot
  check (is_default or slot in ('hair', 'hair_color', 'outfit', 'accessory', 'desk_top', 'desk_front',
                                'room_cushions', 'room_table', 'room_rug', 'room_mat'));

comment on table public.shop_items is
  '아이템 목록과 가격의 유일한 출처. 액세서리 120~300, 머리 색 300, 의상과 머리 모양 600~1500, 책상 소품 180~600, 공용 가구 900~3000.';

insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('cushions-cat', 'room_cushions', '고양이 쿠션', 0, true, 80),
  ('cushions-heart', 'room_cushions', '하트 쿠션', 900, false, 81),
  ('cushions-star', 'room_cushions', '별 쿠션', 900, false, 82),
  ('cushions-check', 'room_cushions', '체크 쿠션', 1200, false, 83),
  ('table-cat', 'room_table', '고양이 인형과 간식', 0, true, 85),
  ('table-tea', 'room_table', '찻잔 세트', 1200, false, 86),
  ('table-cake', 'room_table', '딸기 케이크', 1500, false, 87),
  ('table-flower', 'room_table', '튤립 꽃병', 1500, false, 88),
  ('rug-beige', 'room_rug', '베이지 러그', 0, true, 90),
  ('rug-pink', 'room_rug', '분홍 러그', 1800, false, 91),
  ('rug-mint', 'room_rug', '민트 러그', 2000, false, 92),
  ('rug-sky', 'room_rug', '하늘 러그', 2400, false, 93),
  ('mat-cat', 'room_mat', '고양이 매트', 0, true, 95),
  ('mat-stripe', 'room_mat', '줄무늬 매트', 900, false, 96),
  ('mat-paw', 'room_mat', '발바닥 매트', 1200, false, 97),
  ('mat-heart', 'room_mat', '하트 매트', 1200, false, 98);

-- 화이트보드 문구: 두 줄까지, 줄마다 12자까지. null이면 기본 문구("오늘도 수고했어요!")를 보인다.
alter table public.rooms add column board_text text
  check (board_text is null or (board_text = btrim(board_text) and char_length(board_text) between 1 and 25
                                and board_text !~ '\n.*\n'));
alter table public.rooms add column decor_cushions text not null references public.shop_items (id) default 'cushions-cat';
alter table public.rooms add column decor_table text not null references public.shop_items (id) default 'table-cat';
alter table public.rooms add column decor_rug text not null references public.shop_items (id) default 'rug-beige';
alter table public.rooms add column decor_mat text not null references public.shop_items (id) default 'mat-cat';

-- 화면용 방 정보에 화이트보드 문구와 공용 꾸밈을 더한다.
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
                      where p.room_id = r.id and p.last_seen >= now() - public.room_grace()),
    'board_text', r.board_text,
    'decor', jsonb_build_object('cushions', r.decor_cushions, 'table', r.decor_table,
                                'rug', r.decor_rug, 'mat', r.decor_mat))
  from public.rooms r where r.id = p_room;
$$;

-- 공용 꾸밈 바꾸기 (방장만). 아이템은 그 자리의 기본 아이템이거나 방장이 산 것이어야 한다.
create or replace function public.set_room_decor(p_room uuid, p_slot text, p_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.room_require_owner(p_room);
  if p_slot is null or p_slot not in ('cushions', 'table', 'rug', 'mat') then
    raise exception 'invalid_slot' using errcode = '22023';
  end if;
  if not public.shop_can_use(auth.uid(), p_item, 'room_' || p_slot) then
    raise exception 'not_owned' using errcode = 'P0001';
  end if;
  update public.rooms r
     set decor_cushions = case when p_slot = 'cushions' then p_item else r.decor_cushions end,
         decor_table = case when p_slot = 'table' then p_item else r.decor_table end,
         decor_rug = case when p_slot = 'rug' then p_item else r.decor_rug end,
         decor_mat = case when p_slot = 'mat' then p_item else r.decor_mat end
   where r.id = p_room;
  return public.room_json(p_room);
end;
$$;

-- 화이트보드 문구 바꾸기 (방장만, 무료). 빈 문구는 기본 문구로 되돌린다.
create or replace function public.set_room_board(p_room uuid, p_text text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_text text := btrim(replace(coalesce(p_text, ''), E'\r', ''), E' \n');
  v_line text;
begin
  perform public.room_require_owner(p_room);
  if v_text ~ '\n.*\n' then
    raise exception 'invalid_board' using errcode = '22023';
  end if;
  foreach v_line in array string_to_array(v_text, E'\n') loop
    if char_length(btrim(v_line)) > 12 then
      raise exception 'invalid_board' using errcode = '22023';
    end if;
  end loop;
  update public.rooms r set board_text = nullif(v_text, '') where r.id = p_room;
  return public.room_json(p_room);
end;
$$;

revoke execute on function public.set_room_decor(uuid, text, text) from public, anon;
grant execute on function public.set_room_decor(uuid, text, text) to authenticated;
revoke execute on function public.set_room_board(uuid, text) from public, anon;
grant execute on function public.set_room_board(uuid, text) to authenticated;
