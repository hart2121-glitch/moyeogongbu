/**
 * Story 009 pilot palette. Run with Node 22: node tools/art/palette.mjs
 * Reads the original images without writing them. The two alpha-weighted source
 * histograms receive equal weight, otherwise the 1705x922 room would erase
 * the small character's skin and lavender hues during median cut.
 *
 * Median cut supplies 32 source swatches. The explicit art-directed correction
 * table then turns these into usable, separated ramps. These corrections are
 * intentional manual colour choices, not an automatic image conversion.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { decodePng, encodePng } from './pixelArt.mjs';

export const CURATED = [
  ['outline', '#282332'],
  ['muted-outline', '#4a4054'],
  ['hair-shadow', '#665174'],
  ['hair-mid', '#9874af'],
  ['hair-light', '#c09ad1'],
  ['hair-glint', '#e1c1e7'],
  ['ribbon-dark', '#58325e'],
  ['ribbon-mid', '#94518d'],
  ['ribbon-light', '#c878b5'],
  ['skin-shadow', '#b97d78'],
  ['skin-mid', '#e7b59f'],
  ['skin-light', '#ffe2c3'],
  ['blush', '#db8e9c'],
  ['cream', '#fff1da'],
  ['fabric-shade', '#615871'],
  ['fabric-mid', '#a293b3'],
  ['fabric-light', '#d6cbe0'],
  ['wood-dark', '#3c352e'],
  ['wood-shadow', '#6a4a3a'],
  ['wood-mid', '#9c6e4c'],
  ['wood-light', '#c99a67'],
  ['wood-glint', '#e3bd89'],
  ['sage-dark', '#394a3c'],
  ['sage-mid', '#617452'],
  ['sage-light', '#91a477'],
  ['sage-glint', '#c0c69c'],
  ['steel-dark', '#393f4a'],
  ['steel-mid', '#636677'],
  ['steel-light', '#9b9297'],
  ['sunset', '#c96d4f'],
  ['lamp-amber', '#f2a752'],
  ['lamp-glow', '#ffdc88'],
];
const toRgb = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const toHex = (rgb) => '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');

function histogram(images) {
  const merged = new Map();
  for (const { pixels } of images) {
    let coverage = 0;
    for (let at = 3; at < pixels.length; at += 4) coverage += pixels[at] / 255;
    if (!coverage) throw new Error('Reference contains no visible pixels');
    for (let at = 0; at < pixels.length; at += 4) {
      if (pixels[at + 3] === 0) continue;
      const rgb = [pixels[at], pixels[at + 1], pixels[at + 2]];
      const key = ((rgb[0] >> 3) << 10) | ((rgb[1] >> 3) << 5) | (rgb[2] >> 3);
      const bin = merged.get(key) ?? { key, sum: [0, 0, 0], weight: 0 };
      const weight = (pixels[at + 3] / 255) / coverage;
      bin.weight += weight;
      for (let c = 0; c < 3; c++) bin.sum[c] += rgb[c] * weight;
      merged.set(key, bin);
    }
  }
  return [...merged.values()].map(({ key, sum, weight }) => ({
    key, weight, rgb: sum.map((n) => n / weight),
  }));
}

/** Weighted median cut of 5-bit histogram bins, retaining original RGB means. */
export function medianCut(images, count = 32) {
  const describe = (points) => {
    const ranges = [0, 1, 2].map((c) => Math.max(...points.map((p) => p.rgb[c])) - Math.min(...points.map((p) => p.rgb[c])));
    const axis = ranges.indexOf(Math.max(...ranges));
    const weight = points.reduce((sum, p) => sum + p.weight, 0);
    return { points, axis, weight, score: ranges[axis] * Math.sqrt(weight) };
  };
  const boxes = [describe(histogram(images))];
  while (boxes.length < count) {
    let chosen = -1;
    for (let i = 0; i < boxes.length; i++)
      if (boxes[i].points.length > 1 && (chosen < 0 || boxes[i].score > boxes[chosen].score)) chosen = i;
    if (chosen < 0) throw new Error('References have too few colours for median cut');
    const box = boxes[chosen];
    const sorted = [...box.points].sort((a, b) => a.rgb[box.axis] - b.rgb[box.axis] || a.key - b.key);
    let cumulative = 0, split = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      cumulative += sorted[i].weight;
      split = i + 1;
      if (cumulative >= box.weight / 2) break;
    }
    boxes.splice(chosen, 1, describe(sorted.slice(0, split)), describe(sorted.slice(split)));
  }
  return boxes.map(({ points, weight }) => [0, 1, 2].map((c) => Math.round(points.reduce((sum, p) => sum + p.rgb[c] * p.weight, 0) / weight)));
}

/**
 * Pick the nearest extracted seed for each hand-chosen semantic correction.
 * One source seed may support several ramp steps; a common lavender seed must
 * not consume a useful neutral or warm-light seed merely due to output order.
 */
export function curate(extracted) {
  const seeds = extracted.map((rgb) => ({ rgb }));
  return CURATED.map(([name, hex]) => {
    const target = toRgb(hex);
    const distance = (rgb) => rgb.reduce((sum, n, c) => sum + (n - target[c]) ** 2, 0);
    let best = 0;
    for (let i = 1; i < seeds.length; i++)
      if (distance(seeds[i].rgb) < distance(seeds[best].rgb)) best = i;
    const seed = seeds[best];
    return { name, from: toHex(seed.rgb), to: hex };
  });
}

export async function generatePalette() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const references = [
    ['public/assets/company-study-room-final.png', 1705, 922],
    ['public/assets/characters/idle-down.png.png', 87, 110],
  ];
  const images = await Promise.all(references.map(async ([path, width, height]) => {
    const image = decodePng(await readFile(resolve(root, path)));
    if (image.width !== width || image.height !== height) throw new Error('Unexpected reference dimensions: ' + path);
    return image;
  }));
  const adjustments = curate(medianCut(images));
  const palette = adjustments.map(({ to }) => to);
  if (palette.length !== 32 || new Set(palette).size !== 32) throw new Error('Palette must have exactly 32 unique colours');
  const pixels = new Uint8Array(32 * 4);
  palette.forEach((hex, i) => pixels.set([...toRgb(hex), 255], i * 4));
  const output = resolve(root, 'art-src');
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, 'palette.json'), JSON.stringify(palette, null, 2) + '\n');
  await writeFile(resolve(output, 'palette.png'), encodePng({ width: 32, height: 1, pixels }));
  return { palette, adjustments };
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { adjustments } = await generatePalette();
  console.log('Wrote art-src/palette.json and art-src/palette.png (32 opaque colours)');
  adjustments.forEach(({ name, from, to }, i) => console.log(String(i).padStart(2) + ' ' + name + ': ' + from + ' -> ' + to));
}
