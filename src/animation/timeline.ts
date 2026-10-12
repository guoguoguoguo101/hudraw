export const easing={linear:(x:number)=>x,smooth:(x:number)=>x*x*(3-2*x),out:(x:number)=>1-(1-x)**3,back:(x:number)=>1+2.70158*(x-1)**3+1.70158*(x-1)**2};
type Numeric=Record<string,number>;type Clip={target:Numeric;from:Numeric;to:Numeric;start:number;duration:number;ease:(x:number)=>number};
export class Timeline{
 clips:Clip[]=[];cursor=0;age=0;loops=0;repeat=0;cancelled=false;done=false;expected=new WeakMap<object,Numeric>();initial=new Map<Numeric,Numeric>();
 step(target:object,to:Numeric,duration:number,ease=easing.smooth,delay=0){this.parallel([{target,to,duration,ease,delay}]);return this;}
 parallel(items:{target:object;to:Numeric;duration:number;ease?:(x:number)=>number;delay?:number}[]){let span=0;for(const item of items){const target=item.target as Numeric,from:Numeric={},expected=this.expected.get(item.target)??{},initial=this.initial.get(target)??{};for(const k in item.to){from[k]=expected[k]??target[k];initial[k]??=target[k];}this.initial.set(target,initial);this.expected.set(item.target,{...expected,...item.to});const delay=item.delay??0;this.clips.push({target,from,to:item.to,start:this.cursor+delay,duration:item.duration,ease:item.ease??easing.smooth});span=Math.max(span,item.duration+delay);}this.cursor+=span;return this;}
 wait(duration:number){this.cursor+=duration;return this;}
 cancel(){this.cancelled=true;}
 update(dt:number){if(this.done||this.cancelled)return;this.age+=dt;for(const clip of this.clips){if(this.age<clip.start)continue;const p=clip.ease(Math.min(1,(this.age-clip.start)/clip.duration));for(const k in clip.to)clip.target[k]=clip.from[k]+(clip.to[k]-clip.from[k])*p;}if(this.age>=this.cursor){if(this.loops<this.repeat){this.loops++;this.age%=this.cursor;for(const [target,initial] of this.initial)Object.assign(target,initial);}else this.done=true;}}
}
export class Animator{timelines=new Set<Timeline>();play(t:Timeline){this.timelines.add(t);return t;}update(dt:number){for(const t of this.timelines){t.update(dt);if(t.done||t.cancelled)this.timelines.delete(t);}}clear(){for(const t of this.timelines)t.cancel();this.timelines.clear();}}
