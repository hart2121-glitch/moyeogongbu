-- Story 009: 머리 모양과 머리 색을 따로 고른다 (2026-10-31 결정).
-- 머리 모양(slot hair)은 hair_back과 hair_front를, 머리 색(slot hair_color)은 새 hair_color 열을 정한다.
-- 색 하나를 사면 모든 머리 모양에 쓸 수 있다. 검정, 밤색, 라벤더는 무료, 나머지 7색은 300코인.
-- 지금의 긴 웨이브 머리 그림은 상점 '웨이브 머리'가 되고, 무료 기본 '단발 머리'는 그림이 생기기 전까지 머리카락 없이 보인다.

alter table public.shop_items drop constraint shop_items_slot_check;
alter table public.shop_items add constraint shop_items_slot_check
  check (slot in ('body', 'face', 'hair', 'hair_color', 'outfit', 'accessory'));
alter table public.shop_items drop constraint shop_items_sellable_slot;
alter table public.shop_items add constraint shop_items_sellable_slot
  check (is_default or slot in ('hair', 'hair_color', 'outfit', 'accessory'));

comment on table public.shop_items is '캐릭터 아이템 목록과 가격의 유일한 출처. 액세서리 120~300, 머리 색 300, 의상과 머리 모양 600~1500.';

-- 머리 모양: 짧은 머리는 남자 기본 '짧은 바가지 머리'(무료)가 되고, 똥머리와 바가지 머리를 판다.
update public.shop_items set name = '짧은 바가지 머리', price = 0, is_default = true, sort = 1 where id = 'hair-short';

insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('hair-basic', 'hair', '단발 머리', 0, true, 0),
  ('hair-bun', 'hair', '똥머리', 800, false, 34),
  ('hair-bowl', 'hair', '바가지 머리', 600, false, 35),
  ('hair-color-black', 'hair_color', '검정 머리', 0, true, 0),
  ('hair-color-chestnut', 'hair_color', '밤색 염색', 0, true, 1),
  ('hair-color-lavender', 'hair_color', '라벤더 염색', 0, true, 2),
  ('hair-color-gray', 'hair_color', '회색 염색', 300, false, 41),
  ('hair-color-ashgray', 'hair_color', '애쉬그레이 염색', 300, false, 42),
  ('hair-color-white', 'hair_color', '흰색 염색', 300, false, 43),
  ('hair-color-blonde', 'hair_color', '금발 염색', 300, false, 44),
  ('hair-color-red', 'hair_color', '빨강 염색', 300, false, 45),
  ('hair-color-pink', 'hair_color', '분홍 염색', 300, false, 46),
  ('hair-color-skyblue', 'hair_color', '하늘색 염색', 300, false, 47);

-- 이미 저장한 꾸밈은 모습이 그대로 남게 옮긴다: 예전 라벤더, 밤색 머리는 웨이브 머리(보유로 넣어 준다)와 그 색이 된다.
alter table public.character_looks add column hair_color text references public.shop_items (id);
update public.character_looks
   set hair_color = case when hair_front = 'hair-chestnut' then 'hair-color-chestnut' else 'hair-color-lavender' end;
insert into public.owned_items (user_id, item_id)
  select l.user_id, 'hair-wave' from public.character_looks l
   where l.hair_front in ('hair-lavender', 'hair-chestnut')
  on conflict do nothing;
update public.character_looks
   set hair_back = 'hair-wave', hair_front = 'hair-wave'
 where hair_front in ('hair-lavender', 'hair-chestnut') or hair_back in ('hair-lavender', 'hair-chestnut');
alter table public.character_looks alter column hair_color set not null;
delete from public.shop_items where id in ('hair-lavender', 'hair-chestnut');

-- 꾸밈 JSON에 머리 색을 더한다 (get_my_look, save_look, room_member_status가 함께 쓴다).
create or replace function public.character_look_json(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'body', l.body, 'face', l.face, 'hair_back', l.hair_back, 'hair_front', l.hair_front,
           'hair_color', l.hair_color, 'outfit', l.outfit, 'accessory', l.accessory, 'updated_at', l.updated_at)
    from public.character_looks l where l.user_id = p_user;
$$;

-- 꾸밈 저장에 머리 색을 더한다. 인자가 늘어 예전 함수는 지운다.
drop function public.save_look(text, text, text, text, text, text);
create function public.save_look(
  p_body text, p_face text, p_hair_back text, p_hair_front text, p_hair_color text, p_outfit text, p_accessory text)
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
          and public.shop_can_use(me, p_hair_color, 'hair_color')
          and public.shop_can_use(me, p_outfit, 'outfit')
          and (p_accessory is null or public.shop_can_use(me, p_accessory, 'accessory'))) then
    raise exception 'not_owned' using errcode = 'P0001';
  end if;
  insert into public.character_looks (user_id, body, face, hair_back, hair_front, hair_color, outfit, accessory, updated_at)
  values (me, p_body, p_face, p_hair_back, p_hair_front, p_hair_color, p_outfit, p_accessory, now())
  on conflict (user_id) do update
    set body = excluded.body, face = excluded.face, hair_back = excluded.hair_back,
        hair_front = excluded.hair_front, hair_color = excluded.hair_color, outfit = excluded.outfit,
        accessory = excluded.accessory, updated_at = now();
  return public.character_look_json(me);
end;
$$;

revoke execute on function public.save_look(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.save_look(text, text, text, text, text, text, text) to authenticated;
