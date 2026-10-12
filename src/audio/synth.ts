import type {Sound} from '../platform/adapter';
export class Synth{
 context:AudioContext|null=null;master:GainNode|null=null;muted=false;
 unlock(){this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.gain.value=this.muted?0:.25;this.master.connect(this.context.destination);}void this.context.resume();}
 mute(value:boolean){this.muted=value;if(this.master&&this.context)this.master.gain.setTargetAtTime(value?0:.25,this.context.currentTime,.08);}
 play(kind:Sound){if(!this.context||!this.master)return;const c=this.context,now=c.currentTime;
 const notes:Record<Sound,number[]>={line:[330,660],circle:[220,330,440],z:[587,880,1174],hit:[100,160],hurt:[110,82],win:[293.66,329.63,440,587.33,659.25],lose:[220,146,110],tap:[440]};
 notes[kind].forEach((freq,i)=>{const t=now+i*(kind==='win'?.13:.035),o=c.createOscillator(),g=c.createGain();o.type=kind==='z'?'triangle':'sine';o.frequency.setValueAtTime(freq,t);if(kind==='hit'||kind==='hurt')o.frequency.exponentialRampToValueAtTime(freq*.5,t+.18);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.45,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.45);o.connect(g);g.connect(this.master!);o.start(t);o.stop(t+.5);});
 if(['line','circle','z','hit'].includes(kind)){const len=c.sampleRate*.17,buffer=c.createBuffer(1,len,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/len*6)*.13;const src=c.createBufferSource(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='z'?4800:1800;src.buffer=buffer;src.connect(filter);filter.connect(this.master);src.start(now);}
 }
}
