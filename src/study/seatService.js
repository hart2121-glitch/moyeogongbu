// 방 좌석 저장소 (Story 004). 점유 판정은 서버 claim_seat가 하고(두 사람이 같은 자리를 동시에
// 눌러도 한 명만 앉는다), 이 객체는 서버에서 받은 최근 좌석 상태를 들고 구독자에게 알린다.
// IndexedDB 트랜잭션이 하던 원자적 예약은 DB 잠금과 제약이 대신한다. 인터페이스는 그대로다.

/**
 * @typedef {{ seatNo: number, userId: string | null }} SeatRow
 * @typedef {{ ownerId: string, name: string, state: "reserved" | "occupied" }} SeatLease
 * @param {{
 *   ownerId: string,
 *   claim: (seatId: number) => Promise<boolean>,
 *   release: () => Promise<void>,
 *   fetchSeats: () => Promise<SeatRow[]>,
 *   nameOf?: (userId: string) => string,
 *   onChanged?: () => void,
 * }} server
 */
export function createSeatService({ ownerId, claim, release, fetchSeats, nameOf = () => "", onChanged }) {
  const listeners = new Set();
  let rows = [];
  let seated = null; // 내 자리를 잡은 뒤 앉기 전이면 reserved, 앉았으면 occupied.
  let closed = false;
  const view = () =>
    Object.fromEntries(
      rows
        .filter((r) => r.userId)
        .map((r) => [
          r.seatNo,
          {
            ownerId: r.userId,
            name: nameOf(r.userId),
            state: r.userId === ownerId && seated?.seatId === r.seatNo ? seated.state : "occupied",
          },
        ]),
    );
  const emit = (value = view()) => {
    if (!closed) listeners.forEach((fn) => fn(value));
  };
  const apply = (next) => {
    rows = next;
    if (seated && !rows.some((r) => r.seatNo === seated.seatId && r.userId === ownerId)) seated = null;
    emit();
  };
  const refresh = async () => {
    try {
      apply(await fetchSeats());
    } catch (e) {
      emit(null);
      throw e;
    }
  };
  return {
    ownerId,
    subscribe(fn) {
      listeners.add(fn);
      fn(view());
      return () => listeners.delete(fn);
    },
    /** 서버가 돌려준 좌석 상태를 반영한다 (입장, 연결 확인). */
    apply,
    /** 이름이 바뀌었을 때 다시 알린다. */
    renamed: () => emit(),
    refresh,
    reserve: async (seatId) => {
      if (!Number.isInteger(seatId) || seatId < 1 || seatId > 6) throw new Error("잘못된 좌석입니다.");
      const ok = await claim(seatId);
      if (ok) seated = { seatId, state: "reserved" };
      await refresh().catch(() => {});
      if (ok) onChanged?.();
      return ok;
    },
    /** 앉았다. 서버에서 아직 내 자리인지 확인한다. */
    occupy: async (seatId) => {
      await refresh();
      const mine = rows.some((r) => r.seatNo === seatId && r.userId === ownerId);
      if (mine) {
        seated = { seatId, state: "occupied" };
        emit();
      }
      return mine;
    },
    release: async () => {
      const had = seated || rows.some((r) => r.userId === ownerId);
      seated = null;
      if (!had) return;
      await release();
      rows = rows.map((r) => (r.userId === ownerId ? { ...r, userId: null } : r));
      emit();
      onChanged?.();
    },
    close() {
      closed = true;
      listeners.clear();
    },
  };
}
