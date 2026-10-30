// Node 22, no dependencies. Regenerate with: node tools/art/gen-front.mjs
// Raw generations are inputs, never overwritten. --baseline skips hand edits.
// Step 1 uses the assistant's built-in image generation tool; prompt set and
// provenance: art-src/drafts/front-gen-notes.md. Steps 2-4 below are reproducible.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkImage, decodePng, encodePng } from './pixelArt.mjs';
import { paintbox, CLEANUP, FIXUPS, prepareCleanup } from './gen-front-cleanup.mjs';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const SIZE = { width: 48, height: 64 };
// All manual changes belong here. Coordinates are zero based on the 48x64 frame.
// edits: [x,y,'rrggbb'] or [x,y,null] (transparent).
// rows: {x,y,pattern:'..OO..',key:{O:'rrggbb'}}; '.' erases, ' ' preserves.
// grid may override the measured pseudo-pixel grid after visual review.
export const CANDIDATES = [
  { id: 1, height: 44, grid: null, edits: FIXUPS[0], rows: CLEANUP[0] },
  { id: 2, height: 44, grid: null, edits: FIXUPS[1], rows: CLEANUP[1] },
  { id: 3, height: 44, grid: null, edits: FIXUPS[2], rows: CLEANUP[2] },
];

export const emptyImage = (width, height) => ({ width, height, pixels: new Uint8Array(width * height * 4) });
const offset = (im,x,y) => (y*im.width+x)*4;
const colourKey = (p,i) => (p[i]<<16)|(p[i+1]<<8)|p[i+2];
const rgb = key => [key>>16&255,key>>8&255,key&255];
const hex = key => key.toString(16).padStart(6,'0');
const distance = (a,b) => 0.3*(a[0]-b[0])**2+0.59*(a[1]-b[1])**2+0.11*(a[2]-b[2])**2;
export function put(im,x,y,value) {
  if (x<0||y<0||x>=im.width||y>=im.height) throw new Error(`Pixel outside canvas: ${x},${y}`);
  im.pixels.set(value === null ? [0,0,0,0] : [...rgb(parseInt(value.replace('#',''),16)),255],offset(im,x,y));
}
export function colours(im) {
  const counts=new Map();
  for(let i=0;i<im.pixels.length;i+=4) if(im.pixels[i+3]) {
    const key=hex(colourKey(im.pixels,i)); counts.set(key,(counts.get(key)||0)+1);
  }
  return [...counts].sort((a,b)=>b[1]-a[1]).map(([hex,count])=>({hex,count}));
}
export function bounds(im) {
  let left=im.width,top=im.height,right=-1,bottom=-1;
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.pixels[offset(im,x,y)+3]) {
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<0)throw new Error('No foreground pixels');
  return {left,top,right,bottom,width:right-left+1,height:bottom-top+1};
}

// Background chroma removal includes green spill and softly generated edge pixels.
// No RGB illustration colour is made semitransparent: the mask is strictly binary.
export function removeBackground(source) {
  const im={...source,pixels:source.pixels.slice()};
  for(let i=0;i<im.pixels.length;i+=4) {
    const [r,g,b,a]=im.pixels.subarray(i,i+4);
    if(a<128||(g>110&&g>r*1.35&&g>b*1.3)) im.pixels.set([0,0,0,0],i);
    else im.pixels[i+3]=255;
  }
  return im;
}

