// Node 22, no dependencies. One detected pseudo-pixel block becomes one pixel.
// node tools/art/gen-front-native.mjs [--baseline]
// Raw files and the previous 48x64 drafts are read-only inputs.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodePng, encodePng } from './pixelArt.mjs';
import { ROOT, emptyImage, colours, bounds, removeBackground, detectGrid, dominant, scaleNearest, blit } from './gen-front.mjs';

export const PALETTE = {
  O:'230d32', D:'4d285c', K:'80509c', A:'aa78cb', H:'d6b0ec', L:'f2ddff',
  R:'57248a', V:'9347ce', T:'b152f0', C:'432053', Q:'6b397f',
  W:'fff9ff', N:'c9b5d8', S:'ffe0c6', F:'f9b4a2', B:'e7848e',
  I:'260849', J:'5707a7', E:'992bea', M:'c95b71',
};
export const CANVASES = [{width:56,height:72},{width:64,height:80},{width:72,height:88}];
const at = (im,x,y) => (y*im.width+x)*4;
const rgba = h => [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).concat(255);
const sha256 = file => createHash('sha256').update(readFileSync(resolve(ROOT,file))).digest('hex');

// Strong colour edges vote for block boundaries. Regional x projections avoid
// forcing the lower costume onto the head's slightly different generated phase.
function edgeProjection(im,axis,from=0,to=axis==='x'?im.height:im.width) {
  const length=axis==='x'?im.width:im.height, projection=new Float64Array(length), p=im.pixels;
  for(let c=Math.max(0,Math.floor(from));c<Math.min(axis==='x'?im.height:im.width,Math.ceil(to));c+=2)
    for(let t=1;t<length;t++) {
      const x=axis==='x'?t:c,y=axis==='x'?c:t,i=at(im,x,y),j=axis==='x'?i-4:i-im.width*4;
      if(!p[i+3]&&!p[j+3])continue;
      const delta=p[i+3]!==p[j+3]?255:Math.abs(p[i]-p[j])+Math.abs(p[i+1]-p[j+1])+Math.abs(p[i+2]-p[j+2]);
      if(delta>65) projection[t]+=Math.min(delta,255);
    }
  return projection;
}

// Boundary indices and cell count stay unchanged. Each line may move by at most
// 1/4 cell to a measured edge; no block is merged or sampled a second time.
function refineBoundaries(projection,period,phase,start,count) {
  const radius=Math.floor(period*.25),result=[];
  const max=Math.max(1,...projection);
  for(let i=0;i<=count;i++) {
    const predicted=phase+(start+i)*period;let chosen=predicted,best=-Infinity;
    for(let d=-radius;d<=radius;d++) {
      const x=predicted+d;
      const energy=((projection[x-1]||0)+(projection[x]||0)*2+(projection[x+1]||0))/4/max;
      const score=energy-.035*Math.abs(d);
      if(score>best){best=score;chosen=x;}
    }
    result.push(chosen);
  }
  return result;
}

export function snapNative(im,grid) {
  const bx=Math.floor(-grid.phaseX/grid.x),by=Math.floor(-grid.phaseY/grid.y);
  const width=Math.ceil((im.width-grid.phaseX)/grid.x)-bx,height=Math.ceil((im.height-grid.phaseY)/grid.y)-by;
  const yEdges=refineBoundaries(edgeProjection(im,'y'),grid.y,grid.phaseY,by,height);
  const regionRows=12,regions=[];
  const out=emptyImage(width,height);
  for(let first=0;first<height;first+=regionRows) {
    const last=Math.min(height,first+regionRows);
    const xEdges=refineBoundaries(edgeProjection(im,'x',yEdges[first],yEdges[last]),grid.x,grid.phaseX,bx,width);
    regions.push({firstRow:first,lastRow:last-1,xEdges});
    for(let y=first;y<last;y++)for(let x=0;x<width;x++)
      out.pixels.set(dominant(im,xEdges[x],yEdges[y],xEdges[x+1],yEdges[y+1]),at(out,x,y));
  }
  return {image:out,refinement:{method:'local edge projection, quarter-cell phase correction, unchanged cell count',regionRows,yEdges,regions}};
}

