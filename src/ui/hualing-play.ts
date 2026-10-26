import {Container,Graphics,Sprite,type Texture,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {text} from './interface';
import {mapleEmblem} from '../rendering/petal-brush';
import {thunderBrushEmblem} from '../rendering/thunder-brush';
import {INK_COMPANION_TIERS} from '../gameplay/ink-companions';
const INK=0x20332f,GOLD=0xd8b678,PAPER=0xf5e6c8,RED=0xa34435;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
/** Playable presentation switch. It changes layout, never resets the run. */
export class HualingPlayUI{
 root=new Container();formal=false;private zones:Zone[]=[];private key='';private info?:Text;private timer?:Text;private health=new Graphics();private flower?:Text;private thunder?:Text;private companions?:Text;
 constructor(private game:Game,private cancel:()=>void,private pause:()=>void,private changed:(formal:boolean)=>void,private dragon:Texture){}
 handle(e:InputEvent){
  if(!this.root.visible||!this.game.active)return false;
  if(this.game.hualing.drawing||this.game.hualing.scenes.some(s=>s.dragPointer!==null))return false;
  if(e.kind!=='down')return false;
  const zone=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);
  if(zone){this.cancel();zone.run();this.key='';return true;}
  return false;
 }
 private button(label:string,x:number,y:number,w:number,h:number,run:()=>void){
  this.root.addChild(new Graphics().roundRect(x,y,w,h,8).fill({color:INK,alpha:.86}).stroke({color:GOLD,width:1,alpha:.55}));
  text(this.root,label,x+w/2,y+h/2,18,PAPER,{letterSpacing:1});this.zones.push({x,y,w,h,run});
 }
 update(footer:number,header:number){
  const g=this.game,m=g.hualing;this.root.visible=g.hualingPractice&&g.active;if(!this.root.visible)return;
  const key=JSON.stringify([this.formal,footer,header,m.selected,m.journey.chapter,m.upgrades.levels.trail]);
  if(this.key!==key){
   this.key=key;this.zones=[];this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.info=this.timer=this.flower=this.thunder=this.companions=undefined;this.health=new Graphics();
   this.button(this.formal?'切回测试':'正式界面',508,header+10,174,36,()=>{this.formal=!this.formal;if(m.upgrades.panel==='custom')m.upgrades.panel=null;this.changed(this.formal);});
   if(this.formal){
    this.button('成长试演',30,header+10,174,36,()=>{m.upgrades.panel='custom';});
    this.root.addChild(new Graphics().roundRect(24,header+56,672,84,16).fill({color:INK,alpha:.83}).stroke({color:GOLD,width:1,alpha:.25}));
    const title=text(this.root,'画 灵',81,header+84,27,PAPER,{letterSpacing:4});title.anchor.x=0;
    this.info=text(this.root,'',302,header+86,17,GOLD,{letterSpacing:0});
    this.timer=text(this.root,'',512,header+86,27,PAPER,{fontFamily:'Georgia',letterSpacing:1});
    this.button('Ⅱ',614,header+68,58,44,()=>this.pause());
    this.root.addChild(this.health);
    const y=footer+1148;
    this.root.addChild(new Graphics().roundRect(26,y-10,668,122,18).fill({color:INK,alpha:.87}).stroke({color:GOLD,width:1,alpha:.3}));
    const active=m.selected==='dragon';
    this.root.addChild(new Graphics().roundRect(42,y,158,100,10).fill(active?RED:PAPER).stroke({color:GOLD,width:active?2:1}));
    const head=new Sprite(this.dragon);head.anchor.set(.5);head.position.set(121,y+38);head.width=head.height=81;this.root.addChild(head);
    text(this.root,'游龙',121,y+81,23,active?PAPER:RED,{letterSpacing:3});this.zones.push({x:42,y,w:158,h:100,run:()=>m.selected?m.cancel():m.select('dragon')});
    text(this.root,m.upgrades.levels.trail&&!active?'挥笔唤墨团':'挥笔划妖',338,y+31,25,PAPER,{letterSpacing:3});
    text(this.root,m.upgrades.levels.trail&&!active?'墨团追妖 · 松手继续打':'选符 · 落笔 · 松手成龙',338,y+65,17,GOLD,{letterSpacing:0});
    if(m.upgrades.levels.trail&&!active)this.companions=text(this.root,'',338,y+92,14,PAPER,{letterSpacing:0});
    for(const [i,kind] of (['flower','thunder'] as const).entries()){
     const x=488+i*96,icon=new Graphics();this.root.addChild(new Graphics().circle(x+38,y+39,32).fill({color:0x34443d,alpha:.95}).stroke({color:GOLD,width:1,alpha:.7}));
     if(kind==='flower')mapleEmblem(icon);else thunderBrushEmblem(icon);icon.position.set(x+38,y+39);icon.scale.set(.61);this.root.addChild(icon);
     const label=text(this.root,kind==='flower'?'画符':'雷符',x+38,y+86,18,GOLD,{letterSpacing:0});if(kind==='flower')this.flower=label;else this.thunder=label;
     this.zones.push({x,y,w:76,h:100,run:()=>{m.cancel();if(kind==='flower')m.petals.activate();else m.thunder.activate();}});
    }
   }
  }
  if(this.formal){
   if(this.companions){const c=m.upgrades.trail.companions,tier=INK_COMPANION_TIERS[m.upgrades.levels.trail];this.companions.text=`伙伴 ${c.units.length}/${tier.count} · 凝墨 ${Math.min(100,Math.floor(c.progress/tier.distance*100))}%`;}
   this.info!.text=`${m.journey.info.name} · 斩妖 ${g.kills}`;
   const seconds=Math.floor(m.clock);this.timer!.text=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
   this.health.clear().roundRect(48,header+119,624,3,1).fill({color:PAPER,alpha:.13}).roundRect(48,header+119,Math.max(1,624*g.life/g.maxHp),3,1).fill({color:RED,alpha:.9});
   this.flower!.text=m.petals.active?`花 ${Math.ceil(m.petals.remaining)}秒`:'画符';this.thunder!.text=m.thunder.active?`雷 ${Math.ceil(m.thunder.remaining)}秒`:'雷符';
  }
 }
}