// Estimate grid period from sharp transition projections and repeated run lengths.
// We intentionally use a modal cell sample afterwards, never a bilinear filter.
export function detectGrid(im) {
  const box=bounds(im),maxPeriod=Math.min(32,Math.floor(box.height/18));
  const measure=axis=>{
    const size=axis==='x'?im.width:im.height,other=axis==='x'?im.height:im.width;
    const transitions=new Float64Array(size),runs=new Float64Array(maxPeriod*4+1);
    for(let cross=0;cross<other;cross+=2) {
      let previousEdge=-1;
      for(let along=1;along<size;along++) {
        const x=axis==='x'?along:cross,y=axis==='x'?cross:along,i=offset(im,x,y),p=im.pixels;
        const j=axis==='x'?i-4:i-im.width*4;
        if(p[i+3]&&p[j+3]) {
          const d=Math.abs(p[i]-p[j])+Math.abs(p[i+1]-p[j+1])+Math.abs(p[i+2]-p[j+2]);
          if(d>85) {
            transitions[along]+=Math.min(d,300);
            const run=along-previousEdge;
            if(previousEdge>=0&&run>=3&&run<runs.length)runs[run]++;
            previousEdge=along;
          }
        }
      }
    }
    // One-pixel antialias shoulders create adjacent edge peaks. Smooth once,
    // subtract the DC component, then correlate shifts to find the fundamental
    // block spacing. Raw phase concentration alone prefers multiples of it.
    const smooth=Float64Array.from(transitions,(_,i)=>(transitions[i-1]||0)+transitions[i]*2+(transitions[i+1]||0));
    const mean=smooth.reduce((a,b)=>a+b,0)/size;
    const centred=Float64Array.from(smooth,v=>v-mean);
    const norm=centred.reduce((a,b)=>a+b*b,0)||1;
    const runSupport=period=>(runs[period-1]||0)+(runs[period]||0)+(runs[period+1]||0);
    const maxRunSupport=Math.max(1,...Array.from({length:Math.max(0,maxPeriod-2)},(_,i)=>runSupport(i+3)));
    const total=transitions.reduce((a,b)=>a+b,0)||1,candidates=[];
    for(let period=3;period<=maxPeriod;period++) {
      let best=-1,phase=0;
      for(let p=0;p<period;p++) {
        let energy=0;for(let x=p;x<size;x+=period)energy+=transitions[x];
        let nearby=0;for(let x=p;x<size;x+=period)nearby+=(transitions[x-1]||0)+(transitions[x+1]||0);
        const concentration=(energy+nearby*.25)/total;
        if(concentration>best){best=concentration;phase=p;}
      }
      let correlation=0;
      for(let x=0;x<size-period;x++)correlation+=centred[x]*centred[x+period];
      correlation/=norm;
      const support=runSupport(period)/maxRunSupport;
      const score=correlation*.95+support*.05;
      candidates.push({period,phase,score:Number(score.toFixed(4)),correlation:Number(correlation.toFixed(4)),support:Number(support.toFixed(4))});
    }
    candidates.sort((a,b)=>b.score-a.score);
    // Prefer a smaller fundamental over an almost equally strong harmonic.
    let best=candidates[0]||{period:1,phase:0,score:0};
    for(const candidate of candidates)if(candidate.period<best.period&&Math.round(best.period/candidate.period)>=2&&candidate.score>=best.score*.95&&Math.abs(best.period/candidate.period-Math.round(best.period/candidate.period))<.12)best=candidate;
    return {best,candidates:candidates.slice(0,6)};
  };
  const x=measure('x'),y=measure('y');
  return {x:x.best.period,y:y.best.period,phaseX:x.best.phase,phaseY:y.best.phase,evidence:{x:x.candidates,y:y.candidates}};
}

