import {FoxVestment} from './fox-vestment';
import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import type {SpiritArrow} from '../gameplay/arrows';
const WHITE=0xfff3d5,GOLD=0xe7ba68,RED=0xb73f37,INK=0x242326;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function paper(g:Graphics,x:number,y:number,a:number,t:number){
 const c=Math.cos(a),s=Math.sin(a),point=(u:number,v:number)=>({x:x+u*c-v*s,y:y+u*s+v*c});
 const pts=[point(-7,-13),point(7,-13),point(7,13),point(-7,13)];g.poly(pts.flatMap(p=>[p.x,p.y])).fill(RED).stroke({color:GOLD,width:1});
 for(let i=0;i<3;i++){const p=point(-4,-8+i*5),q=point(4,-8+i*5),r=point(i%2?4:-4,-4+i*5);g.moveTo(p.x,p.y).lineTo(q.x,q.y).lineTo(r.x,r.y).stroke({color:WHITE,width:1,alpha:.8});}
 const p=point(0,15);g.moveTo(p.x,p.y).lineTo(p.x+Math.sin(t*4)*4,p.y+7).stroke({color:RED,width:1});
}
function cloud(g:Graphics,x:number,y:number,k:number,a=.8){
 g.moveTo(x-20*k,y+4*k).bezierCurveTo(x-32*k,y-9*k,x-10*k,y-13*k,x-8*k,y-7*k)
 .bezierCurveTo(x-12*k,y-29*k,x+20*k,y-26*k,x+17*k,y-8*k)
 .bezierCurveTo(x+38*k,y-14*k,x+38*k,y+9*k,x+15*k,y+9*k)
 .lineTo(x-20*k,y+9*k).fill({color:WHITE,alpha:a});
 g.moveTo(x-16*k,y+2*k).bezierCurveTo(x-22*k,y-8*k,x-4*k,y-6*k,x-5*k,y)
 .moveTo(x+1*k,y-6*k).bezierCurveTo(x-3*k,y-20*k,x+17*k,y-16*k,x+12*k,y-5*k)
 .stroke({color:GOLD,width:.8,alpha:a});
}
function arrowArt(level:number){
 const g=new Graphics(),length=[110,134,150][level-1],tail=-length,head=level===1?21:level===2?25:30;
 // Sculpted open barbs and an ivory spear point, with a cinnabar quatrefoil seal.
 g.poly([10,0,-31,-head,-20,-5,-62,-13,-44,0,-62,13,-20,5,-31,head]).fill(RED).stroke({color:GOLD,width:1.4});
 g.poly([17,0,-32,-head-4,-21,-9,-45,0,-21,9,-32,head+4]).fill(WHITE).stroke({color:GOLD,width:1.2});
 g.poly([10,0,-25,-13,-18,-3,-35,0,-18,3,-25,13]).fill(RED);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;g.ellipse(-19+Math.cos(a)*5,Math.sin(a)*5,3.8,3.8).fill(WHITE);}g.circle(-19,0,2.4).fill(INK);
 g.moveTo(tail,0).lineTo(-36,0).stroke({color:RED,width:6}).moveTo(tail,0).lineTo(-36,0).stroke({color:GOLD,width:3.4}).moveTo(tail,0).lineTo(11,0).stroke({color:WHITE,width:1.4});
 for(const sign of [-1,1]){
  g.poly([tail+34,0,tail+2,sign*27,tail+12,sign*9,tail-6,sign*16,tail+3,sign*2]).fill(level===1?GOLD:RED).stroke({color:GOLD,width:1});
  g.poly([tail+32,sign*2,tail+8,sign*21,tail+15,sign*8]).fill(WHITE);
  for(let i=0;i<3;i++)g.moveTo(tail+13+i*5,sign*5).lineTo(tail+3+i*7,sign*(15-i*2)).stroke({color:GOLD,width:.7});
 }
 for(let i=0;i<5;i++){const x=-52-i*10;g.moveTo(x-4,-3).lineTo(x,0).lineTo(x-4,3).stroke({color:WHITE,width:.8});}
 if(level>=2){g.circle(-46,0,5).stroke({color:GOLD,width:1});g.poly([-46,-4,-42,0,-46,4,-50,0]).fill(RED);}
 return g;
}
type Item={root:Container;back?:Container;trail:Graphics;seal:Graphics;burst:Graphics;arrows:Container[];hero?:FoxVestment;ornaments:Graphics[]};
/** All geometry and trails are driven by the same projectile state that deals damage. */
export class ArrowRenderer{
 root=new Container();back=new Container();items=new Map<number,Item>();
 constructor(){for(const layer of [this.root,this.back]){const mask=new Graphics().rect(0,175,720,1005).fill(0xffffff);layer.addChild(mask);layer.mask=mask;}}
 make(s:Skill){
  const item:Item={root:new Container(),trail:new Graphics(),seal:new Graphics(),burst:new Graphics(),arrows:[],ornaments:[]};
  item.root.addChild(item.seal,item.trail);const lv=s.arrows!.level;
  if(lv===4){item.hero=new FoxVestment();item.root.addChild(item.hero.root);item.back=item.hero.back;this.back.addChild(item.back);}
  else for(const p of s.arrows!.projectiles){const a=new Container(),ornament=new Graphics();a.addChild(arrowArt(lv),ornament);item.arrows.push(a);item.ornaments.push(ornament);item.root.addChild(a);}
  item.root.addChild(item.burst);this.root.addChild(item.root);this.items.set(s.id,item);return item;
 }
 update(skills:Skill[]){
  const live=new Set(skills.filter(s=>s.rune==='triangle'&&s.arrows).map(s=>s.id));for(const [id,item] of this.items)if(!live.has(id)){item.root.destroy({children:true});item.back?.destroy({children:true});this.items.delete(id);}
  for(const s of skills){if(s.rune!=='triangle'||!s.arrows||(s.arrows.level<4&&!s.arrows.projectiles.length))continue;const item=this.items.get(s.id)??this.make(s),lv=s.arrows.level,t=s.age;
   item.trail.clear();item.seal.clear();item.burst.clear();
   if(lv===4){
    item.hero!.update(s);
    continue;
   }

   const summon=clamp(t/.2),fade=1-clamp((t-.3)/.35),radius=50*(.7+.3*summon);
   if(fade>0){const g=item.seal;g.circle(s.x,s.y,radius).stroke({color:GOLD,width:1.3,alpha:fade*.8}).circle(s.x,s.y,radius-7).stroke({color:RED,width:3,alpha:fade*.55});
    for(let i=0;i<(lv+2);i++){const a=i*Math.PI*2/(lv+2)+t*.8,x=s.x+Math.cos(a)*radius,y=s.y+Math.sin(a)*radius;g.moveTo(x,y).lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7).stroke({color:WHITE,width:1.3,alpha:fade});}
   }
   s.arrows.projectiles.forEach((p,i)=>{
    const arrow=item.arrows[i],ornament=item.ornaments[i],age=t-p.launch,tailFade=p.done?1-clamp((t-p.impactAt)/.5):1;
    arrow.position.set(p.x,p.y);arrow.rotation=p.angle;arrow.alpha=p.done?0:clamp(t/.15);arrow.scale.set(p.done?1:age<0?.65+.35*clamp(t/p.launch):1);
    ornament.clear();if(lv>=2&&!p.done){for(const sign of [-1,1]){const sway=Math.sin(t*7+i+sign)*5;ornament.moveTo(-34,sign*8).bezierCurveTo(-65,sign*(18+sway),-94,sign*30,-137,sign*(21+sway)).bezierCurveTo(-112,sign*42,-70,sign*29,-34,sign*8).fill({color:RED,alpha:.72});ornament.moveTo(-45,sign*12).bezierCurveTo(-76,sign*30,-109,sign*17,-148,sign*39).stroke({color:GOLD,width:1.1,alpha:.85});}cloud(ornament,-110,27+Math.sin(t*4)*3,.3);}
    this.drawTrail(item.trail,p,lv,t,tailFade);
    if(p.done&&p.impact&&t-p.impactAt<.55)this.drawImpact(item.burst,p,lv,t-p.impactAt);
   });
  }
 }
 drawTrail(g:Graphics,p:SpiritArrow,lv:number,t:number,fade:number){
  const points=p.trail;if(points.length<2||fade<=0)return;
  for(const sign of [-1,1]){
   const edges=points.map((v,j)=>{const next=points[Math.min(j+1,points.length-1)],prev=points[Math.max(0,j-1)],a=Math.atan2(next.y-prev.y,next.x-prev.x),u=j/(points.length-1),w=Math.sin(u*Math.PI)*(lv*7)*(1+Math.sin(t*8+j*.45)*.2);return {x:v.x-Math.sin(a)*w*sign,y:v.y+Math.cos(a)*w*sign};});
   g.moveTo(points[0].x,points[0].y);for(const v of edges)g.lineTo(v.x,v.y);for(const v of [...points].reverse())g.lineTo(v.x,v.y);g.closePath().fill({color:sign===1?RED:GOLD,alpha:fade*(sign===1?.54:.28)});
   g.moveTo(edges[0].x,edges[0].y);for(const v of edges)g.lineTo(v.x,v.y);g.stroke({color:sign===1?GOLD:WHITE,width:1,alpha:fade*.8});
  }
  g.moveTo(points[0].x,points[0].y);for(const v of points)g.lineTo(v.x,v.y);g.stroke({color:GOLD,width:7,alpha:fade*.15}).stroke({color:WHITE,width:1.5,alpha:fade*.9});
  if(lv>=2){for(let j=4;j<points.length-5;j+=9){const v=points[j],side=j%2?1:-1;cloud(g,v.x+side*12,v.y+side*18,.28,fade*.65);if(lv>=3)paper(g,v.x-side*20,v.y+side*12,t*.8+j,t);}}
 }
 drawImpact(g:Graphics,p:SpiritArrow,lv:number,t:number){
  const u=clamp(t/.55),a=1-u,r=35*(1+u*.7);
  g.circle(p.x,p.y,r).stroke({color:RED,width:3,alpha:a*.8}).circle(p.x,p.y,r+6).stroke({color:GOLD,width:1.2,alpha:a});
  if(lv>=3)for(let i=0;i<12;i++){const angle=i*Math.PI/6,dx=Math.cos(angle),dy=Math.sin(angle),cx=p.x+dx*(r-11),cy=p.y+dy*(r-11);g.moveTo(cx-dy*4,cy+dx*4).lineTo(cx+dx*6-dy*4,cy+dy*6+dx*4).lineTo(cx+dx*6+dy*4,cy+dy*6-dx*4).lineTo(cx+dy*4,cy-dx*4).stroke({color:WHITE,width:1.2,alpha:a*.85});}
  for(let i=0;i<8;i++){const angle=i*Math.PI*2/8+p.index,dx=Math.cos(angle),dy=Math.sin(angle),distance=r*(.5+u*1.6);g.poly([p.x+dx*distance,p.y+dy*distance,p.x+dx*(distance+24)-dy*4,p.y+dy*(distance+24)+dx*4,p.x+dx*(distance+45),p.y+dy*(distance+45)]).fill({color:i%3===0?INK:i%2?RED:GOLD,alpha:a});}
  for(const sign of [-1,1])g.moveTo(p.x-r*1.3,p.y+sign*3).lineTo(p.x+r*1.3,p.y+sign*3).stroke({color:WHITE,width:1.3,alpha:a});

 }
 clear(){for(const item of this.items.values()){item.root.destroy({children:true});item.back?.destroy({children:true});}this.items.clear();}
}
