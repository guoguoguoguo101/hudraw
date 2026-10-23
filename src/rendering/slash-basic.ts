import type {Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import {slashVariation} from './slash-upgrades';
const GOLD=0xe7ba68,IVORY=0xfff7df,WHITE=0xfffdf3,RED=0xb83e32;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
type Layers={outer:Graphics;trail:Graphics;flames:Graphics;core:Graphics;sparks:Graphics};

/** A tapered blade stays on the actual swipe; its decoration never drives combat. */
export function drawBasicSlash(s:Skill,layers:Layers,reach:number){
 const {outer,trail,flames,core,sparks}=layers,t=s.age;
 const fade=clamp((s.duration-t)/.13),rise=clamp(t/.045),alpha=rise*fade;
 if(alpha<=0)return;
 const extension=1-(1-clamp(t/.06))**3;
 const fraction=s.slash?.path?2/3+extension/3:Math.max(.03,extension);
 const left=s.slash?.path?reach*(1-fraction)/2:0,right=left+reach*fraction,length=right-left;
 const width=Math.min(18,9+reach*.022),pulse=1+.12*Math.sin(clamp(t/.12)*Math.PI);
 // Broad, translucent air displacement under the sharp, pointed blade.
 outer.moveTo(left,0).bezierCurveTo(left+length*.22,-width*.6,left+length*.65,-width*1.65,right,0)
  .bezierCurveTo(left+length*.67,width*.9,left+length*.18,width*.6,left,0).closePath().fill({color:GOLD,alpha:alpha*.15});
 trail.moveTo(left,0).bezierCurveTo(left+length*.22,-width*.42,left+length*.7,-width*pulse,right,0)
  .bezierCurveTo(left+length*.65,width*.58,left+length*.2,width*.26,left,0).closePath().fill({color:GOLD,alpha:alpha*.92});
 // A red brush wake separates the white cut from bright scenery.
 flames.moveTo(left+length*.03,width*.2)
  .bezierCurveTo(left+length*.24,width*1.1,left+length*.58,width*.72,right-length*.05,0)
  .bezierCurveTo(left+length*.65,width*1.35,left+length*.22,width*1.45,left+length*.03,width*.2)
  .closePath().fill({color:RED,alpha:alpha*.7});
 core.moveTo(left,0).bezierCurveTo(left+length*.23,-width*.18,left+length*.73,-width*.43,right,0)
  .bezierCurveTo(left+length*.74,width*.25,left+length*.22,width*.1,left,0).closePath().fill({color:IVORY,alpha});
 core.moveTo(left,0).lineTo(right,0).stroke({color:WHITE,width:2.4,alpha:alpha*.95});
 // Two thin, broken air streaks add speed without turning Lv1 into a beam.
 for(let i=0;i<2;i++){
  const sign=i?-1:1,start=left+length*(.12+i*.14),end=left+length*(.68+i*.12),off=width*(1+i*.3);
  outer.moveTo(start,sign*off*.3).bezierCurveTo(start+length*.2,sign*off,end-length*.15,sign*off*.6,end,0)
   .stroke({color:i?GOLD:IVORY,width:1.1,alpha:alpha*.5});
 }
 // One brief moving glint, then six seeded fragments fade off the blade.
 const sweep=clamp((t-.015)/.085),tip=left+length*sweep,glint=alpha*clamp((.16-t)/.08);
 if(glint>0){
  core.moveTo(Math.max(left,tip-14),0).lineTo(tip,0).stroke({color:WHITE,width:4,alpha:glint});
  sparks.moveTo(tip,-width*.9*glint).lineTo(tip,width*.9*glint).stroke({color:IVORY,width:1.2,alpha:glint*.65});
 }
 for(let i=0;i<6;i++){
  const seed=slashVariation(s.id,i+600),born=.055+seed*.04,age=t-born;if(age<=0)continue;
  const life=clamp(1-age/.19),sign=i%2?1:-1,x=left+length*(.12+seed*.74),y=sign*(width*.25+age*(40+seed*60));
  const extent=(5+seed*10)*life;
  sparks.moveTo(x,y).lineTo(Math.min(right,x+extent),y+sign*extent*.25)
   .stroke({color:i%3?GOLD:IVORY,width:i%3?1.3:1.8,alpha:alpha*life*.85});
 }
}
