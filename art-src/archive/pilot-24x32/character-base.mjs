// Story 009 pilot. Every mark is an integer pixel: no source-image tracing,
// image generation, canvas, filtering, dependencies, or fractional alpha.
// Run after palette.mjs: node tools/art/character-base.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { encodePng, FRAME, SHEET } from './pixelArt.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const colors = JSON.parse(readFileSync(resolve(root, 'art-src/palette.json'), 'utf8'));
if (colors.length !== 32 || new Set(colors).size !== 32) throw new Error('Expected 32 unique palette colors');
const rgba = colors.map(hex => [...hex.slice(1).match(/../g).map(n => parseInt(n, 16)), 255]);
const names = ['body-basic', 'face-basic', 'hair-lavender-back', 'hair-lavender-front', 'outfit-lavender', 'acc-ribbon'];
// Character-facing semantic indices in the curated shared palette.
const ink = { O: 0, o: 1, h: 2, H: 3, l: 4, L: 5, p: 6, P: 7, q: 8,
  s: 9, S: 10, c: 11, b: 12, C: 13, d: 14, D: 15, w: 16 };
const blank = (width = 24, height = 32) => ({ width, height, pixels: new Uint8Array(width * height * 4) });
function dot(im, x, y, color) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= im.width || y < 0 || y >= im.height)
    throw new Error(`Pixel out of bounds: ${x},${y}`);
  im.pixels.set(color === '.' ? [0, 0, 0, 0] : rgba[ink[color]], (y * im.width + x) * 4);
}
function rect(im, x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy++) for (let xx = x; xx < x + width; xx++) dot(im, xx, yy, color);
}
function stamp(im, x, y, rows) {
  rows.forEach((row, dy) => [...row].forEach((c, dx) => { if (c !== '.') dot(im, x + dx, y + dy, c); }));
}
function composite(dest, source, ox = 0, oy = 0) {
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
    const at = (y * source.width + x) * 4;
    if (source.pixels[at + 3]) dest.pixels.set(source.pixels.subarray(at, at + 4), ((y + oy) * dest.width + x + ox) * 4);
  }
}
function mirror(im) {
  const out = blank();
  for (let y = 0; y < 32; y++) for (let x = 0; x < 24; x++) {
    const from = (y * 24 + x) * 4;
    out.pixels.set(im.pixels.subarray(from, from + 4), (y * 24 + 23 - x) * 4);
  }
  return out;
}

// The face is deliberately empty in the body sheet, so swapping face/hair is
// possible. The back-hair sheet is a hollow silhouette around that face.
function head(body, face, back, front, direction) {
  stamp(body, 5, 7, [
    '....OOOOOO....', '...OccccccO...', '..OccccccccO..', '.OccccccccccO.',
    '.OccccccccccO.', 'OccccccccccccO', 'OSccccccccccSO', 'OSccccccccccSO',
    '.OSccccccccSO.', '..OSccccccSO..', '...OSSSSSSO...', '....OOOOOO....',
  ]);
  rect(body, 10, 18, 4, 4, 'S');
  rect(body, 11, 19, 2, 2, 'c');
  // x=3..20, y=5..23. Broad crown, small two-step curls, no loose pixels.
  stamp(back, 3, 5, [
    '.....OOOOOOOO.....', '...OOllllllllOO...', '..OlllHHHHHHlllO..',
    '.OlllHHHHHHHHlllO.', '.OllHHHHHHHHHHllO.', 'OllHHHHHHHHHHHHllO',
    'OlHHHHHHHHHHHHHHlO', 'OlH..........HllHO', 'OlH..........HllHO',
    'OlH..........HllHO', 'OHH..........HllHO', '.OH..........HllO.',
    '.OH..........HllO.', 'OlH..........HllHO', 'OlH..........HllHO',
    'OHhO........OHlhHO', '.OhO........OhlhO.', '.OO..........OO...',
    '..................',
  ]);
  if (direction === 'up') {
    // A full back cap, tapered into a bob. No face marks leak through it.
    stamp(back, 5, 7, [
      '..OllllllllO..', '.OlllLLLLlllO.', 'OlllHHlHHHlllO', 'OllHHHlHHHHllO',
      'OllHHHlHHHHllO', 'OllHHHhHHHHHlO', 'OlHHHHhHHHHHlO', 'OlHHHHhHHHHHlO',
      'OHHHHHhHHHHHHO', '.OHHHHhHHHHHO.', '.OHhHHhHHHhHO.', '..OhhHHHHhhO..',
      '...OhhhhhhO...', '....OOOOOO....',
    ]);
  } else if (direction === 'left') {
    // Nose faces left. The far eye is hidden by the bridge and fringe.
    rect(body, 4, 14, 2, 2, 'c'); dot(body, 3, 14, 'O'); dot(body, 4, 16, 's');
    rect(back, 5, 12, 1, 5, '.');
    stamp(face, 5, 13, ['O', 'C', 'p']); dot(face, 5, 16, 'b'); dot(face, 6, 17, 's');
    stamp(front, 5, 7, [
      '..OlllllllO...', '.OllLLlllllO..', 'OlllHHHlHlllO.', 'OllHHHHlHHllO.',
      'OllHHHHlHHHlO.', 'OHHHHHHlHHHHO.', '..OHHHHlHHHHO.', '...OHHHlHHHHO.',
      '....OHHhHHHHO.', '.....OHhHHHHO.', '.....OHhHHhHO.', '......OhhhhO..',
      '.......OOOO...',
    ]);
  } else {
    // Two 2x3 eyes with a single ivory catchlight; blush sits below the eye.
    stamp(face, 7, 14, ['OO.....OO', 'CO.....CO', 'pO.....pO']);
    dot(face, 6, 16, 'b'); dot(face, 17, 16, 'b');
    dot(face, 11, 17, 's'); dot(face, 12, 17, 's');
    stamp(front, 5, 7, [
      '..OllllllllO..', '.OlllLLLLlllO.', 'OlllHHlHHHlllO', 'OllHHHlHHHHllO',
      'OlHHHHlHHHHHlO', 'OHHHHOHHHOHHHO', '.OHHO.OHHO.HO.', '......OO......',
    ]);
  }
}