export function reducePalette(image) {
  const out={...image,pixels:image.pixels.slice()},palette=Object.values(PALETTE).map(rgba);
  for(let i=0;i<out.pixels.length;i+=4)if(out.pixels[i+3]) {
    const p=out.pixels;let best=0,distance=Infinity;
    for(let k=0;k<palette.length;k++) {
      const c=palette[k],d=.3*(p[i]-c[0])**2+.59*(p[i+1]-c[1])**2+.11*(p[i+2]-c[2])**2;
      if(d<distance){distance=d;best=k;}
    }
    p.set(palette[best],i);
  }
  return out;
}

export function placeNative(image,{exactCentre=false}={}) {
  const b=bounds(image),size=CANVASES.find(s=>s.width>=b.width+2&&s.height>=b.height+1);
  assert.ok(size,`Native character ${b.width}x${b.height} does not fit available canvases`);
  if(exactCentre)assert.equal(b.width%2,0,'Even canvas needs an even silhouette width for exact horizontal centre');
  const left=Math.floor((size.width-b.width)/2),top=size.height-b.height,out=emptyImage(size.width,size.height);
  for(let y=b.top;y<=b.bottom;y++)for(let x=b.left;x<=b.right;x++)
    out.pixels.set(image.pixels.subarray(at(image,x,y),at(image,x,y)+4),at(out,left+x-b.left,top+y-b.top));
  return {image:out,nativeBounds:b,placement:{dx:left-b.left,dy:top-b.top,left,top}};
}

export function createNativeBase(id) {
  const raw=decodePng(readFileSync(resolve(ROOT,`art-src/drafts/gen-raw-${id}.png`)));
  const masked=removeBackground(raw),detectedGrid=detectGrid(masked),grid=detectedGrid;
  const native=snapNative(masked,grid),snapped=native.image;
  const placed=placeNative(reducePalette(snapped));
  return {id,raw,masked,detectedGrid,grid,snapped,refinement:native.refinement,...placed};
}

export function components(image) {
  const seen=new Set(),groups=[];
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++) {
    const index=y*image.width+x;
    if(!image.pixels[index*4+3]||seen.has(index))continue;
    const group=[],stack=[index];seen.add(index);
    while(stack.length) {
      const n=stack.pop();group.push(n);const xx=n%image.width,yy=Math.floor(n/image.width);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const nx=xx+dx,ny=yy+dy,ni=ny*image.width+nx;
        if(nx>=0&&ny>=0&&nx<image.width&&ny<image.height&&image.pixels[ni*4+3]&&!seen.has(ni)){seen.add(ni);stack.push(ni);}
      }
    }
    groups.push(group);
  }
  return groups.sort((a,b)=>b.length-a.length);
}

export function verifyNative(image,{strict=true}={}) {
  const b=bounds(image),palette=colours(image),alpha=[...new Set(Array.from({length:image.width*image.height},(_,i)=>image.pixels[i*4+3]))];
  const groups=components(image),exposed=[];
  const footXs=Array.from({length:image.width},(_,x)=>x).filter(x=>image.pixels[at(image,x,b.bottom)+3]);
  const footAnchor={x:(Math.min(...footXs)+Math.max(...footXs))/2,y:b.bottom};
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(image.pixels[at(image,x,y)+3]) {
    const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>x+dx<0||y+dy<0||x+dx>=image.width||y+dy>=image.height||!image.pixels[at(image,x+dx,y+dy)+3]);
    if(edge&&image.pixels.subarray(at(image,x,y),at(image,x,y)+3).some((v,i)=>v!==rgba(PALETTE.O)[i]))exposed.push([x,y]);
  }
  const result={canvas:{width:image.width,height:image.height},bounds:b,nativeCharacter:{width:b.width,height:b.height},horizontalCentre:(b.left+b.right)/2,footAnchor,colours:palette.length,palette,alpha,components:groups.map(g=>g.length),orphanPixels:groups.slice(1).flat().length,exposedNonOutline:exposed};
  assert.ok(alpha.every(v=>v===0||v===255));assert.ok(palette.length<=20);
  assert.equal(b.bottom,image.height-1);assert.ok(b.top>=1&&b.left>=1&&b.right<=image.width-2);
  if(strict){assert.equal(result.horizontalCentre,image.width/2-.5);assert.equal(footAnchor.x,image.width/2-.5);assert.equal(groups.length,1);assert.equal(exposed.length,0);}
  return result;
}

