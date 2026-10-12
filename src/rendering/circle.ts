import {GrandWard} from './circle-grand';
import {AscendantWard} from './circle-ascendant';
import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
const GOLD=0xe7ba68,WHITE=0xfff2ce,RED=0xd84332;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
type Ward={grand?:GrandWard|AscendantWard;back:Container;front:Container;floor:Container;rings:Container;dome:Graphics;tails:Container;wave:Graphics;papers:Container[];level:number;radius:number};
/** Geometry is cached at cast time; animation only changes transforms and opacity. */
export class CircleRenderer{
 back=new Container();front=new Container();wards=new Map<number,Ward>();cinematic=new Graphics();cinematicStrength=0;layerVisibility=new Map<string,boolean>();
 constructor(){this.back.addChild(this.cinematic);this.cinematic.rect(0,0,720,1280).fill({color:0x161d20});this.cinematic.visible=false;}
 setLayerVisibility(name:string,visible:boolean){this.layerVisibility.set(name,visible);for(const w of this.wards.values())this.applyLayerVisibility(w);}
 private applyLayerVisibility(w:Ward){if(!(w.grand instanceof AscendantWard))return;const grand=w.grand;for(const [name,layer] of Object.entries(grand.layers))layer.visible=this.layerVisibility.get(name)!==false;grand.fox.front.visible=grand.spiritFace.visible=this.layerVisibility.get('Fox Spirit')!==false;}
 create(s:Skill){
  const level=s.testLevel??1,r=s.radius,back=new Container(),front=new Container(),floor=new Container(),rings=new Container(),tails=new Container(),dome=new Graphics(),wave=new Graphics();
  this.back.addChild(back);this.front.addChild(front);back.addChild(tails,floor);floor.addChild(rings);floor.scale.set(1);
  const base=new Graphics();floor.addChildAt(base,0);base.circle(0,0,r).fill({color:RED,alpha:level===5?.05:.08+level*.015});
  for(let j=0;j<(level===5?3:level+1);j++){
   const g=new Graphics(),radius=r*(level===5?[.76,.65,.49][j]:1-j*.15);rings.addChild(g);
   g.circle(0,0,radius).stroke({color:j%2?RED:GOLD,width:level===5?1.3:j===0?4:2,alpha:level===5?.54:.85});g.circle(0,0,radius-5).stroke({color:WHITE,width:1,alpha:level===5?.22:.6});
   for(let i=0;i<8+level*2;i++){const a=i*Math.PI*2/(8+level*2),x=Math.cos(a)*(radius-13),y=Math.sin(a)*(radius-13);g.moveTo(x,y-6).lineTo(x+5,y).lineTo(x,y+6).lineTo(x-5,y).closePath().stroke({color:GOLD,width:1.4,alpha:.8});}
  }
  const flower=new Graphics();rings.addChild(flower);
  const ribbons=new Graphics();rings.addChild(ribbons);
  for(let j=0;j<2+level;j++){
   const start=j*Math.PI*2/(2+level),rr=r*(.9+j*.025);
   for(let i=0;i<=32;i++){const a=start+i/32*.8,x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i===0)ribbons.moveTo(x,y);else ribbons.lineTo(x,y);}
   ribbons.stroke({color:j%2?WHITE:GOLD,width:level===5?1:level>=3?4:2.5,alpha:level===5?.3:.75});
   const a=start+.8,x=Math.cos(a)*rr,y=Math.sin(a)*rr;ribbons.moveTo(x,y).lineTo(x-Math.sin(a)*20,y+Math.cos(a)*20).lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7).closePath().fill({color:GOLD,alpha:.8});
  }
  for(let i=0;i<(level===5?4:8);i++){const a=i*Math.PI/(level===5?2:4),x=Math.cos(a)*r*.42,y=Math.sin(a)*r*.42,nx=-Math.sin(a)*r*.13,ny=Math.cos(a)*r*.13;flower.moveTo(0,0).quadraticCurveTo(x*.6+nx,y*.6+ny,x,y).quadraticCurveTo(x*.6-nx,y*.6-ny,0,0).fill({color:GOLD,alpha:level===5?.035:.22}).stroke({color:GOLD,width:1.5,alpha:level===5?.42:.75});}
  if(level>=2){back.addChild(dome);dome.circle(0,0,r*.92).fill({color:GOLD,alpha:.045}).stroke({color:GOLD,width:2,alpha:.48});dome.circle(0,0,r*.85).stroke({color:WHITE,width:1,alpha:.14});}
  front.addChild(wave);wave.circle(0,0,r).stroke({color:GOLD,width:level>=3?7:3,alpha:.55});wave.circle(0,0,r-8).stroke({color:WHITE,width:2,alpha:.8});
  const papers:Container[]=[];for(let i=0;i<[4,6,8,9,0][level-1];i++){
   const paper=new Container(),g=new Graphics();paper.addChild(g);g.rect(-12,-25,24,50).fill({color:WHITE}).stroke({color:GOLD,width:1.5});g.moveTo(0,-19).lineTo(-4,-10).lineTo(0,-5).lineTo(4,-10).closePath().stroke({color:RED,width:2});g.moveTo(0,-5).lineTo(0,19).moveTo(-7,0).lineTo(7,3).moveTo(-7,9).lineTo(6,7).moveTo(-5,17).lineTo(0,12).lineTo(6,19).stroke({color:RED,width:2});papers.push(paper);
  }
  const grand=level===5?new AscendantWard(r):level>=3?new GrandWard(level,r):undefined;if(grand){back.addChild(grand.root);front.addChild(grand.front);}const w={back,front,floor,rings,dome,tails,wave,papers,level,radius:r,grand};this.wards.set(s.id,w);return w;
 }
 update(skills:Skill[]){
  const circles=skills.filter(s=>s.rune==='circle'),alive=new Set(circles.map(s=>s.id));this.cinematicStrength=Math.max(0,...circles.filter(s=>s.testLevel===5).map(s=>clamp((s.age-.12)/.5)*clamp((s.duration-s.age)/.65)));this.cinematic.visible=this.cinematicStrength>0;this.cinematic.alpha=this.cinematicStrength*.98;for(const [id,w] of this.wards)if(!alive.has(id)){w.back.destroy({children:true});w.front.destroy({children:true});this.wards.delete(id);}
  for(const s of circles){let w=this.wards.get(s.id);if(w&&(w.level!==(s.testLevel??1)||w.radius!==s.radius)){w.back.destroy({children:true});w.front.destroy({children:true});this.wards.delete(s.id);w=undefined;}w??=this.create(s);
   const t=s.age,open=1-(1-clamp(t/.32))**3,fade=clamp((s.duration-t)/.55),alpha=clamp(t/.09)*fade,r=w.radius;
   w.back.position.set(s.x,s.y);w.front.position.copyFrom(w.back.position);w.back.alpha=w.front.alpha=alpha;w.floor.scale.set(.45+.55*open);w.rings.rotation=t*.13*s.geometry.winding;w.dome.scale.set(open);w.dome.alpha=clamp((t-.12)/.3)*(.9+.1*Math.sin(t*3));w.tails.scale.set(open);w.tails.alpha=clamp((t-.18)/.35)*(.8+.2*Math.sin(t*2));
   w.grand?.update(t);
   this.applyLayerVisibility(w);
   if(w.level===5){w.floor.visible=false;w.dome.visible=false;}
   const burst=clamp((t-.08)/.65);w.wave.scale.set(.5+burst*.8);w.wave.alpha=(1-burst)*clamp(t/.08);
   w.papers.forEach((p,i)=>{const a=i*Math.PI*2/w!.papers.length+t*.65*s.geometry.winding,x=Math.cos(a)*r*.91,y=Math.sin(a)*r*.91;const parent=y>0?w!.front:w!.back;if(p.parent!==parent)parent.addChild(p);p.position.set(x*open,y*open);p.rotation=Math.sin(a)*.22;p.scale.set(.7+.3*open);p.alpha=clamp((t-.08)/.24);});
   if(w.grand?.fox)w.back.addChild(w.grand.root);
  }
 }
 clear(){for(const w of this.wards.values()){w.back.destroy({children:true});w.front.destroy({children:true});}this.wards.clear();this.cinematicStrength=0;this.cinematic.visible=false;}
}
