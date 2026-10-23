import {Container,Graphics,Text} from 'pixi.js';
import type {SceneSeal,SceneMode} from '../gameplay/scene-seal';
import type {Arena} from '../input/line-interaction-geometry';
import {drawPaperTiger,PaperTigerRenderer} from './paper-tiger';
const GOLD=0xe7ba68,PAPER=0xffedcb,RED=0xbe392b,INK=0x20272a;
function label(parent:Container,value:string,size:number){const t=new Text({text:value,style:{fontFamily:['KaiTi','STKaiti','serif'],fontSize:size,fill:GOLD,align:'center',stroke:{color:INK,width:2}}});t.anchor.set(.5);parent.addChild(t);return t;}
function card(g:Graphics,x:number,y:number,alpha=1,scale=1,kind:SceneMode='seal'){
 g.save().transform(scale,0,0,scale,x,y);
 g.roundRect(-32,-41,64,82,5).fill({color:PAPER,alpha}).stroke({color:GOLD,width:2,alpha});
 g.rect(-25,-34,50,68).stroke({color:RED,width:1,alpha:alpha*.6});
 if(kind==='fire')flame(g,0,-3,.75,alpha);
 else if(kind==='chain')g.moveTo(-19,17).lineTo(14,-21).lineTo(4,0).lineTo(21,-8).lineTo(-8,23).stroke({color:RED,width:4,alpha,cap:'round',join:'round'});
 else if(kind==='beast'){g.save().transform(.25,0,0,.25,3,12);drawPaperTiger(g,true,false);g.restore();}
 else g.moveTo(-21,-8).lineTo(-8,-8).lineTo(0,-21).lineTo(8,-8).lineTo(21,-8).moveTo(-18,6).lineTo(-8,6).lineTo(0,18).lineTo(8,6).lineTo(18,6).moveTo(0,-5).lineTo(0,6).stroke({color:RED,width:3,alpha,cap:'round',join:'round'});
 g.circle(0,28,3).fill({color:RED,alpha});g.restore();
}
function flame(g:Graphics,x:number,y:number,size:number,alpha=1){
 g.save().transform(size,0,0,size,x,y);g.ellipse(0,18,24,8).fill({color:RED,alpha:alpha*.22});
 g.moveTo(0,23).bezierCurveTo(-28,12,-18,-8,-7,-13).quadraticCurveTo(-9,0,-3,0).quadraticCurveTo(12,-14,7,-35).bezierCurveTo(39,-5,23,24,0,23).fill({color:0xdd4825,alpha}).stroke({color:GOLD,width:1.5,alpha});
 g.moveTo(0,17).quadraticCurveTo(-11,2,4,-12).quadraticCurveTo(4,2,12,4).quadraticCurveTo(17,16,0,17).fill({color:0xffd884,alpha});g.restore();
}

