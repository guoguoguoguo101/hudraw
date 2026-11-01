import type {Skill} from '../core/types';
import type {Point,Rune} from '../input/recognizer';
/** Renderer adapters never enter the spell factory or gameplay damage pipeline. */
export function visualSkill(rune:Rune,id:number,p:Point):Skill{
 return {id,rune,x:p.x,y:p.y,age:0,direction:{x:1,y:0},released:true,hit:new Set(),hitCounts:new Map(),geometry:{raw:[],points:[],normalized:[],center:{...p},aspect:1,rotation:0,winding:1,vertices:[],intersections:0},quality:1,damage:0,radius:0,range:0,duration:1,strength:1,copies:1,mirror:false,seal:false,sealPower:1,shock:false,shockDuration:0,nextTick:0,rotation:0,target:null,aimPoints:[]};
}
