// Hand-authored native-grid corrections after reviewing native-base-*-8x.png.
// Coordinates refer to the placed native base, BEFORE final centering.
// A row string is a list of explicit pixel edits, never a scaled drawing.
import { put } from './gen-front.mjs';

const rows=(x,y,patterns)=>patterns.flatMap((s,j)=>[...s].flatMap((v,i)=>v===' '?[]:[[x+i,y+j,v==='.'?null:v]]));
const reverse=s=>[...s].reverse().join('');
const eyePair=(left,right,y,patterns)=>[
  ...rows(left,y,patterns),...rows(right,y,patterns.map(reverse)),
];

// Upright eyes (N1), rounded eyes (N2), broad oval eyes (N3). White side
// crescents, upper glints, dark pupils and two purple iris values follow raws.
export const EYES = [
  {left:17,right:31,y:33,patterns:[
    'SSOOOOSS','SOOOOOOS','OWIIIWWO','SWWIIWWI','SWWIJJJI',
    'SWWJJEES','SSWJEEES','SSSJEEES','SSSSEESS',
  ]},
  {left:18,right:31,y:31,patterns:[
    'SSOOOSS','SOOOOOS','OIJJWWI','WIJJWWI',
    'WWJEIII','SWJEEES','SSJEESS','SSSEESS',
  ]},
  {left:23,right:40,y:38,patterns:[
    'SSOOOOOSS','SOOOOOOOS','OOIIIIIOO','OWNIIIWWI','SWWIIIWWI',
    'SWWJJJIII','SSWJJEEES','SSSJEEESS','SSSSEEESS',
  ]},
];

export const PATCHES = [
  [
    // Ribbon: keep large lobes and original diagonal folds, close the knot.
    ...rows(25,9,['.OOO.','OTTT O','OTTT O','ORTR O','O R O']),
    // Blush, tiny original dot mouth, neckline and two distinct fingers.
    ...rows(19,42,['BB','BB']),...rows(34,42,['BB','BB']),
    [27,42,'O'],[27,45,'F'],[28,45,'F'],
    ...rows(15,56,['.OO.','OSSO','OSFO','.OO.']),
    ...rows(36,56,['.OO.','OSSO','OF SO','.OO.']),
    // Socks and shoes: retain broad shape, straighten soles and glints.
    ...rows(20,65,Array(7).fill('................')),
    ...rows(21,65,['OWWNNO','OWWWWO','ONOOIO','OCWWCO','OCQQQO','OCQQQO','.OOOOO']),
    ...rows(29,65,['ONNWWO','OWWWWO','OIOONO','OCWWCO','OQQQCO','OQQQCO','OOOOO.']),
    // Remove a weak right-side hook and join the intended curled tip.
    [49,37,null],[49,38,null],[48,45,null],[49,46,null],
    [48,47,null],[48,48,null],[49,48,null],[49,47,null],
    // One silhouette pixel makes the native width even, allowing exact center.
    [53,42,'O'],
  ],
  [
    // Small butterfly ribbon retains the crossed folds and light lower lobes.
    ...rows(26,13,['.O O.','ORARO','ORTRO','.OOO.']),
    ...rows(19,39,['BB','BB']),...rows(34,39,['BB','BB']),
    [27,39,'M'],[27,42,'F'],[28,42,'F'],
    ...rows(15,54,['.OOO','OSSS','OSSF','OSFO','.OOO']),
    ...rows(36,54,['OOO.','SSSO','FSSO','OFSO','OOO.']),
    ...rows(21,65,['ONNWO','OWWWO','.OCO.','OCWWCO','OCQQCO','OCQQCO','OOOOO.']),
    ...rows(29,65,['OWNNO','OWWWO','.OCO.','OCWWCO','OCQQCO','OCQQCO','.OOOOO']),
    [49,35,'O'],
  ],
  [
    // Keep ribbon's lavender inner folds. Repair knot's two dark corners.
    [34,14,'O'],[37,14,'O'],[34,15,'V'],[37,15,'V'],
    ...rows(25,48,['BBB','BBB']),...rows(43,48,['BBB','BBB']),
    // Original little w-shaped mouth, which the dominant block vote omitted.
    ...rows(34,49,['SSS','SSS']),...rows(34,48,['OSO','SOS']),
    // Rounded hands with the generated inward-facing thumb and pink fingertip.
    ...rows(21,67,['.OOO.','OSSSO','OSSFO','.OFO.','..O..']),
    ...rows(46,67,['.OOO.','OSSSO','OFSSO','.OFO.','..O..']),
    ...rows(28,80,Array(8).fill('...............')),
    ...rows(29,80,['OWWWWO','.OWWO.','.OWWO.','.OOOO.','OCWWCO','OCCCCO','OQQQQO','.OOOOO']),
    ...rows(37,80,['OWWWWO','.OWWO.','.OWWO.','.OOOO.','OCWWCO','OCCCCO','OQQQQO','OOOOO.']),
    // Right curl: remove small doubled jaggies but keep the loop opening.
    [62,53,null],[62,54,null],[61,54,null],[60,54,null],
    [63,51,null],[63,52,null],[63,53,null],[64,51,null],
    [65,43,'O'],
  ],
];

