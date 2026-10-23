import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import type {Point} from '../input/recognizer';
import {pathSlice,pathLength} from '../input/advanced-geometry';
import {WAVE_STAGES,BINDING_STAGES} from '../gameplay/advanced-spells';
const WHITE=0xfff3dc,GOLD=0xe7ba68,RED=0xc84130;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
function stroke(g:Graphics,p:Point[],color:number,width:number,alpha:number){if(p.length<2)return;g.moveTo(p[0].x,p[0].y);for(const v of p.slice(1))g.lineTo(v.x,v.y);g.stroke({color,width,alpha});}
function printSeal(g:Graphics,p:Point,r:number,alpha:number){g.circle(p.x,p.y,r).stroke({color:RED,width:3,alpha}).circle(p.x,p.y,r+5).stroke({color:GOLD,width:1,alpha});g.moveTo(p.x,p.y-r*.7).lineTo(p.x,p.y+r*.7).moveTo(p.x-r*.4,p.y-r*.25).lineTo(p.x+r*.4,p.y-r*.25).lineTo(p.x-r*.25,p.y+r*.2).lineTo(p.x+r*.35,p.y+r*.2).stroke({color:WHITE,width:2,alpha});}
function fox(g:Graphics,p:Point,t:number){const alpha=Math.sin(Math.PI*clamp(t/.8))*.3;if(alpha<=0)return;
 for(let i=0;i<9;i++){const a=-Math.PI+i*Math.PI/8,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,len=100+(i%3)*20;
  g.moveTo(p.x,p.y).bezierCurveTo(p.x+dx*len*.4+nx*35,p.y+dy*len*.4+ny*35,p.x+dx*len+nx*20,p.y+dy*len+ny*20,p.x+dx*len,p.y+dy*len).bezierCurveTo(p.x+dx*len*.7-nx*24,p.y+dy*len*.7-ny*24,p.x+dx*20-nx*18,p.y+dy*20-ny*18,p.x,p.y).fill({color:WHITE,alpha}).stroke({color:GOLD,width:1,alpha});
 }
 g.poly([p.x-34,p.y-25,p.x-29,p.y-76,p.x-8,p.y-42,p.x+8,p.y-42,p.x+29,p.y-76,p.x+34,p.y-25,p.x+18,p.y+7,p.x,p.y+20,p.x-18,p.y+7]).fill({color:WHITE,alpha:alpha*2}).stroke({color:GOLD,width:2,alpha});g.moveTo(p.x-20,p.y-22).lineTo(p.x-8,p.y-15).moveTo(p.x+20,p.y-22).lineTo(p.x+8,p.y-15).stroke({color:RED,width:3,alpha:alpha*3});
}
/** Absolute world paths, pooled graphics, combat-time animation. */
export class AdvancedSpellRenderer{
 root=new Container();items=new Map<number,Graphics>();private spare:Graphics[]=[];
 clear(){for(const g of this.items.values()){g.visible=false;this.spare.push(g);}this.items.clear();}
 update(skills:Skill[]){
  const active=skills.filter(s=>s.wave||s.binding),ids=new Set(active.map(s=>s.id));
  for(const [id,g] of this.items)if(!ids.has(id)){g.visible=false;this.items.delete(id);if(this.spare.length<12)this.spare.push(g);else g.destroy();}
  for(const s of active){let g=this.items.get(s.id);if(!g){g=this.spare.pop()??new Graphics();this.root.addChild(g);this.items.set(s.id,g);}g.visible=true;g.clear();const fade=clamp((s.duration-s.age)/.25);
   if(s.wave){const w=s.wave!,cfg=WAVE_STAGES[w.level-1];
    if(w.level===4)fox(g,w.segments[0]?.center??s.geometry.center,s.age);
    w.segments.forEach((seg,i)=>{
     const u=clamp((s.age-.15-i*.24)/.24),alpha=clamp((.15+i*.24+.52-s.age)/.22)*fade;
     stroke(g,seg.points,GOLD,1,alpha*.2);if(!u||alpha<=0)return;
     const p=pathSlice(seg.points,0,seg.length*u),a=p.at(-1)!;
     // A tapered ribbon follows this segment, with the tip facing its local tangent.
     const outline:number[]=[],back:number[]=[];
     p.forEach((v,j)=>{const b=p[Math.max(0,j-1)],n=p[Math.min(p.length-1,j+1)],d=Math.hypot(n.x-b.x,n.y-b.y)||1,width=(5+Math.sin(j/Math.max(1,p.length-1)*Math.PI)*cfg.width)*(j===p.length-1?.12:1),sign=Math.sign(seg.turn);outline.push(v.x-(n.y-b.y)/d*width*sign,v.y+(n.x-b.x)/d*width*sign);back.unshift(v.y-(n.x-b.x)/d*width*.25*sign);back.unshift(v.x+(n.y-b.y)/d*width*.25*sign);});
     if(outline.length>=6)g.poly([...outline,...back]).fill({color:WHITE,alpha:alpha*.8}).stroke({color:GOLD,width:1.5,alpha});stroke(g,p,RED,3,alpha*.8);
     if(w.level>=2)for(let k=1;k<=Math.min(3,w.level);k++)stroke(g,p.map((v,j)=>({x:v.x+Math.sin(j*.3+k)*k*3,y:v.y+Math.cos(j*.3+k)*k*3})),GOLD,1,alpha*.3);
     g.circle(a.x,a.y,3).fill({color:WHITE,alpha});
    });
    const end=.15+w.segments.length*.24,last=w.segments.at(-1);if(last&&cfg.pull&&s.age>=end){const u=clamp((s.age-end)/.35),p=last.points.map(v=>({x:v.x+(last.center.x-v.x)*u,y:v.y+(last.center.y-v.y)*u}));stroke(g,p,RED,12*(1-u)+2,fade*.8);stroke(g,p,WHITE,4,fade*.9);if(w.level===4)printSeal(g,last.center,22+u*22,fade);}
   }
   if(s.binding){const b=s.binding!,cfg=BINDING_STAGES[b.level-1],p=s.geometry.raw,length=pathLength(p),reveal=clamp(s.age/.32),tighten=clamp((s.age-.25)/cfg.duration),scale=1-tighten*.65;
    if(b.level===4)fox(g,{x:s.x,y:s.y-30},s.age);
    const visible=pathSlice(p,0,length*reveal).map(v=>({x:s.x+(v.x-s.x)*scale,y:s.y+(v.y-s.y)*scale}));
    stroke(g,visible,RED,b.level>=3?7:4,fade*.7);stroke(g,visible,GOLD,2,fade);
    if(b.level>=2)stroke(g,visible.map(v=>({x:s.x+(v.x-s.x)*.83,y:s.y+(v.y-s.y)*.83})),GOLD,1.5,fade*.7);
    for(let j=5;j<visible.length;j+=Math.max(6,Math.ceil(visible.length/12))){const v=visible[j];g.poly([v.x-4,v.y-8,v.x+5,v.y-6,v.x+4,v.y+8,v.x-5,v.y+6]).fill({color:WHITE,alpha:fade}).stroke({color:RED,width:1,alpha:fade});}
    printSeal(g,{x:s.x,y:s.y},14+b.level*4+tighten*12,fade);
    for(const [id,c] of b.captured){if(c.released)continue;g.moveTo(s.x,s.y).quadraticCurveTo((s.x+c.anchor.x)/2+15,(s.y+c.anchor.y)/2-15,c.anchor.x,c.anchor.y).stroke({color:GOLD,width:1.5,alpha:fade*.65});printSeal(g,c.anchor,10,fade*.7);}
   }
  }
 }
}
