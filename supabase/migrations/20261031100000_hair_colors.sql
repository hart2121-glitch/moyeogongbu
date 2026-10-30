-- Story 009: 머리 색 8종. 기본 웨이브 머리(라벤더)의 색만 바꾼 아이템이라 머리 가격대(600~1500)의 가장 낮은 값.
insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('hair-black', 'hair', '검은 머리', 600, false, 34),
  ('hair-gray', 'hair', '회색 머리', 600, false, 35),
  ('hair-ashgray', 'hair', '애쉬그레이 머리', 600, false, 36),
  ('hair-white', 'hair', '흰 머리', 600, false, 37),
  ('hair-blonde', 'hair', '금발 머리', 600, false, 38),
  ('hair-red', 'hair', '빨간 머리', 600, false, 39),
  ('hair-pink', 'hair', '분홍 머리', 600, false, 40),
  ('hair-skyblue', 'hair', '하늘색 머리', 600, false, 41);
