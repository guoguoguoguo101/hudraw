import sharp from 'sharp';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'wechat-game');
await fs.mkdir(out,{recursive:true});
// DevTools' real-device parser can reject optional chaining / nullish coalescing.
// Transpile dependencies as well as our source; don't rely on the IDE's ES6 switch.
await build({root,configFile:false,publicDir:false,define:{'import.meta.env.DEV':'false',navigator:'globalThis.navigator',performance:'globalThis.__LINGHU_CLOCK__',requestAnimationFrame:'globalThis.__LINGHU_REQUEST_FRAME__'},build:{outDir:out,emptyOutDir:false,target:'es2017',minify:'esbuild',lib:{entry:path.join(root,'src/wechat-main.ts'),name:'LinghuWechat',formats:['iife'],fileName:()=> 'runtime.js'}}});
await fs.mkdir(path.join(out,'art/chapters'),{recursive:true});
await fs.mkdir(path.join(out,'art/bosses'),{recursive:true});
for(const chapter of ['valley','sea','palace','snow']){
 const name=chapter+'-boss.json',source=await fs.readFile(path.join(root,'public/art/bosses',name));
 const packed=JSON.stringify({packageEncoding:'gzip-base64-v1',data:gzipSync(source,{level:9}).toString('base64')});
 await fs.writeFile(path.join(out,'art/bosses',name),packed);
 console.log(`Boss 无损打包 ${chapter}：${Math.ceil(source.length/1024)} → ${Math.ceil(Buffer.byteLength(packed)/1024)} KB`);
}
await fs.mkdir(path.join(out,'art/elites'),{recursive:true});
for(const name of await fs.readdir(path.join(out,'art/elites')))if(name.endsWith('.json'))await fs.unlink(path.join(out,'art/elites',name));
for(const name of await fs.readdir(path.join(root,'public/art/elites'))){
 if(name.endsWith('.png'))await fs.copyFile(path.join(root,'public/art/elites',name),path.join(out,'art/elites',name));
}
for(const chapter of ['sea','palace','snow']){
 const name=chapter+'-landscape.json',source=await fs.readFile(path.join(root,'public/art/chapters',name));
 const packed=JSON.stringify({packageEncoding:'gzip-base64-v1',data:gzipSync(source,{level:9}).toString('base64')});
 await fs.writeFile(path.join(out,'art/chapters',name),packed);
 console.log(`场景无损压缩 ${chapter}：${Math.ceil(source.length/1024)} → ${Math.ceil(Buffer.byteLength(packed)/1024)} KB`);
}
await fs.copyFile(path.join(root,'scripts/wechat-entry.js'),path.join(out,'game.js'));
const names=['sky','sun','far_mountains','valley','shrines','arena','foreground','branches'];
await fs.mkdir(path.join(out,'art/environment'),{recursive:true});
for(const name of ['atlas.json','atlas.png','ink-dragon-head-v2.png','ink-guardian-v1.png',...names.map(n=>'environment/'+n+'.png')])await fs.copyFile(path.join(root,'public/art',name),path.join(out,'art',name));
// The original menu scenery uses a compact palette; chapter vector art is unchanged.
for(const name of names)await sharp(path.join(root,'public/art/environment/'+name+'.png')).png({palette:true,colours:128,effort:10,dither:0}).toFile(path.join(out,'art/environment/'+name+'.png'));
await sharp(path.join(root,'public/art/atlas.png')).png({palette:true,colours:256,effort:10,dither:0}).toFile(path.join(out,'art/atlas.png'));
// Palette encoding preserves the existing dragon dimensions and transparency at game display size.
await sharp(path.join(root,'public/art/ink-dragon-head-v2.png')).png({palette:true,colours:256,effort:10,dither:0}).toFile(path.join(out,'art/ink-dragon-head-v2.png'));
await fs.writeFile(path.join(out,'game.json'),JSON.stringify({deviceOrientation:'portrait'},null,2)+'\n');
const projectPath=path.join(out,'project.config.json');
let existing={};
try{existing=JSON.parse(await fs.readFile(projectPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.writeFile(projectPath,JSON.stringify({description:'灵狐绘符 · 微信兼容性测试版',projectname:'linghu-draw',compileType:'game',appid:'touristappid',setting:{es6:false,minified:false,urlCheck:true},...existing},null,2)+'\n');
const files=[...['valley','sea','palace','snow'].map(n=>'art/bosses/'+n+'-boss.json'),'art/chapters/snow-landscape.json','art/chapters/sea-landscape.json','art/chapters/palace-landscape.json','game.js','runtime.js','game.json','project.config.json','art/atlas.json','art/atlas.png','art/ink-dragon-head-v2.png','art/ink-guardian-v1.png',...names.map(n=>'art/environment/'+n+'.png')];
for(const name of files)await fs.access(path.join(out,name));
async function packageFiles(dir){const entries=await fs.readdir(dir,{withFileTypes:true});const result=[];for(const entry of entries){const full=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await packageFiles(full));else if(entry.isFile())result.push({name:path.relative(out,full),bytes:(await fs.stat(full)).size});}return result;}
const packaged=await packageFiles(out),bytes=packaged.reduce((sum,file)=>sum+file.bytes,0),limit=4*1024*1024;
if(bytes>=limit){const largest=packaged.sort((a,b)=>b.bytes-a.bytes).slice(0,5).map(f=>`${f.name}: ${Math.ceil(f.bytes/1024)} KB`).join('\n');throw new Error(`微信源码包超出4MB限制：${Math.ceil(bytes/1024)} KB\n${largest}`);}
console.log(`微信测试包已生成：${out}\n完整目录大小：${(bytes/1024/1024).toFixed(2)} MB（${Math.ceil(bytes/1024)} KB / 4096 KB），余量 ${Math.floor((limit-bytes)/1024)} KB\n开发者工具选择“小游戏”，导入此目录。真机预览需填写自己的小游戏 AppID。`);
