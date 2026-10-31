-- Story 009: 눈 색 7종. 기본 얼굴의 눈동자 색만 바꾼 아이템이다. 처음 모습은 검은 눈이다(클라이언트 DEFAULT_LOOK).
-- 얼굴은 기본 아이템만 둘 수 있으므로(shop_items_sellable_slot) 모두 가입하면 무료로 받는다.
update public.shop_items set name = '보라 눈', sort = 6 where id = 'face-basic';

insert into public.shop_items (id, slot, name, price, is_default, sort) values
  ('face-black', 'face', '검은 눈', 0, true, 0),
  ('face-brown', 'face', '갈색 눈', 0, true, 1),
  ('face-amber', 'face', '호박색 눈', 0, true, 2),
  ('face-green', 'face', '초록 눈', 0, true, 3),
  ('face-blue', 'face', '파란 눈', 0, true, 4),
  ('face-gray', 'face', '회색 눈', 0, true, 5);
