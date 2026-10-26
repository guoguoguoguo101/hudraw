import {Container,Graphics} from 'pixi.js';
import type {FoxRig} from './rigs';
import type {Game} from '../gameplay/game';
import type {InputController} from '../input/controller';
import type {Event} from '../core/types';
import {foxSpell} from '../animation/fox-motion';
import type {SceneSeal} from '../gameplay/scene-seal';

/** Cosmetic reactions to accepted game events and actual drawing/dragging state. */
export class FoxResponse{
 root=new Container();private glow=new Graphics();private accent=new Graphics();action='idle';
 private facing=1;private aim=0;private wasDrawing=false;private effect=0;private clock=-1;
 private flower=0;private thunder=0;private selected=false;private companion=0;
 private bursts=new WeakSet<object>();private phases=new WeakMap<SceneSeal,string>();
 constructor(){this.root.addChild(this.glow,this.accent);}
 clear(){this.action='idle';this.facing=1;this.aim=0;this.wasDrawing=this.selected=false;this.effect=this.flower=this.thunder=this.companion=0;this.clock=-1;this.bursts=new WeakSet();this.phases=new WeakMap();this.glow.clear();this.accent.clear();}
 event(e:Event,fox:FoxRig){
  if(e.type==='hurt'){fox.act(e.amount>0?'hit':'cast',0,'guard');return;}
  if(e.type==='lose'){fox.act('death');return;}if(e.type==='win'){fox.act('victory');return;}
  if(e.type==='freeStroke')fox.act('attack',Math.atan2(e.direction.y,e.direction.x));
  if(e.type==='cast'&&e.rune!=='ink')fox.act('cast',Math.atan2(e.direction.y,e.direction.x),foxSpell(e.rune));
  if(e.type==='foxfire')fox.act('attack',Math.atan2(e.to.y-e.from.y,e.to.x-e.from.x),'petal');
  if(e.type==='talismanBarrage')fox.act('cast',Math.atan2(e.direction.y,e.direction.x),'seal');
  if(e.type==='burningSeaExplosion')fox.act('cast',0,'thunder');
  if(e.type==='lineInteraction')fox.act('cast',0,e.kind==='triangle'?'seal':'slash');
  if(e.type==='functionalRelic')fox.act(e.kind==='reviveSuccess'?'collect':'cast',0,'guard');
  if(e.type==='upgrade')fox.act('collect');
 }
 update(fox:FoxRig,game:Game,input:InputController,dt:number){
  const m=game.hualing;
  if(m.clock<this.clock)this.clear();this.clock=m.clock;
  const paused=['paused','upgrade','reviving'].includes(game.state)||m.upgrades.blocked;
  const active=game.active&&!paused;
  const drag=m.scenes.find(s=>s.dragPointer!==null);
  const drawing=active&&(input.drawing||m.drawing||!!drag);
  const p=drag?.dragPoint??(m.selected?m.path.at(-1):input.points.at(-1));
  if(active){
   const latest=m.effects.at(-1);
   if(latest&&latest.id!==this.effect){this.effect=latest.id;if(latest.age<.3)fox.act('cast',0,'dragon');}
   if(m.petals.remaining>this.flower+.1)fox.act('enchant',0,'petal');
   if(m.thunder.remaining>this.thunder+.1)fox.act('enchant',0,'thunder');
   this.flower=m.petals.remaining;this.thunder=m.thunder.remaining;
   for(const scene of m.scenes){
    const previous=this.phases.get(scene);
    if(scene.phase==='collecting'&&previous!=='collecting')fox.act('collect',0,'seal');
    this.phases.set(scene,scene.phase);
    for(const burst of scene.bursts)if(!this.bursts.has(burst)){
     this.bursts.add(burst);if(burst.age<.3){const summon=burst.kind==='beast'||burst.kind==='crab';fox.act(summon?'summon':'cast',Math.atan2(burst.center.y-fox.root.y,burst.center.x-fox.root.x),summon?'summon':burst.kind==='chain'?'slash':burst.kind==='fire'?'thunder':'guard');}
    }
   }
   const companion=m.upgrades.trail.companions.units.at(-1);
   if(companion&&companion.id!==this.companion){this.companion=companion.id;if(companion.age<.12&&companion.large)fox.act('summon',0,'summon');}
   if(this.wasDrawing&&!drawing&&fox.mode==='idle'&&input.points.length>1)fox.act('attack');
   if(drawing&&p){
    const dx=p.x-360;if(Math.abs(dx)>35)this.facing=dx<0?-1:1;
    const target=Math.max(-.16,Math.min(.16,(p.y-fox.root.y)/800));this.aim+=(target-this.aim)*(1-Math.exp(-dt*12));
   }
   this.wasDrawing=drawing;this.selected=!!m.selected;
  }
  fox.motion.interaction=active?(drag||m.selected?'ready':drawing?'brush':'idle'):'idle';
  if(fox.mode==='idle')fox.motion.spell=m.selected?'dragon':drag?'summon':m.thunder.active?'thunder':m.petals.active?'petal':'slash';
  fox.motion.aim=this.aim;
  // Do not mirror a recoil, celebration or collapse in response to another pointer event.
  if(game.state!=='menu'&&!['hit','victory','death'].includes(fox.mode))fox.root.scale.x=Math.abs(fox.root.scale.x)*this.facing;
  const mode=fox.mode;
  this.action=mode==='idle'?fox.motion.interaction:mode==='cast'&&fox.motion.spell==='dragon'?'dragon':mode;
  this.root.visible=game.state!=='menu'&&game.state!=='tutorial';
  if(!this.root.visible){this.glow.clear();this.accent.clear();return;}
  this.drawFX(fox,m.clock,game.invulnerable);
 }
 private drawFX(fox:FoxRig,time:number,invulnerable:number){
  const g=this.glow,a=this.accent;g.clear();a.clear();
  const {power,prepare,hit}=fox.motion.pose,spell=fox.motion.spell,energy=fox.motion.energy;
  const color=spell==='thunder'?0xa8ddf2:spell==='petal'?0xeaa98b:0xe7ba68;
  const x=fox.root.x,y=fox.root.y+27,side=Math.sign(fox.root.scale.x)||1;
  const casting=['cast','summon','enchant'].includes(fox.mode);
  if(invulnerable>0&&fox.mode!=='death')for(let i=0;i<3;i++){const angle=time*.9+i*Math.PI*2/3;g.ellipse(x,y+8,28,7).stroke({color:0xffebc3,width:1,alpha:.16});g.arc(x,y+8,29,angle,angle+.55).stroke({color:0xffebc3,width:1.4,alpha:.5});}
  if(casting||energy>.05){
   const strength=casting?Math.max(prepare*.4,power):energy*.55;
   g.ellipse(x,y+8,24+power*14,6+power*3).stroke({color,width:1.5,alpha:strength*.7});
   const hx=x+side*(16+power*8),hy=y-18-power*8;
   if(spell==='thunder'&&casting){for(let i=0;i<3;i++){const dx=i*8-8;g.moveTo(hx+dx,hy-15).lineTo(hx+dx-4,hy-5).lineTo(hx+dx+3,hy-7).lineTo(hx+dx-1,hy+3).stroke({color,width:1.8,alpha:strength});}}
   else if((spell==='guard'||spell==='seal')&&casting){g.circle(hx,hy-5,9+power*8).stroke({color,width:1.7,alpha:strength});g.poly([hx,hy-18,hx+10,hy-5,hx,hy+8,hx-10,hy-5]).stroke({color,width:1.3,alpha:strength});}
   else for(let i=0;i<3;i++){const angle=time*2+i*Math.PI*2/3,r=9+power*14;g.ellipse(hx+Math.cos(angle)*r,hy+Math.sin(angle)*r*.6,spell==='petal'?3.4:2,1.8).fill({color,alpha:strength});}
  }
  if(fox.mode==='attack'&&power>.1){const hx=x+side*20;g.arc(hx,y-13,15+power*13,side>0?-1.4:1.7,side>0?1.1:4.3).stroke({color:0xffe4a0,width:2.5,alpha:power*.85});}
  if(fox.mode==='hit'&&hit>.05){
   const hx=x+side*12,hy=y-30;
   a.poly([hx,hy-13,hx+4,hy-4,hx+13,hy,hx+4,hy+4,hx,hy+13,hx-4,hy+4,hx-13,hy,hx-4,hy-4]).fill({color:0xd96049,alpha:hit*.8});
   for(let i=0;i<3;i++){const angle=i*2.1+fox.actionAge*2,r=17+fox.actionAge*28;a.circle(hx+Math.cos(angle)*r,hy+Math.sin(angle)*r,1.6).fill({color:0xffe0a8,alpha:hit});}
  }
  if(fox.mode==='collect'||fox.mode==='victory'){for(let i=0;i<4;i++){const angle=i*Math.PI/2+time,r=20+Math.sin(fox.actionAge*6)*5;a.poly([x+Math.cos(angle)*r,y-18+Math.sin(angle)*r-3,x+Math.cos(angle)*r+2,y-18+Math.sin(angle)*r,x+Math.cos(angle)*r,y-18+Math.sin(angle)*r+3,x+Math.cos(angle)*r-2,y-18+Math.sin(angle)*r]).fill({color:0xffdb8e,alpha:.7});}}
 }
}
