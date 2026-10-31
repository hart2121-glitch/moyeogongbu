// Hand-pixel refinement of the chosen A PNG. Run with Node 22:
// node tools/art/maple-front-cute.mjs
// All marks below are opaque, hand-authored pixel clusters. No image generation.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng, checkImage } from './pixelArt.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const a = decodePng(readFileSync(resolve(root, 'art-src/characters/draft-front-a.png')));
const reference = decodePng(readFileSync(resolve(root, 'public/assets/characters/idle-down.png.png')));
const rgba = hex => [...hex.match(/../g).map(n => parseInt(n, 16)), 255];
const P = Object.fromEntries(Object.entries({
  ink:'352536', seam:'73516e', hairDark:'79488c', hairShade:'955eaa',
  hair:'b173bb', hairLight:'cf8ac8', hairShine:'efb2da',
  bowDark:'7f2d84', bowShade:'a4429a', bow:'cc57b5', bowLight:'e783d2',
  skinShade:'e8b5af', skin:'fce6e1', skinLight:'fff0e9',
  blush:'f29eb4', blushLight:'fac2cf', mouth:'cf788c', mouthPink:'f299b1',
  lash:'51405c', irisDark:'4d427d', iris:'7c5096', irisLight:'b988c8',
  irisBottom:'d0a5dc', white:'fffaf6', cloth:'f9f4f3', clothShade:'d7cbd7',
  clothDeep:'a895b0', skirt:'35323b', skirtLight:'575063', skirtShade:'25232d',
  shoe:'302b39', shoeLight:'575061', sole:'211d29',
}).map(([k,v])=>[k,rgba(v)]));
const canvas=(width=48,height=64)=>({width,height,pixels:new Uint8Array(width*height*4)});
function put(im,x,y,c){if(x>=0&&y>=0&&x<im.width&&y<im.height)im.pixels.set(typeof c==='string'?P[c]:c,(y*im.width+x)*4);}
function rect(im,x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(im,xx,yy,c);}
function line(im,x,y,xx,yy,c){const dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1;let e=dx+dy;for(;;){put(im,x,y,c);if(x===xx&&y===yy)break;const e2=2*e;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}}}
function poly(im,points,c,outline=null){
  const mask=new Set();
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [xi,yi]=points[i],[xj,yj]=points[j];
      if(((yi>y+.5)!==(yj>y+.5))&&x+.5<(xj-xi)*(y+.5-yi)/(yj-yi)+xi)inside=!inside;
    }if(inside)mask.add(y*im.width+x);
  }
  for(const n of mask){const x=n%im.width,y=Math.floor(n/im.width);const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!mask.has((y+dy)*im.width+x+dx));put(im,x,y,outline&&edge?outline:c);}
}