export class SceneSealRenderer{
 root=new Container();private art=new Graphics();private silhouette=new Graphics();private beast=new PaperTigerRenderer();private title=label(this.root,'残缺封印',23);private hint=label(this.root,'笔迹经过就点亮 · 随时停笔',17);private tray=label(this.root,'符 匣',17);private state=label(this.root,'补全封印，获得破印符',17);
 constructor(){drawPaperTiger(this.silhouette);this.root.addChildAt(this.silhouette,0);this.root.addChildAt(this.art,1);this.root.addChild(this.beast.root);}
 update(m:SceneSeal,bounds:Arena,time:number,enabled:boolean,inventory:SceneSeal[]=[m]){
  this.root.visible=enabled;if(!enabled)return;const g=this.art;g.clear();
  this.beast.update(inventory.find(s=>s.mode==='beast')?.beast??m.beast,bounds);
  const c=m.center(bounds),slot=m.slot(bounds),repairing=m.phase==='repairing',collecting=m.phase==='collecting',fading=collecting?Math.max(0,1-m.age/.6):repairing?1:0;
  this.title.visible=this.hint.visible=fading>0;this.title.position.set(c.x,c.y-(m.mode==='seal'?139:m.mode==='chain'?125:176));this.hint.position.set(c.x,c.y+(m.mode==='beast'?225:m.mode==='fire'?154:127));this.title.alpha=this.hint.alpha=fading;
  this.title.text=collecting?m.mode==='beast'?'山虎苏醒':m.mode==='fire'?`收拢 ${m.power} 团妖火`:m.mode==='chain'?'锁链尽断':'封印已复原':m.info.title;
  this.hint.text=m.info.hint;
  this.silhouette.visible=m.mode==='beast'&&fading>0;this.silhouette.position.set(c.x+25,c.y+175-(collecting?m.age*70:0));this.silhouette.scale.set(2.5);this.silhouette.tint=PAPER;this.silhouette.alpha=(.28+m.progress*.4)*fading;
  if(fading>0&&m.mode==='seal'){
   g.poly([c.x-170,c.y-109,c.x+154,c.y-116,c.x+176,c.y+72,c.x+148,c.y+96,c.x-158,c.y+91,c.x-177,c.y-79]).fill({color:INK,alpha:.28*fading}).stroke({color:GOLD,width:1,alpha:.18*fading});
   g.circle(c.x,c.y-8,116).stroke({color:GOLD,width:1,alpha:.16*fading});
   for(let i=0;i<8;i++){const a=i*Math.PI/4,x=c.x+Math.cos(a)*118,y=c.y-8+Math.sin(a)*118;g.moveTo(x,y).lineTo(c.x+Math.cos(a)*126,c.y-8+Math.sin(a)*126).stroke({color:GOLD,width:2,alpha:.28*fading});}
   for(const mark of m.marks){
    const a={x:c.x+mark.a.x,y:c.y+mark.a.y},b={x:c.x+mark.b.x,y:c.y+mark.b.y};
    if(mark.lit)g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:GOLD,width:13,alpha:(.16+m.flash*.35)*fading,cap:'round'});
    g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:mark.lit?GOLD:0xba9c67,width:mark.lit?5:4,alpha:(mark.lit?1:.47+.08*Math.sin(time*2))*fading,cap:'round',join:'round'});
    if(mark.lit)g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:PAPER,width:1.4,alpha:.9*fading,cap:'round'});
   }
   if(collecting)g.circle(c.x,c.y,45+m.age*170).stroke({color:GOLD,width:3,alpha:Math.max(0,1-m.age/.6)});
  }
  if(fading>0&&m.mode==='beast'){
   for(const mark of m.marks){const a={x:c.x+mark.a.x,y:c.y+mark.a.y},b={x:c.x+mark.b.x,y:c.y+mark.b.y};
    g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:INK,width:15,alpha:.35*fading,cap:'round'});
    if(mark.lit)g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:GOLD,width:18,alpha:.14*fading,cap:'round'});
    g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:mark.lit?PAPER:GOLD,width:mark.lit?5:3,alpha:(mark.lit?1:.65)*fading,cap:'round'});
   }
   if(collecting){g.circle(c.x+180,c.y+15,7).fill(PAPER);g.circle(c.x+180,c.y+15,20+m.age*35).stroke({color:GOLD,width:2,alpha:fading});}
  }
  if(fading>0&&m.mode==='chain'){
   for(let i=0;i<m.marks.length;i+=3){const mark=m.marks[i];if(mark.lit)continue;
    const x=c.x+(mark.a.x+mark.b.x)/2,y=c.y+(mark.a.y+mark.b.y)/2,angle=Math.atan2(mark.b.y-mark.a.y,mark.b.x-mark.a.x),cos=Math.cos(angle),sin=Math.sin(angle);
    g.save().transform(cos,sin,-sin,cos,x,y).ellipse(0,0,14,8).stroke({color:INK,width:7,alpha:fading}).ellipse(0,0,14,8).stroke({color:0xa9a395,width:3.5,alpha:fading}).moveTo(-6,-4).lineTo(5,-4).stroke({color:PAPER,width:1,alpha:.55*fading}).restore();
   }
   for(const path of m.paths)for(const p of [path[0],path.at(-1)!]){const x=c.x+p.x,y=c.y+p.y;g.roundRect(x-10,y-10,20,20,3).fill({color:INK,alpha:fading}).stroke({color:GOLD,width:2,alpha:fading});}
   this.hint.text=`长斩扫过链身 · 已斩断 ${Math.round(m.progress*100)}%`;
  }
  if(m.mode==='chain'){
   for(const f of m.fragments){const a=f.age,x=c.x+f.x+Math.cos(f.angle)*a*105,y=c.y+f.y-Math.sin(f.angle)*a*80+a*a*130;g.save().transform(Math.cos(f.angle+a*6),Math.sin(f.angle+a*6),-Math.sin(f.angle+a*6),Math.cos(f.angle+a*6),x,y).ellipse(0,0,7,4).stroke({color:GOLD,width:2,alpha:1-a/.75}).restore();}
   for(const s of m.sweeps){g.moveTo(s.a.x,s.a.y).lineTo(s.b.x,s.b.y).stroke({color:GOLD,width:17,alpha:.2*(1-s.age/.6)}).moveTo(s.a.x,s.a.y).lineTo(s.b.x,s.b.y).stroke({color:PAPER,width:4,alpha:1-s.age/.6});}
  }
  if(m.mode==='fire'&&(repairing||collecting)){
   const target=m.captureCenter??c,t=collecting?Math.min(1,m.age/.75):0;
   for(const [i,p] of m.flames.entries()){
    const captured=m.captured.has(i),start={x:c.x+p.x,y:c.y+p.y};let x=start.x,y=start.y;
    if(collecting&&captured){const dx=start.x-target.x,dy=start.y-target.y,a=t*4;x=target.x+(dx*Math.cos(a)-dy*Math.sin(a))*(1-t);y=target.y+(dx*Math.sin(a)+dy*Math.cos(a))*(1-t);}
    flame(g,x,y+Math.sin(time*3+i)*5,(.85+.08*Math.sin(time*4+i))*(captured?1-t*.75:1),collecting?captured?1-t:Math.max(0,1-t*1.5):1);
   }
   if(collecting){const radius=170*(1-t)+20;g.circle(target.x,target.y,radius).stroke({color:RED,width:8,alpha:1-t}).circle(target.x,target.y,radius+8).stroke({color:GOLD,width:2,alpha:1-t});}
  }
  this.tray.position.set(360,slot.y-61);this.state.position.set(360,slot.y-85);
  const reward=m.info.reward;
  this.state.text=repairing?m.mode==='fire'?'小圈先收一团，或大圈聚成强火符':`完成${m.mode==='chain'?'断链':m.mode==='beast'?'补灵':'封印'}，获得${reward}`:collecting?`${reward} · 正在入匣`:m.phase==='stored'?`${reward}${m.mode==='fire'?` · ${m.power} 火之力`:''} · 拖出使用`:'已释放 · 点右侧重现按钮再试';
  for(let i=0;i<3;i++){const p=m.slot(bounds,i),filled=inventory.some(s=>s.phase==='stored'&&s.slotIndex===i);g.roundRect(p.x-36,p.y-44,72,88,7).fill({color:INK,alpha:.72}).stroke({color:GOLD,width:1,alpha:filled?.8:.25});if(!filled)g.circle(p.x,p.y,2).fill({color:GOLD,alpha:.35});}
  for(const stored of inventory){
   const origin=stored.center(bounds),destination=stored.slot(bounds);
   if(stored.phase==='collecting'){const t=Math.max(0,Math.min(1,(stored.age-.2)/.7)),u=t*t*(3-2*t);card(g,origin.x+(destination.x-origin.x)*u,origin.y+(destination.y-origin.y)*u,1,.85+.15*u,stored.mode);}
   if(stored.phase==='stored'&&!stored.dragPoint)card(g,destination.x,destination.y,1,1,stored.mode);
   if(stored.dragPoint){
    const p=stored.dragPoint,ready=stored.validTarget(p,bounds)&&p.y<destination.y-70;
    if(ready){if(stored.mode==='chain')g.roundRect(p.x-260,p.y-65,520,130,18).fill({color:RED,alpha:.09}).stroke({color:GOLD,width:2,alpha:.8});else if(stored.mode==='beast')g.ellipse(p.x,p.y,60,24).fill({color:RED,alpha:.12}).stroke({color:GOLD,width:2});else g.circle(p.x,p.y,stored.radius).fill({color:RED,alpha:.09}).stroke({color:GOLD,width:2,alpha:.8});g.circle(p.x,p.y,12).stroke({color:GOLD,width:2});}
    card(g,p.x,p.y,.95,.85,stored.mode);this.state.text=ready?`松手${stored.mode==='beast'?'召唤山虎':'释放'+stored.info.reward}`:'拖回符匣或移出画布可取消';
   }
  }
  for(const stored of inventory)for(const burst of stored.bursts){const p=burst.center,t=Math.min(1,burst.age/.5),fade=Math.max(0,1-burst.age/.85),radius=burst.kind==='fire'?115+burst.power*18:135;
   if(burst.kind==='chain'){g.moveTo(p.x-260,p.y+20).lineTo(p.x+260,p.y-20).stroke({color:GOLD,width:30*(1-t)+4,alpha:fade*.5}).moveTo(p.x-260,p.y+20).lineTo(p.x+260,p.y-20).stroke({color:PAPER,width:5,alpha:fade});continue;}
   g.circle(p.x,p.y,radius*t).fill({color:RED,alpha:.13*fade}).stroke({color:GOLD,width:7*(1-t)+2,alpha:fade});g.circle(p.x,p.y,radius*.83*t).stroke({color:PAPER,width:2,alpha:fade*.8});
   for(let i=0;i<12;i++){const a=i*Math.PI/6,r=30+(radius-20)*t;g.moveTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r).lineTo(p.x+Math.cos(a)*(r+17),p.y+Math.sin(a)*(r+17)).stroke({color:GOLD,width:3,alpha:fade});if(burst.kind==='fire'&&i%2===0)flame(g,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,.7*fade,fade);}
  }
 }
}
