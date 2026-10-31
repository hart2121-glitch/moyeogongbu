-- Story 009, 꾸미기 슬롯 계획 1절: 내 책상 세트 (2026-10-31 사용자 결정: 책상 꾸밈은 좌석이 아니라 사람에게 붙는다).
-- 회사 방 책상마다 세 자리가 있다: 왼쪽과 오른쪽(책상 위에 서는 소품), 앞면(번호 왼쪽 판에 붙이는 스티커).
-- 앉은 사람의 세트가 그 책상에 펼쳐지고, 빈 자리는 기본 세트(왼쪽 스탠드, 오른쪽 화분)다.
-- 소품(desk_top)은 왼쪽과 오른쪽 어디에나, 스티커(desk_front)는 앞면에만 놓는다. 세트는 꾸밈(character_looks)에 함께 저장해
-- 같은 방 사람에게 꾸민 모습과 같은 길(room_member_status)로 간다.

alter table public.shop_items drop constraint shop_items_slot_check;
alter table public.shop_items add constraint shop_items_slot_check
  check (slot in ('body', 'face', 'hair', 'hair_color', 'outfit', 'accessory', 'desk_top', 'desk_front'));
alter table public.shop_items drop constraint shop_items_sellable_slot;
alter table public.shop_items add constraint shop_items_sellable_slot
  check (is_default or slot in ('hair', 'hair_color', 'outfit', 'accessory', 'desk_top', 'desk_front'));

comment on table public.shop_items is
  '아이템 목록과 가격의 유일한 출처. 액세서리 120~300, 머리 색 300, 의상과 머리 모양 600~1500, 책상 소품 180~600.';

insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('desk-lamp', 'desk_top', '책상 스탠드', 0, true, 60),
  ('desk-plant', 'desk_top', '작은 화분', 0, true, 61),
  ('desk-books', 'desk_top', '책 더미', 180, false, 62),
  ('desk-mug', 'desk_top', '머그와 쿠키', 180, false, 63),
  ('desk-cactus', 'desk_top', '꽃 핀 선인장', 240, false, 64),
  ('desk-cat', 'desk_top', '고양이 인형', 300, false, 65),
  ('desk-moon', 'desk_top', '달 무드등', 480, false, 66),
  ('desk-globe', 'desk_top', '작은 지구본', 600, false, 67),
  ('sticker-star', 'desk_front', '별 스티커', 180, false, 70),
  ('sticker-cat', 'desk_front', '고양이 스티커', 240, false, 71);

-- 이미 꾸민 사람도 지금 회사 방처럼 스탠드와 화분이 놓인 책상에서 시작한다. null은 그 자리를 비운다.
alter table public.character_looks add column desk_left text references public.shop_items (id) default 'desk-lamp';
alter table public.character_looks add column desk_right text references public.shop_items (id) default 'desk-plant';
alter table public.character_looks add column desk_front text references public.shop_items (id);
update public.character_looks set desk_left = 'desk-lamp', desk_right = 'desk-plant';

-- 꾸밈 JSON에 책상 세트를 더한다 (get_my_look, save_look, room_member_status가 함께 쓴다).
create or replace function public.character_look_json(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'body', l.body, 'face', l.face, 'hair_back', l.hair_back, 'hair_front', l.hair_front,
           'hair_color', l.hair_color, 'outfit', l.outfit, 'accessory', l.accessory, 'gender', l.gender,
           'desk_left', l.desk_left, 'desk_right', l.desk_right, 'desk_front', l.desk_front,
           'updated_at', l.updated_at)
    from public.character_looks l where l.user_id = p_user;
$$;

-- 꾸밈 저장에 책상 세트를 더한다. 인자가 늘어 예전 함수는 지운다.
drop function public.save_look(text, text, text, text, text, text, text, text);
create function public.save_look(
  p_body text, p_face text, p_hair_back text, p_hair_front text, p_hair_color text, p_outfit text, p_accessory text,
  p_gender text, p_desk_left text, p_desk_right text, p_desk_front text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  perform public.room_require_login();
  if p_gender is null or p_gender not in ('f', 'm') then
    raise exception 'invalid_gender' using errcode = 'P0001';
  end if;
  if not (public.shop_can_use(me, p_body, 'body')
          and public.shop_can_use(me, p_face, 'face')
          and public.shop_can_use(me, p_hair_back, 'hair')
          and public.shop_can_use(me, p_hair_front, 'hair')
          and public.shop_can_use(me, p_hair_color, 'hair_color')
          and public.shop_can_use(me, p_outfit, 'outfit')
          and (p_accessory is null or public.shop_can_use(me, p_accessory, 'accessory'))
          and (p_desk_left is null or public.shop_can_use(me, p_desk_left, 'desk_top'))
          and (p_desk_right is null or public.shop_can_use(me, p_desk_right, 'desk_top'))
          and (p_desk_front is null or public.shop_can_use(me, p_desk_front, 'desk_front'))) then
    raise exception 'not_owned' using errcode = 'P0001';
  end if;
  insert into public.character_looks (user_id, body, face, hair_back, hair_front, hair_color, outfit, accessory, gender,
                                      desk_left, desk_right, desk_front, updated_at)
  values (me, p_body, p_face, p_hair_back, p_hair_front, p_hair_color, p_outfit, p_accessory, p_gender,
          p_desk_left, p_desk_right, p_desk_front, now())
  on conflict (user_id) do update
    set body = excluded.body, face = excluded.face, hair_back = excluded.hair_back,
        hair_front = excluded.hair_front, hair_color = excluded.hair_color, outfit = excluded.outfit,
        accessory = excluded.accessory, gender = excluded.gender, desk_left = excluded.desk_left,
        desk_right = excluded.desk_right, desk_front = excluded.desk_front, updated_at = now();
  return public.character_look_json(me);
end;
$$;

revoke execute on function public.save_look(text, text, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.save_look(text, text, text, text, text, text, text, text, text, text, text) to authenticated;
