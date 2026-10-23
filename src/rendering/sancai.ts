import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import type {Point} from '../input/recognizer';
import {SANCAI,SANCAI_STAGES,sancaiArrayTimeline} from '../gameplay/sancai-config';
const WHITE=0xfff3dc,GOLD=0xe7ba68,RED=0xc84130,INK=0x27252a;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
function line(g:Graphics,a:Point,b:Point,width:number,color:number,alpha:number){g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color,width,alpha});}
function blade(g:Graphics,p:Point,size:number,angle:number,level:number,alpha:number){
 const at=(x:number,y:number)=>({x:p.x+Math.cos(angle)*x-Math.sin(angle)*y,y:p.y+Math.sin(angle)*x+Math.cos(angle)*y});
 const polygon=(pts:Point[],color:number,a=alpha)=>g.poly(pts.flatMap(v=>[v.x,v.y])).fill({color,alpha:a});
 const corners=[at(size*1.3,0),at(-size*.65,size*.88),at(-size*.65,-size*.88)];
 g.poly(corners.flatMap(v=>[v.x,v.y])).fill({color:WHITE,alpha}).stroke({color:GOLD,width:level===4?3:2,alpha});
 for(let i=0;i<3;i++){const a=corners[i],b=corners[(i+1)%3];line(g,{x:p.x+(a.x-p.x)*.55,y:p.y+(a.y-p.y)*.55},{x:p.x+(b.x-p.x)*.55,y:p.y+(b.y-p.y)*.55},level>=3?3:2,RED,alpha);line(g,p,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},1,INK,alpha*.65);}
 polygon([at(size*.75,0),at(-size*.22,size*.13),at(-size*.05,0),at(-size*.22,-size*.13)],RED);
 if(level>=3)for(const sign of [-1,1]){line(g,at(-size*.45,sign*size*.55),at(size*.28,sign*size*.1),1,GOLD,alpha);}
}
function sword(g:Graphics,p:Point,size:number,angle:number,alpha:number){
 const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;
 g.poly([p.x+dx*size,p.y+dy*size,p.x+nx*size*.16,p.y+ny*size*.16,p.x-dx*size*.5,p.y-dy*size*.5,p.x-nx*size*.16,p.y-ny*size*.16]).fill({color:WHITE,alpha}).stroke({color:GOLD,width:1.5,alpha});
 line(g,{x:p.x-dx*size*.3-nx*size*.35,y:p.y-dy*size*.3-ny*size*.35},{x:p.x-dx*size*.3+nx*size*.35,y:p.y-dy*size*.3+ny*size*.35},3,RED,alpha);
}
function fox(g:Graphics,p:Point,alpha:number){
 for(let i=0;i<9;i++){const a=-Math.PI*.95+i*Math.PI*.9/8,dx=Math.cos(a),dy=Math.sin(a),n={x:-dy,y:dx},len=115+(i%3)*17;
  g.moveTo(p.x,p.y).quadraticCurveTo(p.x+dx*len*.5+n.x*30,p.y+dy*len*.5+n.y*30,p.x+dx*len,p.y+dy*len).quadraticCurveTo(p.x+dx*len*.6-n.x*24,p.y+dy*len*.6-n.y*24,p.x,p.y).fill({color:WHITE,alpha:alpha*.25}).stroke({color:GOLD,width:1,alpha:alpha*.5});
 }
 g.poly([p.x-30,p.y-14,p.x-34,p.y-73,p.x-9,p.y-44,p.x+9,p.y-44,p.x+34,p.y-73,p.x+30,p.y-14,p.x,p.y+15]).fill({color:WHITE,alpha:alpha*.7}).stroke({color:GOLD,width:2,alpha});
 line(g,{x:p.x-21,y:p.y-24},{x:p.x-8,y:p.y-18},3,RED,alpha);line(g,{x:p.x+21,y:p.y-24},{x:p.x+8,y:p.y-18},3,RED,alpha);
}
/** One pooled Graphics per cast. No texture assets or independent simulation clock. */
export class SancaiRenderer{
 root=new Container();items=new Map<number,Graphics>();private spare:Graphics[]=[];
 clear(){for(const g of this.items.values()){g.clear();g.visible=false;this.spare.push(g);}this.items.clear();}
 update(skills:Skill[]){
  const active=skills.filter(s=>s.sancai),ids=new Set(active.map(s=>s.id));
  for(const [id,g] of this.items)if(!ids.has(id)){this.items.delete(id);g.clear();g.visible=false;if(this.spare.length<12)this.spare.push(g);else g.destroy();}
  for(const s of active){let g=this.items.get(s.id);if(!g){g=this.spare.pop()??new Graphics();this.root.addChild(g);this.items.set(s.id,g);}g.visible=true;g.clear();
   const t=s.sancai!,cfg=SANCAI_STAGES[t.level-1],fade=clamp((s.duration-s.age)/SANCAI.fade);
   if(t.form==='small'){
    if(s.age<t.splitAt){
     const spin=clamp((s.age-t.arrival)/cfg.spinDuration),angle=t.angle+(s.age<t.arrival?s.age*8:spin*cfg.spinTurns*Math.PI*2),size=cfg.size*clamp(s.age/SANCAI.launch);
     if(t.phase==='flight')line(g,{x:t.position.x-s.direction.x*size*2,y:t.position.y-s.direction.y*size*2},t.position,size*.4,GOLD,.35);
     if(t.phase==='spin'){
      g.circle(t.destination.x,t.destination.y,size*1.8).stroke({color:GOLD,width:1,alpha:.35});
      for(let i=0;i<3;i++){const a=angle+i*Math.PI*2/3,r=size*1.45;g.moveTo(t.position.x+Math.cos(a)*r,t.position.y+Math.sin(a)*r).arc(t.position.x,t.position.y,r,a,a+.9).stroke({color:i%2?RED:GOLD,width:2,alpha:.7});}
      if(t.level>=3)blade(g,t.position,size*1.28,-angle,t.level,.18);
     }
     blade(g,t.position,size,angle,t.level,fade);
    }else{
     const burst=clamp(1-(s.age-t.splitAt)/.24);if(burst)g.circle(t.destination.x,t.destination.y,cfg.size*(1+(1-burst)*1.5)).stroke({color:GOLD,width:3,alpha:burst});
     for(const p of t.children){if(p.done){if(p.impact){line(g,{x:p.x-10,y:p.y-16},{x:p.x+10,y:p.y+16},2,WHITE,fade*.5);}continue;}
      for(let k=0;k<(t.level>=3?3:1);k++){const back=14+k*12;line(g,{x:p.x-Math.cos(p.angle)*back,y:p.y-Math.sin(p.angle)*back},p,(t.level>=3?4:2)-k,GOLD,fade*(.45-k*.1));}
      blade(g,p,cfg.size*.65,p.angle+s.age*5,t.level,fade);
     }
    }
   }else{
    const points=t.triangle.vertices,appear=clamp(s.age/cfg.gather),strike=clamp((s.age-cfg.gather)/cfg.strike),timeline=sancaiArrayTimeline(t.level),end=timeline.strikeEnd;
    const center=t.triangle.center,pulse=.7+.3*Math.sin(s.age*3.5),strength=appear*fade;
    // The drawn triangle stays planted; only its inner sigil and edge light move.
    g.poly(points.flatMap(p=>[p.x,p.y])).fill({color:RED,alpha:strength*(.055+.025*pulse)});
    for(const scale of [.82,.92])g.poly(points.flatMap(p=>[center.x+(p.x-center.x)*scale,center.y+(p.y-center.y)*scale])).stroke({color:scale===.82?RED:GOLD,width:1,alpha:strength*.3});
    const radius=Math.min(42+t.level*3,Math.min(...points.map(p=>Math.hypot(p.x-center.x,p.y-center.y)))*.4);
    const rune=Array.from({length:3},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/3+s.age*.35;return {x:center.x+Math.cos(a)*radius,y:center.y+Math.sin(a)*radius};});
    g.poly(rune.flatMap(p=>[p.x,p.y])).stroke({color:GOLD,width:2,alpha:strength*.65});
    g.circle(center.x,center.y,radius*.52).stroke({color:RED,width:1.5,alpha:strength*.6});
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line(g,{x:center.x+Math.cos(a)*radius*.16,y:center.y+Math.sin(a)*radius*.16},{x:center.x+Math.cos(a)*radius*.4,y:center.y+Math.sin(a)*radius*.4},2,GOLD,strength*.7);}
    points.forEach((p,i)=>{
     const next=points[(i+1)%3];line(g,p,next,2,GOLD,strength*(.45+pulse*.15));
     const along=(s.age*.35+i/3)%1,tail=Math.max(0,along-.14);line(g,{x:p.x+(next.x-p.x)*tail,y:p.y+(next.y-p.y)*tail},{x:p.x+(next.x-p.x)*along,y:p.y+(next.y-p.y)*along},3,WHITE,strength*.7);
     const a=Math.atan2(t.strikePoint.y-p.y,t.strikePoint.x-p.x),seal=clamp(appear*3-i*.2);
     g.circle(p.x,p.y,17+t.level*2+pulse*2).stroke({color:RED,width:2,alpha:fade*seal});sword(g,p,21+t.level*3,a,fade*seal);
     if(t.level===4){const dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx;for(const sign of [-1,1])line(g,{x:p.x+nx*sign*25-dx*30,y:p.y+ny*sign*25-dy*30},{x:p.x+nx*sign*25+dx*30,y:p.y+ny*sign*25+dy*30},4,RED,fade*.75);line(g,{x:p.x+nx*25-dx*30,y:p.y+ny*25-dy*30},{x:p.x-nx*25-dx*30,y:p.y-ny*25-dy*30},4,GOLD,fade*.9);}
     if(strike>0){const tip={x:p.x+(t.strikePoint.x-p.x)*strike,y:p.y+(t.strikePoint.y-p.y)*strike},alpha=fade*clamp(1-(s.age-end)/.2);line(g,p,tip,cfg.pathWidth,GOLD,alpha*.3);line(g,p,tip,cfg.pathWidth*.35,WHITE,alpha);sword(g,tip,22+t.level*4,a,alpha);}
    });
    if(s.age>=end){const flash=clamp(1-(s.age-end)/.18);g.circle(t.strikePoint.x,t.strikePoint.y,8+(1-flash)*34).fill({color:WHITE,alpha:flash*.65});}
    if(cfg.cut&&s.age>=timeline.sustainEnd){const u=clamp((s.age-timeline.sustainEnd)/SANCAI.cutDuration),p=t.strikePoint;line(g,{x:p.x-55*u,y:p.y+35*u},{x:p.x+55*u,y:p.y-35*u},5,WHITE,fade*clamp(1-(s.age-timeline.cutEnd)*8));}
    if(cfg.finish){fox(g,{x:t.triangle.center.x,y:t.triangle.center.y-30},(.16+.14*pulse)*strength);const u=clamp((s.age-timeline.cutEnd)/SANCAI.finishDuration);if(u>0){const p=t.strikePoint;g.poly([p.x-120*u,p.y-32,p.x-110*u,p.y-49,p.x+120*u,p.y+32,p.x+110*u,p.y+49]).fill({color:WHITE,alpha:fade*.75}).stroke({color:GOLD,width:2,alpha:fade});line(g,{x:p.x-105*u,y:p.y-33},{x:p.x+105*u,y:p.y+33},3,RED,fade);}}
   }
  }
 }
}
