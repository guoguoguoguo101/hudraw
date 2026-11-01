import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const folder='output/skill-restyle';await mkdir(folder,{recursive:true});
const panelWidth=480,panelHeight=340,bodyHeight=298,width=960,height=680;
const sources=[
 {title:'一字斩 · 折纸金锋',path:'screenshots/brush-line-art/sancai-animation.gif',offset:540},
 {title:'雷符 · 银白传导',path:'output/thunder-brush-polish/motion-after-webgl2.gif',offset:60},
 {title:'花符 · 纸蝶绽放',path:'screenshots/flower-rhythm/after/flower-motion.gif',offset:1050},
 {title:'喷墨 · 墨鲤跃浪',path:'output/skill-restyle/carp/carp-motion.gif',offset:280,crop:{left:0,top:245,width:430,height:325}},
];
for(const source of sources){source.meta=await sharp(source.path,{animated:true}).metadata();source.duration=source.meta.delay.reduce((s,n)=>s+n,0);}
const labels=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${sources.map((s,i)=>`<rect x="${i%2*panelWidth}" y="${Math.floor(i/2)*panelHeight}" width="480" height="40" fill="#182e31"/><text x="${i%2*panelWidth+22}" y="${Math.floor(i/2)*panelHeight+28}" font-family="Microsoft YaHei,sans-serif" font-size="22" fill="#eee0c0">${s.title}</text>`).join('')}</svg>`);
const frames=[];
for(let i=0;i<36;i++){
 const cells=[];
 for(const [slot,source]of sources.entries()){
  let time=(i*60+source.offset)%source.duration,page=0;while(page<source.meta.pages-1&&time>=source.meta.delay[page]){time-=source.meta.delay[page];page++;}
  let input=sharp(source.path,{page,pages:1});if(source.crop)input=input.extract(source.crop);
  const tile=await input.resize(panelWidth,bodyHeight,{fit:'contain',background:'#203738'}).png().toBuffer();cells.push({input:tile,left:slot%2*panelWidth,top:Math.floor(slot/2)*panelHeight+40});
 }
 const frame=await sharp({create:{width,height,channels:4,background:'#203738'}}).composite([...cells,{input:labels,left:0,top:0}]).ensureAlpha().raw().toBuffer();frames.push(frame);
 if(i===0)await sharp(frame,{raw:{width,height,channels:4}}).png().toFile(folder+'/skills-preview.png');
}
await sharp(Buffer.concat(frames),{raw:{width,height:height*frames.length,channels:4,pageHeight:height}}).gif({delay:Array(frames.length).fill(60),loop:0,colours:192,effort:3}).toFile(folder+'/skills-motion.gif');
const result=await sharp(folder+'/skills-motion.gif',{animated:true}).metadata();if(result.pages!==frames.length||result.delay.some(d=>d!==60))throw Error('Animation frame timing must remain intact');
console.log('Saved four-skill preview: output/skill-restyle/skills-motion.gif');
