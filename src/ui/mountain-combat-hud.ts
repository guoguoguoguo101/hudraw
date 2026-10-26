import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {FORMATION_NAMES} from '../gameplay/mountain-run';
import {text} from './interface';

/** Persistent combat feedback: XP fills visibly and ink pickups remain readable in battle. */
export class MountainCombatHUD{
 readonly root=new Container();private meter=new Graphics();private effects=new Graphics();private supplies=new Container();
 private title:Text;private count:Text;private gain:Text;private notice:Text;private inkGain:Text;private wave:Text;
 private icons=new Map<number,Container>();private shown=0;private lastGranted=-1;private lastReset=-1;
 constructor(){
  this.root.eventMode='none';this.root.addChild(this.supplies,this.meter,this.effects);
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
  if(this.lastReset!==g.ink.resetSerial||this.lastGranted!==c.granted){this.shown=0;this.lastReset=g.ink.resetSerial;this.lastGranted=c.granted;}
  const full=c.growthComplete||u.pending>0,ratio=full?1:Math.min(1,c.xp/c.xpNeeded);
  // The value is authoritative; only the bar catches up over several frames.
  this.shown+=(ratio-this.shown)*.22;
  const y=header+154,x=157,w=367,fill=w*this.shown,flash=Math.max(0,1-(c.age-c.lastXpAt)/.7);
  this.meter.clear().roundRect(20,y,680,44,10).fill({color:0x172d30,alpha:.96}).stroke({color:0xd7b378,width:1,alpha:.6});
  this.meter.roundRect(x,y+14,w,15,6).fill(0x0a1a20);
  if(fill>.5)this.meter.roundRect(x,y+14,fill,15,Math.min(6,fill/2)).fill(0xd5b363);
  if(flash>0)this.meter.circle(x+fill,y+21,3+flash*3).fill({color:0xffebba,alpha:flash});
  this.title.text=`修行 Lv${u.picks+1}`;this.title.y=y+21;
  this.count.text=c.growthComplete?'本局圆满':u.pending?'悟道就绪':`${c.xp} / ${c.xpNeeded}`;this.count.y=y+21;
  this.gain.text=flash>0?`经验 +${c.lastXp}`:'';this.gain.y=y+62-(1-flash)*12;this.gain.alpha=flash;
  const exhausted=g.ink.currentInk<8,low=g.ink.currentInk<20,clock=performance.now()/1000;
  this.effects.clear();
  const waveAge=c.age-c.waveAt;
  this.wave.text=waveAge<1.5?FORMATION_NAMES[c.formation]:'';this.wave.y=header+248;
  this.wave.alpha=Math.max(0,Math.min(1,(1.5-waveAge)*2));
  for(const p of c.entryWarnings){
   const pulse=.6+Math.sin(clock*12)*.2;
   this.effects.circle(p.x,p.y,23).stroke({color:0xf0b86d,width:2,alpha:pulse});
   this.effects.poly([p.x-9,p.y-12,p.x,p.y-3,p.x+9,p.y-12]).stroke({color:0xffd59a,width:3,alpha:pulse});
  }
  if(low){
   const alpha=.5+Math.sin(clock*5)*.13,ny=footer+1072;
   this.effects.roundRect(60,ny-25,600,50,12).fill({color:exhausted?0x7c352b:0x253b40,alpha:.94}).stroke({color:exhausted?0xe19b60:0x82cfc7,width:2,alpha});
   this.notice.text=exhausted?'墨尽！抬笔点击墨水符':'灵墨将尽 · 点击或划过墨水符';this.notice.y=ny;this.notice.alpha=1;
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
