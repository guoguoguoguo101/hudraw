import {Container,Graphics,Sprite} from 'pixi.js';
import type {Art} from './rigs';
import {FoxMotion,type FoxAction,type FoxSpell} from '../animation/fox-motion';
import layout from './fox-layout.json';

function part(art:Art,name:string,parent:Container,x=0,y=0,scale=1){const s=new Sprite(art[name]);s.anchor.set(.5);s.position.set(x,y);s.scale.set(scale);parent.addChild(s);return s;}
export class FoxRig{
 root=new Container();body=new Container();head=new Container();motion=new FoxMotion();
 tail:Sprite;torso:Sprite;left_arm:Sprite;right_arm:Sprite;left_leg:Sprite;right_leg:Sprite;left_ear:Sprite;right_ear:Sprite;eyes:Sprite;pupils:Sprite;collar:Sprite;scarf:Sprite;bell:Sprite;
 restTails:Sprite[]=[];tails:Sprite[]=[];private face=new Graphics();private lastFace='';
 get mode(){return this.motion.mode;}get actionAge(){return this.motion.age;}get actionAngle(){return this.motion.angle;}
 constructor(art:Art){
  for(let i=0;i<9;i++){const s=part(art,'fox_tail',this.root,-44,45,.8);s.visible=false;this.tails.push(s);}
  const place=(name:string,parent:Container,pose:number[])=>{const [x,y,scale,angle]=pose,s=part(art,name,parent,x,y,scale);s.rotation=angle;return s;};
  for(let i=0;i<3;i++)this.restTails.push(place(['fox_tail_high','fox_tail_mid','fox_tail_low'][i],this.root,layout.tails[i]));this.tail=this.restTails[0];
  this.root.addChild(this.body);this.right_leg=place('fox_leg',this.body,layout.right_leg);this.left_leg=place('fox_leg',this.body,layout.left_leg);
  this.torso=place('fox_torso',this.body,layout.torso);this.right_arm=place('fox_arm',this.body,layout.right_arm);this.left_arm=place('fox_arm',this.body,layout.left_arm);
  this.scarf=place('fox_scarf',this.body,layout.scarf);this.collar=place('fox_collar',this.body,layout.collar);
  this.body.addChild(this.head);this.head.position.set(layout.head[0],layout.head[1]);
  this.left_ear=place('fox_ear',this.head,layout.left_ear);this.right_ear=place('fox_ear_right',this.head,layout.right_ear);
  part(art,'fox_head',this.head);this.eyes=part(art,'fox_eyes',this.head);this.pupils=part(art,'fox_pupils',this.head);this.head.addChild(this.face);
  this.bell=place('fox_bell',this.body,layout.bell);
 }
 act(mode:FoxAction,angle=0,spell:FoxSpell='slash'){return this.motion.act(mode,angle,spell);}
 update(time:number,dt:number,invulnerable=0){
  this.motion.advance(dt);const m=this.motion,{prepare,power,hit,celebrate,fall,attack}=m.pose;
  const breathe=Math.sin(time*2.1),energy=m.energy,ready=m.interaction==='ready'?energy:0,brush=m.interaction==='brush'?energy:0;
  const sweep=Math.sin(time*8)*brush,spell=m.spell,lift=spell==='dragon'?17:spell==='summon'?12:spell==='thunder'?8:6;
  const reach=attack?1.45:spell==='guard'?.55:spell==='thunder'?1.8:spell==='seal'?.9:spell==='wave'?.85:1.15;
  this.body.position.set(power*(attack?16:5)-hit*24,breathe*1.8+prepare*12-power*lift+hit*13-celebrate*34+fall*22);
  this.body.rotation=prepare*.1-power*(attack?.16:spell==='moon'?-.13:spell==='wave'?.17:.07)-hit*.24+fall*.28+m.aim*energy;
  this.body.scale.set(1+prepare*.06+power*.05+hit*.12+fall*.1,1-prepare*.12-power*.04-hit*.17-fall*.25);
  this.head.position.set(layout.head[0]+power*3,layout.head[1]+prepare*4-power*5+hit*7+fall*12);
  this.head.rotation=Math.sin(time*1.5+.5)*.025-power*.1-hit*.19+celebrate*.1+fall*.14+m.aim*.5*energy;
  const near=m.side===1;
  this.left_arm.rotation=layout.left_arm[3]-(attack?(near?1:.35):1)*power*reach+prepare*.28-brush*(.65+sweep*.3)-ready*.65+hit*.48-fall*.1;
  this.right_arm.rotation=layout.right_arm[3]-(attack?(!near?1:.25):.65)*power*reach-brush*(.35-sweep*.2)-ready*.35+hit*.35;
  if(m.mode==='cast'&&spell==='seal')this.right_arm.rotation+=power*.8;
  if(m.mode==='cast'&&spell==='wave'){this.left_arm.rotation-=Math.sin(m.age*13)*power*.3;this.right_arm.rotation+=Math.sin(m.age*13)*power*.35;}
  this.left_arm.y=layout.left_arm[1]-power*(attack?5:9)-brush*5;this.right_arm.y=layout.right_arm[1]-power*8;
  this.left_leg.rotation=layout.left_leg[3]+hit*.3-celebrate*.15+prepare*.08;this.right_leg.rotation=layout.right_leg[3]-hit*.15+celebrate*.15;
  this.torso.scale.set(1+breathe*.008,1+breathe*.012);
  const earAlert=Math.exp(-(((time%5.2-4.4)/.17)**2));
  this.left_ear.rotation=layout.left_ear[3]+Math.sin(time*2.1)*.045-prepare*.12-power*.12+hit*.8+fall*.7-ready*.12-earAlert*.13;
  this.right_ear.rotation=layout.right_ear[3]-Math.sin(time*2.1-.6)*.045+power*.12-hit*.85-fall*.75+ready*.1;
  this.scarf.rotation=Math.sin(time*2.1-.5)*.05+power*.35+hit*.6+sweep*.12;
  this.scarf.scale.set(layout.scarf[2]+power*.2+hit*.12,layout.scarf[2]+Math.sin(time*2.4)*.025);
  this.bell.rotation=Math.sin(time*2.4)*.1-power*.45+hit*.8+celebrate*.4;
  this.restTails.forEach((tail,i)=>{
   const base=layout.tails[i];tail.position.set(base[0]-hit*9-power*8,base[1]+breathe-jumpTail(celebrate)+prepare*4+fall*8);
   tail.rotation=base[3]+Math.sin(time*1.6-i*.9)*.055-power*((spell==='moon'?.95:.4)-i*.1)-energy*(.12+i*.04)+hit*(.35-i*.12)+fall*.25;
   tail.scale.set(base[2]*(1+power*.12),base[2]*(1-hit*.08));tail.visible=true;
  });
  this.updateFace(time);
  this.root.alpha=fall?1-fall*.35:invulnerable>0?.72+.28*Math.abs(Math.sin(time*17)):1;
  for(let i=0;i<9;i++){const tail=this.tails[i];tail.visible=m.mode==='victory'&&m.age<1.55;tail.rotation=-1.7+i*.4;tail.alpha=tail.visible?Math.sin(Math.min(1,m.age/1.55)*Math.PI)*.7:0;tail.scale.set(.8+.35*Math.min(1,m.age/.4));}
 }
 private updateFace(time:number){
  const expression=this.motion.expression,closed=['hurt','happy','delighted','tired','serene'].includes(expression),blink=Math.max(0,1-Math.abs(time%3.7-3.4)/.09);
  this.eyes.visible=this.pupils.visible=!closed;
  const focused=expression==='focused';this.eyes.scale.set(expression==='wonder'?1.08:1,Math.max(.08,(focused?.88:expression==='wonder'?1.12:1)-blink));this.pupils.scale.y=this.eyes.scale.y;
  this.pupils.position.set(Math.sin(time*.67)*.45+this.motion.aim*3,0);this.pupils.alpha=1-blink;
  if(expression===this.lastFace)return;this.lastFace=expression;this.face.clear();
  if(expression==='wonder'||expression==='hurt'||expression==='happy'||expression==='delighted'||expression==='tired'){
   // Keep the animated mouth below the nose, on the same facial centre as the artwork.
   this.face.ellipse(13,35,10,5).fill(0xfbf0dc);
   if(expression==='wonder')this.face.ellipse(13,35,2.6,3.2).fill(0xa46c4c);
   else if(expression==='hurt')this.face.moveTo(8,36).quadraticCurveTo(13,31,18,36).stroke({color:0x80674e,width:1.5,cap:'round'});
   else if(expression==='tired')this.face.moveTo(9,35).lineTo(17,35).stroke({color:0x80674e,width:1.4,cap:'round'});
   else this.face.moveTo(8,32).quadraticCurveTo(13,42,19,32).closePath().fill(0xb87957);
  }
  if(closed){const g=this.face,color=0x34342d;
   for(const [x,y]of[[-9.3,7],[40.3,14.6]]){
    if(expression==='hurt')g.moveTo(x-7,y-7).lineTo(x+3,y).lineTo(x-7,y+6).stroke({color,width:3.6,cap:'round',join:'round'});
    else g.moveTo(x-7,y+2).quadraticCurveTo(x,y+(expression==='tired'?5:-9),x+7,y+2).stroke({color,width:3,cap:'round'});
   }
  }
 }
}
function jumpTail(jump:number){return jump*16;}
