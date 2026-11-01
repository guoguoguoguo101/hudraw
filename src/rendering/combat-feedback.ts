import {Container,Graphics,Text} from 'pixi.js';
import type {Enemy} from '../core/types';

type DamageNumber={label:Text;x:number;y:number;age:number;amount:number;dead:boolean;lane:number;targetId?:number;secondary:boolean};
type HealthTrail={ratio:number;last:number;hold:number;reveal:number};
type HealthBar={root:Container;frame:Graphics;trail:Graphics;fill:Graphics;width:number;ratio:number;ghost:number;hit:boolean;seen:number};
const BAR_POOL_LIMIT=64;
const NUMBER_LIMIT=20,BAR_REVEAL=1.8;

/** Small paper-and-gold combat annotations, independent of brush and enemy artwork. */
export class CombatFeedbackRenderer{
 root=new Container();enabled=false;
 private bars=new Container();private numbers:DamageNumber[]=[];private spare:Text[]=[];
 private barRigs=new Map<number,HealthBar>();private barSpare:HealthBar[]=[];private barFrame=0;
 private health=new Map<number,HealthTrail>();private serial=0;
 constructor(){this.root.addChild(this.bars);}
 clear(){for(const n of this.numbers){n.label.visible=false;this.spare.push(n.label);}this.numbers.length=0;for(const rig of this.barRigs.values())this.releaseBar(rig);this.barRigs.clear();this.health.clear();this.serial=0;}
 private releaseBar(rig:HealthBar){
  rig.root.visible=false;
  if(this.barSpare.length<BAR_POOL_LIMIT)this.barSpare.push(rig);else rig.root.destroy({children:true});
 }
 private bar(id:number){
  let rig=this.barRigs.get(id);if(rig)return rig;
  rig=this.barSpare.pop();
  if(!rig){const root=new Container(),frame=new Graphics(),trail=new Graphics(),fill=new Graphics();root.eventMode='none';root.addChild(frame,trail,fill);this.bars.addChild(root);rig={root,frame,trail,fill,width:NaN,ratio:NaN,ghost:NaN,hit:false,seen:0};}
  rig.root.visible=true;this.barRigs.set(id,rig);return rig;
 }
 private number(n:DamageNumber){
  n.label.text=(Math.abs(n.amount-Math.round(n.amount))<.05?Math.round(n.amount):Math.round(n.amount*10)/10).toString();
  n.label.style.fill=n.dead?0xf0c36c:n.secondary?0xe5d6ae:0xfff1cf;
  n.label.style.fontSize=n.dead?34:n.secondary?21:28;
  n.label.style.stroke={color:0x24332f,width:n.secondary&&!n.dead?2:3};
 }
 hit(x:number,y:number,amount:number,dead:boolean,targetId?:number,secondary=false){
  if(!this.enabled||!Number.isFinite(amount)||amount<=0)return;
  // Continuous spray reports a short, per-enemy sum rather than a wall of tiny ticks.
  if(secondary&&targetId!==undefined){const recent=this.numbers.find(n=>n.secondary&&n.targetId===targetId&&n.age<.32);if(recent){recent.amount+=amount;recent.dead||=dead;this.number(recent);return;}}
  if(this.numbers.length>=NUMBER_LIMIT){
   // Keep the most legible feedback for deliberate hits and finishing blows.
   const secondaryIndex=this.numbers.findIndex(n=>n.secondary&&!n.dead),index=secondaryIndex<0?0:secondaryIndex;
   const [old]=this.numbers.splice(index,1);old.label.visible=false;this.spare.push(old.label);
  }
  const label=this.spare.pop()??new Text({text:'',style:{fontFamily:'Georgia,serif',fontSize:28,fontWeight:'bold',fill:0xfff1cf,stroke:{color:0x24332f,width:3}}});
  if(!label.parent)this.root.addChild(label);label.anchor.set(.5);label.visible=true;
  const lane=(this.serial++%3)-1;
  const n={label,x:Math.max(48,Math.min(672,x+lane*42)),y:y-42+lane*18,age:0,amount,dead,lane,targetId,secondary};this.number(n);this.numbers.push(n);
 }
 update(enemies:Enemy[],dt:number,enabled:boolean){
  this.enabled=enabled;this.root.visible=enabled;if(!enabled){this.clear();return;}
  const frame=++this.barFrame,decay=1-Math.exp(-dt*9);let order=0;
  for(const e of enemies){
   if(e.hp<=0||e.elite||e.chapterBoss)continue;
   const ratio=Math.max(0,Math.min(1,e.hp/e.maxHp));let trail=this.health.get(e.id);
   if(!trail){trail={ratio,last:ratio,hold:0,reveal:ratio<1?BAR_REVEAL:0};this.health.set(e.id,trail);}
   if(ratio<trail.last){trail.hold=.18;trail.reveal=BAR_REVEAL;}
   if(e.hit>0)trail.reveal=BAR_REVEAL;
   trail.reveal=Math.max(0,trail.reveal-dt);
   trail.last=ratio;trail.hold=Math.max(0,trail.hold-dt);
   if(!trail.hold)trail.ratio=Math.max(ratio,trail.ratio+(ratio-trail.ratio)*decay);
   if(ratio>trail.ratio)trail.ratio=ratio;
   const scale=e.mountain?.scale??1,w=(e.kind==='oni'?82:68)*scale,x=e.x-w/2,y=e.y+58*scale;
   const rig=this.bar(e.id),resized=rig.width!==w,hit=e.hit>0;rig.seen=frame;rig.root.position.set(x,y);
   const engaged=e.ai==='Telegraph'||e.ai==='Attack',persistent=ratio<1&&(ratio<=.25||engaged);
   // Undamaged paper silhouettes stay clean. A hit reveals HP long enough to
   // follow the damage trail; near-death and attacking foes remain readable.
   rig.root.visible=trail.reveal>0||persistent;
   rig.root.alpha=persistent?1:Math.min(1,trail.reveal/.35);
   // Keep the old enemy iteration order, including after target-array reordering.
   if(this.bars.children[order]!==rig.root)this.bars.setChildIndex(rig.root,order);order++;
   if(resized){rig.width=w;rig.frame.clear().poly([-3,-2,w+2,-2,w+4,3,w+1,8,-3,8,-5,3]).fill({color:0x263630,alpha:.85});}
   if(resized||rig.ghost!==trail.ratio){rig.ghost=trail.ratio;rig.trail.clear();if(trail.ratio>0)rig.trail.rect(0,0,w*trail.ratio,5).fill(0xb55c45);}
   if(resized||rig.ratio!==ratio||rig.hit!==hit){
    rig.ratio=ratio;rig.hit=hit;rig.fill.clear();
    if(ratio>0)rig.fill.rect(0,0,w*ratio,5).fill(hit?0xffedba:0xdab16b);
    rig.fill.moveTo(0,.5).lineTo(w*ratio,.5).stroke({color:0xffe4aa,width:.7,alpha:.55});
   }
  }
  for(const [id,rig]of this.barRigs)if(rig.seen!==frame){this.releaseBar(rig);this.barRigs.delete(id);this.health.delete(id);}
  let active=0;
  for(const n of this.numbers){
   n.age+=dt;const life=n.dead?.82:n.secondary?.58:.76;if(n.age>=life){n.label.visible=false;this.spare.push(n.label);continue;}
   const pop=Math.min(1,n.age/.11),fade=Math.max(0,(n.age-(life-.24))/.24);
   n.label.position.set(n.x+n.lane*n.age*12,n.y-44*n.age);
   n.label.scale.set(.8+pop*.2+Math.sin(pop*Math.PI)*.18);n.label.alpha=1-fade;this.numbers[active++]=n;
  }
  this.numbers.length=active;
 }
}
