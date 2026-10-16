export const CAPACITY = 6;
export const STORAGE_KEY = "moyeogongbu.rooms.v1";
export const DEMO_INVITATION = {
  id: "invited-demo",
  name: "함께하는 회사",
  code: "MOYEO6",
  kind: "invited",
  theme: "company",
  capacity: CAPACITY,
};
const validRoom = (room) =>
  room &&
  typeof room.id === "string" &&
  typeof room.name === "string" &&
  room.name.trim().length > 0 &&
  room.name.length <= 30 &&
  /^[A-Z0-9]{6}$/.test(room.code) &&
  ["owned", "invited"].includes(room.kind) &&
  room.theme === "company" &&
  room.capacity === CAPACITY;
export function loadRooms(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (
      Array.isArray(saved) &&
      saved.length <= 100 &&
      saved.every(validRoom) &&
      new Set(saved.map((r) => r.id)).size === saved.length &&
      new Set(saved.map((r) => r.code)).size === saved.length
    )
      return saved;
  } catch {
    /* 손상된 저장값은 사용하지 않습니다. */
  }
  return [DEMO_INVITATION];
}
export function makeRoom(name, rooms) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 30)
    throw new Error("방 이름을 1~30자로 입력해 주세요.");
  if (rooms.length >= 100)
    throw new Error("로컬 데모에서는 최대 100개의 방을 저장할 수 있어요.");
  let code;
  do {
    code = Array.from(
      crypto.getRandomValues(new Uint8Array(6)),
      (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 32],
    ).join("");
  } while (rooms.some((room) => room.code === code));
  return {
    id: `room-${code}-${Date.now().toString(36)}`,
    name: trimmed,
    code,
    kind: "owned",
    theme: "company",
    capacity: CAPACITY,
  };
}
