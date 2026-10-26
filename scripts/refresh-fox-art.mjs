import {foxPreview} from './fox-preview.mjs';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {foxArt} from './fox-friendly-art.mjs';
// Replace only fox cells; retain every unrelated texture, atlas coordinate and scale.
const dir='public/art',config=JSON.parse(await fs.readFile('art.config.json','utf8'));
const parts=foxArt({gold:'#E7BA68',...config.palette}),atlas=JSON.parse(await fs.readFile(`${dir}/atlas.json`,'utf8'));
parts.fox_preview=foxPreview(parts);
const image=await sharp(`${dir}/atlas.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let added=false;
for(const [name,content] of Object.entries(parts)){
 if(!atlas.frames[name]){
  const used=new Set(Object.values(atlas.frames).map(f=>`${f.frame.x},${f.frame.y}`));
  let frame;
  for(let y=0;y<image.info.height&&!frame;y+=320)for(let x=0;x<image.info.width&&!frame;x+=320)if(!used.has(`${x},${y}`))frame={x,y,w:320,h:320};
  if(!frame)throw new Error('No free atlas cell for '+name);
  atlas.frames[name]={frame,rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:320,h:320},sourceSize:{w:320,h:320}};added=true;
 }
 const frame=atlas.frames[name].frame;
 const scale=config.assetScales?.[name]??1;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="-160 -160 320 320"><g id="${name}" transform="scale(${scale})">${content}</g></svg>`;
 await fs.writeFile(`${dir}/${name}.svg`,svg);
 const png=await sharp(Buffer.from(svg)).png().toBuffer();await fs.writeFile(`${dir}/${name}.png`,png);
 const pixels=await sharp(png).ensureAlpha().raw().toBuffer();
 for(let row=0;row<frame.h;row++)pixels.copy(image.data,((frame.y+row)*image.info.width+frame.x)*4,row*frame.w*4,(row+1)*frame.w*4);
}
await sharp(image.data,{raw:image.info}).png().toFile(`${dir}/atlas.png`);
if(added)await fs.writeFile(`${dir}/atlas.json`,JSON.stringify(atlas,null,2));
console.log(`Updated ${Object.keys(parts).length} fox parts and atlas cells; other artwork preserved.`);
