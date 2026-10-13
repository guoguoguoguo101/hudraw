import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'wechat-game');
await fs.mkdir(out,{recursive:true});
// DevTools' real-device parser can reject optional chaining / nullish coalescing.
// Transpile dependencies as well as our source; don't rely on the IDE's ES6 switch.
await build({root,configFile:false,publicDir:false,define:{'import.meta.env.DEV':'false',navigator:'globalThis.navigator',performance:'globalThis.__LINGHU_CLOCK__',requestAnimationFrame:'globalThis.__LINGHU_REQUEST_FRAME__'},build:{outDir:out,emptyOutDir:false,target:'es2017',minify:'esbuild',lib:{entry:path.join(root,'src/wechat-main.ts'),name:'LinghuWechat',formats:['iife'],fileName:()=> 'runtime.js'}}});
await fs.copyFile(path.join(root,'scripts/wechat-entry.js'),path.join(out,'game.js'));
const names=['sky','sun','far_mountains','valley','shrines','arena','foreground','branches'];
await fs.mkdir(path.join(out,'art/environment'),{recursive:true});
for(const name of ['atlas.json','atlas.png',...names.map(n=>'environment/'+n+'.png')])await fs.copyFile(path.join(root,'public/art',name),path.join(out,'art',name));
await fs.writeFile(path.join(out,'game.json'),JSON.stringify({deviceOrientation:'portrait'},null,2)+'\n');
const projectPath=path.join(out,'project.config.json');
let existing={};
try{existing=JSON.parse(await fs.readFile(projectPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.writeFile(projectPath,JSON.stringify({description:'灵狐绘符 · 微信兼容性测试版',projectname:'linghu-draw',compileType:'game',appid:'touristappid',setting:{es6:false,minified:false,urlCheck:true},...existing},null,2)+'\n');
const files=['game.js','runtime.js','game.json','project.config.json','art/atlas.json','art/atlas.png',...names.map(n=>'art/environment/'+n+'.png')];
let bytes=0;for(const name of files)bytes+=(await fs.stat(path.join(out,name))).size;
console.log(`微信测试包已生成：${out}\n已生成文件总大小：${(bytes/1024/1024).toFixed(2)} MB\n开发者工具选择“小游戏”，导入此目录。真机预览需填写自己的小游戏 AppID。`);
