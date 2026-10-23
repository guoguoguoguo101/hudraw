// Browser-backed wx mock: checks the actual package startup and rendering, not real WeChat compatibility.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';

const root=path.resolve('wechat-game');
const server=http.createServer(async(req,res)=>{
 // Match WeChat's ban on dynamically compiled JavaScript (no unsafe-eval).
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self'");
 try{
  if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<html><head><meta charset="utf-8"></head><body style="margin:0"><script src="/game.js"></script></body></html>');return;}
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1),file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.png')?'image/png':'application/json; charset=utf-8');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
 page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')console.error(message.text());});
 await page.addInitScript(()=>{
  // Emulate native microsecond Performance and a frame timestamp from another origin.
  const nativeNow=performance.now.bind(performance),nativeFrame=requestAnimationFrame.bind(globalThis);
  const upload=WebGLRenderingContext.prototype.bufferSubData;
  WebGLRenderingContext.prototype.bufferSubData=function(...args){if(args.length!==3)throw new Error('native WebGL1 supports only three bufferSubData arguments');return upload.apply(this,args);};
  Object.defineProperty(globalThis,'performance',{value:{now:()=>nativeNow()*1000},configurable:true});
  globalThis.requestAnimationFrame=callback=>nativeFrame(stamp=>callback(stamp*1000+987654321));
  // Reproduce missing globals/methods before Pixi's module initialization.
  globalThis.Intl=undefined;Array.prototype.at=undefined;
  Object.defineProperty(globalThis,'navigator',{value:undefined,writable:true,configurable:true});
  globalThis.__browserEvents={add:globalThis.addEventListener,remove:globalThis.removeEventListener};
  Object.defineProperty(globalThis,'addEventListener',{value:undefined,writable:true,configurable:true});
  Object.defineProperty(globalThis,'removeEventListener',{value:undefined,writable:true,configurable:true});
  globalThis.GameGlobal=globalThis;
  globalThis.require=path=>{const script=document.createElement('script');script.src='/'+path.replace(/^\.\//,'');document.body.appendChild(script);};
  const listeners={},storage=new Map();let first=true;
  globalThis.__wxListeners=listeners;globalThis.__wxStorage=storage;globalThis.__wxReady=false;
  const info=console.info.bind(console);console.info=(...args)=>{if(String(args[0]).includes('启动完成'))globalThis.__wxReady=true;info(...args);};
  globalThis.wx={
   createCanvas:()=>{const c=document.createElement('canvas');if(first){first=false;document.body.appendChild(c);c.style.width='390px';c.style.height='844px';}return c;},
   createImage:()=>new Image(),getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:1}),getDeviceInfo:()=>({platform:'ios',system:'test',model:'test'}),
   getFileSystemManager:()=>({readFile:({filePath,success,fail})=>fetch('/'+filePath).then(async response=>{if(!response.ok)throw new Error(filePath);success({data:await response.text()});}).catch(fail)}),
   getStorageSync:key=>storage.get(key),setStorageSync:(key,value)=>storage.set(key,value),
   showModal:options=>{globalThis.__wxError=options.content;},
   setClipboardData:options=>{globalThis.__diagnosticReport=options.data;options.success();},
   ...Object.fromEntries(['TouchStart','TouchMove','TouchEnd','TouchCancel','Hide','Show','WindowResize'].flatMap(name=>[
    ['on'+name,fn=>(listeners[name]??=[]).push(fn)],['off'+name,fn=>{listeners[name]=listeners[name].filter(x=>x!==fn);}]
   ])),
  };
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 // Poll without Playwright's injected listeners while browser event APIs are absent.
 const started=await page.evaluate(()=>new Promise(resolve=>{
  const deadline=Date.now()+20000;
  const poll=()=>{if(globalThis.__wxReady||globalThis.__wxError||Date.now()>deadline){
   // Restore only after initialization, for the automation framework's screenshot helpers.
   globalThis.addEventListener=globalThis.__browserEvents.add;globalThis.removeEventListener=globalThis.__browserEvents.remove;
   resolve(globalThis.__wxReady||Boolean(globalThis.__wxError));
  }else setTimeout(poll,25);};poll();
 }));
 assert.equal(started,true,'startup timed out without browser event APIs');
 assert.equal(await page.evaluate(()=>globalThis.__wxError),undefined);
 const touch=async(name,x,y)=>page.evaluate(({name,x,y})=>{
  const s=390/720,touch={identifier:1,clientX:x*s,clientY:(844-1280*s)/2+y*s};
  for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});
 },{name,x,y});
 await touch('TouchStart',360,838);await touch('TouchEnd',360,838);
 // The game refreshes menu hit zones during its next frame.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 // Deliver one stroke together so slow software WebGL cannot exceed the draw timeout between automation calls.
 await page.evaluate(()=>{
  const send=(name,x)=>{const s=390/720,touch={identifier:1,clientX:x*s,clientY:(844-1280*s)/2+580*s};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  send('TouchStart',230);for(let i=1;i<=12;i++)send('TouchMove',230+i*220/12);send('TouchEnd',450);
 });
 await page.waitForTimeout(300);
 const progress=await page.evaluate(()=>JSON.parse(globalThis.__wxStorage.get('linghu-player-progress-v1')));
 assert.deepEqual(errors,[]);
 assert.equal(progress.stats.totalRuns,1);assert.equal(progress.spells.line?.casts,1,JSON.stringify(progress.stats));
 await fs.mkdir(path.resolve('screenshots/layout'),{recursive:true});
 await page.screenshot({path:path.resolve('screenshots/layout/fullscreen-battle.png')});
 const edgeOffset=(844-1280*(390/720))/2/(390/720);
 const tap=async(x,y,anchor='world')=>{y+=anchor==='header'?-edgeOffset:anchor==='footer'?edgeOffset:0;await touch('TouchStart',x,y);await touch('TouchEnd',x,y);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
 await tap(647,87,'header');await tap(360,880);await tap(360,1137);
 await fs.mkdir(path.resolve('screenshots/hualing'),{recursive:true});
 for(let i=0;i<5;i++){
  await tap(436,1228,'footer');await tap(96+i*132,1090,'footer');
  await page.screenshot({path:path.resolve(`screenshots/hualing/wechat-guide-${i}.png`)});
  await tap(110,1228,'footer');await page.waitForTimeout(i===1?400:750);
  await page.screenshot({path:path.resolve(`screenshots/hualing/wechat-effect-${i}.png`)});
 }
 await tap(647,87,'header');await tap(360,880);await tap(246,1207);
 const beforePractice=await page.evaluate(()=>globalThis.__wxStorage.get('linghu-player-progress-v1'));
 // Exercise functional relics in the production interaction-practice scene via wx touches.
 await tap(647,87,'header');await tap(360,880);await tap(474,1207);

 // New level-one companion uses a native drag from the dedicated tiger card.
 await touch('TouchStart',90,815+edgeOffset);await touch('TouchMove',360,580);await touch('TouchEnd',360,580);
 await page.waitForTimeout(200);await fs.mkdir(path.resolve('screenshots/paper-tiger'),{recursive:true});
 await page.screenshot({path:path.resolve('screenshots/paper-tiger/wechat-unfold.png')});
 await page.waitForTimeout(750);await page.screenshot({path:path.resolve('screenshots/paper-tiger/wechat-hunting.png')});
 await tap(625,905,'footer');
 await fs.mkdir(path.resolve('screenshots/functional-relics'),{recursive:true});
 await touch('TouchStart',100,919+edgeOffset);await touch('TouchMove',520,500);await touch('TouchEnd',520,500);await page.waitForTimeout(180);await page.screenshot({path:path.resolve('screenshots/functional-relics/wechat-lantern.png')});
 await tap(625,905,'footer');
 const relicSharp=(await import('sharp')).default;
 const stopBadgePixels=async()=>{const {data,info}=await relicSharp(await page.screenshot()).raw().toBuffer({resolveWithObject:true});let n=0;for(let y=127;y<172;y++)for(let x=140;x<250;x++){const i=(y*info.width+x)*info.channels;if(data[i]<65&&data[i+2]>data[i]*1.15)n++;}return n;};
 const beforeStopBadge=await stopBadgePixels();await tap(243,919,'footer');await page.waitForTimeout(100);assert.ok(await stopBadgePixels()>beforeStopBadge+200,'wx hourglass should render its blue countdown badge');await page.screenshot({path:path.resolve('screenshots/functional-relics/wechat-stop.png')});
 await tap(625,905,'footer');
 await tap(565,959,'footer');await page.waitForTimeout(360);await page.screenshot({path:path.resolve('screenshots/functional-relics/wechat-rescue.png')});
 await tap(615,294);await tap(360,543);const rescueDiagnostic=JSON.parse(await page.evaluate(()=>globalThis.__diagnosticReport));assert.equal(rescueDiagnostic.actions.filter(a=>a.action==='pause:before').at(-1).state,'reviving');assert.equal(rescueDiagnostic.glError,0);
 await tap(360,609);await page.evaluate(()=>{
  const scale=390/720,offset=(844-1280*scale)/2,send=(name,x,y)=>{const touch={identifier:1,clientX:x*scale,clientY:offset+y*scale};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  for(const [a,b] of [[{x:255,y:505},{x:465,y:505}],[{x:360,y:445},{x:360,y:655}]]){send('TouchStart',a.x,a.y);for(let i=1;i<=12;i++)send('TouchMove',a.x+(b.x-a.x)*i/12,a.y+(b.y-a.y)*i/12);send('TouchEnd',b.x,b.y);}
 });await page.waitForTimeout(120);await page.screenshot({path:path.resolve('screenshots/functional-relics/wechat-revived.png')});
 await tap(647,87,'header');await tap(360,543);const revivedDiagnostic=JSON.parse(await page.evaluate(()=>globalThis.__diagnosticReport));assert.equal(revivedDiagnostic.actions.filter(a=>a.action==='pause:before').at(-1).state,'playing');assert.equal(revivedDiagnostic.glError,0);await tap(360,609);await tap(625,905,'footer');

 await tap(647,87,'header');await tap(360,880);await tap(246,1207);
 await tap(106,1120,'footer');
 await fs.mkdir(path.resolve('screenshots/practice'),{recursive:true});
 await page.screenshot({path:path.resolve('screenshots/practice/level-picker.png')});
 await tap(596,930,'footer');
 for(const [x,y,levelX] of [[278,1120,596],[450,1120,581],[622,1120,581],[106,1202,581],[278,1202,581],[450,1202,581]]){await tap(x,y,'footer');await tap(levelX,930,'footer');}
 for(const [x,y] of [[106,1158],[278,1158],[450,1158],[622,1158],[106,1240],[278,1240],[450,1240]])await tap(x,y,'footer');
 await page.evaluate(()=>{
  const send=(name,x)=>{const s=390/720,touch={identifier:1,clientX:x*s,clientY:(844-1280*s)/2+580*s};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  send('TouchStart',230);for(let i=1;i<=12;i++)send('TouchMove',230+i*220/12);send('TouchEnd',450);
 });
 await page.waitForTimeout(300);
 await page.screenshot({path:path.resolve('screenshots/practice/free-cast.png')});
 // The same canvas tuning controls must work without browser DOM widgets.
 await tap(596,1027,'footer');await tap(438,320);
 assert.equal(await page.evaluate(()=>globalThis.__wxStorage.get('linghu-brush-skin')),'gold');
 await tap(360,375);await tap(623,496);
 await fs.mkdir(path.resolve('screenshots/spirit-pen'),{recursive:true});
 await page.screenshot({path:path.resolve('screenshots/spirit-pen/wechat-effect-controls.png')});
 await tap(628,221);
 await page.evaluate(()=>{
  const scale=390/720,offset=(844-1280*scale)/2;
  const send=(name,x,y)=>{const touch={identifier:1,clientX:x*scale,clientY:offset+y*scale};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  send('TouchStart',150,520);for(let i=1;i<60;i++){const t=i/59;send('TouchMove',i%2?520:150,520+i%3*5);}send('TouchEnd',520,520);
 });
 await page.waitForTimeout(140);await page.screenshot({path:path.resolve('screenshots/spirit-pen/wechat-failure-clean.png')});
 await tap(647,87,'header');await tap(360,543);
 const diagnostic=JSON.parse(await page.evaluate(()=>globalThis.__diagnosticReport));
 if(diagnostic.glError!==0)console.error(JSON.stringify(diagnostic));
 assert.equal(diagnostic.build,'ios-diagnostics-4');assert.equal(diagnostic.clock,'monotonic-ms');assert.ok(diagnostic.gameplay.frames>0);assert.ok(diagnostic.gameplay.fps>0&&diagnostic.gameplay.fps<200);assert.ok(diagnostic.gameplay.maxFrameMs<1000);assert.equal(diagnostic.gameplay.unfinishedUpdates,0,'paused report must contain completed updates');assert.ok(diagnostic.totalFrames>=diagnostic.gameplay.frames);assert.ok([...diagnostic.actions,...rescueDiagnostic.actions].some(a=>a.action==='practice'&&a.state==='playing'));assert.equal(diagnostic.renderer.webGLVersion,1);assert.equal(diagnostic.glError,0,'WebGL1 rendering must not produce INVALID_ENUM');assert.deepEqual(diagnostic.glErrors,[]);
 assert.equal(await page.evaluate(()=>globalThis.__wxStorage.get('linghu-player-progress-v1')),beforePractice,'practice must not change saved progress');
 assert.deepEqual(errors,[],'brush controls and failed glyph fade must not cause runtime errors');
 assert.deepEqual(errors,[]);
 // Exercise the new production entry through native-style touches as well.
 await tap(360,880);await tap(474,1207);
 await page.evaluate(()=>{
  const scale=390/720,offset=(844-1280*scale)/2;
  const send=(name,x,y)=>{const touch={identifier:1,clientX:x*scale,clientY:offset+y*scale};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  for(const [a,b] of [[{x:180,y:650},{x:540,y:650}],[{x:250,y:720},{x:360,y:390}],[{x:360,y:390},{x:470,y:720}]]){
   send('TouchStart',a.x,a.y);for(let i=1;i<=24;i++)send('TouchMove',a.x+(b.x-a.x)*i/24,a.y+(b.y-a.y)*i/24);send('TouchEnd',b.x,b.y);
  }
 });
 await page.waitForTimeout(230);await fs.mkdir(path.resolve('screenshots/line-interactions'),{recursive:true});await page.screenshot({path:path.resolve('screenshots/line-interactions/wechat-window.png')});
 // A disabled arc must become a fallback only in the interaction scene.
 await page.evaluate(()=>{
  const scale=390/720,offset=(844-1280*scale)/2;
  const send=(name,x,y)=>{const touch={identifier:1,clientX:x*scale,clientY:offset+y*scale};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  for(let i=0;i<=44;i++){const angle=-Math.PI/2+i/44*Math.PI,x=360+Math.cos(angle)*120,y=600+Math.sin(angle)*120;send(i===0?'TouchStart':'TouchMove',x,y);}
  send('TouchEnd',360,720);
 });
 await page.waitForTimeout(140);await fs.mkdir(path.resolve('screenshots/fallback-slash'),{recursive:true});await page.screenshot({path:path.resolve('screenshots/fallback-slash/wechat-fallback.png')});
 // Equip four real brush buttons, then draw each style through wx touch events.
 const sharp=(await import('sharp')).default;
 await fs.mkdir(path.resolve('screenshots/burning-sea'),{recursive:true});
 const countTheme=async(color)=>{const {data,info}=await sharp(await page.screenshot()).raw().toBuffer({resolveWithObject:true});let count=0;const r=color>>16,g=color>>8&255,b=color&255;for(let y=400;y<640;y++)for(let x=35;x<355;x++){const i=(y*info.width+x)*info.channels;if(Math.abs(data[i]-r)<22&&Math.abs(data[i+1]-g)<22&&Math.abs(data[i+2]-b)<22)count++;}return count;};
 const brushResults=[];
 for(const [index,id,color] of [[0,'cinnabar',0xaf292d],[1,'fox',0x287969],[2,'gold',0xe5c67d],[3,'mountain',0x394b53]]){
  await tap(410,1027,'footer');await tap(596,1027,'footer');await tap(122+index*158,320);await tap(629,221);
  const before=await countTheme(color);await tap(580,1202,'footer');
  await page.evaluate(()=>{
   const scale=390/720,offset=(844-1280*scale)/2;
   const send=(name,x,y)=>{const touch={identifier:1,clientX:x*scale,clientY:offset+y*scale};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
   for(const y of [700,830]){send('TouchStart',140,y);for(let i=1;i<=35;i++)send('TouchMove',140+i*12,y+Math.sin(i/5)*30);send('TouchEnd',560,y+Math.sin(7)*30);}
  });
  await page.waitForTimeout(180);const after=await countTheme(color);assert.ok(after>before+40,`native ${id} brush should visibly paint its own palette: ${before} -> ${after}`);brushResults.push({id,before,after});
  await page.screenshot({path:path.resolve('screenshots/burning-sea/wechat-'+id+'.png')});
  if(id==='cinnabar')await page.screenshot({path:path.resolve('screenshots/burning-sea/wechat-fire.png')});
 }
 await fs.writeFile(path.resolve('screenshots/burning-sea/wechat-four-brushes.json'),JSON.stringify(brushResults,null,2));
 // The last four-second drawing now holds every trail until one common blast.
 await page.waitForTimeout(3800);await page.screenshot({path:path.resolve('screenshots/burning-sea/wechat-charging.png')});
 await page.waitForTimeout(1900);await page.screenshot({path:path.resolve('screenshots/burning-sea/wechat-explosion.png')});
 await page.waitForTimeout(1000);

 await tap(647,87,'header');await tap(360,543);
 const interactionDiagnostic=JSON.parse(await page.evaluate(()=>globalThis.__diagnosticReport));
 assert.ok(interactionDiagnostic.actions.some(a=>a.action==='interactionPractice'&&a.state==='playing'));
 assert.equal(interactionDiagnostic.glError,0);assert.equal(interactionDiagnostic.gameplay.unfinishedUpdates,0);
 assert.ok(interactionDiagnostic.gameplay.last.fallbacks>=1,'native-style arc touch produces the experimental fallback');
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>globalThis.__wxStorage.get('linghu-player-progress-v1')),beforePractice);
 console.log('PASS: WeChat package startup without unsafe-eval, rendering, normal cast, old practice levels, new interaction entry/three touch slashes, curved fallback, functional lantern/stop/rescue, paper tiger summon/hunt, four brush buttons and four distinct burning-sea palettes, shared charge and explosion, free cast and progress isolation (browser-backed wx mock only)');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
