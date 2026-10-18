// 로컬 데모의 동일 출처 탭 간 좌석 저장소. 서버 도입 시 이 인터페이스를 교체합니다.
export const LEASE_MS = 45000;
export function createSeatService(roomId, ownerId, nickname) {
  const key = `moyeogongbu.seats.v1.${roomId}`,
    lock = `${key}.lock`;
  const channel =
    typeof BroadcastChannel === "function" ? new BroadcastChannel(key) : null;
  const listeners = new Set();
  let closed = false;
  const read = () => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      const now = Date.now();
      return Object.fromEntries(
        Object.entries(data).filter(
          ([seat, r]) =>
            /^[1-6]$/.test(seat) &&
            r &&
            typeof r.ownerId === "string" &&
            typeof r.name === "string" &&
            ["reserved", "occupied"].includes(r.state) &&
            Number.isFinite(r.expiresAt) &&
            r.expiresAt > now,
        ),
      );
    } catch {
      throw new Error(
        "좌석 저장소를 읽을 수 없어 중복 예약을 방지하기 위해 입장을 중단했어요.",
      );
    }
  };
  const notify = () => {
    if (closed) return;
    try {
      const value = read();
      listeners.forEach((fn) => fn(value));
    } catch {
      listeners.forEach((fn) => fn(null));
    }
  };
  const transaction = async (update) => {
    if (!navigator.locks?.request)
      throw new Error(
        "이 브라우저는 탭 간 좌석 잠금을 지원하지 않아요. 최신 Chrome 또는 Edge로 열어 주세요.",
      );
    return navigator.locks.request(lock, () => {
      const data = read(),
        result = update(data);
      localStorage.setItem(key, JSON.stringify(data));
      channel?.postMessage("changed");
      notify();
      return result;
    });
  };
  const storage = (e) => {
    if (e.key === key) notify();
  };
  window.addEventListener("storage", storage);
  if (channel) channel.onmessage = notify;
  const renew = () =>
    transaction((data) => {
      for (const entry of Object.values(data))
        if (entry.ownerId === ownerId) entry.expiresAt = Date.now() + LEASE_MS;
    }).catch(() => listeners.forEach((fn) => fn(null)));
  const timer = setInterval(() => {
    notify();
    renew();
  }, 10000);
  return {
    ownerId,
    subscribe(fn) {
      listeners.add(fn);
      notify();
      return () => listeners.delete(fn);
    },
    reserve: (seatId) =>
      transaction((data) => {
        if (!Number.isInteger(seatId) || seatId < 1 || seatId > 6)
          throw new Error("잘못된 좌석입니다.");
        const existing = data[seatId];
        if (existing && existing.ownerId !== ownerId) return false;
        for (const seat of Object.keys(data))
          if (data[seat].ownerId === ownerId) delete data[seat];
        data[seatId] = {
          ownerId,
          name: nickname,
          state: "reserved",
          expiresAt: Date.now() + LEASE_MS,
        };
        return true;
      }),
    occupy: (seatId) =>
      transaction((data) => {
        const entry = data[seatId];
        if (!entry || entry.ownerId !== ownerId) return false;
        entry.state = "occupied";
        entry.expiresAt = Date.now() + LEASE_MS;
        return true;
      }),
    release: () =>
      transaction((data) => {
        for (const seat of Object.keys(data))
          if (data[seat].ownerId === ownerId) delete data[seat];
      }),
    close() {
      closed = true;
      clearInterval(timer);
      window.removeEventListener("storage", storage);
      channel?.close();
      listeners.clear();
    },
  };
}
