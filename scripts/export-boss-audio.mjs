import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output='assets/audio/chapter-bosses';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();
const kinds=['bossFlame','bossWave','bossStar','bossFrost','bossParry'],rate=22050,previews=[];
function wav(pcm){const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?qa=1&mode=hualing`,{waitUntil:'domcontentloaded'});
 for(const kind of kinds){
  const result=await page.evaluate(async({kind,rate})=>{
   const {Synth}=await import('/src/audio/synth.ts'),context=new OfflineAudioContext(1,Math.ceil(rate*1.4),rate),synth=new Synth();synth.context=context;synth.master=context.createGain();synth.master.gain.value=.65;synth.master.connect(context.destination);synth.play(kind);
   const rendered=await context.startRendering(),data=rendered.getChannelData(0);let peak=0,energy=0;const pcm=new Uint8Array(data.length*2),view=new DataView(pcm.buffer);
   for(let i=0;i<data.length;i++){if(!Number.isFinite(data[i]))throw Error('nonfinite audio');peak=Math.max(peak,Math.abs(data[i]));energy+=data[i]*data[i];view.setInt16(i*2,Math.round(Math.max(-1,Math.min(1,data[i]))*32767),true);}
   let binary='';for(let i=0;i<pcm.length;i+=8192)binary+=String.fromCharCode(...pcm.subarray(i,i+8192));return {base64:btoa(binary),peak,rms:Math.sqrt(energy/data.length),voices:synth.bossVoices};
  },{kind,rate});
  assert.ok(result.peak>.01&&result.peak<.99&&result.rms>.001,kind+' audible without clipping');assert.equal(result.voices,0,kind+' releases audio nodes');
  const pcm=Buffer.from(result.base64,'base64');await writeFile(`${output}/${kind}.wav`,wav(pcm));previews.push(pcm);console.log('PASS rendered '+kind+' peak='+result.peak.toFixed(3)+' rms='+result.rms.toFixed(3));
 }
 await writeFile(`${output}/boss-sounds-preview.wav`,wav(Buffer.concat(previews)));
 await writeFile(`${output}/README.md`,'# 画灵 Boss 音效\n\n程序合成，直接使用当前游戏 Synth 的相同声源离线导出。合集顺序：日火燃爆 → 巨浪拍卷 → 星束贯穿 → 寒风碎冰 → 反制回弹。每段 1.4 秒。\n\n游戏在蓄势、实际发射、反制和受击事件分别触发对应声音，遵守静音设置并限制并发。WAV 为试听与存档，运行时使用程序合成，不加载这些文件。生成脚本：scripts/export-boss-audio.mjs。试听导出增益 0.65，游戏总线默认 0.25。\n');
}finally{await browser.close();}
