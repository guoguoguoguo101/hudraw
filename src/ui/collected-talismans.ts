import {drawOrbitFox} from '../rendering/fox-orbit';
import {frontlineRuneIcon} from '../rendering/frontline-rune-art';
import {Container,Graphics,Sprite,type Texture} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {COLLECTED,COLLECTED_NAMES,COLLECTED_RUNES,type CollectedRune} from '../gameplay/collected-talismans';
import type {InputEvent} from '../platform/adapter';
import {inArena} from '../input/line-interaction-geometry';
import {text} from './interface';
import {INK_PULSE} from '../gameplay/ink-pulse';
import {collectedRuneIcon} from '../rendering/collected-rune-icon';
type Zone={x:number;y:number;w:number;h:number;kind:CollectedRune|'foxrush'};
/** The practice shelf exposes all runes; campaign cards retain pickup-only ownership. */
export class CollectedTalismanUI{
 formal=true;root=new Container();private cards=new Container();private guide=new Graphics();private zones:Zone[]=[];private key='';
 private pointer:number|null=null;private fromCard=false;private origin={x:0,y:0};private moved=false;
 constructor(private game:Game,private stopBrush:()=>void,private dragon?:Texture,private crescent?:Texture){this.root.addChild(this.cards,this.guide);}
 private release(kind:CollectedRune,p:{x:number;y:number}){const g=this.game,accepted=g.frontlineTest&&!['flower','thunder','heal'].includes(kind)?g.frontline.throw(g,kind,p):g.campaign.levelId===null?g.collected.preview(g,kind,p):g.collected.use(g,kind,p);if(!accepted&&kind==='heal'&&g.life>=g.maxHp)g.hualing.say('生命已满');return accepted;}
 handle(e:InputEvent){
  const g=this.game,m=g.collected;if(!this.root.visible||!g.hualingPractice||!g.active||g.hualing.upgrades.blocked||g.campaign.supportPanel)return false;
  if(this.pointer!==null&&!m.selected)this.pointer=null;
  if(this.pointer!==null){if(e.id!==this.pointer)return true;
   if(e.kind==='cancel'){this.pointer=null;m.cancel();return true;}
   if(e.kind==='move'){m.target={x:e.x,y:e.y};this.moved||=Math.hypot(e.x-this.origin.x,e.y-this.origin.y)>12;return true;}
   if(e.kind==='up'){this.pointer=null;const kind=m.selected;if(kind&&(!this.fromCard||this.moved)&&inArena(e,g.hualing.bounds))this.release(kind,{x:e.x,y:e.y});else if(this.moved||!this.fromCard)m.cancel();return true;}return true;
  }
  if(e.kind!=='down')return false;
  const zone=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);
  if(zone){this.stopBrush();g.hualing.cancel();m.cancel();
   if(zone.kind==='foxrush'){if(!g.foxRush.cast(g))g.hualing.say(g.foxRush.active?'狐群仍在冲阵':`狐群蓄势中 · ${g.foxRush.remaining.toFixed(1)}秒`);return true;}
   if(g.campaign.levelId!==null&&!m.counts[zone.kind])return true;
   if(zone.kind==='flower'||zone.kind==='thunder'||zone.kind==='heal'||zone.kind==='crescent'&&!g.frontlineTest){this.release(zone.kind,{x:360,y:Math.max(g.hualing.bounds.top+20,Math.min(g.hualing.bounds.bottom-20,g.playerPosition.y))});return true;}
   if(m.casts.some(c=>c.kind===zone.kind)||zone.kind==='pulse'&&g.pulse.effect){g.hualing.say('此符仍在展开');return true;}
   m.selected=zone.kind;m.target=null;this.pointer=e.id;this.fromCard=true;this.moved=false;this.origin={x:e.x,y:e.y};return true;
  }
  if(m.selected){this.pointer=e.id;this.fromCard=false;this.moved=false;this.origin={x:e.x,y:e.y};m.target={x:e.x,y:e.y};return true;}
  const pickup=m.pickups.find(p=>Math.hypot(e.x-p.x,e.y-p.y)<=38);if(pickup){this.stopBrush();if(!m.collect(pickup.id))g.hualing.say(`符匣已满 · 最多${COLLECTED.capacity}张`);return true;}return false;
 }
 update(header:number,footer:number,hidden=false){
  const g=this.game,m=g.collected;this.root.visible=g.hualingPractice&&g.active&&!hidden&&!g.hualing.upgrades.blocked&&!g.campaign.supportPanel;
  if(!this.root.visible){m.cancel();this.pointer=null;this.key='';return;}
  const practice=g.campaign.levelId===null,y=footer+(g.frontlineTest?1098:practice?1050:1148),kinds=practice?COLLECTED_RUNES:m.owned,columns=g.frontlineTest?6:5,entries:readonly (CollectedRune|null)[]=g.frontlineTest?[null,...kinds]:kinds;
  const key=JSON.stringify([y,header,m.counts,kinds,m.selected,practice,m.casts.map(c=>c.kind),!!g.pulse.effect,g.hualing.petals.active,g.hualing.thunder.active,m.crescent.active,g.foxRush.active,Math.ceil(g.foxRush.remaining)]);
  if(this.key!==key){this.key=key;this.cards.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];
   const w=g.frontlineTest?103:126,gap=9,h=g.frontlineTest?76:practice?86:101;
   for(const [i,kind]of entries.entries()){
    const row=practice?Math.floor(i/columns):0,rowCount=practice?Math.min(columns,entries.length-row*columns):entries.length,start=(720-(rowCount*w+Math.max(0,rowCount-1)*gap))/2;
    const x=start+(practice?i%columns:i)*(w+gap),yy=y+row*(g.frontlineTest?84:96),cx=x+w/2;
    if(kind===null){const busy=g.foxRush.active||g.foxRush.remaining>0,art=new Graphics();this.cards.addChild(art);art.roundRect(x+1,yy+4,w,h,9).fill({color:0x192e2c,alpha:.8}).roundRect(x,yy,w,h-2,9).fill(busy?0x6e4939:0xa94a35).stroke({color:0xffd78b,width:1.8});art.roundRect(x+5,yy+5,w-10,h-13,6).stroke({color:0xedbc70,width:.7,alpha:.6});const icon=new Graphics();icon.position.set(cx+2,yy+27);icon.scale.set(.36);drawOrbitFox(icon);this.cards.addChild(icon);text(this.cards,'狐群冲阵',cx,yy+60,17,0xffedc8,{letterSpacing:0});if(busy)text(this.cards,g.foxRush.active?'冲阵中':Math.ceil(g.foxRush.remaining)+'s',x+w-23,yy+12,12,0xffe5aa,{letterSpacing:0});this.zones.push({x,y:yy,w,h,kind:'foxrush'});continue;}
    const active=m.selected===kind,busy=m.casts.some(c=>c.kind===kind)||kind==='pulse'&&!!g.pulse.effect,enchanted=kind==='flower'&&g.hualing.petals.active||kind==='thunder'&&g.hualing.thunder.active||kind==='crescent'&&m.crescent.active,art=new Graphics();this.cards.addChild(art);
    if(g.frontlineTest){art.roundRect(x+1,yy+4,w,h,9).fill({color:0x192e2c,alpha:.8});art.roundRect(x,yy,w,h-2,9).fill(active?0xa84b37:0xf0dfbb).stroke({color:active?0xffe5aa:enchanted?0xb65b3d:0xb79561,width:active?2.5:1.5});art.roundRect(x+5,yy+5,w-10,h-13,6).stroke({color:active?0xf5ce88:0xd3b680,width:.7,alpha:.6});art.moveTo(x+14,yy+45).lineTo(x+w-14,yy+45).stroke({color:active?0xeac78c:0xc4a56f,width:.6,alpha:.45});}
    else{art.poly([x+5,yy,x+w-8,yy,x+w,yy+8,x+w-2,yy+h-3,x+3,yy+h,x,yy+13]).fill({color:active?0x823e32:0xf0dfbb,alpha:busy?.65:1}).stroke({color:active?0xffdda0:enchanted?0xac593d:0xc5a36a,width:active?2.5:enchanted?2:1.3});art.poly([x+w-19,yy,x+w-8,yy,x+w,yy+8,x+w,yy+19]).fill({color:active?0xb35c40:0xd6bc86});}
    const texture=g.frontlineTest?undefined:kind==='dragon'?this.dragon:kind==='crescent'?this.crescent:undefined;if(texture){const head=new Sprite(texture);head.anchor.set(.5);head.position.set(cx,yy+(practice?29:37));head.width=head.height=kind==='crescent'?(practice?54:62):(practice?49:60);this.cards.addChild(head);}
    else{const icon=new Graphics();icon.position.set(cx,yy+(practice?29:37));if(g.frontlineTest){frontlineRuneIcon(icon,kind);icon.position.y=yy+26;icon.scale.set(.72);}else{collectedRuneIcon(icon,kind);if(kind==='flower')icon.scale.set(.48);else if(kind==='thunder')icon.scale.set(practice?.82:.75);else if(practice)icon.scale.set(.85);}this.cards.addChild(icon);}
    const name=kind==='ward'?'九尾结界':kind==='storm'?'天狐雷劫':practice||kind==='flower'||kind==='thunder'?COLLECTED_NAMES[kind]:COLLECTED_NAMES[kind].replace(/符$/,'');text(this.cards,name,cx,yy+(g.frontlineTest?60:practice?67:80),g.frontlineTest?17:practice?19:20,active?0xffecc9:0x6e3b2e,{letterSpacing:1});
    if(!practice)text(this.cards,'×'+m.counts[kind],x+w-20,yy+16,17,active?0xffecc9:0x815638,{letterSpacing:0});else if(enchanted)text(this.cards,'生效',x+w-24,yy+12,13,0x9d4936,{letterSpacing:0});this.zones.push({x,y:yy,w,h,kind});
   }
  }
  const art=this.guide;art.clear();if(m.selected&&m.target&&inArena(m.target,g.hualing.bounds)){
   const p=m.target;if(m.selected==='ward'||m.selected==='pulse')art.circle(p.x,p.y,m.selected==='pulse'?INK_PULSE.radius:235).fill({color:0xe5c57c,alpha:.07}).stroke({color:0xffdf97,width:2,alpha:.9});
   else if(m.selected==='crescent')art.ellipse(p.x,p.y,126,72).fill({color:0xe5c57c,alpha:.09}).stroke({color:0xffdf97,width:2});
   else if(m.selected==='dragon')art.moveTo(360,g.hualing.bounds.bottom-80).quadraticCurveTo(270,p.y,p.x,p.y).stroke({color:0xffdf97,width:3,alpha:.7});
   else if(m.selected==='beast'||m.selected==='crab')art.ellipse(p.x,p.y,60,24).fill({color:0xe5c57c,alpha:.1}).stroke({color:0xffdf97,width:2});
   else{const b=g.hualing.bounds;art.rect(b.left,b.top,b.right-b.left,b.bottom-b.top).stroke({color:0xffdf97,width:2,alpha:.4});}art.circle(p.x,p.y,9).stroke({color:0xffdf97,width:2});
  }
 }
}