// Leg geometry changes every phase without moving the bottom-center origin.
// Both toes stay on the ground plane; this is a quiet, shuffling office walk.
function limbs(body, outfit, direction, phase) {
  const walking = phase >= 0;
  const spread = walking && phase % 2 === 0;
  const lx = spread ? 7 : 8, rx = spread ? 14 : 13;
  rect(body, 8, 20, 8, 7, 'O'); rect(body, 9, 21, 6, 5, 'S');
  for (const x of [lx, rx]) {
    rect(body, x, 26, 3, 6, 'O'); rect(body, x + 1, 26, 1, 3, 'S');
    rect(body, x, 29, 3, 1, 'w');
    rect(body, x, 30, 3, 1, 'o');
  }
  if (walking) {
    // Alternating sock heights and knee shadows make opposing legs readable.
    const lead = phase < 2 ? lx : rx, trail = phase < 2 ? rx : lx;
    rect(body, lead, 27, 3, 2, 'w'); rect(body, trail + 1, 27, 1, 2, 's');
    if (phase % 2) { dot(body, lx + 1, 30, 'w'); dot(body, rx + 1, 29, 'o'); }
  }
  const armOffsets = walking ? [[-1, 1], [0, 0], [1, -1], [1, 0]][phase] : [0, 0];
  for (const [side, x] of [[0, 5], [1, 16]]) {
    const ay = 22 + armOffsets[side];
    stamp(body, x, ay, ['.OO', 'OSS', 'OcS', '.OO']);
    stamp(outfit, x, ay, ['.OO', 'OwD']);
  }
  if (direction === 'left') {
    // Fore/aft motion is more pronounced in profile, and stays within cell.
    const handX = walking ? [6, 8, 15, 12][phase] : 8;
    rect(body, 5, 20, 14, 7, '.');
    rect(body, 9, 20, 6, 7, 'O'); rect(body, 10, 21, 4, 5, 'S');
    rect(outfit, 5, 20, 14, 7, '.');
    stamp(body, handX, 24, ['OOO', 'OcS', '.OO']);
    stamp(outfit, handX, 22, ['.OO', 'OwD', 'ODd']);
  }
}

function clothes(outfit, direction) {
  if (direction === 'left') {
    stamp(outfit, 8, 20, [
      '.OOOOOO.', 'OCwDDDdO', 'OCwDDddO', 'ODwDDddO',
      '.ODDddO.', '.OpPPPpO', 'OpPPpppO', '.OOOOOO.',
    ]);
  } else {
    stamp(outfit, 7, 20, [
      '..OOOOOO..', '.OCwCCwCO.', 'OwDwCCwDwO', 'ODDwCCwDDO',
      '.ODDPPDDO.', '.OpPPPPpO.', 'OpPPppPPpO', '.OOOOOOOO.',
    ]);
    if (direction === 'up') {
      rect(outfit, 9, 21, 6, 4, 'D'); rect(outfit, 10, 21, 4, 1, 'w');
      rect(outfit, 10, 24, 4, 1, 'd'); rect(outfit, 10, 26, 1, 2, 'P');
      rect(outfit, 13, 26, 1, 2, 'P');
    } else {
      dot(outfit, 11, 22, 'p'); dot(outfit, 12, 23, 'p');
    }
  }
}

