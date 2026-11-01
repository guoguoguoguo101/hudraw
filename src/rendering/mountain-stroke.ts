import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {SWEEP_TIERS} from '../gameplay/mountain-stroke';
import {strokeTitle} from '../gameplay/hualing-combo';

const RED=0xb9442c,CREAM=0xffebbd,INK=0x1c3033,GOLD=0xe8b875;
function label(size:number){const t=new Text({text:'',style:{fontFamily:['KaiTi','STKaiti','serif'],fontSize:size,fontWeight:'bold',fill:CREAM,stroke:{color:INK,width:4},align:'center'}});t.anchor.set(.5);return t;}

/** Cut-paper role markers, actual-path sweep echoes and ink flowing back to the brush. */
export class MountainStrokeRenderer{
 readonly root=new Container();private art=new Graphics();private seal=new Container();private sealArt=new Graphics();
 private title=label(40);private hint=label(20);private notices=Array.from({length:12},()=>label(22));
 constructor(){this.root.eventMode='none';this.root.addChild(this.art,...this.notices,this.seal);this.seal.addChild(this.sealArt,this.title,this.hint);this.hint.y=40;}
 update(g:Game){
  const c=g.campaign,m=c.brush,now=c.age,b=g.hualing.bounds;
  this.root.visible=c.levelId!==null&&(g.active||g.state==='paused'||g.state==='win');if(!this.root.visible)return;
  const a=this.art;a.clear();
  for(const e of g.enemies){const t=e.mountain;if(!t||e.elite||e.chapterBoss)continue;
   const r=26,theta=Math.atan2(t.facing.y,t.facing.x);
   if(t.role==='armor'&&!t.broken){
    for(let i=0;i<3;i++){const x=e.x+(i-1)*14,y=e.y-23-Math.abs(i-1)*3;a.poly([x-8,y-8,x+8,y-8,x+7,y+4,x,y+10,x-7,y+4]).fill({color:0x536b76,alpha:.94}).stroke({color:GOLD,width:1.5});}
   }else if(t.role==='shield'&&!t.broken){
    const start=theta-1,end=theta+1;a.moveTo(e.x+Math.cos(start)*r,e.y+Math.sin(start)*r).arc(e.x,e.y,r,start,end).stroke({color:GOLD,width:6,alpha:.9});
    a.moveTo(e.x+Math.cos(start)*(r+5),e.y+Math.sin(start)*(r+5)).arc(e.x,e.y,r+5,start,end).stroke({color:CREAM,width:1.5,alpha:.8});
   }else if(t.role==='eye'){
    const y=e.y-46,pulse=1+Math.sin(now*6)*.08;
    a.poly([e.x-10*pulse,y-16,e.x+10*pulse,y-16,e.x+10*pulse,y+13,e.x,y+20,e.x-10*pulse,y+13]).fill(RED).stroke({color:CREAM,width:1});
    a.poly([e.x,y-10,e.x+6,y,e.x,y+10,e.x-6,y]).stroke({color:CREAM,width:1.6});
    a.circle(e.x,e.y,35+Math.sin(now*5)*2).stroke({color:RED,width:1.4,alpha:.55});
    for(let i=0;i<4;i++){const q=i*Math.PI/2+now*.25;a.moveTo(e.x+Math.cos(q)*39,e.y+Math.sin(q)*39).lineTo(e.x+Math.cos(q)*44,e.y+Math.sin(q)*44).stroke({color:CREAM,width:2,alpha:.65});}
   }
   if(t.staggerUntil>now){for(let i=0;i<3;i++){const q=now*4+i*2.1,x=e.x+Math.cos(q)*23,y=e.y-31+Math.sin(q)*6;a.poly([x,y-4,x+3,y,x,y+4,x-3,y]).fill(GOLD);}}
  }
  for(let i=0;i<this.notices.length;i++){
   const t=this.notices[i],n=m.notices[i];t.visible=!!n;if(!n)continue;
   const age=now-n.at,alpha=Math.max(0,1-age/1.1);t.text={armor:'碎甲 · 再落一笔',blocked:'侧划破盾',shield:'破盾！',eye:'阵眼已破 · 妖群失衡'}[n.kind];
   t.position.set(Math.max(112,Math.min(608,n.x)),Math.max(b.top+42,n.y-67-age*22));t.alpha=alpha;
   if(n.kind==='eye'){const r=175*Math.min(1,age/.35);a.circle(n.x,n.y,r).stroke({color:RED,width:5*(1-age/1.1)+1,alpha:alpha*.65});}
   if(n.kind==='armor'||n.kind==='shield')for(let j=0;j<5;j++){const q=j*1.26,x=n.x+Math.cos(q)*age*90,y=n.y-16+Math.sin(q)*age*75+age*age*40;a.poly([x,y-4,x+5,y,x,y+5,x-4,y]).fill({color:GOLD,alpha});}
  }
  const trailAlpha=Math.max(0,1-(now-m.lastTrace)/.32),boost=m.inkBoostUntil>now;
  if((m.tier>0||boost)&&m.path.length>1&&trailAlpha>0){
   const points=m.path.slice(-32);
   for(const [width,color,alpha] of [[boost?15:11,INK,.27],[boost?4:2,boost?0x8cddd2:RED,.6]]){a.moveTo(points[0].x,points[0].y);for(const p of points)a.lineTo(p.x,p.y);a.stroke({color,width,alpha:alpha*trailAlpha,cap:'round',join:'round'});}
  }
  for(const f of m.flows){const age=now-f.at;
   for(let j=0;j<7;j++){
    const u=Math.max(0,Math.min(1,(age-j*.027)/.4));if(u<=0||u>=1)continue;
    const x=f.from.x+(f.to.x-f.from.x)*u+Math.sin(u*Math.PI)*36,y=f.from.y+(f.to.y-f.from.y)*u-Math.sin(u*Math.PI)*40;
    a.ellipse(x,y,6-j*.5,9-j*.7).fill({color:j%2?0x74cabe:0x254d54,alpha:1-u*.5});
   }
   if(age>.35&&age<.65)a.circle(f.to.x,f.to.y,8+(age-.35)*65).stroke({color:0xa1e3d6,width:3,alpha:(.65-age)*2});
  }
  const live=m.active&&m.kills>=3,result=m.result,shown=live?{...m.tip,kills:m.kills,tier:m.tier,ink:0,at:m.tierAt,cancelled:false}:result;
  this.seal.visible=!!shown&&!shown.cancelled&&shown.kills>=2;
  if(shown&&this.seal.visible){
   const age=now-shown.at,scale=live?.8:Math.min(1,.76+age*2),alpha=live?1:Math.max(0,Math.min(1,(2-age)*2));
   this.seal.position.set(live?552:Math.max(160,Math.min(560,shown.x)),live?b.top+92:Math.max(b.top+92,Math.min(b.bottom-90,shown.y-88)));this.seal.scale.set(scale);this.seal.alpha=alpha;
   const tier=shown.tier;this.title.style.fontSize=tier===3?51:tier===2?44:37;this.title.text=strokeTitle(shown.kills);
   const next=SWEEP_TIERS[tier];this.hint.text=live?(next?`再斩${next.kills-shown.kills}妖 · 升一档`:'抬笔落印 · 回墨＋10'):`${tier?SWEEP_TIERS[tier-1].label:'落笔斩妖'}${shown.ink>0?' · 回墨＋'+Math.round(shown.ink):''}`;
   this.sealArt.clear();for(let i=0;i<3;i++)this.sealArt.poly([-137+i*4,-23+i*12,120,-31+i*12,143-i*4,-11+i*12,-127,7+i*12]).fill({color:INK,alpha:.55});
   if(tier>=2)this.sealArt.roundRect(112,-28,32,48,2).fill(RED).stroke({color:CREAM,width:1.5});
   if(tier===3)this.sealArt.rect(-145,-37,290,95).stroke({color:RED,width:3,alpha:.7});
  }
 }
}
