// Shared 16-colour paint box. Explicit patches below are hand-authored after
// inspecting the snapped generations, not a replacement procedurally drawn sprite.
export const PALETTE = {
  O:'281c36', D:'4e315f', K:'74508f', A:'9064b2', H:'b18ad1', L:'d4b4ea',
  R:'8c4fba', V:'b46bdf', I:'572290', J:'9a48dd', S:'ffe2d0', T:'eeb49e',
  B:'ee91ad', W:'fff9f3', C:'c8bbd9', M:'995366',
};
export function paintbox(image,id) {
  const result={...image,pixels:image.pixels.slice()};
  const colours=Object.values(PALETTE).map(h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)));
  for(let i=0;i<result.pixels.length;i+=4)if(result.pixels[i+3]) {
    const p=result.pixels;let best=0,near=Infinity;
    colours.forEach((c,k)=>{const d=(p[i]-c[0])**2+(p[i+1]-c[1])**2+(p[i+2]-c[2])**2;if(d<near){near=d;best=k;}});
    const x=(i/4)%48,y=Math.floor(i/4/48),hairBottom=[50,46,47][id-1],bodyTop=[48,44,46][id-1];
    if(id && y<=hairBottom && !(y>=bodyTop&&x>=17&&x<=30)) {
      const [r,g,b]=p.subarray(i,i+3);
      let symbol;
      if(r+g+b<200)symbol='O';
      else if(r-b>22&&g>b)symbol=g<175?'B':g<200?'T':'S';
      else if(y<=[26,25,26][id-1])symbol=r+g+b>480?'V':r+g+b>330?'R':'D';
      else symbol=r+g+b>700?'L':r+g+b>540?'H':'A';
      p.set([0,2,4].map(j=>parseInt(PALETTE[symbol].slice(j,j+2),16)),i);
    }else p.set(colours[best],i);
  }
  return result;
}
const rows=(x,y,patterns)=>patterns.map((pattern,j)=>({x,y:y+j,pattern,key:PALETTE}));
const mirror=s=>s+[...s].reverse().join('');
const face=[
  'OOOOOSSSSOOOOO', 'OWIIOSSSSOWIIO', 'SIIISSSSSSIIIS',
  'SJJJSSSSSSJJJS', 'SSJSSSSSSSSJSS', 'BBSSSSSSSSSSBB',
  'SSSSSSMMSSSSSS', 'OSSSSSSSSSSSSO',
];
// Row strings are explicit pixel paint operations. No vector rasterisation or
// reduction of an illustration occurs here. Bow lobes, symmetric eyes, single
// highlights, collars, tiny hands, pleats and feet were redrafted on the real grid.
const body=[
  '....OCSTTSCO....', '...OCWWDDWWCO...', '..OWWWWDDWWWWO..',
  '..OWCWWDDWWCWO..', '.OWWCWWWWWWCWWO.', '.OTSOODDDDOOSTO.',
  '.OSSOODDDDOOSSO.', '..ODKDDKDDKDDO..', '..ODKDDKDDKDDO..',
  '...OOOOOOOOOO...', '....OSTOOSTO....', '....OWCOOCWO....',
  '....OWWOOWWO....', '...OODDOODDOO...', '...ODKKOODKKO...',
  '...OOOO..OOOO...',
];
export const CLEANUP = [
  [
    ...rows(14,20,['.OOOO.....','ORVVRO....','ORVVVRO...','.ORVVVRO..','..ORVVRROO','..ORRRRDOV','..ORVVROOO'].map(mirror)),
    ...rows(17,40,face),
    ...rows(16,48,body),
  ],
  [
    ...rows(16,20,['.OOO....','ORVRO...','ORVVRO..','.ORVRROO','..ORRDOV','..ORVROO','...OOOHH'].map(mirror)),
    ...rows(17,36,face),
    ...rows(16,44,[...body.slice(0,4),'..OWCWWWWWWCWO..','..OWCWWWWWWCWO..',...body.slice(4,9),body[8],...body.slice(9,12),body[11],...body.slice(12)]),
  ],
  [
    ...rows(16,20,['.OOO....','ORVRO...','ORVVRO..','.ORVRROO','..ORRDOV','..ORVROO','...OOOHH'].map(mirror)),
    ...rows(17,38,face),
    ...rows(16,46,[...body.slice(0,4),'..OWCWWWWWWCWO..',...body.slice(4,9),body[8],...body.slice(9)]),
  ],
];

// Final independent-review pass: explicit exposed-edge repairs, then erase the
// two detached hand-colour pairs remaining outside G2's redrafted sleeves.
export const FIXUPS = [
  [[15,27,'O'],[32,27,'O'],[16,47,'O'],[31,47,'O'],
   [18,47,'O'],[19,47,'O'],[28,47,'O'],[29,47,'O'],
   [15,48,'O'],[32,48,'O'],[15,49,'O'],[32,49,'O'],[15,50,'O'],[32,50,'O']],
  [[16,27,'O'],[17,27,'O'],[18,27,'O'],[29,27,'O'],[30,27,'O'],[31,27,'O'],
   [16,43,'O'],[31,43,'O'],[18,43,'O'],[19,43,'O'],[28,43,'O'],[29,43,'O'],
   [15,44,'O'],[32,44,'O'],[15,45,'O'],[32,45,'O'],
   [15,52,null],[15,53,null],[32,52,null],[32,53,null]],
  [[16,27,'O'],[17,27,'O'],[18,27,'O'],[29,27,'O'],[30,27,'O'],[31,27,'O'],
   [16,45,'O'],[31,45,'O'],[18,45,'O'],[19,45,'O'],[28,45,'O'],[29,45,'O'],[32,46,'O']],
].map(edits=>edits.map(([x,y,symbol])=>[x,y,symbol===null?null:PALETTE[symbol]]));

// Remove detached generated specks, then recolour only the existing outermost
// silhouette to a single dark pixel. The explicit patches above finish the edges.
export function prepareCleanup(image) {
  const im={...image,pixels:image.pixels.slice()},seen=new Set(),groups=[];
  const opaque=i=>i>=0&&i<48*64&&im.pixels[i*4+3]===255;
  for(let i=0;i<48*64;i++)if(opaque(i)&&!seen.has(i)) {
    const group=[],queue=[i];seen.add(i);
    while(queue.length){const k=queue.pop();group.push(k);const x=k%48,y=Math.floor(k/48);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy,n=ny*48+nx;if(nx>=0&&nx<48&&ny>=0&&ny<64&&opaque(n)&&!seen.has(n)){seen.add(n);queue.push(n);}
      }
    }groups.push(group);
  }
  groups.sort((a,b)=>b.length-a.length);
  for(const group of groups.slice(1))for(const i of group)im.pixels.set([0,0,0,0],i*4);
  const mask=im.pixels.slice();
  for(let y=0;y<64;y++)for(let x=0;x<48;x++)if(mask[(y*48+x)*4+3]) {
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>x+dx<0||x+dx>=48||y+dy<0||y+dy>=64||!mask[((y+dy)*48+x+dx)*4+3]))
      im.pixels.set([40,28,54,255],(y*48+x)*4);
  }
  return im;
}
