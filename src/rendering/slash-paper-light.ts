import type {Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import {slashVariation as noise} from './slash-upgrades';
const GOLD=0xe7ba68,RED=0xb83e32,WHITE=0xfff8e7;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
export function paperLightLayout(seed:number){return Array.from({length:6},(_,i)=>({birth:.05+noise(seed,i+170)*.085,side:noise(seed,i+180)>.48?1:-1,speed:160+noise(seed,i+190)*240,drift:85+noise(seed,i+200)*125,spin:(noise(seed,i+210)-.5)*10,scale:.75+noise(seed,i+220)*.42,phase:noise(seed,i+230)*Math.PI*2}));}
export function paperLightWidth(f:number){return 3+13*smooth(f/.18);}
/** Lv2 only: a growing beam and a bounded seeded burst, not repeating decorative rings. */
export function drawPaperLight(s:Skill,layers:{outer:Graphics;core:Graphics;trail:Graphics;flames:Graphics;papers:Graphics;sparks:Graphics},reach:number,head:number,alpha:number){
 const {outer,core,trail,flames,papers,sparks}=layers,t=s.age,start=14,end=Math.max(start+1,head),length=end-start,pulse=.93+.07*Math.sin(t*24);
 outer.moveTo(start,-3);for(let i=1;i<=12;i++){const f=i/12,x=start+length*f,w=paperLightWidth(f)*pulse;outer.bezierCurveTo(x-length/18,-w*.98,x-length/36,-w,x,-w);}
 const w=paperLightWidth(1)*pulse;outer.bezierCurveTo(end+5,-w*.7,end+5,w*.7,end,w);for(let i=11;i>=0;i--){const f=i/12,x=start+length*f,z=paperLightWidth(f)*pulse;outer.bezierCurveTo(x+length/18,z,x+length/36,z,x,z);}outer.closePath().fill({color:GOLD,alpha});
 // The ivory core also widens near the source then holds its width to the front.
 core.moveTo(start,-1);core.bezierCurveTo(start+length*.05,-2,start+length*.12,-7,start+length*.20,-8).lineTo(end,-8).quadraticCurveTo(end+3,0,end,8).lineTo(start+length*.20,8).bezierCurveTo(start+length*.12,7,start+length*.05,2,start,1).closePath().fill({color:WHITE,alpha});
 core.moveTo(start,0).lineTo(end,0).stroke({color:0xffffff,width:1.7,alpha});
 // Unequal rotating paper flames: phase, longitudinal center and pitch vary per cast.
 for(let j=0;j<3;j++){const phase=noise(s.id,j+300)*6.28,center=start+length*(.18+noise(s.id,j+310)*.6),extent=length*(.14+noise(s.id,j+320)*.13),radius=19+noise(s.id,j+330)*20,rotation=t*(9+noise(s.id,j+340)*6)+phase;
  const points=Array.from({length:11},(_,k)=>{const f=k/10;return {x:Math.max(start,Math.min(end,center+(f-.5)*extent*2)),y:Math.sin(rotation+f*(3.5+j*.37))*radius};});
  const front=Math.cos(rotation)>.05,g=front?flames:trail,shade=front?1:.45;
  g.moveTo(points[0].x,points[0].y);for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k];g.bezierCurveTo(a.x+(b.x-a.x)/3,a.y,b.x-(b.x-a.x)/3,b.y,b.x,b.y);}for(let k=points.length-1;k>=0;k--){const p=points[k],cut=(k%3===0?7:3)*(j===1?-1:1);g.lineTo(p.x-3,p.y+cut);}g.closePath().fill({color:j===1?RED:GOLD,alpha:alpha*shade*.78});
  g.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))g.lineTo(p.x,p.y);g.stroke({color:WHITE,width:1.2,alpha:alpha*shade*.7});
 }
 for(const [i,p] of paperLightLayout(s.id).entries()){const age=t-p.birth;if(age<0)continue;
  const birthX=start+reach*smooth((p.birth-.05)/.16),x=Math.min(end+24,birthX+age*p.speed),y=p.side*(16+age*p.drift)+Math.sin(p.phase+age*8)*7,a=p.phase*.3+age*p.spin,scale=p.scale,life=alpha*clamp(1-age/.42);
  papers.save().setTransform(Math.cos(a)*scale,Math.sin(a)*scale,-Math.sin(a)*scale,Math.cos(a)*scale,x,y);
  const red=i%3===0;papers.moveTo(-8,-19).lineTo(9,-17).lineTo(7,17).lineTo(-6,20).closePath().fill({color:red?RED:WHITE,alpha:life}).stroke({color:GOLD,width:.8,alpha:life});
  const ink=red?GOLD:RED;papers.moveTo(-4,-11).lineTo(4,-11).lineTo(-2,-3).lineTo(4,0).lineTo(-3,8).moveTo(0,-14).lineTo(0,13).stroke({color:ink,width:1.8,alpha:life});papers.restore();
  if(i===1||i===4){const r=9+p.scale*3,px=x+13,py=y+p.side*11;papers.moveTo(px+r,py).arc(px,py,r,p.phase,p.phase+4.6).stroke({color:GOLD,width:1.2,alpha:life*.65});papers.moveTo(px-3,py-5).lineTo(px+3,py-5).lineTo(px-2,py+4).lineTo(px+4,py+4).stroke({color:ink,width:1.1,alpha:life*.8});}
 }
 // Individual lightning splinters open outward, with staggered birth and unequal lifetimes.
 for(let i=0;i<13;i++){const born=.06+noise(s.id,i+400)*.13,age=t-born;if(age<0)continue;const life=.12+noise(s.id,i+410)*.15,fade=alpha*clamp(1-age/life);if(!fade)continue;
  const side=noise(s.id,i+420)>.5?1:-1,x=start+reach*smooth((born-.05)/.16)+age*(65+noise(s.id,i+430)*110),y=side*(14+age*(80+noise(s.id,i+440)*145)),len=9+noise(s.id,i+450)*26;
  sparks.moveTo(x,y).lineTo(x+len*.33,y-side*5).lineTo(x+len*.5,y+side*4).lineTo(x+len,y+side*(8+age*20)).stroke({color:i%3?GOLD:WHITE,width:i%3?1.3:1.8,alpha:fade});
  if(i%4===0)sparks.moveTo(x+len*.5,y).lineTo(x+len*.35,y+side*11).stroke({color:GOLD,width:1,alpha:fade*.6});
 }
}
