// 정규화 좌표의 거리를 실제 원본 크기로 계산합니다. 기존 그래프는 v2 크기를 기본값으로 사용합니다.
export const distance = (a, b, image = { width: 1536, height: 1024 }) =>
  Math.hypot((b.x - a.x) * image.width, (b.y - a.y) * image.height);
export function findPath(graph, from, to) {
  if (!graph.nodes[from] || !graph.nodes[to])
    throw new Error("이동 지점을 찾을 수 없어요.");
  const cost = { [from]: 0 };
  const previous = {};
  const visited = new Set();
  while (true) {
    const current = Object.keys(cost)
      .filter((id) => !visited.has(id))
      .sort((a, b) => cost[a] - cost[b])[0];
    if (!current) throw new Error("연결된 통로가 없어요.");
    if (current === to) break;
    visited.add(current);
    for (const [a, b] of graph.edges) {
      const next = a === current ? b : b === current ? a : null;
      if (!next || visited.has(next)) continue;
      const candidate =
        cost[current] +
        distance(graph.nodes[current], graph.nodes[next], graph.image);
      if (candidate < (cost[next] ?? Infinity)) {
        cost[next] = candidate;
        previous[next] = current;
      }
    }
  }
  const path = [to];
  while (path[0] !== from) path.unshift(previous[path[0]]);
  return path;
}
