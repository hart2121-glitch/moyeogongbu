// 로컬 데모의 동일 출처 탭 간 좌석 저장소. 서버 도입 시 이 인터페이스를 교체합니다.
export const LEASE_MS = 45000;
let database;
const openDatabase = () =>
  (database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open("moyeogongbu-seat-locks", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("rooms");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = null;
      reject(new Error("좌석 저장소를 열 수 없어요."));
    };
  }));
export function createSeatService(roomId, ownerId, nickname) {
  const key = `moyeogongbu.seats.v1.${roomId}`;
  const channel =
    typeof BroadcastChannel === "function" ? new BroadcastChannel(key) : null;
  const listeners = new Set();
  let closed = false;
  const read = (stored) => {
    try {
      const data = stored ?? JSON.parse(localStorage.getItem(key) || "{}");
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
  // IndexedDB readwrite 트랜잭션은 탭 사이에서도 읽기→검사→쓰기를 원자적으로 처리합니다.
  // localStorage는 기존 데이터 이관과 알림용 사본일 뿐 예약의 승인 근거로 쓰지 않습니다.
  const record = async (mode, update) => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("rooms", mode),
        store = tx.objectStore("rooms"),
        request = store.get(key);
      let data, result, problem;
      request.onsuccess = () => {
        try {
          data = read(request.result);
          if (update) {
            result = update(data);
            store.put(data, key);
          }
        } catch (e) {
          problem = e;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve({ data, result });
      tx.onabort = tx.onerror = () =>
        reject(problem || new Error("좌석 저장소 처리에 실패했어요."));
    });
  };
  let notification = 0;
  const notify = async () => {
    const id = ++notification;
    try {
      const { data } = await record("readonly");
      if (!closed && id === notification) listeners.forEach((fn) => fn(data));
    } catch {
      if (!closed && id === notification) listeners.forEach((fn) => fn(null));
    }
  };
  const transaction = async (update) => {
    const { data, result } = await record("readwrite", update);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      /* 승인된 원자적 저장은 유지합니다. */
    }
    if (!closed) {
      channel?.postMessage("changed");
      notify();
    }
    return result;
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
