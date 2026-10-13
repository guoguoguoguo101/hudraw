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
 await tap(647,87,'header');await tap(360,880);await tap(360,1157);
 const beforePractice=await page.evaluate(()=>globalThis.__wxStorage.get('linghu-player-progress-v1'));
 await tap(105,1204,'footer');
 await fs.mkdir(path.resolve('screenshots/practice'),{recursive:true});
 await page.screenshot({path:path.resolve('screenshots/practice/level-picker.png')});
 await tap(596,1050,'footer');
 for(const [x,levelX] of [[275,596],[445,581],[615,581]]){await tap(x,1204,'footer');await tap(levelX,1050,'footer');}
 for(const x of [105,275,445,615])await tap(x,1242,'footer');
 await page.evaluate(()=>{
  const send=(name,x)=>{const s=390/720,touch={identifier:1,clientX:x*s,clientY:(844-1280*s)/2+580*s};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  send('TouchStart',230);for(let i=1;i<=12;i++)send('TouchMove',230+i*220/12);send('TouchEnd',450);
 });
 await page.waitForTimeout(300);
 await page.screenshot({path:path.resolve('screenshots/practice/free-cast.png')});
 // The same canvas tuning controls must work without browser DOM widgets.
 await tap(596,1101,'footer');await tap(438,320);
 assert.equal(await page.evaluate(()=>globalThis.__wxStorage.get('linghu-brush-skin')),'gold');
 await tap(360,375);await tap(623,496);
 await fs.mkdir(path.resolve('screenshots/spirit-pen'),{recursive:true});
 await page.screenshot({path:path.resolve('screenshots/spirit-pen/wechat-effect-controls.png')});
 await tap(628,221);
 await page.evaluate(()=>{
  const scale=390/720,offset=(844-1280*scale)/2;
  const send=(name,x,y)=>{const touch={identifier:1,clientX:x*scale,clientY:offset+y*scale};for(const fn of globalThis.__wxListeners[name])fn({touches:[touch],changedTouches:[touch]});};
  send('TouchStart',150,520);for(let i=1;i<60;i++){const t=i/59;send('TouchMove',150+t*370,520+Math.sin(t*Math.PI*2)*80);}send('TouchEnd',520,520);
 });
 await page.waitForTimeout(140);await page.screenshot({path:path.resolve('screenshots/spirit-pen/wechat-failure-clean.png')});
 await tap(647,87,'header');await tap(360,543);
 const diagnostic=JSON.parse(await page.evaluate(()=>globalThis.__diagnosticReport));
 if(diagnostic.glError!==0)console.error(JSON.stringify(diagnostic));
 assert.equal(diagnostic.build,'ios-diagnostics-4');assert.equal(diagnostic.clock,'monotonic-ms');assert.ok(diagnostic.gameplay.frames>0);assert.ok(diagnostic.gameplay.fps>0&&diagnostic.gameplay.fps<200);assert.ok(diagnostic.gameplay.maxFrameMs<1000);assert.equal(diagnostic.gameplay.unfinishedUpdates,0,'paused report must contain completed updates');assert.ok(diagnostic.totalFrames>=diagnostic.gameplay.frames);assert.ok(diagnostic.actions.some(a=>a.action==='practice'&&a.state==='playing'));assert.equal(diagnostic.renderer.webGLVersion,1);assert.equal(diagnostic.glError,0,'WebGL1 rendering must not produce INVALID_ENUM');assert.deepEqual(diagnostic.glErrors,[]);
 assert.equal(await page.evaluate(()=>globalThis.__wxStorage.get('linghu-player-progress-v1')),beforePractice,'practice must not change saved progress');
 assert.deepEqual(errors,[],'brush controls and failed glyph fade must not cause runtime errors');
 assert.deepEqual(errors,[]);
 console.log('PASS: WeChat package startup without unsafe-eval, rendering, normal cast, practice entry and four level pickers, free cast and progress isolation (browser-backed wx mock only)');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