export function buildComparison(raws,natives,olds) {
  const gap=16,rawsRow=raws.map(im=>scaleNearest(im,Math.round(im.width*320/im.height),320));
  const nativeRow=natives.map(im=>scaleNearest(im,im.width*4,im.height*4));
  const pairs=natives.map((im,i)=>[scaleNearest(im,im.width*2,im.height*2),scaleNearest(olds[i],olds[i].width*2,olds[i].height*2)]);
  const rows=[rawsRow,nativeRow,pairs.flat()];
  const rowWidth=row=>row.reduce((sum,im)=>sum+im.width,0)+(row.length+1)*gap;
  const rowHeights=rows.map(row=>Math.max(...row.map(im=>im.height)));
  const out=emptyImage(Math.max(...rows.map(rowWidth)),rowHeights.reduce((a,b)=>a+b,0)+gap*4);
  for(let i=0;i<out.pixels.length;i+=4)out.pixels.set([244,232,213,255],i);
  let y=gap;
  for(let r=0;r<rows.length;r++) {
    let x=Math.floor((out.width-rowWidth(rows[r]))/2)+gap;
    for(const im of rows[r]){blit(out,im,x,y+rowHeights[r]-im.height);x+=im.width+gap;}
    y+=rowHeights[r]+gap;
  }
  return out;
}

export async function main({baseline=process.argv.includes('--baseline')}={}) {
  const cleanup=baseline?null:(await import('./gen-front-native-cleanup.mjs')).cleanupNative;
  const bases=[1,2,3].map(createNativeBase),images=[],diagnostics=[];
  mkdirSync(resolve(ROOT,'art-src/characters'),{recursive:true});
  for(const base of bases) {
    const edited=baseline?{image:base.image}:cleanup(base.image,base.id,{PALETTE,components}),result=edited.pixels?{image:edited}:edited;
    const image=baseline?result.image:placeNative(result.image,{exactCentre:true}).image;
    const validation=verifyNative(image,{strict:!baseline});images.push(image);
    const output=`art-src/${baseline?'drafts/native-base-':'characters/draft-front-n'}${base.id}.png`;
    writeFileSync(resolve(ROOT,output),encodePng(image));
    const {image:omit,...metadata}=result;
    const rawInput=`art-src/drafts/gen-raw-${base.id}.png`,oldInput=`art-src/characters/draft-front-g${base.id}.png`;
    diagnostics.push({id:base.id,output,inputs:[{path:rawInput,sha256:sha256(rawInput)},{path:oldInput,sha256:sha256(oldInput)}],rawSize:{width:base.raw.width,height:base.raw.height},rawForegroundBounds:bounds(base.masked),detectedGrid:base.detectedGrid,refinement:base.refinement,snap:{oneBlockPerOutputPixel:true,resized:false,fullGridSize:{width:base.snapped.width,height:base.snapped.height}},snappedBounds:bounds(base.snapped),cleanup:metadata,...validation});
  }
  const old=[1,2,3].map(id=>decodePng(readFileSync(resolve(ROOT,`art-src/characters/draft-front-g${id}.png`))));
  const name=baseline?'front-native-base-compare.png':'front-native-compare.png';
  writeFileSync(resolve(ROOT,`art-src/drafts/${name}`),encodePng(buildComparison(bases.map(b=>b.raw),images,old)));
  writeFileSync(resolve(ROOT,`art-src/drafts/${baseline?'front-native-base-diagnostics':'front-native-diagnostics'}.json`),JSON.stringify({baseline,candidates:diagnostics},null,2)+'\n');
  console.log(JSON.stringify(diagnostics.map(({id,canvas,nativeCharacter,colours,horizontalCentre,orphanPixels,exposedNonOutline})=>({id,canvas,nativeCharacter,colours,horizontalCentre,orphanPixels,exposedNonOutline:exposedNonOutline.length})),null,2));
  return diagnostics;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
