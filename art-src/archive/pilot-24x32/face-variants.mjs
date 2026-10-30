// Hand-authored front-standing face studies. Node 22, built-ins only.
// Run from any directory: node tools/art/face-variants.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { encodePng, decodePng } from './pixelArt.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const palette = JSON.parse(readFileSync(resolve(root, 'art-src/palette.json'), 'utf8'));
if (palette.length !== 32 || new Set(palette).size !== 32) throw new Error('Expected the pilot 32-color palette');
const rgba = palette.map(hex => [...hex.slice(1).match(/../g).map(n => parseInt(n, 16)), 255]);
const ink = { O: 0, o: 1, h: 2, H: 3, l: 4, L: 5, p: 6, P: 7, q: 8,
  s: 9, S: 10, c: 11, b: 12, C: 13, d: 14, D: 15, w: 16 };
const blank = (width = 24, height = 32) => ({ width, height, pixels: new Uint8Array(width * height * 4) });
function dot(im, x, y, color) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= im.width || y >= im.height || !(color in ink)) throw new Error('Invalid authored pixel');
  im.pixels.set(rgba[ink[color]], (y * im.width + x) * 4);
}
function stamp(im, x, y, rows) {
  rows.forEach((row, dy) => [...row].forEach((color, dx) => { if (color !== '.') dot(im, x + dx, y + dy, color); }));
}
function face(im) {
  // Skin width is ten pixels between the narrow side locks. Fringe only y10–11.
  stamp(im, 6, 10, [
    '.SccccccccS.', 'SccccccccccS', 'SccccccccccS', 'SccccccccccS',
    'SccccccccccS', '.SccccccccS.', '.SccccccccS.', '..SccccccS..', '...SSSSSS...',
  ]);
  // Exactly 2x3 per eye, with one ivory highlight in each eye.
  for (const x of [8, 14]) stamp(im, x, 12, ['CO', 'OO', 'HO']);
  dot(im, 7, 15, 'b'); dot(im, 16, 15, 'b'); dot(im, 11, 16, 's');
}
function body(im) {
  stamp(im, 10, 19, ['OSSO', 'OccO']);
  stamp(im, 6, 21, ['.o........o.', 'ow........wo', 'oD........Do', 'oS........So', '.o........o.']);
  stamp(im, 7, 20, [
    '..oooooo..', '.oCwCCwCo.', 'owDwCCwDwo', 'oDDwCCwDDo',
    '.oDDPPDDo.', '.opPPPPpo.', 'opPPppPPpo', '.oooooooo.',
  ]);
  for (const x of [8, 13]) stamp(im, x, 28, ['OSO', 'OwO', 'Owo', 'OOO']);
}
function variantA() {
  const im = blank();
  // Crown to jaw is 15 rows. Narrow stepped locks curl to the shoulders.
  stamp(im, 4, 4, [
    '.....oooooo.....', '...oolllllloo...', '..olLllllllLlo..', '.ollLllllllLllo.',
    '.olllllHHlllllo.', 'ollllHHHHHHllllo', 'olHHH......HHHlo', 'olHH........HHlo',
    'olH..........Hlo', 'olH..........Hlo', '.oH..........Ho.', '.oH..........Ho.',
    'olH..........Hlo', 'olH..........Hlo', 'oHh..........hHo', '.ohH........Hho.',
    '..oHh......hHo..', '...oo......oo...',
  ]);
  body(im); face(im);
  stamp(im, 6, 9, ['llllHHHHllll', 'HHllHHHlHHHH', 'HlH..HH..HlH']);
  // Angular wings taper into a central knot. The bottom two pixels are tails.
  stamp(im, 5, 0, [
    'pppp......pppp', 'pqqlpp..pplqqp', 'pqqqlPppPlqqqp',
    'pqqqPPqqPPqqqp', '.pPPPPPPPPPPp.', '..ppppPPpppp..', '.....p..p.....',
  ]);
  return im;
}
function variantB() {
  const im = blank();
  // Compact rounded bob, a fourteen-row head and a clear cheek outline.
  stamp(im, 4, 5, [
    '.....oooooo.....', '...oolllllloo...', '..olllLLLLlllo..', '.ollllllllllllo.',
    '.olllHHHHHHlllo.', 'olHHH......HHHlo', 'olHH........HHlo', 'olH..........Hlo',
    'olH..........Hlo', 'olH..........Hlo', '.oH..........Ho.', '.oH..........Ho.',
    '..oh........ho..', '...o........o...',
  ]);
  body(im); face(im);
  stamp(im, 6, 9, ['llllHHHHllll', 'HHllHHHHllHH', 'HlH......HlH']);
  // Two triangular loops share a bright pinched knot at the upper-right side.
  stamp(im, 14, 4, ['pp.....pp', 'pqqp.pqqp', 'pqqPpPqqp', '.pPPqPPp.', '..ppPpp..', '...p.p...']);
  return im;
}
function verifyVariant(im) {
  if (im.width !== 24 || im.height !== 32) throw new Error('Expected 24x32 variant');
  for (let at = 0; at < im.pixels.length; at += 4) {
    const alpha = im.pixels[at + 3];
    if (alpha !== 0 && alpha !== 255) throw new Error('Partial alpha in variant');
    const rgb = '#' + [...im.pixels.subarray(at, at + 3)].map(n => n.toString(16).padStart(2, '0')).join('');
    if (alpha && !palette.includes(rgb)) throw new Error('Off-palette variant pixel');
  }
  const feet = Array.from({ length: 24 }, (_, x) => x).filter(x => im.pixels[(31 * 24 + x) * 4 + 3]);
  if (!feet.length || (feet[0] + feet.at(-1)) / 2 !== 11.5) throw new Error('Feet must anchor at 11.5,31');
}
function cropFrameOne(sheet) {
  if (sheet.width < 24 || sheet.height !== 32) throw new Error('Unexpected pilot dimensions');
  const im = blank();
  for (let y = 0; y < 32; y++) im.pixels.set(sheet.pixels.subarray(y * sheet.width * 4, (y * sheet.width + 24) * 4), y * 24 * 4);
  return im;
}
function nearest(im, width, height) {
  const out = blank(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = (Math.floor(y * im.height / height) * im.width + Math.floor(x * im.width / width)) * 4;
    out.pixels.set(im.pixels.subarray(at, at + 4), (y * width + x) * 4);
  }
  return out;
}
function copy(dest, source, ox) {
  for (let y = 0; y < source.height; y++) dest.pixels.set(source.pixels.subarray(y * source.width * 4, (y + 1) * source.width * 4), (y * dest.width + ox) * 4);
}
const a = variantA(), b = variantB();
verifyVariant(a); verifyVariant(b);
const pilot = cropFrameOne(decodePng(readFileSync(resolve(root, 'art-src/characters/preview-base.png'))));
const reference = decodePng(readFileSync(resolve(root, 'public/assets/characters/idle-down.png.png')));
const refWidth = Math.round(reference.width * 128 / reference.height);
// Gaps are eight transparent output pixels. All three sprites use exact 4x blocks.
// The reference retains source RGB; alpha is thresholded at 128 for binary display.
// This changes only the comparison copy, never the original reference file.
for (let at = 3; at < reference.pixels.length; at += 4) reference.pixels[at] = reference.pixels[at] >= 128 ? 255 : 0;
const compare = blank(96 * 3 + 8 * 3 + refWidth, 128);
copy(compare, nearest(pilot, 96, 128), 0);
copy(compare, nearest(a, 96, 128), 104);
copy(compare, nearest(b, 96, 128), 208);
copy(compare, nearest(reference, refWidth, 128), 312);
for (const [name, im] of [['preview-face-a.png', a], ['preview-face-b.png', b], ['preview-face-compare-x4.png', compare]]) {
  writeFileSync(resolve(root, 'art-src/characters', name), encodePng(im));
}
console.log('Wrote face A, face B and comparison (pilot, A, B, reference).');