// Colour mode of a block. Near-duplicate generator colours share 8-level bins;
// the most common exact RGB inside the winning bin is retained as the sample.
export function dominant(im,x0,y0,x1,y1) {
  const bins=new Map();let transparent=0,total=0;
  for(let y=Math.max(0,Math.floor(y0));y<Math.min(im.height,Math.ceil(y1));y++)
    for(let x=Math.max(0,Math.floor(x0));x<Math.min(im.width,Math.ceil(x1));x++) {
      total++;const i=offset(im,x,y),p=im.pixels;
      if(!p[i+3]){transparent++;continue;}
      const key=((p[i]>>3)<<10)|((p[i+1]>>3)<<5)|(p[i+2]>>3);
      let bin=bins.get(key);if(!bin){bin={count:0,exact:new Map()};bins.set(key,bin);}
      bin.count++;const c=colourKey(p,i);bin.exact.set(c,(bin.exact.get(c)||0)+1);
    }
  if(transparent>=total/2||!bins.size)return [0,0,0,0];
  const bin=[...bins.values()].sort((a,b)=>b.count-a.count)[0];
  const c=[...bin.exact].sort((a,b)=>b[1]-a[1])[0][0];return [...rgb(c),255];
}
export function snapGrid(im,grid) {
  const bx=Math.floor(-grid.phaseX/grid.x),by=Math.floor(-grid.phaseY/grid.y);
  const width=Math.ceil((im.width-grid.phaseX)/grid.x)-bx,height=Math.ceil((im.height-grid.phaseY)/grid.y)-by;
  const out=emptyImage(width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const sx=grid.phaseX+(x+bx)*grid.x,sy=grid.phaseY+(y+by)*grid.y;
    out.pixels.set(dominant(im,sx,sy,sx+grid.x,sy+grid.y),offset(out,x,y));
  }
  return out;
}
export function fit(im,targetHeight=42) {
  const b=bounds(im),height=Math.min(targetHeight,64),width=Math.min(46,Math.round(b.width*height/b.height));
  const out=emptyImage(48,64),left=Math.floor((48-width)/2),top=64-height;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)
    out.pixels.set(dominant(im,b.left+x*b.width/width,b.top+y*b.height/height,b.left+(x+1)*b.width/width,b.top+(y+1)*b.height/height),offset(out,left+x,top+y));
  return anchor(out);
}
export function anchor(im) {
  const b=bounds(im);let left=im.width,right=-1;
  for(let x=0;x<im.width;x++)if(im.pixels[offset(im,x,b.bottom)+3]){left=Math.min(left,x);right=Math.max(right,x);}
  const dx=Math.round(23.5-(left+right)/2),dy=63-b.bottom,out=emptyImage(im.width,im.height);
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.pixels[offset(im,x,y)+3]) {
    const nx=x+dx,ny=y+dy;if(nx<0||nx>=im.width||ny<0||ny>=im.height)throw new Error('Anchoring clips foreground');
    out.pixels.set(im.pixels.subarray(offset(im,x,y),offset(im,x,y)+4),offset(out,nx,ny));
  }
  return out;
}

