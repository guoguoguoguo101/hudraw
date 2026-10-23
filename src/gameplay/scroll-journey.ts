export type LandscapeStage='sunset'|'wind'|'night';
export const LANDSCAPE_STAGES:LandscapeStage[]=['sunset','wind','night'];
export const LANDSCAPE_NAMES:Record<LandscapeStage,string>={sunset:'落日',wind:'起风',night:'夜色'};
const ease=(a:number,b:number,t:number)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};

/** Real-time scenery clock. Battle slow motion and enemy stop never accelerate a sunset. */
export class ScrollJourney{
 time=0;automatic=true;autoEvents=true;
 get stage():LandscapeStage{return this.time>=56?'night':this.time>=26?'wind':'sunset';}
 get wind(){return ease(20,34,this.time)*(1-.55*ease(52,68,this.time));}
 get night(){return ease(49,65,this.time);}
 get weights(){const dusk=ease(20,34,this.time),night=this.night;return [1-dusk,dusk*(1-night),night] as const;}
 get event(){return this.time>=64?'beast':this.time>=32?'fire':'seal';}
 advance(dt:number){if(this.automatic&&Number.isFinite(dt)&&dt>0)this.time=Math.min(90,this.time+dt);}
 preview(stage:LandscapeStage){this.time=stage==='sunset'?6:stage==='wind'?39:74;this.automatic=false;this.autoEvents=true;}
 resume(){this.automatic=true;this.autoEvents=true;}
 reset(){this.time=0;this.automatic=true;this.autoEvents=true;}
}
