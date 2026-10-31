// 사용법: node tools/art/validate.mjs [art-src 경로]
// characters/와 rooms/의 그림을 모두 검사한다. 위반이 있으면 종료 코드 1.
// preview로 시작하는 파일과 draft로 시작하는 시안은 검사하지 않는다.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkImage, decodePng, ROOM, SHEET } from "./pixelArt.mjs";

/**
 * art-src 폴더 전체를 검사한다.
 * @returns {{file:string, problems:string[]}[]} 파일별 결과
 */
export function validateArtDir(root) {
  const results = [];
  const groups = [
    { dir: "characters", size: SHEET },
    { dir: "rooms", size: ROOM },
  ];
  for (const { dir, size } of groups) {
    const folder = join(root, dir);
    if (!existsSync(folder)) continue;
    const names = readdirSync(folder).filter(
      (n) => n.endsWith(".png") && !n.startsWith("preview") && !n.startsWith("draft"),
    );
    for (const name of names) {
      const file = join(folder, name);
      const image = decodePng(readFileSync(file));
      results.push({ file, problems: checkImage(image, { size, checkFeet: name.startsWith("body-") }) });
    }
  }
  return results;
}

if (process.argv[1]?.endsWith("validate.mjs")) {
  const results = validateArtDir(process.argv[2] ?? "art-src");
  let failed = 0;
  for (const { file, problems } of results) {
    console.log(`${problems.length ? "실패" : "통과"}  ${file}`);
    for (const p of problems) console.log(`      ${p}`);
    if (problems.length) failed++;
  }
  console.log(`\n${results.length}개 중 ${failed}개 실패`);
  process.exit(failed ? 1 : 0);
}