function backWaves(im){
  // Retain A's lower back-hair underlay between y=23 and 43; reshape its
  // shoulder curls in individual pixel clusters and lift its crown four rows.
  rect(im,0,0,48,23,[0,0,0,0]);rect(im,0,44,48,20,[0,0,0,0]);
  poly(im,[[18,18],[29,18],[36,21],[40,27],[41,35],[40,39],[44,44],[44,46],[41,48],[38,47],[37,49],[33,48],[30,43],[17,43],[13,48],[9,49],[7,47],[3,48],[2,45],[5,39],[5,30],[8,24],[12,20]],'hairShade','ink');
  poly(im,[[9,27],[13,24],[13,32],[11,38],[12,43],[10,46],[7,47],[8,43],[6,44],[7,38],[7,32]],'hair');
  poly(im,[[35,24],[39,29],[39,37],[38,40],[41,44],[43,45],[40,46],[37,44],[36,47],[34,45],[35,39]],'hair');
  line(im,8,33,8,37,'hairLight');line(im,8,38,6,42,'hairLight');line(im,6,44,8,45,'hairLight');
  line(im,11,39,12,43,'hairDark');line(im,10,44,9,46,'hairLight');
  line(im,38,32,38,36,'hairLight');line(im,38,38,37,40,'hairDark');
  line(im,39,42,41,44,'hairLight');line(im,36,43,37,45,'hairDark');
}
function body(im){
  // 9 visible rows below the skirt: bare knees, white socks and separate shoes.
  for(const x of [17,26]){
    rect(im,x,54,5,7,'skinShade');rect(im,x+1,55,3,4,'skin');
    rect(im,x,58,5,4,'clothShade');rect(im,x+1,58,3,3,'white');
    poly(im,[[x,61],[x+4,61],[x+6,63],[x+6,64],[x-1,64],[x-1,63]],'shoe','ink');
    rect(im,x,61,4,1,'shoeLight');rect(im,x-1,63,7,1,'sole');
  }
  poly(im,[[18,43],[29,43],[32,45],[35,49],[34,51],[31,51],[29,48],[29,52],[18,52],[18,48],[16,51],[13,51],[12,49],[15,45]],'cloth','seam');
  rect(im,18,45,11,5,'cloth');
  line(im,15,47,14,49,'white');line(im,32,47,33,49,'white');
  line(im,17,47,17,50,'clothShade');line(im,30,47,30,50,'clothShade');
  // Rounded hands, each three pixels wide with a soft thumb pixel.
  poly(im,[[13,50],[16,50],[17,52],[16,54],[13,54],[12,52]],'skin','seam');
  rect(im,13,51,3,2,'skinLight');put(im,16,52,'skin');
  poly(im,[[31,50],[34,50],[35,52],[34,54],[31,54],[30,52]],'skin','seam');
  rect(im,31,51,3,2,'skinLight');put(im,30,52,'skin');
  poly(im,[[19,44],[23,46],[21,49],[18,46]],'white','clothDeep');
  poly(im,[[24,46],[28,44],[29,46],[26,49]],'white','clothDeep');
  rect(im,23,46,2,2,'skirt');line(im,23,48,24,51,'skirtLight');
  poly(im,[[18,50],[29,50],[32,55],[29,56],[18,56],[15,55]],'skirt','ink');
  line(im,18,51,29,51,'skirtLight');line(im,19,52,18,54,'skirtLight');
  line(im,22,52,21,55,'skirtShade');line(im,25,52,26,55,'skirtLight');
  line(im,28,52,29,54,'skirtShade');
}
function eye(im,x,y,left){
  // Rounded seven-column iris with exactly one 2x2 main catchlight and a
  // separate lower-right point. Violet ramps are inherited from Variant A.
  // Face pass 3 also tapers the upper arch. The tiny outer flick connects to
  // the upper lash at y+1 rather than making a detached dark eyebrow block.
  const glyph=['..kkk..','.ddidd.','dwwiiid','dwwiiid','diiiild','.illlw.','..bbb..','...s...'];
  const colors={k:'lash',d:'irisDark',i:'iris',l:'irisLight',b:'irisBottom',w:'white',s:'skinShade'};
  glyph.forEach((row,j)=>[...row].forEach((c,i)=>{if(c!=='.')put(im,x+i,y+j,colors[c]);}));
  put(im,x,y+1,'lash');put(im,x+6,y+1,'lash');
  put(im,left?x-1:x+7,y+1,'lash');
}
function face(im,happy){
  poly(im,[[15,25],[32,25],[36,29],[38,35],[37,40],[35,43],[31,45],[27,46],[20,46],[16,45],[12,43],[10,40],[9,35],[11,29]],'skin','skinShade');
  poly(im,[[15,27],[32,27],[35,32],[36,37],[35,41],[31,43],[27,45],[20,45],[16,43],[12,40],[11,35],[13,30]],'skinLight');
  // Face pass 2: a stepped pale halo rounds the six-pixel pink blush cores.
  // Their centres (14, 33) are mirrored around the face axis x=23.5.
  for(const x of [13,32]){
    rect(im,x-1,41,5,2,'blushLight');
    rect(im,x,40,3,1,'blushLight');rect(im,x,43,3,1,'blushLight');
    rect(im,x,41,3,2,'blush');
  }
  if(happy){
    // Four-column open smile: a pink interior and darker rounded lip rim.
    ['mmmm','mppm','.mm.'].forEach((row,y)=>[...row].forEach((c,x)=>{
      if(c!=='.')put(im,22+x,42+y,c==='m'?'mouth':'mouthPink');
    }));
  }else{
    put(im,22,42,'mouth');put(im,25,42,'mouth');
    put(im,23,43,'mouth');put(im,24,43,'mouth');
  }
}
function fringe(im){
  poly(im,[[17,19],[29,19],[35,22],[38,27],[38,34],[36,39],[34,40],[32,37],[32,31],[29,29],[27,33],[21,33],[18,29],[15,31],[15,37],[13,40],[11,39],[9,34],[9,28],[12,22]],'hair','hairDark');
  poly(im,[[17,20],[22,20],[19,26],[17,29],[14,31],[13,36],[12,38],[11,34],[11,28],[13,23]],'hairLight');
  poly(im,[[24,20],[29,20],[33,23],[34,27],[32,30],[29,28],[27,31],[22,31],[20,28],[22,24]],'hairLight');
  poly(im,[[22,27],[26,28],[29,26],[29,29],[27,32],[22,32],[20,29]],'hair');
  line(im,22,32,26,32,'hairShade');
  poly(im,[[35,24],[37,28],[36,35],[34,38],[34,31]],'hairShade');
  line(im,16,23,19,21,'hairShine');line(im,23,24,28,24,'hairShine');
  line(im,12,31,12,35,'hairShine');line(im,34,30,34,34,'hairLight');
}
function bow(im){
  // The right loop is one row higher: a modest playful tilt, not a rotation
  // filter. Round loops, a lit centre knot and two deliberately short tails.
  poly(im,[[11,9],[14,9],[18,11],[23,15],[22,19],[18,21],[13,22],[10,20],[8,16],[8,12]],'bow','bowDark');
  poly(im,[[34,7],[37,8],[39,12],[38,17],[36,20],[31,19],[26,17],[25,14],[30,10]],'bow','bowDark');
  poly(im,[[20,18],[24,18],[22,24],[19,23]],'bowShade','bowDark');
  poly(im,[[25,17],[28,17],[30,22],[27,22]],'bow','bowDark');
  line(im,11,11,11,15,'bowLight');line(im,12,10,14,11,'bowLight');
  line(im,13,20,19,18,'bowShade');line(im,16,13,21,16,'bowShade');
  line(im,35,9,36,12,'bowLight');line(im,29,13,33,11,'bowLight');
  line(im,28,16,35,18,'bowShade');
  poly(im,[[23,13],[26,13],[28,15],[27,18],[23,19],[21,17],[21,15]],'bowShade','bowDark');
  rect(im,23,14,3,2,'bowLight');rect(im,23,16,3,1,'bow');
}
function draw(happy){
  const im={width:a.width,height:a.height,pixels:new Uint8Array(a.pixels)};
  backWaves(im);body(im);face(im,happy);fringe(im);bow(im);
  // The fringe is intentionally behind the brows and rounded eye glyphs.
  for(const x of [15,30])line(im,x,happy?30:31,x+2,happy?30:31,'hairShade');
  eye(im,13,33,true);eye(im,28,33,false);
  return im;
}
function blit(out,im,left,top,scale){
  for(let y=0;y<Math.round(im.height*scale);y++)for(let x=0;x<Math.round(im.width*scale);x++){
    const i=(Math.min(im.height-1,Math.floor(y/scale))*im.width+Math.min(im.width-1,Math.floor(x/scale)))*4;
    const alpha=im.pixels[i+3]/255,j=((top+y)*out.width+left+x)*4;
    for(let k=0;k<3;k++)out.pixels[j+k]=Math.round(im.pixels[i+k]*alpha+out.pixels[j+k]*(1-alpha));
  }
}
function compare(a2,a3){
  const scale=256/reference.height,refWidth=Math.round(reference.width*scale);
  const out=canvas(refWidth+3*192+3*96+6*16,256);rect(out,0,0,out.width,out.height,rgba('f4e8d5'));
  let x=0;blit(out,reference,x,0,scale);x+=refWidth+16;
  for(const im of [a,a2,a3]){blit(out,im,x,0,4);x+=192+16;}
  for(const im of [a,a2,a3]){blit(out,im,x,128,2);x+=96+16;}
  return out;
}
function write(path,im){const dest=resolve(root,path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,encodePng(im));}
const a2=draw(false),a3=draw(true);
for(const [name,im] of [['a2',a2],['a3',a3]]){
  const problems=checkImage(im,{size:{width:48,height:64}});
  const ground=[];for(let x=0;x<48;x++)if(im.pixels[(63*48+x)*4+3]===255)ground.push(x);
  const anchor=(Math.min(...ground)+Math.max(...ground))/2;
  if(anchor!==23.5)throw new Error(`${name}: unexpected feet anchor ${anchor}`);
  if(problems.length)throw new Error(`${name}: ${problems.join(', ')}`);
  write(`art-src/characters/draft-front-${name}.png`,im);
  console.log(`${name.toUpperCase()}: checkImage = ${JSON.stringify(problems)}, feet = (${anchor}, 63)`);
}
write('art-src/drafts/front-cute-compare.png',compare(a2,a3));
