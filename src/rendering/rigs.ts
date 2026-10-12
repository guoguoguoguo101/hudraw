import {Container,Sprite,Texture} from 'pixi.js';
import {MOTION} from '../animation/motion';
import type {Enemy} from '../core/types';
export type Art=Record<string,Texture>;
export function sprite(art:Art,name:string,parent:Container,x=0,y=0,scale=1){const s=new Sprite(art[name]);s.anchor.set(.5);s.position.set(x,y);s.scale.set(scale);parent.addChild(s);return s;}
export class FoxRig{
 root=new Container();body=new Container();head=new Container();tail:Sprite;torso:Sprite;left_arm:Sprite;right_arm:Sprite;left_leg:Sprite;right_leg:Sprite;left_ear:Sprite;right_ear:Sprite;eyes:Sprite;pupils:Sprite;collar:Sprite;scarf:Sprite;bell:Sprite;restTails:Sprite[]=[];tails:Sprite[]=[];mode:'idle'|'cast'|'hit'|'victory'|'death'='idle';actionAge=0;actionAngle=0;
 constructor(art:Art){
  for(let i=0;i<9;i++){const s=sprite(art,'fox_tail',this.root,-44,45,.8);s.visible=false;this.tails.push(s);}
  for(let i=0;i<3;i++){const s=sprite(art,['fox_tail_high','fox_tail_mid','fox_tail_low'][i],this.root,-43,30,[.88,.88,.85][i]);s.rotation=[-.12,.06,.08][i];this.restTails.push(s);}this.tail=this.restTails[0];
  this.root.addChild(this.body);this.left_leg=sprite(art,'fox_leg',this.body,-43,49,.84);this.right_leg=sprite(art,'fox_leg',this.body,-17,45,.78);this.right_leg.tint=0xe2cfab;
  this.torso=sprite(art,'fox_torso',this.body,0,24);this.right_arm=sprite(art,'fox_arm',this.body,44,48,.82);this.right_arm.tint=0xeadaba;this.left_arm=sprite(art,'fox_arm',this.body,25,56,.88);
  this.scarf=sprite(art,'fox_scarf',this.body,20,22,.86);this.collar=sprite(art,'fox_collar',this.body,28,24,.88);
  this.body.addChild(this.head);this.head.position.set(38,-25);
  this.left_ear=sprite(art,'fox_ear',this.head,-30,-32,.78);this.right_ear=sprite(art,'fox_ear',this.head,33,-34,.81);this.left_ear.rotation=-.24;this.right_ear.rotation=.31;
  sprite(art,'fox_head',this.head);this.eyes=sprite(art,'fox_eyes',this.head,0,3);this.pupils=sprite(art,'fox_pupils',this.head,0,3);
  this.bell=sprite(art,'fox_bell',this.body,40,40,.47);
 }
 act(mode:FoxRig['mode'],angle=0){this.mode=mode;this.actionAge=0;this.actionAngle=angle;}
 update(time:number,dt:number,invulnerable=0){this.actionAge+=dt;const a=this.actionAge,m=MOTION;let pulse=0,anticipation=0,hit=0,jump=0;
  if(this.mode==='cast'){anticipation=a<m.cast.anticipation?Math.sin(Math.PI*a/m.cast.anticipation):0;pulse=a<m.cast.anticipation?0:Math.sin(Math.PI*Math.min(1,(a-m.cast.anticipation)/(m.cast.recover-m.cast.anticipation)));if(a>m.cast.recover)this.mode='idle';}
  if(this.mode==='hit'){hit=Math.sin(Math.PI*Math.min(1,a/m.hit.duration));if(a>m.hit.duration)this.mode='idle';}
  if(this.mode==='victory')jump=Math.max(0,Math.sin(Math.min(1,a/.8)*Math.PI))*m.victory.jump;
  const breathe=Math.sin(time*m.idle.breath);
  this.body.y=breathe*1.4-jump+anticipation*6;this.body.rotation=anticipation*.055-pulse*.07+hit*m.hit.tilt;
  this.head.rotation=Math.sin(time*1.5+.5)*.025-pulse*.15-hit*.1;this.head.y=-25+anticipation*3-pulse*4;
  this.restTails.forEach((s,i)=>{s.rotation=[-.12,.06,.08][i]+Math.sin(time*1.5-i*.85)*.045-pulse*(.12-i*.025);s.y=30+breathe*.8-jump*.35;s.visible=this.mode!=='victory'||a>1.55;});
  this.left_arm.rotation=-.14+Math.sin(time*2+.7)*.024-pulse*.78+anticipation*.17;this.right_arm.rotation=-.17+pulse*.23;
  this.torso.scale.set(1+breathe*.007,1+breathe*.012);
  this.left_leg.rotation=.17+Math.sin(time*1.4)*.02+hit*.18-jump*.004;this.right_leg.rotation=-.10-Math.sin(time*1.4+.9)*.02-hit*.08+jump*.004;
  const earAlert=Math.exp(-Math.pow((time%5.2-4.4)/.17,2));this.left_ear.rotation=-.24+Math.sin(time*2.1)*m.idle.ear-pulse*.1-earAlert*.10;this.right_ear.rotation=.31-Math.sin(time*2.1-.6)*m.idle.ear+pulse*.13+earAlert*.07;
  this.scarf.rotation=Math.sin(time*2.1-.5)*.045+pulse*.14;this.scarf.scale.y=.86+Math.sin(time*2.4)*.024;this.bell.rotation=Math.sin(time*2.4)*.12-pulse*.25;
  const blink=Math.max(0,1-Math.abs(time%3.7-3.4)/.09);this.eyes.scale.y=Math.max(.09,1-blink);this.pupils.scale.y=this.eyes.scale.y;const gaze=Math.sin(time*.67)*.75+Math.cos(this.actionAngle)*pulse*1.1;this.pupils.x=gaze;this.pupils.y=3+Math.sin(time*.53)*.4;this.pupils.alpha=1-blink;
  this.root.alpha=this.mode==='death'?Math.max(0,1-a/m.death.duration):(invulnerable>0?.62+.38*Math.abs(Math.sin(time*14)):1);
  for(let i=0;i<9;i++){const s=this.tails[i],show=this.mode==='victory';s.visible=show;s.rotation=-1.7+i*.40+Math.sin(time*2+i)*.025;s.tint=i%2?0xe7ba68:0xffffff;s.alpha=show?Math.max(0,Math.sin(Math.min(1,a/1.55)*Math.PI))*.95:0;s.scale.set(.85+.40*Math.min(1,a/.4));}
 }
}
export class EnemyRig{
 root=new Container();body:Sprite;wings:Sprite[]=[];
 constructor(public kind:Enemy['kind'],art:Art){if(kind==='crow'){this.wings.push(sprite(art,'crow_wing',this.root,-20,-14,.8),sprite(art,'crow_wing',this.root,20,-14,.8));this.wings[1].scale.x=-.8;}this.body=sprite(art,(kind==='boss'?'oni':kind)+'_body',this.root);this.root.scale.set(kind==='boss'?1.1:kind==='oni'?.72:kind==='crow'?.62:.72);}
 update(e:Enemy,time:number,alpha=1){this.root.position.set(e.prevX+(e.x-e.prevX)*alpha,e.prevY+(e.y-e.prevY)*alpha+Math.sin(e.age*(e.kind==='crow'?8:4)+e.id)*4);this.body.rotation=Math.sin(time*3+e.id)*.06;this.body.scale.set(1+Math.sin(time*3+e.id)*.025,1-Math.sin(time*3+e.id)*.025);this.body.tint=e.hit>0?0xffeed1:0xffffff;for(let i=0;i<this.wings.length;i++)this.wings[i].rotation=(i===0?1:-1)*(.1+Math.sin(time*15+e.id)*.52);this.root.rotation=e.hit>0?Math.sin(e.hit*50)*.10:0;}
}
