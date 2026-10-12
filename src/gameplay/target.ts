import {WORLD,type Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
export class SkillTargetResolver{
 static distance(e:Point,from:Point={x:WORLD.foxX,y:WORLD.foxY}){return Math.hypot(e.x-from.x,e.y-from.y);}
 static sector(enemies:Enemy[],direction:Point,range:number,cosine=.35){return enemies.filter(e=>{const dx=e.x-WORLD.foxX,dy=e.y-WORLD.foxY,d=Math.hypot(dx,dy)||1;return e.hp>0&&d<=range&&(dx*direction.x+dy*direction.y)/d>=cosine;}).sort((a,b)=>this.score(b)-this.score(a)||a.id-b.id);}
 static score(e:Enemy){return 700-this.distance(e)+(e.ai==='Telegraph'?150:0)+(e.kind==='boss'?450:e.kind==='oni'?75:0);}
 static priority(enemies:Enemy[],direction:Point,range:number){return this.sector(enemies,direction,range)[0]??null;}
 static ray(enemies:Enemy[],direction:Point,range:number,width:number){return enemies.filter(e=>{const dx=e.x-WORLD.foxX,dy=e.y-WORLD.foxY,along=dx*direction.x+dy*direction.y,across=Math.abs(dx*direction.y-dy*direction.x);return e.hp>0&&along>=0&&along<=range&&across<=width/2+(e.kind==='boss'?55:e.kind==='oni'?34:23);}).sort((a,b)=>this.distance(a)-this.distance(b)||a.id-b.id);}
 static chain(enemies:Enemy[],direction:Point,range:number,max:number){const first=this.priority(enemies,direction,range);if(!first)return [];const chosen=[first];while(chosen.length<max){const last=chosen.at(-1)!;const next=enemies.filter(e=>e.hp>0&&!chosen.includes(e)&&this.distance(e,last)<280).sort((a,b)=>this.distance(a,last)-this.distance(b,last)||this.score(b)-this.score(a))[0];if(!next)break;chosen.push(next);}return chosen;}
}
