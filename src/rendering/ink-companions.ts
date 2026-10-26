import {Container,Graphics} from 'pixi.js';
import type {InkCompanions,InkCompanion} from '../gameplay/ink-companions';
import {inkCompanionRadius} from '../gameplay/ink-companions';
const INK=0x111e24,EDGE=0x889b96,PAPER=0xf8e8bf;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Small, round brush-ink friends: one body, two ears, dot eyes and a brush tail. */
export function drawInkBlob(g:Graphics,large=0,time=0){
 const r=inkCompanionRadius(large);
 // One expressive brush tail, with an intentionally clean silhouette.
 const sway=Math.sin(time*4)*r*.12;
 g.moveTo(-r*.62,-r*.2).bezierCurveTo(-r*1.9,-r*.6,-r*1.55,-r*1.6+sway,-r*.91,-r*1.8+sway).bezierCurveTo(-r*1.22,-r*1.05,-r*.48,-r*.91,-r*.62,-r*.2).fill(INK).stroke({color:EDGE,width:.8,alpha:.65});
 if(large===2){g.moveTo(-r*1.12,-r*.97).quadraticCurveTo(-r*1.25,-r*1.36,-r*1.05,-r*1.62).stroke({color:EDGE,width:1.3,alpha:.7});}
 g.ellipse(-r*.42,r*.3,r*.22,r*.12).ellipse(r*.48,r*.3,r*.22,r*.12).fill(INK);
 g.poly([-r*.71,-r*.45,-r*.65,-r*1.18,-r*.16,-r*.77]).fill(INK).stroke({color:EDGE,width:1,alpha:.8});
 g.poly([r*.17,-r*.76,r*.61,-r*1.18,r*.76,-r*.41]).fill(INK).stroke({color:EDGE,width:1,alpha:.8});
 g.ellipse(0,-r*.27,r,r*.78).fill(INK).stroke({color:EDGE,width:1,alpha:.8});
 g.poly([-r*.57,-r*.75,-r*.57,-r*.98,-r*.38,-r*.78]).poly([r*.37,-r*.78,r*.56,-r*.98,r*.61,-r*.74]).fill({color:PAPER,alpha:.9});
 // Tiny cream eyes and a dot nose, never a mask or a human face.
 g.ellipse(r*.12,-r*.38,r*.095,r*.14).ellipse(r*.55,-r*.4,r*.095,r*.14).fill(PAPER);
 g.circle(r*.43,-r*.13,r*.045).fill(0xc77659);
 g.ellipse(-r*.36,-r*.56,r*.2,r*.1).fill({color:0x35484b,alpha:.65});
}
type Rig={root:Container;body:Graphics;shadow:Graphics};
export class InkCompanionRenderer{
 root=new Container();private rigs=new Map<number,Rig>();private effects=new Graphics();private model?:InkCompanions;
 constructor(){this.root.eventMode='none';this.root.sortableChildren=true;this.root.addChild(this.effects);}
 update(model:InkCompanions,low=false){
  if(this.model!==model){for(const rig of this.rigs.values())rig.root.destroy({children:true});this.rigs.clear();this.model=model;}
  const ids=new Set(model.units.map(u=>u.id));
  for(const [id,rig] of this.rigs)if(!ids.has(id)){rig.root.destroy({children:true});this.rigs.delete(id);}
  for(const u of model.units){
   let rig=this.rigs.get(u.id);if(!rig){const root=new Container(),shadow=new Graphics(),body=new Graphics();root.addChild(shadow,body);rig={root,body,shadow};this.rigs.set(u.id,rig);this.root.addChild(root);}
   this.pose(rig,u,model.time,low);
  }
  const fx=this.effects;fx.clear();fx.zIndex=10000;
  for(const hit of model.hits){const t=hit.age/.3,r=hit.large?28:14;fx.ellipse(hit.x,hit.y,r*(.4+t),r*(.2+t*.4)).stroke({color:PAPER,width:2,alpha:(1-t)*.8});
   for(let i=0;i<(low?3:5);i++){const a=i*2.4;fx.circle(hit.x+Math.cos(a)*r*(1+t),hit.y+Math.sin(a)*r*(.5+t),Math.max(.5,3*(1-t))).fill({color:i%2?PAPER:INK,alpha:1-t});}
  }
 }
 private pose(rig:Rig,u:InkCompanion,time:number,low:boolean){
  const {root,body,shadow}=rig,r=inkCompanionRadius(u.large);
  const rise=clamp(u.age/.3),fade=clamp((u.life-u.age)/.65),bounce=u.moving?Math.abs(Math.sin(time*11+u.id))*r*.22:Math.sin(time*3+u.id)*1.2;
  const jump=u.phase==='pounce'?Math.sin(clamp(u.phaseAge/.22)*Math.PI)*r*.8:0;
  let sx=1,sy=1;
  if(u.phase==='windup'){sx=1.12;sy=.8;}else if(u.phase==='pounce'){sx=1.18;sy=.87;}else if(u.phase==='recover'){const t=clamp(u.phaseAge/.28);sx=1.2-.2*t;sy=.75+.25*t;}
  root.position.set(u.x,u.y);root.zIndex=u.y;root.alpha=fade;
  shadow.clear().ellipse(0,1,r*(.85+.15*(1-rise)),r*.27).fill({color:INK,alpha:.4*rise});
  if(u.phase==='rise'||fade<1){shadow.ellipse(0,2,r*(1.1+.25*(1-rise)),r*.3).fill({color:INK,alpha:.85});
   if(!low)for(let i=0;i<3;i++)shadow.circle((i-1)*r*.8,-Math.sin(rise*Math.PI)*r*(.6+i*.2),2.5*(1-rise)+.5).fill(INK);
  }
  body.clear();drawInkBlob(body,u.large,time+u.id);
  body.scale.set(u.facing*sx*(.65+.35*rise),sy*(.15+.85*rise)*(.35+.65*fade));body.y=(1-rise)*r*.4-bounce-jump;
 }
}
