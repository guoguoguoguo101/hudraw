/** Original pentatonic scene scores. Rendered once, with circular reverb tails. */
export type MusicScene='journey'|'sunset'|'wind'|'night';
export const MUSIC_NAMES:Record<MusicScene,string>={journey:'山河流转',sunset:'丹霞归舟',wind:'风过千山',night:'月下听溪'};
export const MUSIC_BPM=72;
export const MUSIC_SECONDS=64*60/MUSIC_BPM;
type Instrument='pluck'|'flute'|'bell'|'bass'|'pad'|'drum';
type Section={scene:Exclude<MusicScene,'journey'>;bars:number};
const BPM={sunset:72,wind:86,night:60};
const hz=(midi:number)=>440*2**((midi-69)/12);
const MELODIES={
 sunset:[[62,66,69,71],[69,66,64,-1],[66,69,74,71],[69,66,62,-1],[64,66,69,66],[64,62,59,-1],[62,66,64,69],[66,64,62,-1]],
 wind:[[69,71,74,76],[74,71,69,66],[71,74,78,76],[74,69,71,-1],[66,69,71,74],[76,74,71,69],[71,66,69,64],[66,64,62,-1]],
 night:[[74,-1,71,69],[66,69,71,-1],[69,-1,66,64],[62,66,64,-1],[71,69,66,-1],[64,66,69,71],[69,-1,64,66],[64,62,-1,-1]],
};
const ROOTS={sunset:[50,50,47,47,43,43,45,50],wind:[50,47,43,45,50,47,43,45],night:[47,43,50,45,47,43,45,50]};
export function createHualingMusic(context:BaseAudioContext,scene:MusicScene='sunset'){
 const sections:Section[]=scene==='journey'?[{scene:'sunset',bars:8},{scene:'wind',bars:8},{scene:'night',bars:8}]:[{scene,bars:16}];
 const rate=22050,seconds=sections.reduce((n,s)=>n+s.bars*4*60/BPM[s.scene],0),length=Math.round(seconds*rate);
 const buffer=context.createBuffer(2,length,rate),left=buffer.getChannelData(0),right=buffer.getChannelData(1);
 const add=(frame:number,value:number,pan:number)=>{const i=((frame%length)+length)%length;left[i]+=value*Math.sqrt((1-pan)/2);right[i]+=value*Math.sqrt((1+pan)/2);};
 const note=(at:number,midi:number,volume:number,pan:number,instrument:Instrument,life=2.3)=>{
  const f=hz(midi),start=Math.round(at*rate),echo=Math.round((instrument==='flute'?.31:.23)*rate);
  for(let i=0;i<life*rate;i++){
   const t=i/rate,phase=2*Math.PI*f*t,fade=Math.min(1,(life-t)/.08);let v=0;
   if(instrument==='pluck')v=(1-Math.exp(-t*150))*(Math.sin(phase)*Math.exp(-t*2)+.3*Math.sin(phase*2.001)*Math.exp(-t*4.5)+.1*Math.sin(phase*3.003)*Math.exp(-t*7));
   if(instrument==='flute'){const env=Math.min(1,t/.13)*Math.min(1,(life-t)/.3);v=env*(Math.sin(phase+.025*Math.sin(t*30))+.12*Math.sin(phase*2))*.65;}
   if(instrument==='bell')v=(1-Math.exp(-t*85))*Math.exp(-t*2.5)*(Math.sin(phase)+.15*Math.sin(phase*3)+.04*Math.sin(phase*5));
   if(instrument==='bass')v=(1-Math.exp(-t*35))*Math.exp(-t*1.3)*(Math.sin(phase)+.15*Math.sin(phase*2));
   if(instrument==='pad')v=Math.sin(Math.PI*t/life)**2*(Math.sin(phase)+.35*Math.sin(phase*1.002))*.6;
   if(instrument==='drum')v=(1-Math.exp(-t*220))*Math.exp(-t*22)*(Math.sin(phase+.6*(1-Math.exp(-t*35)))+.12*Math.sin(phase*3));
   v*=volume*Math.max(0,fade);add(start+i,v,pan);
   if(instrument!=='drum'&&instrument!=='pad'){add(start+i+echo,v*.18,-pan);add(start+i+echo*2,v*.08,pan*.5);}
  }
 };
 let elapsed=0;
 for(const section of sections){
  const kind=section.scene,beat=60/BPM[kind];
  for(let bar=0;bar<section.bars;bar++){
   const start=elapsed+bar*4*beat,root=ROOTS[kind][bar%8],phrase=MELODIES[kind][bar%8],second=bar>=8;
   phrase.forEach((pitch,i)=>{if(pitch<0)return;const at=start+[0,kind==='wind'?.75:1.2,2,3.1][i]*beat;
    note(at,pitch+(second&&bar%4===2?-12:0),kind==='night'?.035:.06,kind==='wind'?-.2:.2,kind==='night'?'flute':'pluck',kind==='night'?1.4*beat:2.2);
    if(kind==='sunset'&&i===2&&bar%2===0)note(at+.22*beat,pitch-12,.018,-.3,'flute',1.4*beat);
   });
   note(start+.025,root,.044,-.25,'bass',3*beat);
   note(start,root+12,.016,-.15,'pad',4*beat);note(start,root+19,.011,.25,'pad',4*beat);
   // An accompaniment with its own rhythm, rather than duplicating the melody.
   const steps=kind==='wind'?[0,.5,1.5,2,2.5,3.5]:kind==='sunset'?[.5,1.5,2.5]:[.75,2.75];
   steps.forEach((offset,i)=>note(start+offset*beat,root+[12,19,24,19][(i+bar)%4],kind==='wind'?.024:.018,(i%2?1:-1)*.45,'pluck',1.65));
   if(kind==='wind'){
    note(start,43,.032,0,'drum',.25);note(start+2*beat,50,.024,.12,'drum',.22);
    if(bar%2===1)note(start+3.5*beat,69,.026,.35,'flute',.65*beat);
   }
   if(kind==='night'&&bar%2===0)note(start+2*beat,root+31,.022,-.3,'bell',3.1);
   if(second&&bar%4===3)note(start+3*beat,root+24,.02,-.3,'bell',2.2);
  }
  elapsed+=section.bars*4*beat;
 }
 let peak=0;for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
 if(peak>.18){const gain=.18/peak;for(let i=0;i<length;i++){left[i]*=gain;right[i]*=gain;}}
 return buffer;
}
type Voice={source:AudioBufferSourceNode;gain:GainNode;scene:MusicScene;started:number;offset:number;duration:number};
export class HualingMusic{
 private buffers=new Map<MusicScene,AudioBuffer>();private voice:Voice|null=null;
 private offsets=new Map<MusicScene,number>();private retiring=new Set<Voice>();
 constructor(private context:AudioContext,private output:AudioNode){}
 get playing(){return this.voice!==null;}
 get scene(){return this.voice?.scene??null;}
 setPlaying(enabled:boolean,scene:MusicScene='journey'){
  if(enabled&&this.voice?.scene===scene||!enabled&&!this.voice)return;
  let buffer:AudioBuffer|undefined;
  if(enabled){buffer=this.buffers.get(scene);if(!buffer){buffer=createHualingMusic(this.context,scene);this.buffers.set(scene,buffer);while(this.buffers.size>2)this.buffers.delete(this.buffers.keys().next().value!);}else{this.buffers.delete(scene);this.buffers.set(scene,buffer);}}
  const c=this.context,now=c.currentTime;
  // Rapid scene clicks retire earlier fades promptly; at most one outgoing voice remains.
  for(const v of this.retiring){v.source.stop(now+.025);this.retiring.delete(v);}
  if(this.voice){
   const old=this.voice;this.offsets.set(old.scene,(old.offset+now-old.started)%old.duration);this.voice=null;
   old.gain.gain.cancelScheduledValues(now);old.gain.gain.setTargetAtTime(0,now,enabled?.18:.03);old.source.stop(now+(enabled?.9:.15));this.retiring.add(old);
   old.source.onended=()=>{old.source.disconnect();old.gain.disconnect();this.retiring.delete(old);};
  }
  if(enabled){
   const source=c.createBufferSource(),gain=c.createGain(),offset=this.offsets.get(scene)??0;
   source.buffer=buffer!;source.loop=true;source.connect(gain);gain.connect(this.output);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.65,now+.9);source.start(now,offset);
   this.voice={source,gain,scene,started:now,offset,duration:buffer!.duration};
  }
 }
}
