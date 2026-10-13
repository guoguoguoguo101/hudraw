import {Container,Graphics} from 'pixi.js';
import type {BrushStroke} from '../../relics/cinnabar-brush';
const RED=0xc93e32,GOLD=0xecc777,CREAM=0xffead0;
/** Dedicated vector overlay. Original skill renderers are untouched. */
export class BrushRenderer {
 root=new Container();private graphics=new Map<number,Graphics>();private spare:Graphics[]=[];
 update(strokes:readonly BrushStroke[]){
  const live=new Set(strokes.map(s=>s.id));for(const [id,g] of this.graphics)if(!live.has(id)){g.visible=false;this.graphics.delete(id);this.spare.push(g);}
  for(const s of strokes){if(s.age<0)continue;let g=this.graphics.get(s.id);if(!g){g=this.spare.pop()??new Graphics();this.root.addChild(g);this.graphics.set(s.id,g);}g.visible=true;g.clear();g.position.set(0,0);g.rotation=0;
   const a=s.action,u=Math.min(1,s.age/.2),fade=s.resolved?Math.max(0,1-(s.age-(s.impactAge??0))/.48):1,w=[3,5,8][s.level-1];g.alpha=fade;
   if(a.kind==='ray'){
    g.position.set(a.origin.x,a.origin.y);g.rotation=Math.atan2(a.direction.y,a.direction.x);const end=a.range*(1-(1-u)**3),width=Math.min(a.width*.4,9+s.level*5);
    g.moveTo(0,0).bezierCurveTo(end*.28,-width*.2,end*.7,-width*.8,end,0).bezierCurveTo(end*.7,width*.6,end*.25,width*.15,0,0).fill(RED);
    g.moveTo(8,0).quadraticCurveTo(end*.6,-2,end,0).stroke({color:GOLD,width:1.2,alpha:.85});
    if(s.level>1){g.moveTo(0,width*.7).quadraticCurveTo(end*.55,width,end*.87,width*.2).stroke({color:RED,width:w,alpha:.35});}
    for(let i=0;i<5+s.level*3;i++){const x=end*(.18+i/(8+s.level*3)*.75),y=Math.sin(i*2.6+s.id)*width*2;this.flame(g,x,y,8+s.level*3,i,fade);}
    for(const p of s.contacts){const dx=p.x-a.origin.x,dy=p.y-a.origin.y;this.burst(g,dx*a.direction.x+dy*a.direction.y,-dx*a.direction.y+dy*a.direction.x,s,fade);}
   }else if(a.kind==='area'){
    const r=a.radius*(.55+.45*(1-(1-u)**3));g.circle(a.origin.x,a.origin.y,r).stroke({color:RED,width:w,alpha:.9});g.circle(a.origin.x,a.origin.y,r-5).stroke({color:GOLD,width:1,alpha:.7});
    for(let i=0;i<12+s.level*4;i++){const angle=i*Math.PI*2/(12+s.level*4)+s.age*.3;const x=a.origin.x+Math.cos(angle)*r,y=a.origin.y+Math.sin(angle)*r;this.flame(g,x,y,8+s.level*3,angle,fade);}
    for(const p of s.contacts)this.burst(g,p.x,p.y,s,fade);
   }else if(a.kind==='projectile'){
    if(s.trail.length){g.moveTo(s.trail[0].x,s.trail[0].y);for(const p of s.trail.slice(1))g.lineTo(p.x,p.y);g.stroke({color:RED,width:w,alpha:.65});if(s.level>1){g.moveTo(s.trail[0].x+3,s.trail[0].y+3);for(const p of s.trail.slice(1))g.lineTo(p.x+3,p.y+3);g.stroke({color:GOLD,width:1,alpha:.5});}}
    if(!s.resolved){const {x,y}=s.position,dx=Math.cos(s.angle),dy=Math.sin(s.angle);g.moveTo(x+dx*24,y+dy*24).lineTo(x-dx*13-dy*12,y-dy*13+dx*12).lineTo(x-dx*5,y-dy*5).lineTo(x-dx*13+dy*12,y-dy*13-dx*12).closePath().fill(RED).stroke({color:GOLD,width:1.3});}
    for(const p of s.contacts)this.burst(g,p.x,p.y,s,fade);
   }else if(a.kind==='chain'){
    let previous=a.origin;for(const [i,hit] of a.hits.entries()){const p=hit.position,dx=p.x-previous.x,dy=p.y-previous.y,len=Math.hypot(dx,dy)||1;g.moveTo(previous.x,previous.y);for(let j=1;j<=7;j++){const f=j/7,z=j===7?0:Math.sin(j*4.1+i+s.id)*(5+s.level*3);g.lineTo(previous.x+dx*f-dy/len*z,previous.y+dy*f+dx/len*z);}g.stroke({color:RED,width:w,alpha:.95});this.flame(g,p.x,p.y,12+s.level*4,i,fade);previous=p;}for(const p of s.contacts)this.burst(g,p.x,p.y,s,fade);
   }
  }
 }
 private flame(g:Graphics,x:number,y:number,r:number,a:number,alpha:number){const dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx;g.moveTo(x-dx*r,y-dy*r).quadraticCurveTo(x+nx*r*.6,y+ny*r*.6,x+dx*r,y+dy*r).lineTo(x+nx*r*.17,y+ny*r*.17).quadraticCurveTo(x-nx*r*.3,y-ny*r*.3,x-dx*r,y-dy*r).fill({color:RED,alpha:.7*alpha});}
 private burst(g:Graphics,x:number,y:number,s:BrushStroke,alpha:number){const t=Math.max(0,s.age-(s.impactAge??s.age)),r=10+t*65;for(let i=0;i<4+s.level*3;i++){const a=i*Math.PI*2/(4+s.level*3)+s.id*.37,dx=Math.cos(a),dy=Math.sin(a),px=x+dx*r,py=y+dy*r;g.moveTo(px,py).lineTo(px-dx*(7+s.level*3)-dy*3,py-dy*(7+s.level*3)+dx*3).lineTo(px-dx*4+dy*2,py-dy*4-dx*2).closePath().fill({color:i%3?RED:GOLD,alpha});}g.circle(x,y,3).fill({color:CREAM,alpha});}
 clear(){for(const g of this.graphics.values()){g.visible=false;this.spare.push(g);}this.graphics.clear();}
}
