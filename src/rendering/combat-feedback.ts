import {Container,Graphics,Text} from 'pixi.js';
import type {Enemy} from '../core/types';

type DamageNumber={label:Text;x:number;y:number;age:number;amount:number;dead:boolean;lane:number;targetId?:number;secondary:boolean};
type HealthTrail={ratio:number;last:number;hold:number};

/** Small paper-and-gold combat annotations, independent of brush and enemy artwork. */
export class CombatFeedbackRenderer{
 root=new Container();enabled=false;
 private bars=new Graphics();private numbers:DamageNumber[]=[];private spare:Text[]=[];
 private health=new Map<number,HealthTrail>();private serial=0;
 constructor(){this.root.addChild(this.bars);}
 clear(){for(const n of this.numbers){n.label.visible=false;this.spare.push(n.label);}this.numbers=[];this.health.clear();this.bars.clear();this.serial=0;}
 private number(n:DamageNumber){n.label.text=(Math.abs(n.amount-Math.round(n.amount))<.05?Math.round(n.amount):Math.round(n.amount*10)/10).toString();n.label.style.fill=n.dead?0xf0c36c:0xfff1cf;n.label.style.fontSize=n.dead?35:n.secondary?24:30;}
 hit(x:number,y:number,amount:number,dead:boolean,targetId?:number,secondary=false){
  if(!this.enabled||!Number.isFinite(amount)||amount<=0)return;
  // Continuous spray reports a short, per-enemy sum rather than a wall of tiny ticks.
  if(secondary&&targetId!==undefined){const recent=this.numbers.find(n=>n.secondary&&n.targetId===targetId&&n.age<.22);if(recent){recent.amount+=amount;recent.dead||=dead;this.number(recent);return;}}
  if(this.numbers.length>=32){const old=this.numbers.shift()!;old.label.visible=false;this.spare.push(old.label);}
  const label=this.spare.pop()??new Text({text:'',style:{fontFamily:'Georgia,serif',fontSize:30,fontWeight:'bold',fill:0xfff1cf,stroke:{color:0x332b2a,width:4},dropShadow:{color:0x201d24,alpha:.5,blur:2,distance:2,angle:Math.PI/2}}});
  if(!label.parent)this.root.addChild(label);label.anchor.set(.5);label.visible=true;
  const lane=(this.serial++%3)-1;
  const n={label,x:Math.max(48,Math.min(672,x+lane*42)),y:y-42+lane*18,age:0,amount,dead,lane,targetId,secondary};this.number(n);this.numbers.push(n);
 }
 update(enemies:Enemy[],dt:number,enabled:boolean){
  this.enabled=enabled;this.root.visible=enabled;if(!enabled){this.clear();return;}
  const g=this.bars;g.clear();const alive=new Set<number>();
  for(const e of enemies){
   if(e.hp<=0||e.elite||e.chapterBoss)continue;alive.add(e.id);
   const ratio=Math.max(0,Math.min(1,e.hp/e.maxHp));let trail=this.health.get(e.id);
   if(!trail){trail={ratio,last:ratio,hold:0};this.health.set(e.id,trail);}
   if(ratio<trail.last)trail.hold=.18;
   trail.last=ratio;trail.hold=Math.max(0,trail.hold-dt);
   if(!trail.hold)trail.ratio=Math.max(ratio,trail.ratio+(ratio-trail.ratio)*(1-Math.exp(-dt*9)));
   if(ratio>trail.ratio)trail.ratio=ratio;
   const w=e.kind==='oni'?82:68,x=e.x-w/2,y=e.y+58;
   g.roundRect(x-3,y-3,w+6,13,4).fill({color:0x252b2a,alpha:.9}).stroke({color:0xe3bd77,width:1,alpha:.65});
   if(trail.ratio>0)g.roundRect(x,y,w*trail.ratio,7,2).fill(0xb55c45);
   if(ratio>0)g.roundRect(x,y,w*ratio,7,2).fill(e.hit>0?0xffedba:0xdab16b);
   g.moveTo(x,y+1).lineTo(x+w*ratio,y+1).stroke({color:0xffe4aa,width:1,alpha:.65});
  }
  for(const id of this.health.keys())if(!alive.has(id))this.health.delete(id);
  const active:DamageNumber[]=[];
  for(const n of this.numbers){
   n.age+=dt;const life=n.secondary?.56:.82;if(n.age>=life){n.label.visible=false;this.spare.push(n.label);continue;}
   const pop=Math.min(1,n.age/.11),fade=Math.max(0,(n.age-(life-.24))/.24);
   n.label.position.set(n.x+n.lane*n.age*12,n.y-44*n.age);
   n.label.scale.set(.8+pop*.2+Math.sin(pop*Math.PI)*.18);n.label.alpha=1-fade;active.push(n);
  }
  this.numbers=active;
 }
}
