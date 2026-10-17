export function overlaps(a, b) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}
export function characterBounds(character, layout) {
  const { width, height } = layout.character;
  return {
    left: character.position.x - width / 2,
    right: character.position.x + width / 2,
    top: character.position.y - height,
    bottom: character.position.y,
  };
}
export function getCharacterOcclusion(character, layout) {
  if (character.activity === "seated")
    return layout.seatedMode === "sprite" ? null : "seated";
  if (
    character.edge &&
    layout.portalEdges.some(
      ([a, b]) =>
        (character.edge[0] === a && character.edge[1] === b) ||
        (character.edge[0] === b && character.edge[1] === a),
    )
  )
    return "doorway";
  if (
    layout.backgroundPeople.some((person) =>
      overlaps(characterBounds(character, layout), person),
    )
  )
    return "background-person";
  if (
    layout.obstacles.some((obstacle) =>
      overlaps(characterBounds(character, layout), obstacle),
    )
  )
    return "furniture";
  return null;
}