// Weighted k-means with farthest-point initialization. Lock the darkest source
// colour so 1px dark contours are not averaged into a purple shadow.
export function quantise(im,limit=16) {
  const histogram=colours(im).map(c=>({c:rgb(parseInt(c.hex,16)),n:c.count}));
  if(histogram.length<=limit)return im;
  const dark=histogram.reduce((a,b)=>a.c.reduce((s,n)=>s+n,0)<b.c.reduce((s,n)=>s+n,0)?a:b).c;
  const centres=[dark.slice()];
  while(centres.length<limit) {
    let best=null,score=-1;
    for(const h of histogram){const d=Math.min(...centres.map(c=>distance(h.c,c)))*Math.sqrt(h.n);if(d>score){score=d;best=h.c;}}
    centres.push(best.slice());
  }
  for(let iteration=0;iteration<15;iteration++) {
    const sums=centres.map(()=>[0,0,0,0]);
    for(const h of histogram){let chosen=0,near=Infinity;centres.forEach((c,k)=>{const d=distance(c,h.c);if(d<near){near=d;chosen=k;}});for(let c=0;c<3;c++)sums[chosen][c]+=h.c[c]*h.n;sums[chosen][3]+=h.n;}
    for(let k=1;k<centres.length;k++)if(sums[k][3])centres[k]=sums[k].slice(0,3).map(v=>Math.round(v/sums[k][3]));
  }
  const out={...im,pixels:im.pixels.slice()};
  for(let i=0;i<out.pixels.length;i+=4)if(out.pixels[i+3]){
    const c=[...out.pixels.subarray(i,i+3)];let chosen=0,near=Infinity;
    centres.forEach((v,k)=>{const d=distance(v,c);if(d<near){near=d;chosen=k;}});out.pixels.set(centres[chosen],i);
  }
  return out;
}
export function handCleanup(image,config) {
  const im={...image,pixels:image.pixels.slice()};
  for(const {x,y,pattern,key} of config.rows)for(let j=0;j<pattern.length;j++) {
    const symbol=pattern[j];if(symbol===' ')continue;
    if(symbol!=='.'&&!key[symbol])throw new Error(`Missing row colour ${symbol}`);
    put(im,x+j,y,symbol==='.'?null:key[symbol]);
  }
  for(const [x,y,colour] of config.edits)put(im,x,y,colour);
  return im;
}
export function scaleNearest(im,width,height) {
  const out=emptyImage(width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const i=offset(im,Math.min(im.width-1,Math.floor(x*im.width/width)),Math.min(im.height-1,Math.floor(y*im.height/height)));
    out.pixels.set(im.pixels.subarray(i,i+4),offset(out,x,y));
  }
  return out;
}
export function blit(dst,src,left,top) {
  for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++){
    const i=offset(src,x,y),j=offset(dst,x+left,y+top),a=src.pixels[i+3]/255;
    for(let c=0;c<3;c++)dst.pixels[j+c]=Math.round(src.pixels[i+c]*a+dst.pixels[j+c]*(1-a));dst.pixels[j+3]=255;
  }
}
export function comparison(raws,cleaned) {
  const gap=16,rawThumbs=raws.map(im=>scaleNearest(im,Math.round(im.width*256/im.height),256));
  const bottom=[...cleaned.map(im=>scaleNearest(im,192,256)),...cleaned.map(im=>scaleNearest(im,96,128))];
  const rowWidth=items=>items.reduce((s,im)=>s+im.width,0)+(items.length+1)*gap;
  const out=emptyImage(Math.max(rowWidth(rawThumbs),rowWidth(bottom)),560);
  for(let i=0;i<out.pixels.length;i+=4)out.pixels.set([244,232,213,255],i);
  for(const [images,y]of [[rawThumbs,16],[bottom,288]]){
    let x=Math.floor((out.width-rowWidth(images))/2)+gap;
    for(const im of images){blit(out,im,x,y+(256-im.height));x+=im.width+gap;}
  }
  return out;
}
export async function main({baseline=process.argv.includes('--baseline')}={}) {
  const draftDir=resolve(ROOT,'art-src/drafts'),characterDir=resolve(ROOT,'art-src/characters');
  mkdirSync(draftDir,{recursive:true});mkdirSync(characterDir,{recursive:true});
  const raws=[],cleaned=[],diagnostics=[];
  for(const config of CANDIDATES){
    const raw=decodePng(readFileSync(resolve(draftDir,`gen-raw-${config.id}.png`)));raws.push(raw);
    const masked=removeBackground(raw),detected=detectGrid(masked),grid=config.grid||detected;
    const snapped=snapGrid(masked,grid),base=quantise(paintbox(fit(snapped,config.height),config.id),16);
    writeFileSync(resolve(draftDir,`gen-baseline-${config.id}.png`),encodePng(base));
    const image=baseline?base:handCleanup(prepareCleanup(base),config),validation=checkImage(image,{size:SIZE});
    assert.deepEqual(validation,[]);
    const palette=colours(image);assert.ok(palette.length<=16,`Candidate ${config.id}: ${palette.length} colours`);
    const alphas=new Set();for(let i=3;i<image.pixels.length;i+=4)alphas.add(image.pixels[i]);
    assert.ok([...alphas].every(a=>a===0||a===255),'Only alpha 0/255 allowed');
    const b=bounds(image);assert.equal(b.bottom,63);assert.ok(b.height>=40&&b.height<=44,'Character height must be 40-44px');
    let changedPixels=0;for(let i=0;i<image.pixels.length;i+=4)if(image.pixels.subarray(i,i+4).some((v,c)=>v!==base.pixels[i+c]))changedPixels++;
    let footLeft=48,footRight=-1;for(let x=0;x<48;x++)if(image.pixels[offset(image,x,63)+3]){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x);}
    if(!baseline)assert.equal((footLeft+footRight)/2,23.5,'Feet must be centred on x=23.5');
    cleaned.push(image);
    const output=`art-src/characters/draft-front-g${config.id}.png`;writeFileSync(resolve(ROOT,output),encodePng(image));
    diagnostics.push({id:config.id,rawSize:{width:raw.width,height:raw.height},detectedGrid:detected,usedGrid:grid,bounds:b,colours:palette.length,palette,alpha:[...alphas],footAnchor:{x:(footLeft+footRight)/2,y:63},validator:validation,manualEditCount:config.edits.length,manualRowCount:config.rows.length,cleanupChangedPixels:changedPixels,output});
  }
  writeFileSync(resolve(draftDir,'front-gen-compare.png'),encodePng(comparison(raws,cleaned)));
  writeFileSync(resolve(draftDir,'front-gen-diagnostics.json'),JSON.stringify({baseline,candidates:diagnostics},null,2)+'\n');
  console.log(JSON.stringify(diagnostics,null,2));return diagnostics;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
