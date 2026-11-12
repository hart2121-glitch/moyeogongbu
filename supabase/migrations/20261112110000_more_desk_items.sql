-- Story 009 내 책상 세트에 소품 여섯 개를 더한다 (2026-11-12). 그림은 tools/art/desk-items.mjs가 만든 public/assets/rooms/desk/<id>.png.
-- 책상 소품은 가격 순으로 늘어서도록 진열 순서를 다시 매기고, 앞면 스티커는 소품 뒤로 옮긴다.

insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('desk-pencils', 'desk_top', '연필꽂이', 200, false, 64),
  ('desk-candle', 'desk_top', '향초', 260, false, 66),
  ('desk-clock', 'desk_top', '민트 자명종', 300, false, 68),
  ('desk-bunny', 'desk_top', '토끼 인형', 360, false, 69),
  ('desk-hourglass', 'desk_top', '모래시계', 420, false, 70),
  ('desk-fishbowl', 'desk_top', '금붕어 어항', 540, false, 72);

update public.shop_items s set sort = v.sort
  from (values
  ('desk-cactus', 65),
  ('desk-cat', 67),
  ('desk-moon', 71),
  ('desk-globe', 73),
  ('sticker-star', 80),
  ('sticker-cat', 81)
  ) as v(id, sort)
  where s.id = v.id;
