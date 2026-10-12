import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {guardianSceneSvg} from '../src/rendering/fox-vestment-scene';
const dir='assets/vfx/fox_guardian';await mkdir(dir,{recursive:true});
const frames=[{time:.22,name:'01-ritual',title:'起势 · 聚焦法阵'},{time:.69,name:'02-emerge',title:'钻出 · 侧后切入'},{time:1.14,name:'03-orbit',title:'盘旋 · 前后环绕'},{time:2.16,name:'04-vestment',title:'法衣 · 守护定格'}],inputs=[];
for(const f of frames){const svg=guardianSceneSvg(f.time);await writeFile(`${dir}/${f.name}.svg`,svg);await sharp(Buffer.from(svg)).resize(504,704).png().toFile(`${dir}/${f.name}.png`);inputs.push(await sharp(Buffer.from(svg)).resize(360,503).png().toBuffer());}
const labels=Buffer.from(`<svg width="1440" height="52"><rect width="1440" height="52" fill="#29242a"/><style>text{font:18px 'Microsoft YaHei';fill:#f5e2c0}</style>${frames.map((f,i)=>`<text x="${i*360+32}" y="32">${f.title} · ${f.time.toFixed(2)}s</text>`).join('')}</svg>`);
await sharp({create:{width:1440,height:555,channels:4,background:'#29242a'}}).composite([{input:labels,left:0,top:0},...inputs.map((input,i)=>({input,left:i*360,top:52}))]).png().toFile(`${dir}/keyframes.png`);
console.log('Exported four vector keyframes and concept sheet');