function ribbon(acc, direction) {
  if (direction === 'left') {
    stamp(acc, 12, 2, ['.OO...OO.', 'OpqO.OpPO', 'OPqPOPPpO', '.OPPOppO.', '..OOOOO..', '...OpO...']);
  } else {
    stamp(acc, 4, 1, [
      '.OOOO......OOOO.', 'OpqqPO....OPqqpO', 'OPqqPPOOOOPPqqPO', 'OPqqPPOPPoPPqqPO',
      '.OPPPpOPPOpPPPO.', '..OppOOOOOOppO..', '...OO......OO...',
    ]);
  }
}

function standing(direction, phase = -1) {
  if (direction === 'right') return standing('left', phase).map(mirror);
  const layers = names.map(() => blank());
  const [body, face, back, front, outfit, acc] = layers;
  head(body, face, back, front, direction);
  limbs(body, outfit, direction, phase);
  clothes(outfit, direction);
  ribbon(acc, direction);
  return layers;
}

function seated(direction) {
  const layers = standing(direction);
  const [body, , , , outfit] = layers;
  // Seated knees turn forward, shoes tucked under; deliberately no chair art.
  rect(body, 0, 25, 24, 7, '.'); rect(outfit, 0, 25, 24, 7, '.');
  stamp(body, 7, 25, ['.OOOOOOOO.', 'OcSSSSSScO', '.OSOOSOSO.', '..OO..OO..', '..Oo..oO..', '..OO..OO..']);
  stamp(outfit, 7, 25, ['.ODDDDDDO.', 'OpPPPPPPpO', '.OpPPpppO.', '..OOOOOO..']);
  if (direction === 'up') {
    // Forearms reach toward a desk beyond the head/torso silhouette.
    stamp(body, 5, 21, ['OO............OO', 'OcO..........OcO', '.OO..........OO.']);
  } else {
    stamp(body, 8, 24, ['.OO..OO.', 'OcSOOScO', '.OOOOOO.']);
    rect(outfit, 9, 25, 2, 1, '.'); rect(outfit, 13, 25, 2, 1, '.');
  }
  return layers;
}

function resting() {
  const layers = standing('down');
  // A seated sofa rest with head upright, knees and feet angled to the right.
  // Keeping the head upright preserves swappable hair/ribbon registration.
  const [body, face, , , outfit] = layers;
  rect(body, 0, 25, 24, 7, '.'); rect(outfit, 0, 25, 24, 7, '.');
  stamp(body, 9, 26, ['OOOOOOOOO', 'OSSSSSScO', '.OOOOOOOSOO', '......OwwoO', '.......OOO.']);
  stamp(outfit, 7, 25, ['.ODDDDDDO', 'OpPPPPPPpO', '.OpPPPPPPpO', '..OOOOOOOO.']);
  // Closed eyes distinguish rest from working, using the same face layer.
  rect(face, 7, 14, 9, 3, '.');
  stamp(face, 7, 15, ['O.......O', '.OO...OO.']);
  return layers;
}

const frames = ['down', 'up', 'left', 'right'].map(d => standing(d));
for (const direction of ['down', 'up', 'left', 'right'])
  for (let phase = 0; phase < 4; phase++) frames.push(standing(direction, phase));
frames.push(seated('up'), seated('down'), resting());
if (frames.length !== FRAME.count) throw new Error('Frame order mismatch');
const sheets = names.map(() => blank(SHEET.width, SHEET.height));
for (let f = 0; f < frames.length; f++)
  frames[f].forEach((layer, index) => composite(sheets[index], layer, f * FRAME.width));
const preview = blank(SHEET.width, SHEET.height);
for (const layer of sheets) composite(preview, layer);
function enlarge4(im) {
  const out = blank(im.width * 4, im.height * 4);
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    const source = (Math.floor(y / 4) * im.width + Math.floor(x / 4)) * 4;
    out.pixels.set(im.pixels.subarray(source, source + 4), (y * out.width + x) * 4);
  }
  return out;
}
const contact = blank(24 * 6, 32 * 4);
for (let f = 0; f < frames.length; f++)
  for (const layer of frames[f]) composite(contact, layer, (f % 6) * 24, Math.floor(f / 6) * 32);
const dir = resolve(root, 'art-src/characters');
mkdirSync(dir, { recursive: true });
for (let index = 0; index < sheets.length; index++) writeFileSync(resolve(dir, `${names[index]}.png`), encodePng(sheets[index]));
writeFileSync(resolve(dir, 'preview-base.png'), encodePng(preview));
writeFileSync(resolve(dir, 'preview-base-x4.png'), encodePng(enlarge4(preview)));
writeFileSync(resolve(dir, 'preview-contact-x4.png'), encodePng(enlarge4(contact)));
console.log('Wrote six 552x32 layers, composite, integer x4 preview and contact sheet.');
