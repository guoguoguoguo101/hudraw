import {COMBAT} from './config';
export class CombatClock{
 real=0;world=0;accumulator=0;readonly step=1/60;
 reset(){this.real=this.world=this.accumulator=0;}
 advance(realDt:number,paused:boolean,drawing:boolean,simulate:(dt:number)=>unknown){if(paused)return 0;this.real+=realDt;const scaled=realDt*(drawing?COMBAT.drawScale:1);this.world+=scaled;this.accumulator+=scaled;let steps=0;while(this.accumulator+1e-10>=this.step){const keepGoing=simulate(this.step);this.accumulator-=this.step;steps++;if(keepGoing===false){this.world-=Math.max(0,this.accumulator);this.accumulator=0;break;}}return steps;}
}
export class SpellChargeSystem{
 papers=COMBAT.startPapers;progress=0;
 reset(){this.papers=COMBAT.startPapers;this.progress=0;}
 update(dt:number){if(this.papers>=COMBAT.maxPapers){this.progress=0;return;}this.progress+=dt;while(this.progress+1e-8>=COMBAT.chargePeriod&&this.papers<COMBAT.maxPapers){this.progress=Math.max(0,this.progress-COMBAT.chargePeriod);this.papers++;}if(this.papers===COMBAT.maxPapers)this.progress=0;}
 consume(){if(!this.papers)return false;this.papers--;return true;}
}
