// 바닥 클릭 및 모든 목적지는 동일한 발 기준 내비게이션을 사용합니다.
const cache = new WeakMap();
const pointInRect = (p, r) =>
  p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
export function isWalkable(layout, p) {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  const nav = layout.navigation;
  if (!nav.areas.some((r) => pointInRect(p, r))) return false;
  const rx = nav.radius / layout.image.width,
    ry = nav.radius / layout.image.height;
  return !nav.blockers.some(
    (r) =>
      p.x > r.left - rx &&
      p.x < r.right + rx &&
      p.y > r.top - ry &&
      p.y < r.bottom + ry,
  );
}
// 선분과 사각형의 교차 구간. 얇은 장애물도 표본 간격에 의존하지 않고 검사합니다.
function rectInterval(a, b, r) {
  let enter = 0,
    exit = 1;
  for (const [axis, low, high] of [
    ["x", r.left, r.right],
    ["y", r.top, r.bottom],
  ]) {
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-12) {
      if (a[axis] < low || a[axis] > high) return null;
    } else {
      const t1 = (low - a[axis]) / delta,
        t2 = (high - a[axis]) / delta;
      enter = Math.max(enter, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (enter > exit) return null;
    }
  }
  return [enter, exit];
}
export function segmentWalkable(layout, a, b) {
  if (!isWalkable(layout, a) || !isWalkable(layout, b)) return false;
  const nav = layout.navigation,
    rx = nav.radius / layout.image.width,
    ry = nav.radius / layout.image.height;
  for (const r of nav.blockers) {
    const expanded = {
      left: r.left - rx,
      right: r.right + rx,
      top: r.top - ry,
      bottom: r.bottom + ry,
    };
    const interval = rectInterval(a, b, expanded);
    if (interval) {
      const t = (interval[0] + interval[1]) / 2;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (
        p.x > expanded.left &&
        p.x < expanded.right &&
        p.y > expanded.top &&
        p.y < expanded.bottom
      )
        return false;
    }
  }
  // 시작점과 끝점이 바닥이어도 중간에 벽/허용 영역 밖을 가로지르면 차단합니다.
  const intervals = nav.areas
    .map((r) => rectInterval(a, b, r))
    .filter(Boolean)
    .sort((x, y) => x[0] - y[0]);
  let covered = 0;
  for (const [start, end] of intervals) {
    if (start > covered + 1e-10) return false;
    covered = Math.max(covered, end);
  }
  return covered >= 1 - 1e-10;
}

class Heap {
  items = [];
  push(v) {
    let i = this.items.length;
    this.items.push(v);
    while (i) {
      const p = (i - 1) >> 1;
      if (this.items[p].score <= v.score) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = v;
  }
  pop() {
    const root = this.items[0],
      last = this.items.pop();
    if (this.items.length) {
      let i = 0;
      while (true) {
        let child = i * 2 + 1;
        if (child >= this.items.length) break;
        if (
          child + 1 < this.items.length &&
          this.items[child + 1].score < this.items[child].score
        )
          child++;
        if (this.items[child].score >= last.score) break;
        this.items[i] = this.items[child];
        i = child;
      }
      this.items[i] = last;
    }
    return root;
  }
}
function gridFor(layout) {
  if (cache.has(layout)) return cache.get(layout);
  const step = layout.navigation.step,
    w = Math.ceil(layout.image.width / step) + 1,
    h = Math.ceil(layout.image.height / step) + 1;
  const point = (id) => ({
    x: ((id % w) * step) / layout.image.width,
    y: (Math.floor(id / w) * step) / layout.image.height,
  });
  const open = new Uint8Array(w * h);
  for (let id = 0; id < open.length; id++)
    open[id] = Number(isWalkable(layout, point(id)));
  const grid = { step, w, h, open, point };
  cache.set(layout, grid);
  return grid;
}
export function navigateFloor(layout, start, end) {
  if (!isWalkable(layout, start) || !isWalkable(layout, end))
    throw new Error("벽이나 가구 대신 이동 가능한 바닥을 선택해 주세요.");
  if (segmentWalkable(layout, start, end)) return [start, end];
  const g = gridFor(layout),
    { w, h, open, point } = g;
  const snap = (p) => {
    const cx = Math.round((p.x * layout.image.width) / g.step),
      cy = Math.round((p.y * layout.image.height) / g.step);
    let best = null,
      bestDistance = Infinity;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const x = cx + dx,
          y = cy + dy,
          id = y * w + x;
        if (x < 0 || y < 0 || x >= w || y >= h || !open[id]) continue;
        const q = point(id),
          d = Math.hypot(dx, dy);
        if (d < bestDistance && segmentWalkable(layout, p, q)) {
          best = id;
          bestDistance = d;
        }
      }
    if (best === null)
      throw new Error("이 위치로 연결된 통로를 찾을 수 없어요.");
    return best;
  };
  const from = snap(start),
    to = snap(end),
    cost = new Float64Array(w * h).fill(Infinity),
    previous = new Int32Array(w * h).fill(-1),
    closed = new Uint8Array(w * h);
  const heuristic = (id) =>
    Math.hypot((id % w) - (to % w), Math.floor(id / w) - Math.floor(to / w));
  const heap = new Heap();
  cost[from] = 0;
  heap.push({ id: from, score: heuristic(from) });
  while (heap.items.length) {
    const { id } = heap.pop();
    if (closed[id]) continue;
    if (id === to) break;
    closed[id] = 1;
    const x = id % w,
      y = Math.floor(id / w);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx,
          ny = y + dy,
          n = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !open[n] || closed[n])
          continue;
        if (dx && dy && (!open[y * w + nx] || !open[ny * w + x])) continue;
        if (!segmentWalkable(layout, point(id), point(n))) continue;
        const next = cost[id] + Math.hypot(dx, dy);
        if (next < cost[n]) {
          cost[n] = next;
          previous[n] = id;
          heap.push({ id: n, score: next + heuristic(n) });
        }
      }
  }
  if (from !== to && previous[to] === -1)
    throw new Error("선택한 바닥으로 연결된 통로가 없어요.");
  const ids = [to];
  while (ids[0] !== from) ids.unshift(previous[ids[0]]);
  const raw = [start, ...ids.map(point), end],
    route = [start];
  let i = 0;
  while (i < raw.length - 1) {
    let next = raw.length - 1;
    while (next > i + 1 && !segmentWalkable(layout, raw[i], raw[next])) next--;
    route.push(raw[next]);
    i = next;
  }
  return route;
}
