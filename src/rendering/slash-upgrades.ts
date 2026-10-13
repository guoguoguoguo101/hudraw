import type {Graphics} from 'pixi.js';
import type {Skill} from '../core/types';

const WHITE=0xfff9e9,GOLD=0xe7ba68,RED=0xb73f37;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** Stable per-cast variation: never use frame-dependent random numbers. */
export function slashVariation(seed:number,index:number){let h=Math.imul(seed^Math.imul(index+1,374761393),668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
export function slashPaperLayout(seed:number,range:number){return Array.from({length:5},(_,i)=>({
 x:range*(.16+i*.155+slashVariation(seed,i)*.055),
 y:(i%2?-1:1)*(29+slashVariation(seed,i+9)*30),
 angle:(slashVariation(seed,i+18)-.5)*1.3,
 scale:.7+slashVariation(seed,i+27)*.45,
 spin:(slashVariation(seed,i+36)-.5)*5
}));}

/** Pure vector ornament layer for Lv2/3; gameplay and relics have no dependency on it. */
export function drawSlashUpgrade(s:Skill,layers:Graphics[],hitAt:number,duration:number){
 const [core,trail,papers,shards,impact]=layers,lv=s.slash!.level,t=s.age;
 const elapsed=t-hitAt,fade=clamp((duration-t)/.11),reach=s.range*(.3+.7*clamp(elapsed/.055));
 if(elapsed<0){core.moveTo(14,0).lineTo(s.range*clamp(t/hitAt),0).stroke({color:GOLD,width:1,alpha:.4});}
 else{
  const w=(lv===2?17:14)*(.65+.35*Math.sin(clamp(elapsed/.15)*Math.PI));
  core.moveTo(14,0).quadraticCurveTo(reach*.55,-w,reach,0).quadraticCurveTo(reach*.58,w*.7,14,0).fill({color:GOLD,alpha:fade});
  core.moveTo(15,0).quadraticCurveTo(reach*.5,-1.4,reach-5,0).stroke({color:WHITE,width:lv===2?2.7:3.7,alpha:fade});
  // One shorter after-stroke, never a paired crescent or a wrapped ribbon.
  const bend=(lv===2?20:23)*Math.sin(clamp(elapsed/.22)*Math.PI);
  trail.moveTo(35,4).quadraticCurveTo(reach*.4,bend,reach*.78,2).stroke({color:GOLD,width:lv===2?2.5:2,alpha:fade*.68});
  const count=lv===2?5:11;
  for(let i=0;i<count;i++){const age=elapsed-i*.002;if(age<0)continue;const r=slashVariation(s.id,i+54),x=40+r*s.range*.82+age*(30+r*60),y=(slashVariation(s.id,i+70)-.5)*(lv===2?28:70)*(1+age*3),size=2+r*3;
   shards.moveTo(x,y).lineTo(x-size*2,y+size).lineTo(x-size*.6,y-size*.7).closePath().fill({color:lv===3&&i%4===0?RED:GOLD,alpha:fade*.75});}
 }
 if(lv===3){
  for(const [i,p] of slashPaperLayout(s.id,s.range).entries()){
   const arrival=hitAt+.02+p.x/s.range*.04,age=t-arrival,split=clamp(age/.12),alpha=clamp(t/.04)*clamp((duration-t)/.12);
   for(const half of [-1,1]){
    const a=p.angle+half*split*(.4+p.spin*.15),c=Math.cos(a),n=Math.sin(a),cx=p.x+half*split*10,cy=p.y+half*split*(10+Math.abs(p.y)*.22),scale=p.scale*1.15;
    const point=(x:number,y:number)=>({x:cx+(x*c-y*n)*scale,y:cy+(x*n+y*c)*scale});
    const vertices=half<0?[[-12,-25],[10,-25],[12,-2],[3,2],[-5,-2],[-12,1]]:[[-12,3],[-5,0],[3,4],[12,0],[10,25],[-11,23]];
    const first=point(...vertices[0] as [number,number]);papers.moveTo(first.x,first.y);for(const v of vertices.slice(1)){const q=point(...v as [number,number]);papers.lineTo(q.x,q.y);}papers.closePath().fill({color:WHITE,alpha}).stroke({color:GOLD,width:.7,alpha:alpha*.5});
    // Broken vermilion seal and a compact hand-cut glyph, following each half.
    const mark=(x:number,y:number)=>point(x,y*half);const u=mark(-6,9),v=mark(6,9),z=mark(0,21);papers.moveTo(u.x,u.y).lineTo(v.x,v.y).lineTo(z.x,z.y).lineTo(u.x,u.y).stroke({color:RED,width:1.7,alpha});
    const m=mark(-4,15),q=mark(4,19),k=mark(1,5);papers.moveTo(m.x,m.y).lineTo(q.x,q.y).moveTo(k.x,k.y).lineTo(z.x,z.y).stroke({color:RED,width:1.5,alpha});
   }
  }
 }
 for(const hit of s.slash!.contacts){const age=t-hit.at;if(age<0||age>.20)continue;
  const dx=hit.x-s.x,dy=hit.y-s.y,x=dx*s.direction.x+dy*s.direction.y,y=-dx*s.direction.y+dy*s.direction.x,alpha=clamp(1-age/.20),r=(hit.secondary?34:lv===2?11:26)*(1+age*2),seed=s.id*17+hit.id,angle=slashVariation(seed,2)*Math.PI*2;
  if(lv===2){impact.moveTo(x-r,y).lineTo(x+3,y-3).lineTo(x+r*.6,y-8).lineTo(x+3,y+2).closePath().fill({color:GOLD,alpha});impact.moveTo(x-5,y).lineTo(x+9,y).stroke({color:WHITE,width:1.4,alpha});continue;}
  const variant=hit.id%3;
  for(let j=0;j<(variant===1?2:3);j++){const a=angle+j*(variant===2?.85:1.9),b=a+(variant===1?1.65:1.1),offset=age*15;impact.moveTo(x+Math.cos(a)*(r+offset),y+Math.sin(a)*(r+offset)).arc(x,y,r+offset,a,b).stroke({color:RED,width:hit.secondary?3.5:2.3,alpha});}
  impact.moveTo(x-r*.4,y-r*.25).lineTo(x+r*.3,y-r*.25).lineTo(x-r*.1,y+r*.25).lineTo(x+r*.45,y+r*.25).moveTo(x,y-r*.6).lineTo(x,y+r*.6).stroke({color:RED,width:2,alpha});
  // Short, asymmetric fan only at actual secondary-hit locations.
  const count=hit.secondary?5:3;
  for(let j=0;j<count;j++){const a=angle+(j/count-.5)*1.1,len=r*(.9+slashVariation(seed,j+8)*.9),nx=-Math.sin(a),ny=Math.cos(a),px=x+Math.cos(a)*len,py=y+Math.sin(a)*len;impact.moveTo(x,y).lineTo(px+nx*3,py+ny*3).lineTo(px-nx*2,py-ny*2).closePath().fill({color:j%2?WHITE:GOLD,alpha});}
 }
}
