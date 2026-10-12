import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import {TalismanSpellFactory} from '../gameplay/spells';
type Shape={root:Container;body:Container;outline:Graphics;rays:Graphics;aimBuilt:boolean};
/** Bounded cached graphics: the player's 64 sampled points are built once per cast. */
export class ProceduralTalismanRenderer{
 root=new Container();shapes=new Map<number,Shape>();spare:Shape[]=[];
 create(s:Skill){const item=this.spare.pop()??{root:new Container(),body:new Container(),outline:new Graphics(),rays:new Graphics(),aimBuilt:false};item.root.removeChildren();item.body.removeChildren().forEach(child=>{if(child!==item.outline)child.destroy({children:true});});item.root.addChild(item.body,item.rays);item.body.addChild(item.outline);item.root.visible=true;item.aimBuilt=false;this.root.addChild(item.root);const g=item.outline;g.clear();item.rays.clear();
  const points=s.geometry.points,c=s.geometry.center,span=Math.max(1,...points.map(p=>Math.abs(p.x-c.x)*2),...points.map(p=>Math.abs(p.y-c.y)*2));const size=s.rune==='circle'?s.radius*2:s.rune==='spiral'?s.radius*1.4:230;
  const local=points.slice(0,64).map(p=>({x:(p.x-c.x)/span*size,y:(p.y-c.y)/span*size}));
  for(const width of [10,3.4,1.1]){if(local.length){g.moveTo(local[0].x,local[0].y);for(const p of local.slice(1))g.lineTo(p.x,p.y);if(['circle','star','triangle'].includes(s.rune))g.closePath();if(width===10&&['circle','star','triangle'].includes(s.rune))g.fill({color:0xd84332,alpha:.055});g.stroke({color:width===1.1?0xfff7e8:0xe7ba68,width,alpha:width===10?.10:width===3.4?.87:.75});}}
  // Meander corners and paper-cut flames grow along actual stroke samples.
  for(let i=0;i<local.length;i+=8){const p=local[i],q=local[Math.min(i+1,local.length-1)],a=Math.atan2(q.y-p.y,q.x-p.x),nx=-Math.sin(a),ny=Math.cos(a);g.moveTo(p.x,p.y).quadraticCurveTo(p.x+nx*12-5,p.y+ny*12-7,p.x+nx*20,p.y+ny*20).quadraticCurveTo(p.x+nx*8+5,p.y+ny*8+6,p.x,p.y).fill({color:i%16?0xe7ba68:0xd84332,alpha:.7});}
  if(['circle','star','triangle','spiral'].includes(s.rune)){g.circle(0,0,size*.24).stroke({color:0xe7ba68,width:1,alpha:.44});for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*size*.24,y=Math.sin(a)*size*.24;g.moveTo(x,y).lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7).stroke({color:0xe7ba68,width:1.4,alpha:.65});}}
  if(['circle','triangle','star','spiral'].includes(s.rune)){
   const radius=s.rune==='spiral'?s.radius:size*.46;
   if(s.rune==='spiral')g.circle(0,0,radius).stroke({color:0xe7ba68,width:1.7,alpha:.28});
   for(let i=0;i<12;i++){const angle=i*Math.PI/6,dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx,x=dx*radius,y=dy*radius;
    g.moveTo(x-dx*12,y-dy*12).quadraticCurveTo(x-dx*6+nx*10,y-dy*6+ny*10,x+dx*12,y+dy*12).quadraticCurveTo(x+dx*2-nx*8,y+dy*2-ny*8,x-dx*12,y-dy*12).fill({color:i%3?0xe7ba68:0xd84332,alpha:.72});
    g.moveTo(x-dx*5,y-dy*5).quadraticCurveTo(x+nx*3,y+ny*3,x+dx*5,y+dy*5).stroke({color:0xfff7e8,width:.9,alpha:.55});
   }
  }
  if(s.copies>1){const copy=new Graphics();for(const p of local.slice(0,1))copy.moveTo(p.x+7,p.y+5);for(const p of local.slice(1))copy.lineTo(p.x+7,p.y+5);copy.stroke({color:0xd84332,width:3,alpha:.7});item.body.addChild(copy);}
  if(s.mirror){const copy=new Graphics();for(const p of local.slice(0,1))copy.moveTo(-p.x,p.y);for(const p of local.slice(1))copy.lineTo(-p.x,p.y);copy.stroke({color:0xe7ba68,width:1.7,alpha:.38});item.body.addChild(copy);}
  if(s.rune==='line'||s.rune==='star'||s.rune==='triangle'){const rays=item.rays;for(const d of TalismanSpellFactory.directions(s)){rays.moveTo(0,0).lineTo(d.x*s.range,d.y*s.range).stroke({color:0xe7ba68,width:s.rune==='star'?5:8,alpha:.55});rays.moveTo(0,0).lineTo(d.x*s.range,d.y*s.range).stroke({color:0xfff7e8,width:1.7,alpha:.85});const x=d.x*s.range,y=d.y*s.range,w=s.rune==='star'?8:12;rays.moveTo(d.x*38,d.y*38).lineTo(x*.8-d.y*w,y*.8+d.x*w).lineTo(x,y).lineTo(x*.76+d.y*w*.65,y*.76-d.x*w*.65).closePath().fill({color:0xe7ba68,alpha:.65});rays.moveTo(d.x*65,d.y*65).lineTo(x*.73+d.y*3,y*.73-d.x*3).lineTo(x*.9,y*.9).closePath().fill({color:0xfff7e8,alpha:.7});rays.moveTo(x,y).lineTo(x-d.x*28-d.y*9,y-d.y*28+d.x*9).lineTo(x-d.x*18,y-d.y*18).lineTo(x-d.x*28+d.y*9,y-d.y*28-d.x*9).closePath().fill({color:0xe7ba68,alpha:.7});}}
  if(s.seal){const y=size*.44;g.rect(-15,y,30,30).fill({color:0x8b2333,alpha:.8}).stroke({color:0xe7ba68,width:1,alpha:.7});g.moveTo(-8,y+7).lineTo(8,y+7).lineTo(-6,y+16).lineTo(8,y+16).moveTo(0,y+4).lineTo(0,y+26).stroke({color:0xe7ba68,width:1.5,alpha:.85});}
  if(s.shock){g.moveTo(-26,-45).lineTo(-8,-52).lineTo(-17,-33).lineTo(5,-37).lineTo(-9,-13).stroke({color:0xfff7e8,width:2,alpha:.85});g.circle(0,0,42).stroke({color:0xe7ba68,width:1,alpha:.45});}
  this.shapes.set(s.id,item);return item;
 }
 update(skills:Skill[]){const alive=new Set(skills.map(s=>s.id));for(const [id,item] of this.shapes)if(!alive.has(id)){item.root.visible=false;this.shapes.delete(id);if(this.spare.length<12)this.spare.push(item);else item.root.destroy({children:true});}
  for(const s of skills){const item=this.shapes.get(s.id)??this.create(s);if(s.rune==='triangle'&&s.released&&!item.aimBuilt&&s.aimPoints.length){item.aimBuilt=true;item.rays.clear();for(const p of s.aimPoints){const dx=p.x-360,dy=p.y-665,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;item.rays.moveTo(0,0).lineTo(dx*.78+nx*9,dy*.78+ny*9).lineTo(dx,dy).lineTo(dx*.78-nx*9,dy*.78-ny*9).closePath().fill({color:0xe7ba68,alpha:.75});item.rays.moveTo(0,0).lineTo(dx,dy).stroke({color:0xfff7e8,width:2,alpha:.85});}}item.root.position.set(s.x,s.y);const scale=.65+.35*Math.min(1,s.age/.12);item.body.scale.set(scale);item.root.alpha=s.age<.1?s.age/.1:Math.min(1,(s.duration-s.age)/.4);if(s.rune==='ink')item.root.alpha*=.45;item.body.rotation=s.rune==='spiral'?s.age*2*s.geometry.winding:s.rune==='circle'||s.seal?s.age*.25*s.geometry.winding:0;item.rays.scale.set(Math.min(1,s.age/.16));item.rays.alpha=Math.max(0,1-(s.age-.12)*1.7);}
 }
 clear(){for(const item of this.shapes.values()){item.root.visible=false;this.spare.push(item);}this.shapes.clear();}
}
