import type {Game} from './game';
import type {Point} from '../input/recognizer';
import type {CollectedRune} from './collected-talismans';
import {inArena} from '../input/line-interaction-geometry';
export type RuneFlight={kind:CollectedRune;from:Point;target:Point;age:number;duration:number};
/** Isolated test-mode deployment: spells take effect only after the talisman lands. */
export class FrontlineBattle{
 flights:RuneFlight[]=[];
 reset(){this.flights=[];}
 throw(g:Game,kind:CollectedRune,target:Point){
  if(!g.frontlineTest||!g.active||g.hualing.upgrades.blocked||!inArena(target,g.hualing.bounds)||![target.x,target.y].every(Number.isFinite))return false;
  if(this.flights.some(f=>f.kind===kind)||g.collected.casts.some(c=>c.kind===kind)||kind==='pulse'&&g.pulse.effect)return false;
  this.flights.push({kind,from:{...g.playerPosition},target:{...target},age:0,duration:.38});g.collected.cancel();return true;
 }
 advance(g:Game,dt:number){
  if(!g.frontlineTest||!g.active||!Number.isFinite(dt)||dt<=0)return;
  for(const f of [...this.flights]){f.age+=dt;if(f.age>=f.duration){this.flights=this.flights.filter(v=>v!==f);if(!g.collected.preview(g,f.kind,f.target))g.hualing.say('该符暂不可释放，请重新选点');}}
 }
}
