import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {FORMATION_NAMES} from '../gameplay/mountain-run';
import {text} from './interface';
import {PlayerHealthHUD} from './player-health-hud';
import {MOUNTAIN_THEMES} from './mountain-theme';

/** Persistent combat feedback: XP fills visibly and ink pickups remain readable in battle. */
export class MountainCombatHUD{
 readonly root=new Container();private meterBase=new Graphics();private meter=new Graphics();private effects=new Graphics();private supplies=new Container();private meterHeader=NaN;private meterTheme='';private meterKey='';
 private title:Text;private count:Text;private gain:Text;private notice:Text;private inkGain:Text;private wave:Text;
 private icons=new Map<number,Container>();private shown=0;private lastGranted=-1;private lastReset=-1;
 private health=new PlayerHealthHUD();
 constructor(){
  this.root.eventMode='none';this.root.addChild(this.supplies,this.meterBase,this.meter,this.effects,this.health.root);
  this.title=text(this.root,'',91,0,18,0xffe6b1,{letterSpacing:0});this.count=text(this.root,'',604,0,17,0xffe6b1,{letterSpacing:0});
  this.gain=text(this.root,'',360,0,19,0xe5c371,{letterSpacing:0});
  this.notice=text(this.root,'',360,0,23,0xffe7b3,{letterSpacing:0,fontWeight:'bold'});
  this.inkGain=text(this.root,'',554,0,23,0xb6eee1,{letterSpacing:0,fontWeight:'bold'});
  this.wave=text(this.root,'',360,0,23,0xffdf9e,{letterSpacing:2,fontWeight:'bold',stroke:{color:0x263c3c,width:4}});
 }
 update(g:Game,header:number,footer:number){
  const c=g.campaign,u=g.hualing.upgrades;
  this.root.visible=c.levelId!==null&&g.active&&!u.blocked&&!c.supportPanel;
  if(!this.root.visible)return;
  this.health.update(g,footer);
  if(this.lastReset!==g.ink.resetSerial||this.lastGranted!==c.granted){this.shown=0;this.lastReset=g.ink.resetSerial;this.lastGranted=c.granted;}
  const full=c.growthComplete||u.pending>0,ratio=full?1:Math.min(1,c.xp/c.xpNeeded);
  // The value is authoritative; only the bar catches up over several frames.
  this.shown+=(ratio-this.shown)*.22;
  if(Math.abs(ratio-this.shown)<.001)this.shown=ratio;
  const chapter=c.level?.chapter??g.hualing.journey.chapter,t=MOUNTAIN_THEMES[chapter],dark=chapter==='palace';
  const y=header+154,x=157,w=367,fill=w*this.shown,flash=Math.max(0,1-(c.age-c.lastXpAt)/.7);
  if(this.meterHeader!==header||this.meterTheme!==chapter){
   this.meterHeader=header;this.meterTheme=chapter;const p=this.meterBase;p.clear();
   p.poly([29,y+7,690,y+7,697,y+14,694,y+37,26,y+37,23,y+29,25,y+13]).fill({color:t.paper,alpha:.94}).stroke({color:t.line,width:.8,alpha:.65});
   p.moveTo(35,y+10).lineTo(684,y+10).stroke({color:t.line,width:.6,alpha:.28});
   p.moveTo(140,y+14).lineTo(140,y+29).moveTo(544,y+14).lineTo(544,y+29).stroke({color:t.line,width:.7,alpha:.45});
   p.rect(x,y+17,w,8).fill({color:t.ink,alpha:dark?.13:.12});
   this.title.style.fill=this.count.style.fill=t.ink;
  }
  const meterKey=[chapter,header,fill,flash].join(':');
  if(this.meterKey!==meterKey){this.meterKey=meterKey;this.meter.clear();
   if(fill>.5)this.meter.rect(x,y+17,fill,8).fill(dark?0xd9bd7c:0x9b773c);
   if(flash>0)this.meter.poly([x+fill,y+15,x+fill+4,y+21,x+fill,y+27,x+fill-4,y+21]).fill({color:dark?0xffebba:t.accent,alpha:flash*.8});
  }
  this.title.text=`修行 Lv${u.picks+1}`;this.title.y=y+21;
  this.count.text=c.growthComplete?'本局圆满':u.pending?'悟道就绪':`${c.xp} / ${c.xpNeeded}`;this.count.y=y+21;
  this.gain.text=flash>0?`经验 +${c.lastXp}`:'';this.gain.y=y+62-(1-flash)*12;this.gain.alpha=flash;
  const exhausted=g.ink.currentInk<8,low=g.ink.currentInk<20,clock=performance.now()/1000;
  if(this.effects.context.instructions.length)this.effects.clear();
  const waveAge=c.age-c.waveAt;
  this.wave.text=waveAge<1.5?FORMATION_NAMES[c.formation]:'';this.wave.y=header+248;
  this.wave.alpha=Math.max(0,Math.min(1,(1.5-waveAge)*2));
  for(const p of c.entryWarnings){
   const pulse=.6+Math.sin(clock*12)*.2;
   this.effects.circle(p.x,p.y,23).stroke({color:0xf0b86d,width:2,alpha:pulse});
   this.effects.poly([p.x-9,p.y-12,p.x,p.y-3,p.x+9,p.y-12]).stroke({color:0xffd59a,width:3,alpha:pulse});
  }
  if(low){
   const alpha=.5+Math.sin(clock*5)*.13,ny=footer+1098;
   this.effects.roundRect(60,ny-21,600,42,10).fill({color:exhausted?0x7c352b:0x253b40,alpha:.94}).stroke({color:exhausted?0xe19b60:0x82cfc7,width:2,alpha});
   this.notice.text=g.collected.counts.pulse>0?(exhausted?'墨尽！震墨可用 · 命中三妖回墨10':'灵墨将尽 · 震墨可清群回墨'):exhausted?'墨尽！抬笔点击墨水符':'灵墨将尽 · 点击或划过墨水符';this.notice.y=ny;this.notice.alpha=1;
   this.effects.roundRect(23,header+210,674,footer+909-header,16).stroke({color:0xd87851,width:2,alpha:exhausted?alpha*.6:0});
  }else{this.notice.text='';this.notice.alpha=0;}
  const inkAge=c.age-c.lastInkAt;this.inkGain.text=inkAge<1.3?`墨水符 +${c.lastInkAmount}`:'';this.inkGain.y=header+117-inkAge*14;this.inkGain.alpha=Math.max(0,1-inkAge/1.3);
  const ids=new Set(c.pickups.map(p=>p.id));for(const [id,node] of this.icons)if(!ids.has(id)){node.destroy({children:true});this.icons.delete(id);}
  for(const p of c.pickups){
   let node=this.icons.get(p.id);
   if(!node){
    node=new Container();const g=new Graphics();node.addChild(g);
    g.circle(0,0,35).fill({color:0x74c9bd,alpha:.12}).stroke({color:0xa5e7dc,width:1.5,alpha:.6});
    g.poly([-20,-30,12,-30,23,-19,23,29,-20,29]).fill(0xe5f1dc).stroke({color:0x3c8b89,width:2});
    g.poly([12,-30,12,-18,23,-19]).fill(0xa6d8cb);
    g.moveTo(-12,-22).lineTo(5,-22).moveTo(-12,20).lineTo(14,20).stroke({color:0x48958b,width:1.3});
    text(node,'墨',1,-1,29,0x245c63,{letterSpacing:0,fontWeight:'bold'});text(node,`+${p.amount}`,0,49,18,0xdaf5df,{letterSpacing:0,stroke:{color:0x23454c,width:3}});
    this.icons.set(p.id,node);this.supplies.addChild(node);
   }
   node.position.set(p.x,p.y);node.rotation=Math.sin(clock*2+p.id)*.06;node.scale.set(1+Math.sin(clock*3+p.id)*.05);
   node.alpha=c.age-p.born>20?.6+Math.sin(clock*7)*.3:1;
   if(low){this.effects.circle(p.x,p.y,44+Math.sin(clock*4)*4).stroke({color:0xb9f1d8,width:2,alpha:.7});this.effects.poly([p.x-8,p.y-52,p.x,p.y-44,p.x+8,p.y-52]).fill(0xb9f1d8);}
  }
 }
}
