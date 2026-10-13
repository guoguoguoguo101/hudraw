import {COMBAT} from './config';
export class CombatClock{
 real=0;world=0;accumulator=0;readonly step=1/60;
 reset(){this.real=this.world=this.accumulator=0;}
 advance(realDt:number,paused:boolean,drawing:boolean,simulate:(dt:number)=>unknown){if(paused)return 0;this.real+=realDt;const scaled=realDt*(drawing?COMBAT.drawScale:1);this.world+=scaled;this.accumulator+=scaled;let steps=0;while(this.accumulator+1e-10>=this.step){const keepGoing=simulate(this.step);this.accumulator-=this.step;steps++;if(keepGoing===false){this.world-=Math.max(0,this.accumulator);this.accumulator=0;break;}}return steps;}
}