// Native-coordinate material masks reviewed against each raw. Purples in these
// head regions belong to hair; the explicit bow and costume exclusions preserve
// their own ramps. Skin, white glints and dark contours are not palette-merged.
export const HAIR = [
  {top:14,bottom:52,bowBottom:16,bowOutside:[19,36],bodyTop:48,body:[16,40]},
  {top:18,bottom:47,bodyTop:44,body:[18,37]},
  {top:17,bottom:57,bowBottom:20,bowInside:[25,46],bodyTop:54,body:[25,46]},
];
export const BOW = [
  {left:11,right:44,top:2,bottom:16,tones:['R','V','T']},
  {left:17,right:38,top:9,bottom:18,tones:['R','T','H']},
  {left:23,right:49,top:6,bottom:20,tones:['R','V','A']},
];

export function cleanupNative(image,id,{PALETTE,components}) {
  const im={...image,pixels:image.pixels.slice()},edits=[];
  const paint=(x,y,value,reason)=>{
    const color=value===null?null:PALETTE[value];
    if(value!==null&&!color)throw new Error(`Unknown palette symbol ${value}`);
    const i=(y*im.width+x)*4,before=Array.from(im.pixels.subarray(i,i+4));
    put(im,x,y,color);
    if(before.some((v,c)=>v!==im.pixels[i+c]))edits.push({x,y,value,reason});
  };
  const hair=HAIR[id-1],hairRamp=['K','H','L'];
  const purples=new Set(['D','K','A','H','L','R','V','T','C','Q'].map(k=>PALETTE[k]));
  const rgb=h=>[0,2,4].map(c=>parseInt(h.slice(c,c+2),16));
  const mergePixel=(x,y,symbols,reason)=>{
    const i=(y*im.width+x)*4;
    if(!im.pixels[i+3])return;
    const h=Buffer.from(im.pixels.subarray(i,i+3)).toString('hex');
    if(!purples.has(h))return;
    const c=rgb(h),dist=symbols.map(k=>rgb(PALETTE[k])).map(v=>.3*(c[0]-v[0])**2+.59*(c[1]-v[1])**2+.11*(c[2]-v[2])**2);
    paint(x,y,symbols[dist.indexOf(Math.min(...dist))],reason);
  };
  for(let y=hair.top;y<=hair.bottom;y++)for(let x=0;x<im.width;x++) {
    if(y>=hair.bodyTop&&x>=hair.body[0]&&x<=hair.body[1])continue;
    if(y<=hair.bowBottom&&hair.bowOutside&&(x<hair.bowOutside[0]||x>hair.bowOutside[1]))continue;
    if(y<=hair.bowBottom&&hair.bowInside&&x>=hair.bowInside[0]&&x<=hair.bowInside[1])continue;
    mergePixel(x,y,hairRamp,'merge hair near-duplicates to three tones');
  }
  const eye=EYES[id-1];
  for(const [x,y,v] of [...eyePair(eye.left,eye.right,eye.y,eye.patterns),...PATCHES[id-1]])
    paint(x,y,v,'hand-authored detail correction');
  const bow=BOW[id-1];
  for(let y=bow.top;y<=bow.bottom;y++)for(let x=bow.left;x<=bow.right;x++) {
    // N1's hair emerges between the bow lobes below the knot; N2 has a
    // forehead opening under its smaller knot. Keep those hair samples.
    if(id===1&&y>=14&&x>=19&&x<=36)continue;
    if(id===2&&y>=16&&x>=23&&x<=32)continue;
    if(id===3&&y>=17&&x>=33&&x<=40)continue;
    mergePixel(x,y,bow.tones,'merge ribbon near-duplicates to three tones');
  }

  // Measured mask repairs are logged as exact coordinates. Keep only the main
  // connected sprite, then recolour its existing exposed pixels, without
  // dilating, eroding, or shrinking the silhouette. Hand patches above do shape.
  for(const group of components(im).slice(1))for(const index of group)
    paint(index%im.width,Math.floor(index/im.width),null,'detached generated speck');
  const mask=im.pixels.slice();
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(mask[(y*im.width+x)*4+3]) {
    const exposed=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>
      x+dx<0||y+dy<0||x+dx>=im.width||y+dy>=im.height||!mask[((y+dy)*im.width+x+dx)*4+3]);
    if(exposed)paint(x,y,'O','close one-pixel silhouette outline');
  }
  return {image:im,edits,handAuthoredOperations:eye.patterns.join('').length*2+PATCHES[id-1].length,
    eyes:{...eye,width:eye.patterns[0].length,height:eye.patterns.length},hair:{...hair,tones:hairRamp},bow,iteration:4,
    visualIteration:'After pass 1: increase paired eye glints to 2x2, lighten N1 upper iris, separate N3 mouth from chin. After independent review: merge hair and ribbon to three tones each; move N1/N3 shoes one pixel right so feet and silhouette share the same center.'};
}
