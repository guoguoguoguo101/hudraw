import {upgradedCharacters,environmentLayers} from './art-upgrade.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const dir=path.resolve('public/art');await fs.mkdir(dir,{recursive:true});
const args=process.argv.slice(2),configPath=args.includes('--config')?args[args.indexOf('--config')+1]:'art.config.json';
const config=JSON.parse(await fs.readFile(configPath,'utf8'));
const P={paper:'#F3E7CB',red:'#D84332',dark:'#8B2333',wine:'#562A34',ink:'#192027',gold:'#E7BA68',white:'#FFF7E8',jade:'#72B5A4',...config.palette};
const definitions=[],contents=new Map();
const p=(d,fill=P.white,stroke='',width=1)=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
const line=(d,c=P.gold,w=2)=>p(d,'none',c,w);
const circle=(x,y,r,c,stroke='',w=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${stroke||'none'}" stroke-width="${w}"/>`;
function asset(name,content,description,options={}){const scale=config.assetScales?.[name]??1;contents.set(name,content);const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="-160 -160 320 320"><g id="${name}" transform="scale(${scale})">${content}</g></svg>`;definitions.push({name,svg,description,config:{scale,...options},width:320,height:320,pivot:[160,160]});}
const tail='M 0 12 C -53 17 -110 -5 -119 -49 C -150 -77 -134 -114 -151 -137 C -116 -132 -113 -106 -93 -97 C -108 -139 -80 -151 -81 -157 C -48 -134 -64 -119 -42 -102 C -39 -141 -6 -135 -11 -155 C 17 -112 -5 -98 13 -69 C 39 -41 15 -11 0 12 Z';
asset('fox_tail',p(tail)+line('M -7 -4 C -47 -23 -54 -67 -105 -94')+line('M -21 -31 Q -53 -38 -44 -59 Q -35 -75 -23 -63'),'蓬松主尾；根部为原点');
asset('fox_torso',p('M -36 -31 Q 0 -47 36 -31 L 44 4 L 31 26 L 53 84 L 26 81 L 22 97 L 0 83 L -22 97 L -26 81 L -53 84 L -31 26 L -44 4 Z')+p('M -27 -29 L 0 -7 L 27 -29 L 13 16 L 0 27 L -13 16 Z',P.wine)+p('M -37 25 Q 0 40 37 25 L 35 36 Q 0 49 -35 36 Z',P.red)+line('M -30 51 Q -17 70 -35 76 M 30 51 Q 17 70 35 76')+p('M 0 41 L 7 57 L 0 70 L -7 57 Z',P.gold)+line('M -5 43 L 0 49 L 5 43'),'白衣短袍，交领、红腰封、镂金衣纹');
asset('fox_head',p('M 0 -54 C -34 -63 -61 -46 -63 -13 L -79 -1 L -58 8 L -70 23 L -50 26 C -45 54 -22 64 0 72 C 22 64 45 54 50 26 L 70 23 L 58 8 L 79 -1 L 63 -13 C 61 -46 34 -63 0 -54 Z')+p('M -15 41 L 0 30 L 15 41 L 0 52 Z',P.ink)+line('M 0 51 L 0 60 M -12 59 Q 0 68 12 59',P.wine,1.8)+p('M 0 -45 L 8 -24 L 0 -13 L -8 -24 Z',P.red)+line('M -44 26 Q -32 21 -27 28 M 44 26 Q 32 21 27 28',P.gold,2),'少年灵狐，颊毛剪口、额间朱砂');
asset('fox_ear',p('M -19 25 Q -36 -16 -29 -57 Q 6 -40 25 5 L 18 30 Z')+p('M -20 -37 Q 0 -23 13 5 L -8 13 Z',P.red)+line('M -19 -36 L -12 -2'),'耳根为旋转锚点');
asset('fox_eyes',p('M -49 -4 Q -33 -20 -14 -8 Q -30 2 -49 -4 Z',P.ink)+p('M 49 -4 Q 33 -20 14 -8 Q 30 2 49 -4 Z',P.ink)+circle(-30,-7,3.5,P.gold)+circle(30,-7,3.5,P.gold),'独立双眼层：垂直缩放眨眼');
asset('fox_arm',p('M -13 -6 Q 0 -19 17 -6 L 30 36 Q 22 55 6 59 L -16 50 L -10 28 Z')+line('M -10 39 Q 10 48 24 34')+p('M 7 51 Q 21 46 27 53 L 17 64 L 2 62 Z'),'袖管与爪手，肩部旋转');
asset('fox_leg',p('M -11 -4 L 11 -4 L 9 31 L 20 41 Q 20 50 3 49 L -13 46 L -12 26 Z',P.white)+line('M -10 40 L 16 40'),'小短腿，髋部旋转');
let fur='M 0 -65 ';for(let i=1;i<=36;i++){const a=-Math.PI/2+i*Math.PI*2/36,r=i%2?67:58;fur+=`L ${(Math.cos(a)*r).toFixed(2)} ${(Math.sin(a)*r).toFixed(2)} `;}fur+='Z';
asset('ink_body',p(fur,P.ink,P.gold,1.3)+line('M -38 26 Q -13 38 8 22 M 10 -37 Q 37 -22 31 2',P.wine,3)+p('M -20 -1 Q -31 -15 -43 -7 Q -32 5 -20 -1 Z',P.red)+p('M 20 -1 Q 31 -15 43 -7 Q 32 5 20 -1 Z',P.red)+circle(-30,-4,2,P.gold)+circle(30,-4,2,P.gold)+p('M -13 24 Q 0 14 13 24 L 5 32 L -5 32 Z',P.paper),'墨团妖：闭合毛刺轮廓、朱目、卷毛暗纹');
asset('crow_body',p('M -32 -15 Q -49 -50 -19 -62 L -3 -78 L 8 -60 Q 35 -60 42 -37 L 77 -22 L 40 -10 Q 26 6 17 24 L 35 66 L 3 55 L -9 75 L -21 40 Q -44 18 -32 -15 Z',P.ink)+p('M 42 -35 L 74 -23 L 42 -18 Z',P.gold)+p('M 0 -39 Q 13 -49 26 -38 Q 13 -29 0 -39 Z',P.red)+circle(14,-39,2.5,P.gold)+line('M -20 5 Q -12 35 3 43'),'纸鸦身体与鸟喙');
asset('crow_wing',p('M 0 0 C -42 -2 -91 -36 -128 -98 L -108 -93 L -112 -119 L -85 -104 L -81 -130 L -54 -109 L -38 -130 C -10 -87 9 -38 0 0 Z',P.ink)+line('M -13 -22 Q -48 -49 -91 -88')+line('M -17 -33 L -54 -86 M -33 -48 L -82 -94',P.wine,3),'独立纸翼：肩根原点');
asset('oni_body',p('M -52 -48 L -62 -111 Q -34 -98 -24 -64 L 0 -72 L 24 -64 Q 34 -98 62 -111 L 52 -48 L 80 -25 L 63 -7 L 77 10 L 55 23 Q 51 73 0 96 Q -51 73 -55 23 L -77 10 L -63 -7 L -80 -25 Z',P.red)+p('M -47 -27 Q -26 -39 -10 -18 L -39 -11 Z',P.ink)+p('M 47 -27 Q 26 -39 10 -18 L 39 -11 Z',P.ink)+line('M -37 -20 L -18 -20 M 37 -20 L 18 -20',P.gold,3)+p('M 0 -51 L 10 -33 L 0 -20 L -10 -33 Z',P.gold)+p('M -9 -2 L 0 -14 L 9 -2 L 0 16 Z',P.wine)+p('M -30 34 Q 0 16 30 34 L 21 52 L -21 52 Z',P.ink)+p('M -22 32 L -16 46 L -8 30 M 22 32 L 16 46 L 8 30',P.white)+line('M -43 0 Q -62 22 -37 36 M 43 0 Q 62 22 37 36 M -20 61 Q 0 82 20 61')+line('M -44 -58 L -45 -81 M 44 -58 L 45 -81'),'赤面鬼：双角、镂空眼口与回纹');
asset('cloud',p('M -139 32 Q -159 12 -131 3 Q -146 -34 -110 -38 Q -92 -82 -58 -49 Q -24 -78 -5 -42 Q 40 -62 53 -21 Q 91 -42 110 -3 Q 154 -15 142 28 L 153 34 Z',P.white)+line('M -126 17 C -104 20 -119 -24 -90 -26 C -63 -29 -61 0 -78 3 C -91 6 -96 -11 -84 -12 M -58 20 C -26 20 -41 -26 -11 -27 C 15 -28 19 -1 1 3 Q -12 5 -10 -8 M 40 20 Q 58 -9 82 0 Q 95 12 80 16 M -125 28 L 126 28',P.gold,1.5),'祥云三卷，层层剪口');
asset('leaf',p('M 0 38 C -48 -3 -14 -57 0 -87 C 14 -57 48 -3 0 38 Z',P.gold)+line('M 0 22 L 0 -61',P.ink,2),'鎏金柳叶碎片');
asset('paper_shard',p('M -22 -8 L -6 -30 L 24 -13 L 10 25 L -11 14 Z',P.gold)+line('M -12 -4 L 12 9',P.red,2),'剪纸碎屑');
asset('flame',p('M 0 51 C -53 18 -25 -19 -13 -41 Q 2 -60 0 -86 C 48 -50 16 -16 31 5 Q 55 33 0 51 Z',P.gold)+p('M 0 30 Q -20 11 0 -19 Q -3 8 15 11 Z',P.red),'灵焰与生命符');
asset('slash',p('M -148 12 Q -58 -59 120 -40 L 85 -30 L 155 -22 L 107 -13 L 144 -2 Q -30 -29 -148 12 Z',P.white)+p('M -148 16 Q -26 -19 147 -4 Q 50 22 -89 18 Z',P.gold)+line('M -120 8 Q 5 -29 113 -16',P.red,2),'弧面纸刃剑气；长轴水平');
asset('rune_z',line('M -62 -72 L 62 -72 L -62 72 L 62 72',P.gold,9)+line('M -75 -90 L -75 -105 L -60 -105 M 75 90 L 75 105 L 60 105',P.gold,3),'雷咒符印');
let ring='';for(let j=0;j<16;j++){ring+=`<g transform="rotate(${j*22.5})">${p('M 0 -66 C -20 -84 -14 -105 0 -124 C 14 -105 20 -84 0 -66 Z',P.gold)}${line('M 0 -79 L 0 -108',P.wine,2)}</g>`;}ring+=circle(0,0,137,'none',P.gold,2)+circle(0,0,57,'none',P.gold,2);asset('sigil_ring',ring,'十六瓣护身符阵，双圈与镂空叶片');
asset('sigil_center',p('M 0 -63 L 21 -21 L 63 0 L 21 21 L 0 63 L -21 21 L -63 0 L -21 -21 Z',P.gold)+p('M 0 -42 L 13 -13 L 42 0 L 13 13 L 0 42 L -13 13 L -42 0 L -13 -13 Z',P.wine)+circle(0,0,8,P.gold),'八方回旋阵心');
const group=(id,name,transform)=>`<g id="${id}" transform="${transform}">${contents.get(name)}</g>`;
asset('fox_preview',`<g transform="scale(.68)">${group('tail','fox_tail','translate(-26 57) rotate(-23) scale(1.08)')}${group('left_leg','fox_leg','translate(-21 81) scale(.92)')}${group('right_leg','fox_leg','translate(21 81) scale(.92)')}${group('left_arm','fox_arm','translate(-36 -9) rotate(7)')}${group('right_arm','fox_arm','translate(36 -9) scale(-1 1) rotate(7)')}${group('torso','fox_torso','translate(0 0)')}<g id="head" transform="translate(0 -66)">${group('left_ear','fox_ear','translate(-43 -39) scale(.86)')}${group('right_ear','fox_ear','translate(43 -39) scale(-.86 .86)')}${contents.get('fox_head')}${group('eyes','fox_eyes','translate(0 10)')}</g></g>`,'完整白衣灵狐：可编辑层级与中心局部锚点');

// Replace named textures while preserving gameplay's existing atlas contract.
for(const [name,content] of Object.entries(upgradedCharacters(P))){
 const old=definitions.findIndex(a=>a.name===name);if(old>=0)definitions.splice(old,1);
 asset(name,content,'美术升级：原创分层剪纸素材，中心局部锚点');
}
const part=(name,x,y,rotation=0,sx=1,sy=sx)=>`<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${sx} ${sy})">${contents.get(name)}</g>`;
const oldPreview=definitions.findIndex(a=>a.name==='fox_preview');definitions.splice(oldPreview,1);
asset('fox_preview',`<g transform="translate(10 6) scale(.9)">${part('fox_tail_high',-43,30,-7,.88)}${part('fox_tail_mid',-43,30,3,.88)}${part('fox_tail_low',-43,30,5,.85)}${part('fox_leg',-43,49,10,.84)}${part('fox_leg',-17,45,-6,.78)}${part('fox_torso',0,24)}${part('fox_arm',44,48,-10,.82)}${part('fox_arm',25,56,-8,.88)}${part('fox_scarf',20,22,0,.86)}${part('fox_collar',28,24,0,.88)}<g transform="translate(38 -25)">${part('fox_ear',-30,-32,-14,.78)}${part('fox_ear',33,-34,18,.81)}${contents.get('fox_head')}${part('fox_eyes',0,3)}${part('fox_pupils',0,3)}</g>${part('fox_bell',40,40,0,.47)}</g>`,'狐灵守护者：三种原创尾形、金瞳、朱砂足尖、独立颈带和飘带');
const cols=5,size=320,rows=Math.ceil(definitions.length/cols),frames={},composite=[];
for(let i=0;i<definitions.length;i++){const a=definitions[i];await fs.writeFile(path.join(dir,`${a.name}.svg`),a.svg);const buffer=await sharp(Buffer.from(a.svg)).png().toBuffer();await fs.writeFile(path.join(dir,`${a.name}.png`),buffer);const x=(i%cols)*size,y=Math.floor(i/cols)*size;composite.push({input:buffer,left:x,top:y});frames[a.name]={frame:{x,y,w:size,h:size},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:size,h:size},sourceSize:{w:size,h:size}};}
await sharp({create:{width:cols*size,height:rows*size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composite).png().toFile(path.join(dir,'atlas.png'));
await fs.writeFile(path.join(dir,'atlas.json'),JSON.stringify({frames,meta:{image:'atlas.png',format:'RGBA8888',size:{w:cols*size,h:rows*size},scale:'1'}},null,2));
// Environment stays as eight transparent layers, also exported as an inspection composite.
const environments=environmentLayers(P);
await fs.mkdir(path.join(dir,'environment'),{recursive:true});
const envComposite=[];
for(const [name,svg] of Object.entries(environments)){
 await fs.writeFile(path.join(dir,'environment',name+'.svg'),svg);
 const input=await sharp(Buffer.from(svg)).png().toBuffer();
 await fs.writeFile(path.join(dir,'environment',name+'.png'),input);envComposite.push({input,left:0,top:0});
}
await sharp({create:{width:720,height:1280,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(envComposite).png().toFile(path.join(dir,'landscape.png'));
const bg=`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">${Object.entries(environments).map(([name,svg])=>`<g id="${name}">${svg.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'')}</g>`).join('')}</svg>`;
await fs.writeFile(path.join(dir,'landscape.svg'),bg);
await fs.writeFile(path.join(dir,'environment','layers.json'),JSON.stringify(Object.keys(environments),null,2));
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({palette:P,assets:definitions.map(({svg,...a})=>a),landscape:{width:720,height:1280}},null,2));
await fs.writeFile('public/art-preview.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>灵狐画符 · 美术工坊</title><style>body{background:${P.ink};color:${P.paper};font-family:serif;padding:32px}h1{letter-spacing:.2em}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}article{background:${P.wine};padding:18px;border:1px solid #E7BA6833;border-radius:8px}img{width:100%;aspect-ratio:1;object-fit:contain}p{color:${P.gold};font-size:13px}a{color:${P.gold}}</style><h1>灵狐画符 · 美术工坊</h1><p>可编辑 SVG → 透明 PNG → 固定纹理图集 · 所有部件的锚点均为画布中心</p><a href="/">返回试玩</a><main>${definitions.map(a=>`<article><img src="art/${a.name}.svg"><b>${a.name}</b><p>${a.description}</p><a href="art/${a.name}.svg">SVG 源文件</a></article>`).join('')}<article><img style="aspect-ratio:9/16" src="art/landscape.svg"><b>landscape · 720 × 1280</b><p>竖屏山海场景</p></article></main></html>`);
console.log(`Generated ${definitions.length} layered SVG assets, PNG textures, atlas, portrait landscape and preview page.`);

