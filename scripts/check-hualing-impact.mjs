import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const folder='screenshots/hualing-impact';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`${new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173').origin}/?mode=hualing&qa=1`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__LINGHU__);
 const audio=await page.evaluate(async()=>{
  const {Synth}=await import('/src/audio/synth.ts');
  const results=[];
  for(const kind of ['paperHit','paperBreak']){
   const c=new OfflineAudioContext(1,24000,48000),s=new Synth(()=>c);
   // Offline contexts cannot resume; connect the same master chain explicitly.
   s.context=c;s.master=c.createGain();s.master.gain.value=.25;s.master.connect(c.destination);
   let sources=0;const original=c.createBufferSource.bind(c);c.createBufferSource=()=>{sources++;return original();};
   for(let i=0;i<30;i++)s.play(kind);
   const afterBurst=sources;s.mute(true);s.play(kind);const afterMute=sources;
   const buffer=await c.startRendering(),data=Array.from(buffer.getChannelData(0));
   results.push({kind,afterBurst,afterMute,peak:Math.max(...data.map(Math.abs)),energy:data.reduce((n,x)=>n+x*x,0),voices:s.paperVoices,data});
  }
  return results;
 });
 for(const result of audio){
  assert.equal(result.afterBurst,1,'dense simultaneous hits must coalesce');assert.equal(result.afterMute,1);
  assert.equal(result.voices,0,'voices must release after playback');assert.ok(result.peak>0&&result.peak<.1);assert.ok(result.energy>0);
  const wav=Buffer.alloc(44+result.data.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(96000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
  result.data.forEach((x,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),44+i*2));
  await writeFile(`${folder}/${result.kind}.wav`,wav);delete result.data;
 }
 assert.ok(audio[1].energy>audio[0].energy,'finisher should have a fuller tail');
 for(const dead of [false,true]){
  const camera=await page.evaluate(dead=>{
   const a=window.__LINGHU__;a.app.ticker.stop();a.input.cancel();a.action('restart');a.app.ticker.stop();a.game.director.disabled=true;a.game.enemies=[];a.game.hualing.frozen=true;a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;
   const e=a.game.spawn('ink',{x:360,y:555});e.speed=0;e.ai='Approach';
   a.view.update(a.game,a.input,0,60,0);a.game.damage(e,dead?e.hp:30);
   for(const event of a.game.drain())a.view.event(event);
   a.view.update(a.game,a.input,1/60,60,1/60);a.hualingUI.update(a.view.ui.footer.y);a.app.render();return {shake:a.view.shake,x:a.view.world.x,y:a.view.world.y};
  },dead);
  assert.deepEqual(camera,{shake:0,x:0,y:0},'hualing hits and kills must keep camera still');
  await page.screenshot({path:`${folder}/${dead?'kill':'hit'}-390.png`});
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${folder}/verification.json`,JSON.stringify({audio,errors},null,2));
 console.log('PASS impact: real hit/kill rendering; offline audio non-silent, unclipped, distinct energy; burst limiting, mute and voice cleanup');
}finally{await browser.close();}
