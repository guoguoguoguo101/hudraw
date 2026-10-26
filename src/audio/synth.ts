import {HualingMusic,type MusicScene} from './hualing-music';
import type {Sound} from '../platform/adapter';
export class Synth{
 private inkVoices=0;private lastInkBlock=-10;private wideVoices=0;
 private bossVoices=0;private lastBossMark=-10;
 private sprayNoise:AudioBuffer|null=null;private lastSpray=-Infinity;private sprayVoices=0;
 private electricNoise:AudioBuffer|null=null;private electricVoices=0;private lastElectricStroke=-Infinity;private lastElectricHit=-Infinity;
 private music:HualingMusic|null=null;private musicWanted=false;private musicScene:MusicScene='journey';
 setMusic(enabled:boolean,scene:MusicScene='journey'){this.musicWanted=enabled;this.musicScene=scene;this.syncMusic();}
 private syncMusic(){if(!this.context||!this.master)return;if(this.musicWanted&&!this.muted)this.music??=new HualingMusic(this.context,this.master);this.music?.setPlaying(this.musicWanted&&!this.muted,this.musicScene);}
 private paperNoise:AudioBuffer|null=null;private lastPaperHit=-Infinity;private lastPaperBreak=-Infinity;private paperVoices=0;
 constructor(private createContext:()=>AudioContext=()=>new AudioContext()){}
 context:AudioContext|null=null;master:GainNode|null=null;muted=false;
 unlock(){this.context??=this.createContext();if(!this.master){this.master=this.context.createGain();this.master.gain.value=this.muted?0:.25;this.master.connect(this.context.destination);}void this.context.resume();this.syncMusic();}
 mute(value:boolean){this.muted=value;if(this.master&&this.context)this.master.gain.setTargetAtTime(value?0:.25,this.context.currentTime,.08);this.syncMusic();}
 play(kind:Sound){if(!this.context||!this.master||this.muted)return;const c=this.context,now=c.currentTime;
 if(kind==='bossFlame'||kind==='bossWave'||kind==='bossStar'||kind==='bossFrost'||kind==='bossParry'){this.bossAttack(kind);return;}
 if(kind==='bossIntro'||kind==='bossMark'||kind==='bossBreak'||kind==='bossDanger'){this.bossSound(kind);return;}
 if(kind==='inkSeal'||kind==='inkSummon'||kind==='inkSlam'||kind==='inkBlock'){this.inkSound(kind);return;}
 if(kind==='wideCast'){this.wideSlash();return;}
 if(kind==='carpCast'||kind==='carpImpact'){this.carpSound(kind==='carpImpact');return;}
 if(kind==='spray'||kind==='sprayHigh'){this.spray(kind==='sprayHigh');return;}
 if(kind==='thunderOn'||kind==='thunderStroke'||kind==='thunderHit'){this.electric(kind);return;}
 if(kind==='paperHit'||kind==='paperBreak'){this.paperImpact(kind==='paperBreak');return;}
 const notes:Record<Exclude<Sound,'inkSeal'|'inkSummon'|'inkSlam'|'inkBlock'|'bossFlame'|'bossWave'|'bossStar'|'bossFrost'|'bossParry'|'bossIntro'|'bossMark'|'bossBreak'|'bossDanger'|'wideCast'|'carpCast'|'carpImpact'|'spray'|'sprayHigh'|'paperHit'|'paperBreak'|'thunderOn'|'thunderStroke'|'thunderHit'>,number[]>={line:[330,660],circle:[220,330,440],z:[587,880,1174],hit:[100,160],hurt:[110,82],win:[293.66,329.63,440,587.33,659.25],lose:[220,146,110],tap:[440],combo1:[392,440],combo2:[440,587],combo3:[587,659],combo4:[659,784]};
 const combo=kind.startsWith('combo');
 notes[kind].forEach((freq,i)=>{const t=now+i*(kind==='win'?.13:combo?.085:.035),o=c.createOscillator(),g=c.createGain();o.type=kind==='z'?'triangle':'sine';o.frequency.setValueAtTime(freq,t);if(kind==='hit'||kind==='hurt')o.frequency.exponentialRampToValueAtTime(freq*.5,t+.18);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(combo?.14:.45,t+(combo?.012:.008));g.gain.exponentialRampToValueAtTime(.001,t+(combo?.24:.45));o.connect(g);g.connect(this.master!);o.start(t);o.stop(t+(combo?.27:.5));o.onended=()=>{o.disconnect();g.disconnect();};});
 if(['line','circle','z','hit'].includes(kind)){const len=c.sampleRate*.17,buffer=c.createBuffer(1,len,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/len*6)*.13;const src=c.createBufferSource(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='z'?4800:1800;src.buffer=buffer;src.connect(filter);filter.connect(this.master);src.start(now);}
 }
 private inkSound(kind:'inkSeal'|'inkSummon'|'inkSlam'|'inkBlock'){
  const c=this.context!,now=c.currentTime,block=kind==='inkBlock';if(this.inkVoices>=3||block&&now-this.lastInkBlock<.12)return;if(block)this.lastInkBlock=now;this.inkVoices++;
  const duration=block?.22:kind==='inkSummon'?1.05:kind==='inkSlam'?.5:.7,base=block?390:kind==='inkSlam'?95:kind==='inkSummon'?82:146.8;
  for(let i=0;i<(block?2:3);i++){
   const o=c.createOscillator(),gain=c.createGain(),t=now+i*(block?.009:.025);o.type='sine';o.frequency.setValueAtTime(base*(i===0?1:i===1?1.5:2.002),t);o.frequency.exponentialRampToValueAtTime(base*(i===0?.6:i===1?1.45:1.98),t+duration);
   gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime((block?.07:kind==='inkSlam'?.4:.21)/(i+1),t+(kind==='inkSummon'?.12:.014));gain.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(gain);gain.connect(this.master!);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();gain.disconnect();if(i===0)this.inkVoices--;};
  }
 }
 private bossAttack(kind:'bossFlame'|'bossWave'|'bossStar'|'bossFrost'|'bossParry'){
  const c=this.context!,now=c.currentTime;if(this.bossVoices>=4)return;this.bossVoices++;
  const parry=kind==='bossParry',wave=kind==='bossWave',star=kind==='bossStar',frost=kind==='bossFrost',duration=parry?.4:wave?1.05:.72;
  if(!this.sprayNoise){this.sprayNoise=c.createBuffer(1,Math.ceil(c.sampleRate*1.1),c.sampleRate);const d=this.sprayNoise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const noise=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),tone=c.createOscillator(),toneGain=c.createGain();noise.buffer=this.sprayNoise;noise.loop=true;
  filter.type=frost?'highpass':star?'bandpass':'lowpass';filter.Q.value=star?3:.7;filter.frequency.setValueAtTime(parry?2800:wave?280:frost?3000:star?1500:1100,now);filter.frequency.exponentialRampToValueAtTime(parry?900:wave?1300:frost?800:star?180:140,now+duration);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(parry?.45:wave?.7:frost?.25:star?.45:.55,now+(parry?.008:.13));gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  noise.connect(filter);filter.connect(gain);gain.connect(this.master!);noise.start(now);noise.stop(now+duration+.02);
  tone.type=star||parry?'triangle':'sine';tone.frequency.setValueAtTime(parry?380:star?320:wave?65:90,now);tone.frequency.exponentialRampToValueAtTime(parry?760:star?80:42,now+duration);toneGain.gain.setValueAtTime(.001,now);toneGain.gain.linearRampToValueAtTime(.3,now+.02);toneGain.gain.exponentialRampToValueAtTime(.001,now+duration);tone.connect(toneGain);toneGain.connect(this.master!);tone.start(now);tone.stop(now+duration+.02);
  noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();this.bossVoices--;};tone.onended=()=>{tone.disconnect();toneGain.disconnect();};
 }
 private bossSound(kind:'bossIntro'|'bossMark'|'bossBreak'|'bossDanger'){
  const c=this.context!,now=c.currentTime,mark=kind==='bossMark';if(this.bossVoices>=4||mark&&now-this.lastBossMark<.11)return;if(mark)this.lastBossMark=now;this.bossVoices++;
  const duration=mark?.18:kind==='bossIntro'?.85:.43,frequencies=mark?[660,990]:kind==='bossBreak'?[160,320,640]:kind==='bossIntro'?[62,93,124]:[95,76];
  frequencies.forEach((frequency,i)=>{const oscillator=c.createOscillator(),gain=c.createGain(),start=now+i*.035;oscillator.type=mark?'sine':'triangle';oscillator.frequency.setValueAtTime(frequency,start);oscillator.frequency.exponentialRampToValueAtTime(frequency*(kind==='bossBreak'?1.4:mark?1:.55),start+duration);gain.gain.setValueAtTime(.001,start);gain.gain.linearRampToValueAtTime(mark?.075:.13,start+.018);gain.gain.exponentialRampToValueAtTime(.001,start+duration);oscillator.connect(gain);gain.connect(this.master!);oscillator.start(start);oscillator.stop(start+duration+.01);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();if(i===frequencies.length-1)this.bossVoices--;};});
 }
 private wideSlash(){
  const c=this.context!,now=c.currentTime,duration=.32;if(this.wideVoices>=4)return;this.wideVoices++;
  if(!this.paperNoise){this.paperNoise=c.createBuffer(1,Math.ceil(c.sampleRate*.38),c.sampleRate);const data=this.paperNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.paperNoise;
  filter.type='lowpass';filter.Q.value=.55;filter.frequency.setValueAtTime(550,now);filter.frequency.exponentialRampToValueAtTime(2400,now+.055);filter.frequency.exponentialRampToValueAtTime(260,now+duration);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.33,now+.025);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  source.connect(filter);filter.connect(gain);gain.connect(this.master!);source.start(now);source.stop(now+duration+.01);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.wideVoices--;};
  const tone=c.createOscillator(),body=c.createGain();tone.type='sine';tone.frequency.setValueAtTime(155,now);tone.frequency.exponentialRampToValueAtTime(55,now+.2);
  body.gain.setValueAtTime(.001,now);body.gain.linearRampToValueAtTime(.2,now+.012);body.gain.exponentialRampToValueAtTime(.001,now+.23);tone.connect(body);body.connect(this.master!);tone.start(now);tone.stop(now+.25);tone.onended=()=>{tone.disconnect();body.disconnect();};
 }
 private carpSound(impact:boolean){
  const c=this.context!,now=c.currentTime,duration=impact?.25:.32;
  if(!this.paperNoise){this.paperNoise=c.createBuffer(1,Math.ceil(c.sampleRate*.38),c.sampleRate);const data=this.paperNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.paperNoise;
  filter.type='lowpass';filter.Q.value=.7;filter.frequency.setValueAtTime(impact?1700:700,now);filter.frequency.exponentialRampToValueAtTime(impact?220:1600,now+duration*.55);filter.frequency.exponentialRampToValueAtTime(180,now+duration);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(impact?.3:.2,now+(impact?.008:.04));gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  source.connect(filter);filter.connect(gain);gain.connect(this.master!);source.start(now);source.stop(now+duration+.01);
  const tone=c.createOscillator(),body=c.createGain();tone.type='sine';tone.frequency.setValueAtTime(impact?115:175,now);tone.frequency.exponentialRampToValueAtTime(impact?48:90,now+duration);
  body.gain.setValueAtTime(.001,now);body.gain.linearRampToValueAtTime(.13,now+.01);body.gain.exponentialRampToValueAtTime(.001,now+duration);tone.connect(body);body.connect(this.master!);tone.start(now);tone.stop(now+duration+.01);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};tone.onended=()=>{tone.disconnect();body.disconnect();};
 }
 private spray(high:boolean){
  const c=this.context!,now=c.currentTime;if(now-this.lastSpray<.095||this.sprayVoices>=3)return;this.lastSpray=now;this.sprayVoices++;
  if(!this.sprayNoise){this.sprayNoise=c.createBuffer(1,Math.ceil(c.sampleRate*.2),c.sampleRate);const data=this.sprayNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.75+.25*Math.sin(i*.09));}
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.sprayNoise;
  filter.type='bandpass';filter.Q.value=.55;filter.frequency.setValueAtTime(high?1700:2100,now);filter.frequency.exponentialRampToValueAtTime(high?450:700,now+.075);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(high?.23:.14,now+.004);gain.gain.exponentialRampToValueAtTime(.001,now+.085);
  source.connect(filter);filter.connect(gain);gain.connect(this.master!);source.start(now);source.stop(now+.095);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.sprayVoices--;};
 }
 private electric(kind:'thunderOn'|'thunderStroke'|'thunderHit'){
  const c=this.context!,now=c.currentTime,stroke=kind==='thunderStroke',hit=kind==='thunderHit';
  if(this.electricVoices>=3||stroke&&now-this.lastElectricStroke<.14||hit&&now-this.lastElectricHit<.1)return;
  if(stroke)this.lastElectricStroke=now;if(hit)this.lastElectricHit=now;this.electricVoices++;
  if(!this.electricNoise){this.electricNoise=c.createBuffer(1,Math.ceil(c.sampleRate*.32),c.sampleRate);const data=this.electricNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.4+.6*Math.sin(i*.071)**8);}
  const duration=stroke?.095:hit?.14:.24,level=stroke?.065:hit?.12:.1;
  const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();src.buffer=this.electricNoise;
  filter.type='bandpass';filter.Q.value=.6;filter.frequency.setValueAtTime(stroke?1200:1800,now);filter.frequency.exponentialRampToValueAtTime(450,now+duration);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(level,now+.006);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  src.connect(filter);filter.connect(gain);gain.connect(this.master!);src.start(now);src.stop(now+duration+.01);
  const tone=c.createOscillator(),body=c.createGain();tone.type='sine';tone.frequency.setValueAtTime(stroke?190:hit?150:330,now);tone.frequency.exponentialRampToValueAtTime(stroke?120:hit?65:110,now+duration);
  body.gain.setValueAtTime(.001,now);body.gain.linearRampToValueAtTime(stroke?.035:.085,now+.008);body.gain.exponentialRampToValueAtTime(.001,now+duration);tone.connect(body);body.connect(this.master!);tone.start(now);tone.stop(now+duration+.015);
  src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};tone.onended=()=>{tone.disconnect();body.disconnect();this.electricVoices--;};
 }
 private paperImpact(dead:boolean){
  const c=this.context!,master=this.master!,now=c.currentTime;
  // Separate finishers from light cuts, while bounding sound density in crowds.
  if(this.paperVoices>=4||now-(dead?this.lastPaperBreak:this.lastPaperHit)<(dead?.11:.075))return;
  if(dead)this.lastPaperBreak=now;else this.lastPaperHit=now;
  this.paperVoices++;
  if(!this.paperNoise){this.paperNoise=c.createBuffer(1,Math.ceil(c.sampleRate*.38),c.sampleRate);const data=this.paperNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
  const pitch=.97+Math.random()*.06,duration=dead?.18:.09;
  const src=c.createBufferSource(),filter=c.createBiquadFilter(),tear=c.createGain();
  src.buffer=this.paperNoise;src.playbackRate.value=pitch;filter.type='lowpass';filter.Q.value=.45;
  filter.frequency.setValueAtTime(dead?1100:850,now);filter.frequency.exponentialRampToValueAtTime(dead?400:500,now+duration);
  tear.gain.setValueAtTime(.001,now);tear.gain.linearRampToValueAtTime(dead?.22:.13,now+.008);tear.gain.exponentialRampToValueAtTime(.001,now+duration);
  src.connect(filter);filter.connect(tear);tear.connect(master);src.start(now);src.stop(now+duration+.01);
  const body=c.createOscillator(),thump=c.createGain();body.type='sine';body.frequency.setValueAtTime((dead?165:220)*pitch,now);body.frequency.exponentialRampToValueAtTime((dead?145:200)*pitch,now+duration);
  thump.gain.setValueAtTime(.001,now);thump.gain.linearRampToValueAtTime(dead?.28:.18,now+.007);thump.gain.exponentialRampToValueAtTime(.001,now+(dead?.16:.075));
  body.connect(thump);thump.connect(master);body.start(now);body.stop(now+duration+.02);
  src.onended=()=>{src.disconnect();filter.disconnect();tear.disconnect();};
  body.onended=()=>{body.disconnect();thump.disconnect();this.paperVoices--;};
 }
}
