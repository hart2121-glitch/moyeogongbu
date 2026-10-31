-- Story 009: 남자 머리 모양 3종 (사용자가 시안에서 고름). 머리 모양 가격대 600~1500 안에서 정했다.
insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('hair-dandy', 'hair', '댄디 머리', 700, false, 36),
  ('hair-comma', 'hair', '쉼표 머리', 900, false, 37),
  ('hair-perm', 'hair', '웨이브 펌', 1000, false, 38);
