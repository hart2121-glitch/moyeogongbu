// 좌석 번호 표시 (2026-11-11): 앞줄에 앉은 사람의 캐릭터가 뒷줄 좌석 번호 자리를 덮으면, 그림 속 동그라미는 캐릭터에
// 가려지는데 번호 글자만 머리 위에 떠 보인다. 그런 번호는 글자를 숨긴다.

/**
 * 앉아 있는 사람의 캐릭터 그림(발이 좌석 지점, 폭과 높이는 layout.character) 안에 들어가는 다른 좌석 번호 id.
 * @param {{ id: number, node: string, label: { x: number, y: number }, lease?: { state: string } | null }[]} seats
 * @param {{ nodes: Record<string, { x: number, y: number }>, character: { width: number, height: number } }} layout
 * @returns {Set<number>}
 * @example coveredSeatIds(seats, companyFinalLayout) // 4번에 앉아 있으면 Set {1}
 */
export function coveredSeatIds(seats, layout) {
  const { width, height } = layout.character;
  const covered = new Set();
  for (const seat of seats) {
    if (seat.lease?.state !== "occupied") continue;
    const feet = layout.nodes[seat.node];
    if (!feet) continue;
    for (const other of seats)
      if (other.id !== seat.id && Math.abs(other.label.x - feet.x) < width / 2 && other.label.y > feet.y - height && other.label.y < feet.y)
        covered.add(other.id);
  }
  return covered;
}
