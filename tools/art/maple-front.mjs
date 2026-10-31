// Hand-authored front sprite study. Run: node tools/art/maple-front.mjs
// No generated artwork, dependencies, filters or resampling libraries.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { decodePng, encodePng, checkImage } from './pixelArt.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = decodePng(readFileSync(resolve(root, 'public/assets/characters/idle-down.png.png')));
const rgba = hex => [...hex.match(/../g).map(x => parseInt(x, 16)), 255];
// Colours sampled from the reference, with clean intermediate ramps for B.
const P = Object.fromEntries(Object.entries({
  ink:'352536', seam:'73516e', hairDark:'79488c', hairShade:'955eaa',
  hair:'b173bb', hairLight:'cf8ac8', hairShine:'efb2da',
  bowDark:'7f2d84', bowShade:'a4429a', bow:'cc57b5', bowLight:'e783d2',
  skinShade:'e8b5af', skin:'fce6e1', skinLight:'fff0e9',
  blush:'f5afbd', blushLight:'fac9cd', mouth:'cf788c',
  lash:'312639', irisDark:'4d427d', iris:'7c5096', irisLight:'b988c8',
  irisBottom:'d0a5dc', white:'fffaf6', cloth:'f9f4f3', clothShade:'d7cbd7',
  clothDeep:'a895b0', skirt:'35323b', skirtLight:'575063', skirtShade:'25232d',
  shoe:'302b39', shoeLight:'575061', sole:'211d29',
}).map(([key, value]) => [key, rgba(value)]));
const canvas = (width=48,height=64) => ({width,height,pixels:new Uint8Array(width*height*4)});
function put(im,x,y,c) {
  if(x>=0 && y>=0 && x<im.width && y<im.height) im.pixels.set(typeof c==='string'?P[c]:c,(y*im.width+x)*4);
}
function rect(im,x,y,w,h,c) {for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)put(im,i,j,c);}
function line(im,x,y,xx,yy,c) {
  const dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1;let e=dx+dy;
  for(;;){put(im,x,y,c);if(x===xx&&y===yy)break;const e2=2*e;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}}
}
function poly(im,points,c,outline=null) {
  const mask=new Set();
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [xi,yi]=points[i],[xj,yj]=points[j];
      if(((yi>y+.5)!==(yj>y+.5))&&(x+.5<(xj-xi)*(y+.5-yi)/(yj-yi)+xi))inside=!inside;
    }
    if(inside)mask.add(y*im.width+x);
  }
  for(const n of mask){const x=n%im.width,y=Math.floor(n/im.width);
    const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!mask.has((y+dy)*im.width+x+dx));
    put(im,x,y,outline&&edge?outline:c);
  }
}
// True footprint integration in premultiplied RGBA. The reference is fitted
// without stretching; transparent padding remains transparent. A is painted ON
// this actual underlay, not on a separately reconstructed approximation.
function areaUnderlay() {
  const out=canvas(),s=Math.min(48/source.width,64/source.height);
  // Keep the whole reference's aspect ratio. Shift the fitted underlay down so
  // its last solid source row (99) meets the frame's ground row.
  const ox=(48-source.width*s)/2,oy=64-100*s;
  for(let y=0;y<64;y++)for(let x=0;x<48;x++){
    const left=(x-ox)/s,right=(x+1-ox)/s,top=(y-oy)/s,bottom=(y+1-oy)/s;
    const accum=[0,0,0,0];
    for(let sy=Math.max(0,Math.floor(top));sy<Math.min(source.height,Math.ceil(bottom));sy++)
      for(let sx=Math.max(0,Math.floor(left));sx<Math.min(source.width,Math.ceil(right));sx++){
        const weight=Math.max(0,Math.min(right,sx+1)-Math.max(left,sx))*Math.max(0,Math.min(bottom,sy+1)-Math.max(top,sy));
        const i=(sy*source.width+sx)*4,a=source.pixels[i+3]/255;
        for(let k=0;k<3;k++)accum[k]+=source.pixels[i+k]*a*weight;
        accum[3]+=a*weight;
      }
    if(accum[3])put(out,x,y,[...accum.slice(0,3).map(v=>Math.round(v/accum[3])),Math.round(255*accum[3]/((right-left)*(bottom-top)))]);
  }
  // Deliberate paint cleanup: discard the reference's faint exterior haze and
  // collapse sampled colours onto its hair/skin/clothing ramps, not a fixed
  // global colour limit. Redrawn eyes and strands replace muddy small features.
  for(let i=0;i<out.pixels.length;i+=4){
    if(out.pixels[i+3]<150){out.pixels.fill(0,i,i+4);continue;}
    let best=P.hair,distance=Infinity;
    for(const c of Object.values(P)){const d=c.slice(0,3).reduce((sum,v,k)=>sum+(v-out.pixels[i+k])**2,0);if(d<distance){best=c;distance=d;}}
    out.pixels.set(best,i);
  }
  return out;
}
function bow(im,y,wide=false) {
  const l=wide?9:10,r=47-l;
  poly(im,[[l+2,y],[l+5,y+1],[20,y+4],[23,y+6],[21,y+8],[l+5,y+11],[l+2,y+11],[l,y+8],[l-1,y+4],[l,y+1]],'bow','ink');
  poly(im,[[r-2,y],[r-5,y+1],[27,y+4],[24,y+6],[26,y+8],[r-5,y+11],[r-2,y+11],[r,y+8],[r+1,y+4],[r,y+1]],'bow','ink');
  line(im,l+2,y+2,l+2,y+5,'bowLight');line(im,l+3,y+1,l+5,y+2,'bowLight');
  line(im,r-2,y+2,r-2,y+5,'bowLight');
  line(im,l+6,y+5,20,y+6,'bowShade');line(im,28,y+6,r-5,y+5,'bowShade');
  line(im,l+3,y+9,19,y+7,'bowShade');line(im,28,y+7,r-3,y+9,'bowShade');
  poly(im,[[21,y+4],[25,y+3],[28,y+5],[27,y+8],[22,y+8],[20,y+6]],'bowShade','bowDark');
  rect(im,23,y+4,3,2,'bowLight');
}
function clothes(im,b) {
  const waist=b?49:54,hem=b?55:58,shoulder=b?40:49;
  // Two separated feet; bottom row's extreme opaque pixels are 16 and 31.
  for(const x of [17,26]){
    rect(im,x,hem-1,5,7,'skinShade');rect(im,x+1,hem,3,4,'skin');
    rect(im,x,hem+2,5,5,'clothShade');rect(im,x+1,hem+2,3,3,'cloth');
    const shoeTop=b?60:62;
    poly(im,[[x,shoeTop],[x+4,shoeTop],[x+6,63],[x+6,64],[x-1,64],[x-1,63]],'shoe','ink');
    rect(im,x,shoeTop,4,1,'shoeLight');rect(im,x-1,63,7,1,'sole');
  }
  // Bell-shaped blouse and short sleeves, hands below sleeve cuffs.
  poly(im,[[18,shoulder],[29,shoulder],[33,shoulder+3],[37,waist],[34,waist+3],[30,waist],[29,waist+2],[18,waist+2],[17,waist],[13,waist+3],[10,waist],[14,shoulder+3]],'cloth','ink');
  poly(im,[[14,waist-1],[17,waist],[16,waist+3],[13,waist+4],[11,waist+2]],'skin','seam');
  poly(im,[[30,waist],[33,waist-1],[36,waist+2],[34,waist+4],[31,waist+3]],'skin','seam');
  line(im,17,shoulder+4,16,waist-1,'clothDeep');line(im,30,shoulder+4,31,waist-1,'clothShade');
  poly(im,[[18,shoulder+1],[23,shoulder+3],[21,shoulder+6],[18,shoulder+3]],'white','seam');
  poly(im,[[24,shoulder+3],[29,shoulder+1],[29,shoulder+3],[26,shoulder+6]],'white','seam');
  rect(im,22,shoulder+3,3,2,'skirt');line(im,23,shoulder+5,24,waist,'skirtLight');
  poly(im,[[17,waist],[30,waist],[33,hem],[29,hem+1],[18,hem+1],[14,hem]],'skirt','ink');
  line(im,18,waist+2,17,hem-1,'skirtLight');line(im,22,waist+2,21,hem,'skirtShade');
  line(im,26,waist+2,27,hem,'skirtLight');line(im,29,waist+2,30,hem-1,'skirtShade');
  line(im,18,waist+1,29,waist+1,'skirtLight');
}
function eye(im,x,y,b) {
  // Hand-edited 6x7 / 7x9 glyphs, including the two catchlights. Rounded
  // lower iris clusters replace the draft's rectangular dark eye columns.
  const glyph=b?[
    '.kkkkk.', 'kdddddk', 'dwwpiid', 'dwwpiid', 'diiipil',
    'diillwl', '.illll.', '..bbb..', '..sss..',
  ]:[
    '.kkkk.', 'dwwpdd', 'dwwiid', 'diipil', 'diilwl', '.lbbl.', '..ss..',
  ];
  const colors={k:'lash',d:'irisDark',p:'irisDark',i:'iris',l:'irisLight',b:'irisBottom',w:'white',s:'skinShade'};
  glyph.forEach((row,j)=>[...row].forEach((c,i)=>{
    // Clear the lower corners into the skin rather than retaining square iris.
    put(im,x+i,y+j,c==='.'?'skinLight':colors[c]);
  }));
  put(im,x-1,y+1,'lash');
}
function hairBack(im,b) {
  const top=b?7:13,base=b?43:49;
  poly(im,[[18,top],[28,top],[35,top+2],[40,top+7],[42,top+15],[41,top+20],[45,base-7],[43,base-3],[40,base-4],[40,base],[34,base-1],[31,base-4],[16,base-4],[12,base],[7,base-1],[7,base-4],[3,base-3],[2,base-8],[5,base-15],[5,top+14],[7,top+8],[12,top+3]],'hairShade','ink');
  poly(im,[[9,top+11],[12,top+6],[15,top+8],[12,top+19],[13,base-7],[10,base-3],[8,base-4],[8,base-12],[6,base-10],[7,top+20]],'hair');
  poly(im,[[35,top+7],[39,top+11],[39,top+21],[43,base-9],[41,base-5],[38,base-8],[38,base-3],[34,base-5],[35,base-14]],'hair');
  line(im,5,base-10,5,base-6,'hairLight');line(im,10,base-12,10,base-7,'hairLight');
  line(im,38,base-13,39,base-9,'hairDark');line(im,36,base-6,38,base-3,'hairDark');
}
function faceAndFringe(im,b) {
  const fy=b?18:33,ey=b?25:37,chin=b?41:49;
  poly(im,[[15,fy],[32,fy],[37,fy+6],[37,chin-6],[34,chin-2],[29,chin],[18,chin],[13,chin-2],[10,chin-6],[10,fy+6]],'skin','seam');
  poly(im,[[13,fy+6],[17,fy+2],[31,fy+2],[34,fy+7],[34,chin-6],[30,chin-2],[18,chin-2],[13,chin-6]],'skinLight');
  const blushY=ey+(b?9:7);
  rect(im,b?11:12,blushY,b?5:4,2,'blushLight');rect(im,b?32:32,blushY,b?5:4,2,'blushLight');
  line(im,b?12:13,blushY+1,b?15:15,blushY+1,'blush');line(im,32,blushY+1,b?35:34,blushY+1,'blush');
  line(im,23,chin-3,24,chin-3,'mouth');put(im,24,chin-2,'blushLight');
  // Smooth crown with three lavender bands and deliberately broken shine.
  const t=b?9:23;
  poly(im,[[17,t],[29,t],[35,t+3],[38,t+8],[37,ey+5],[34,ey+7],[32,ey+5],[32,ey-1],[29,ey-3],[27,ey],[21,ey],[18,ey-3],[15,ey-1],[15,ey+5],[12,ey+7],[9,ey+5],[9,t+10],[12,t+4]],'hair','hairDark');
  poly(im,[[17,t+1],[23,t+1],[20,t+7],[18,ey-4],[15,ey-2],[13,ey+4],[11,ey+5],[11,t+10],[13,t+5]],'hairLight');
  poly(im,[[24,t+1],[29,t+1],[33,t+4],[34,t+10],[33,ey-3],[30,ey-5],[28,ey-1],[22,ey-1],[20,ey-4],[22,t+8]],'hairLight');
  poly(im,[[21,t+9],[26,t+10],[29,t+8],[29,ey-3],[27,ey-1],[22,ey-1],[20,ey-4]],'hair');
  line(im,22,ey-1,27,ey-1,'hairShade');
  poly(im,[[34,t+5],[36,t+8],[36,ey+4],[34,ey+5],[34,ey-3]],'hairShade');
  line(im,19,t+3,16,t+6,'hairShine');line(im,22,t+7,27,t+7,'hairShine');
  line(im,30,t+6,32,t+4,'hairShine');line(im,18,t+8,17,ey-5,'hairShade');
  line(im,30,t+9,31,ey-4,'hairShade');line(im,12,ey,12,ey+4,'hairLight');
  // Paint eyes last: the fringe's side locks must not erase the catchlights.
  eye(im,b?13:14,ey,b);eye(im,28,ey,b);
}
function draw(b) {
  const im=b?canvas():areaUnderlay();
  if(b)hairBack(im,true);
  else {
    // Preserve the cleaned downsample's back-hair and shoulder-length wavy
    // silhouette. Trace a one-pixel outer contour, then deliberately consolidate
    // a few messy strand clusters with long, readable lavender planes.
    const alpha=im.pixels.slice();
    for(let y=0;y<64;y++)for(let x=0;x<48;x++){
      if(!alpha[(y*48+x)*4+3])continue;
      if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>x+dx<0||x+dx>=48||y+dy<0||y+dy>=64||!alpha[((y+dy)*48+x+dx)*4+3]))put(im,x,y,'ink');
    }
    poly(im,[[9,35],[11,34],[10,43],[9,48],[7,50],[6,47],[8,42]],'hair');
    poly(im,[[37,34],[39,37],[39,43],[42,48],[40,51],[37,48],[37,43]],'hairShade');
    line(im,7,44,6,47,'hairLight');line(im,39,44,40,47,'hair');
  }
  clothes(im,b);faceAndFringe(im,b);bow(im,b?0:13,b);
  return im;
}
function blit(out,im,left,top,scale) {
  const w=Math.round(im.width*scale),h=Math.round(im.height*scale);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(Math.min(im.height-1,Math.floor(y/scale))*im.width+Math.min(im.width-1,Math.floor(x/scale)))*4;
    const c=im.pixels.subarray(i,i+4),a=c[3]/255,j=((top+y)*out.width+left+x)*4;
    for(let k=0;k<3;k++)out.pixels[j+k]=Math.round(c[k]*a+out.pixels[j+k]*(1-a));
  }
}
function compare(a,b) {
  // The requested reference-height exception uses nearest neighbour; sprite
  // previews exclusively use integer 4x and 2x magnification.
  const refScale=256/source.height,refWidth=Math.round(source.width*refScale);
  const out=canvas(refWidth+192+192+96+96+16*4,256);
  for(let y=0;y<out.height;y++)rect(out,0,y,out.width,1,rgba('f4e8d5'));
  let x=0;blit(out,source,x,0,refScale);x+=refWidth+16;
  blit(out,a,x,0,4);x+=192+16;blit(out,b,x,0,4);x+=192+16;
  blit(out,a,x,128,2);x+=96+16;blit(out,b,x,128,2);
  return out;
}
function write(path,im) {const file=resolve(root,path);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,encodePng(im));}
const a=draw(false),b=draw(true);
for(const [name,im] of [['a',a],['b',b]]){
  const problems=checkImage(im,{size:{width:48,height:64}});
  let bottom=-1,left=48,right=-1;
  for(let y=63;y>=0&&bottom<0;y--)for(let x=0;x<48;x++)if(im.pixels[(y*48+x)*4+3]===255){bottom=y;left=Math.min(left,x);right=Math.max(right,x);}
  if(bottom!==63||(left+right)/2!==23.5)problems.push(`Foot anchor ${JSON.stringify({bottom,left,right})}`);
  if(problems.length)throw new Error(`${name}: ${problems.join(', ')}`);
  write(`art-src/characters/draft-front-${name}.png`,im);
  console.log(`Variant ${name.toUpperCase()}: checkImage = ${JSON.stringify(problems)}, anchor = (${(left+right)/2}, ${bottom})`);
}
write('art-src/drafts/front-compare.png',compare(a,b));
