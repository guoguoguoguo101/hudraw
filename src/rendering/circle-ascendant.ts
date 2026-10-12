import {Container,Graphics} from 'pixi.js';
import {AscendantCrane} from './ascendant-crane';
import {AscendantSpirit} from './ascendant-spirit';
import {CircleScrollRing} from './circle-scroll-ring';
import {WardCloud} from './ward-atmosphere';
const WHITE=0xffedce,GOLD=0xecc16f,RED=0xdf3b28,INK=0x202729;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const reveal=(t:number,start:number,duration:number)=>clamp((t-start)/duration);
export const CIRCLE_FIVE_LAYERS=['Core','Inner Circle','Outer Circle','Scroll Ring','Ofuda','Fox Spirit','Shrine Props','Light FX'] as const;
type LayerName=typeof CIRCLE_FIVE_LAYERS[number];
/** Eight editable modules follow the six-stage ritual timeline. */
export class AscendantWard{
 root=new Container();front=new Container();layers={} as Record<LayerName,Container>;
 fox:AscendantSpirit;scrollRing:CircleScrollRing;cranes:AscendantCrane[]=[];clouds:WardCloud[]=[];charms:Container[]=[];leaves:Graphics[]=[];
 core=new Graphics();inner=new Graphics();outer=new Graphics();halo=new Graphics();arcs=new Graphics();props:Container[]=[];lanterns:Graphics[]=[];spiritFace=new Container();outline=new Graphics();
 constructor(public radius:number){
  for(const name of CIRCLE_FIVE_LAYERS){const layer=new Container();layer.label=name;this.layers[name]=layer;(name==='Ofuda'||name==='Light FX'?this.front:this.root).addChild(layer);}
  const r=radius;
  this.layers.Core.addChild(this.core);this.core.circle(0,0,r*.15).stroke({color:GOLD,width:1.2,alpha:.8});
  this.layers['Inner Circle'].addChild(this.inner);const g=this.inner;
  g.circle(0,0,r*.47).stroke({color:GOLD,width:1.5,alpha:.85}).circle(0,0,r*.44).stroke({color:WHITE,width:1,alpha:.38});
  for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.cos(a)*r*.39,y=Math.sin(a)*r*.39,nx=-Math.sin(a)*r*.15,ny=Math.cos(a)*r*.15;g.moveTo(0,0).quadraticCurveTo(x*.5+nx,y*.5+ny,x,y).quadraticCurveTo(x*.5-nx,y*.5-ny,0,0).stroke({color:GOLD,width:1.2,alpha:.5});}
  for(let i=0;i<32;i++){const a=i*Math.PI/16;g.moveTo(Math.cos(a)*r*.46,Math.sin(a)*r*.46).lineTo(Math.cos(a)*r*(i%4===0?.425:.442),Math.sin(a)*r*(i%4===0?.425:.442)).stroke({color:GOLD,width:1,alpha:.6});}
  this.layers['Outer Circle'].addChild(this.outer);
  this.scrollRing=new CircleScrollRing(r*.94,62);this.layers['Scroll Ring'].addChild(this.scrollRing);
  this.fox=new AscendantSpirit(r);this.fox.body.scale.set(1.7);this.layers['Fox Spirit'].addChild(this.fox.root);this.root.addChildAt(this.layers['Fox Spirit'],0);this.spiritFace.addChild(this.fox.body);this.spiritFace.label=this.fox.front.label='Fox Spirit';this.root.addChild(this.spiritFace);this.front.addChild(this.fox.front);
  this.layers['Light FX'].addChild(this.halo,this.arcs,this.outline);
  this.outline.moveTo(0,-84).bezierCurveTo(-19,-88,-31,-78,-37,-60).lineTo(-62,-38).lineTo(-43,-37).lineTo(-57,-24).lineTo(-35,-29).lineTo(-45,-13).lineTo(-28,-20).bezierCurveTo(-24,0,-12,17,0,23).bezierCurveTo(12,17,24,0,28,-20).lineTo(45,-13).lineTo(35,-29).lineTo(57,-24).lineTo(43,-37).lineTo(62,-38).lineTo(37,-60).bezierCurveTo(31,-78,19,-88,0,-84).closePath().stroke({color:WHITE,width:1.2,alpha:.8});this.outline.scale.set(1.7);
  // Guardian halo belongs to light FX; the face and all nine tails stay separately addressable.
  for(const rad of [r*.31,r*.35])this.halo.circle(0,-r*.81,rad).stroke({color:GOLD,width:1.1,alpha:.5});
  this.halo.moveTo(0,-r*1.23).lineTo(0,-r*.40).stroke({color:GOLD,width:1,alpha:.45});
  for(const y of [-r*1.18,-r*.46])this.halo.poly([0,y-12,6,y,0,y+12,-6,y]).stroke({color:WHITE,width:1.2,alpha:.7});
  for(let i=0;i<12;i++){
   const p=new Container(),g=new Graphics();p.addChild(g);this.layers.Ofuda.addChild(p);this.charms.push(p);
   g.moveTo(-10,-24).quadraticCurveTo(0,-26,10,-24).lineTo(10,24).quadraticCurveTo(0,20,-10,24).closePath().fill({color:WHITE}).stroke({color:GOLD,width:1});
   g.moveTo(0,-18).lineTo(-4,-11).lineTo(0,-6).lineTo(4,-11).closePath().moveTo(0,-6).lineTo(0,17).moveTo(-6,0).lineTo(6,3).moveTo(-6,11).lineTo(6,8).stroke({color:RED,width:1.8});
   if(i%2)g.poly([-5,18,-5,21,5,21,5,18]).stroke({color:RED,width:.8});
  }
  for(let i=0;i<4;i++){
   const prop=new Container(),g=new Graphics();prop.addChild(g);this.layers['Shrine Props'].addChild(prop);this.props.push(prop);
   if(i%2===0){g.poly([-30,-23,0,-17,30,-23,25,-15,-25,-15]).fill({color:INK}).stroke({color:GOLD,width:.8});g.rect(-22,-15,6,43).rect(16,-15,6,43).rect(-26,-8,52,5).fill({color:RED});}
   else {g.rect(-21,-8,42,35).fill({color:RED});g.rect(-13,0,26,27).fill({color:INK});g.rect(-1,1,2,25).fill({color:GOLD});g.poly([-31,-11,0,-28,31,-11,25,-5,-25,-5]).fill({color:INK}).stroke({color:GOLD,width:1});g.poly([-23,-28,0,-39,23,-28,18,-23,-18,-23]).fill({color:INK}).stroke({color:GOLD,width:.8});g.rect(-26,27,52,3).fill({color:GOLD});}
   for(const x of [-34,34]){const lantern=new Graphics();prop.addChild(lantern);this.lanterns.push(lantern);lantern.position.set(x,6);lantern.roundRect(-4,0,8,13,2).fill({color:RED}).stroke({color:GOLD,width:.8});lantern.moveTo(0,-4).lineTo(0,0).moveTo(0,13).lineTo(0,18).stroke({color:GOLD,width:1});}
  }
  for(let i=0;i<4;i++){const cloud=new WardCloud(i+12);cloud.scale.set(.9+i%2*.12);this.layers['Shrine Props'].addChild(cloud);this.clouds.push(cloud);}
  for(let i=0;i<3;i++){const crane=new AscendantCrane(i);this.layers['Shrine Props'].addChild(crane);this.cranes.push(crane);}
  for(let i=0;i<24;i++){const leaf=new Graphics();leaf.poly([0,-7,3,-2,7,0,3,3,0,7,-3,3,-7,0,-3,-2]).fill({color:RED});this.layers['Light FX'].addChild(leaf);this.leaves.push(leaf);}
 }
 update(t:number){
  const r=this.radius;this.root.alpha=this.front.alpha=1;
  const l=this.layers;l.Core.alpha=reveal(t,0,.25);l['Inner Circle'].alpha=reveal(t,.22,.4);l['Inner Circle'].scale.set(.85+.15*reveal(t,.22,.4));l['Inner Circle'].rotation=t*.06;
  const expand=reveal(t,.45,.48);l['Outer Circle'].alpha=expand;this.outer.clear();
  for(const [index,rad] of [r*.65,r*.73,r*.79].entries()){
   const end=Math.PI*2*reveal(t,.45+index*.10,.50);if(end<=0)continue;this.outer.arc(0,0,rad,-Math.PI/2,-Math.PI/2+end).stroke({color:index===1?RED:GOLD,width:index===1?2:1.3,alpha:index===1?.8:.7});
   for(let i=0;i<16;i++){if(i/16>end/(Math.PI*2))continue;const a=i*Math.PI/8,x=Math.cos(a)*rad,y=Math.sin(a)*rad;this.outer.poly([x,y-5,x+4,y,x,y+5,x-4,y]).stroke({color:GOLD,width:1,alpha:.7});}
  }l['Outer Circle'].rotation=-t*.035;
  l.Ofuda.alpha=reveal(t,.82,.42);this.charms.forEach((p,i)=>{const a=-Math.PI/2+.40+i*(Math.PI*2-.80)/11+Math.sin(t*.4)*.035,spread=reveal(t,.82+i*.025,.40),rad=r*(i%3===0?.81:.69)*(.18+.82*spread);p.position.set(Math.cos(a)*rad,Math.sin(a)*rad);p.rotation=Math.sin(t*1.2+i)*.12;p.alpha=spread;});
  this.scrollRing.update(t);l['Scroll Ring'].alpha=reveal(t,1.12,.2);
  const spirit=reveal(t,2.13,.68);l['Fox Spirit'].alpha=spirit*.76;this.fox.front.alpha=spirit*.50;this.spiritFace.alpha=reveal(t,2.32,.5)*.94;this.fox.update(t);this.fox.body.y+=Math.sin(t*.8)*5;this.outline.y=this.fox.body.y;this.outline.alpha=spirit*(1-reveal(t,2.35,.5));
  l['Shrine Props'].alpha=reveal(t,1.95,.5);this.props.forEach((p,i)=>{const a=Math.PI*.25+i*Math.PI/2+Math.sin(t*.32)*.018,rad=r*.81;p.position.set(Math.cos(a)*rad,Math.sin(a)*rad);p.scale.set(i<2?.78:.86);});
  this.clouds.forEach((c,i)=>{const a=Math.PI*.13+i*Math.PI/2,rad=r*1.07;c.position.set(Math.cos(a)*rad,Math.sin(a)*rad);c.alpha=.65;c.update(t);});
  this.cranes.forEach((c,i)=>{const a=.1+i*Math.PI*2/3-t*.12,rad=r*1.09;c.position.set(Math.cos(a)*rad,Math.sin(a)*rad);c.rotation=a-Math.PI/2;c.scale.set(.55);c.alpha=.78;c.update(t);});
  l['Light FX'].alpha=reveal(t,.65,.3);this.halo.alpha=spirit*(.6+.15*Math.sin(t*1.8));const g=this.arcs;g.clear();
  for(let i=0;i<3;i++){const a=t*.18+i*Math.PI*2/3,rad=r*(.78+i*.035);g.arc(0,0,rad,a,a+.48).stroke({color:GOLD,width:7,alpha:.07}).arc(0,0,rad,a,a+.48).stroke({color:WHITE,width:1.4,alpha:.65});const x=Math.cos(a+.48)*rad,y=Math.sin(a+.48)*rad;g.circle(x,y,3).fill({color:WHITE,alpha:.7});}
  this.leaves.forEach((p,i)=>{const a=i*2.399+t*.12,rad=r*(.96+i%5*.035);p.position.set(Math.cos(a)*rad,Math.sin(a)*rad);p.rotation=a+t*.3;p.scale.set(.5+i%3*.2);p.alpha=.35+.25*Math.sin(t+i)**2;});
 }
}
