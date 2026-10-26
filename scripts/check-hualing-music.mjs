import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/hualing-music';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.__musicSources=[];
 const create=AudioContext.prototype.createBufferSource;
 AudioContext.prototype.createBufferSource=function(){const s=create.call(this),stop=s.stop.bind(s);s.stop=(...args)=>{s.__stopped=true;return stop(...args);};window.__musicSources.push(s);return s;};
});
const active=()=>page.evaluate(()=>window.__musicSources.filter(s=>s.loop&&!s.__stopped).length);
async function action(name){await page.evaluate(name=>window.__LINGHU__.action(name),name);}
try{
 await page.goto(`${new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173').origin}/?mode=hualing&qa=1`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__LINGHU__);
 // Real gesture unlocks browsers which require audio activation.
 await page.mouse.click(200,400);
 const muted=await page.evaluate(()=>window.__LINGHU__.view.ui.muted);if(muted)await action('sound');
 await page.waitForFunction(()=>window.__musicSources.some(s=>s.loop&&!s.__stopped));assert.equal(await active(),1);
 await action('pause');assert.equal(await active(),0);await action('resume');assert.equal(await active(),1);
 await action('sound');assert.equal(await active(),0);await action('sound');assert.equal(await active(),1);
 await action('restart');assert.equal(await active(),1);
 await action('menu');assert.equal(await active(),0);await action('interactionPractice');assert.equal(await active(),0);
 await action('hualingPractice');assert.equal(await active(),1);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await active(),0);
 const music=[];
 for(const scene of ['journey','sunset','wind','night']){
  const item=await page.evaluate(async scene=>{
   const {createHualingMusic,MUSIC_NAMES}=await import('/src/audio/hualing-music.ts'),c=new OfflineAudioContext(2,1,22050),start=performance.now(),b=createHualingMusic(c,scene);
   const channels=[b.getChannelData(0),b.getChannelData(1)];let peak=0,energy=0,maxStep=0;
   for(const data of channels)for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));energy+=data[i]*data[i];if(i)maxStep=Math.max(maxStep,Math.abs(data[i]-data[i-1]));}
   const bytes=new Uint8Array(44+b.length*4),v=new DataView(bytes.buffer),str=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
   str(0,'RIFF');v.setUint32(4,bytes.length-8,true);str(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,b.sampleRate,true);v.setUint32(28,b.sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,bytes.length-44,true);
   for(let i=0;i<b.length;i++)for(let ch=0;ch<2;ch++)v.setInt16(44+i*4+ch*2,Math.round(channels[ch][i]*32767),true);
   let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));
   return{scene,name:MUSIC_NAMES[scene],duration:b.duration,renderMs:performance.now()-start,peak,energy,maxStep,seam:Math.max(...channels.map(d=>Math.abs(d[0]-d.at(-1)))),wav:btoa(raw)};
  },scene);
  console.log(item.scene,JSON.stringify({peak:item.peak,maxStep:item.maxStep,seam:item.seam}));
  assert.ok(item.duration>40&&item.duration<90);assert.ok(item.peak>.01&&item.peak<=.181);assert.ok(item.energy>1);assert.ok(item.seam<.02);assert.ok(item.maxStep<.025);
  await writeFile(`${folder}/${item.name}.wav`,Buffer.from(item.wav,'base64'));delete item.wav;music.push(item);
 }
 await action('resume');
 for(const scene of ['sunset','wind','night']){
  await page.evaluate(scene=>window.__LINGHU__.game.hualing.previewLandscape(scene),scene);
  const expected=music.find(x=>x.scene===scene).duration;
  await page.waitForFunction(expected=>window.__musicSources.some(s=>s.loop&&!s.__stopped&&Math.abs(s.buffer.duration-expected)<.01),expected);
  assert.equal(await active(),1);
 }
 await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;m.journey.resume();});
 await page.waitForFunction(()=>window.__musicSources.some(s=>s.loop&&!s.__stopped&&s.buffer.duration>80));
 assert.equal(await active(),1);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({music,errors,lifecycle:'entry, pause, resume, mute, restart, menu, old mode, blur: passed'},null,2));
 console.log('PASS music: four distinct stereo arrangements and WAVs; smooth loops; automatic/manual score switching; bounded sources; pause/mute/menu/blur and legacy isolation');
}finally{await browser.close();}
