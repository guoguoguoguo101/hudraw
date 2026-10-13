import {Container,Graphics} from 'pixi.js';
import {WardCloud} from './ward-atmosphere';
const RED=0xea402c,WINE=0x952b28,GOLD=0xefbb68,CREAM=0xffedc8,INK=0x151b20;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function sealFlower(g:Graphics,x:number,y:number,r:number,color=CREAM){
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r,nx=-Math.sin(a)*r*.46,ny=Math.cos(a)*r*.46;g.moveTo(x,y).quadraticCurveTo(px+nx,py+ny,px,py).quadraticCurveTo(px-nx,py-ny,x,y).fill({color});}
 g.circle(x,y,r*.12).fill({color:color===CREAM?RED:GOLD});
}
function tassel(g:Graphics,x:number,y:number,length:number){
 g.circle(x,y,3.7).fill({color:GOLD});g.moveTo(x,y+3).lineTo(x,y+length).stroke({color:WINE,width:10});
 for(let i=-2;i<=2;i++)g.moveTo(x+i*1.8,y+6).quadraticCurveTo(x+i*1.8+2,y+length*.55,x+i*2.4,y+length).stroke({color:i%2?GOLD:RED,width:1.2});
}
/** Braided shimenawa and shide are cached path silhouettes, not paper textures. */
function rope(radius:number,count:number){
 const g=new Graphics();g.circle(0,0,radius).stroke({color:WINE,width:17}).circle(0,0,radius).stroke({color:GOLD,width:13});
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count,co=Math.cos(a),si=Math.sin(a),p=(x:number,y:number)=>[co*(radius+y)-si*x,si*(radius+y)+co*x] as const;
  g.moveTo(...p(-9,-5)).quadraticCurveTo(...p(-1,-10),...p(10,4)).quadraticCurveTo(...p(3,10),...p(-9,-5)).closePath().fill({color:i%2?CREAM:GOLD,alpha:.93}).stroke({color:0xa76a36,width:.8,alpha:.65});
  g.moveTo(...p(-7,-4)).quadraticCurveTo(...p(1,-2),...p(6,6)).stroke({color:0xffd58c,width:1.1});
 }
 return g;
}
class SealFire{
 art=new Graphics();
 constructor(public radius:number,public seed:number,public count:number){}
 update(t:number){
  const r=this.radius,g=this.art,span=this.count===2?1.75:1.24,phase=t*1.9+this.seed*1.6;
  const shape=(width:number,shift:number)=>{
   const left:number[]=[],right:number[]=[];
   for(let i=0;i<=28;i++){
    const u=i/28,a=this.seed*Math.PI*2/this.count+t*.24+u*span;
    const rr=r*(1.01+.045*Math.sin(u*Math.PI)+Math.sin(phase-u*3.2)*.035*Math.sin(u*Math.PI)),w=Math.sin(u*Math.PI)**.7*r*width*(.64+.28*Math.sin(phase-u*5)+.14*Math.sin(u*13));
    const bend=Math.sin(u*Math.PI*2+phase)*r*.018*Math.sin(u*Math.PI);
    left.push(Math.cos(a)*(rr+w+shift+bend),Math.sin(a)*(rr+w+shift+bend));right.unshift(Math.sin(a)*(rr-w+shift+bend));right.unshift(Math.cos(a)*(rr-w+shift+bend));
   }
   return [...left,...right];
  };
  g.clear().poly(shape(.074,0)).fill({color:RED,alpha:.9});
  g.poly(shape(.046,-r*.007)).fill({color:GOLD,alpha:.95}).poly(shape(.028,-r*.006)).fill({color:CREAM,alpha:.96});
  // A curled wave crest interrupts the regular ring: red silhouette, gold rim and pale core.
  const curlAngle=this.seed*Math.PI*2/this.count+t*.24+span*.45,scale=r/320;
  const p=(x:number,y:number)=>{const v=y+Math.sin(phase-x*.025)*5*(x/85);return [Math.cos(curlAngle)*(r+v*scale)-Math.sin(curlAngle)*x*scale,Math.sin(curlAngle)*(r+v*scale)+Math.cos(curlAngle)*x*scale] as const;};
  g.moveTo(...p(-35,2)).bezierCurveTo(...p(-14,20),...p(-11,53),...p(25,50)).bezierCurveTo(...p(47,52),...p(44,17),...p(18,24)).bezierCurveTo(...p(29,8),...p(64,25),...p(85,58)).bezierCurveTo(...p(78,6),...p(39,-18),...p(11,-13)).bezierCurveTo(...p(-9,-20),...p(-25,-9),...p(-35,2)).closePath().fill({color:RED});
  g.moveTo(...p(-28,2)).bezierCurveTo(...p(-11,11),...p(-4,43),...p(21,42)).bezierCurveTo(...p(39,45),...p(37,22),...p(23,26)).bezierCurveTo(...p(42,8),...p(59,30),...p(79,48)).bezierCurveTo(...p(68,15),...p(41,-7),...p(14,-4)).bezierCurveTo(...p(-9,-11),...p(-20,-5),...p(-28,2)).closePath().fill({color:CREAM});
  g.moveTo(...p(-18,3)).bezierCurveTo(...p(-5,11),...p(0,36),...p(22,35)).bezierCurveTo(...p(36,34),...p(30,23),...p(24,28)).stroke({color:GOLD,width:2.2});
  // Detached calligraphic tips bend with a delayed wave, rather than scaling a flame badge.
  for(let j=0;j<3;j++){
   const a=this.seed*Math.PI*2/this.count+t*.24+span*.75+j*.17,rr=r*(1.10+j*.008),x=Math.cos(a)*rr,y=Math.sin(a)*rr,dx=-Math.sin(a),dy=Math.cos(a),bend=Math.sin(phase-j*.5)*9;
   g.moveTo(x,y).quadraticCurveTo(x+dx*20-Math.cos(a)*bend,y+dy*20-Math.sin(a)*bend,x+dx*36,y+dy*36).quadraticCurveTo(x+dx*15+Math.cos(a)*5,y+dy*15+Math.sin(a)*5,x,y).fill({color:j%2?RED:CREAM,alpha:.7});
  }
 }
}
/** Elements translated from the AI concepts: sacred rope, paper curtain, seal-blades,
 * lanterns, knot streamers, foxfire crescents, cloud curls and maple fragments. */
export class SealRitual{
 back=new Container();front=new Container();rope=new Container();curtain=new Container();
 folds:Container[]=[];lanterns:Container[]=[];knots:Container[]=[];blades:Container[]=[];fires:SealFire[]=[];clouds:WardCloud[]=[];leaves:Graphics[]=[];streamers:Graphics[]=[];
 constructor(public level:number,public radius:number){
  const r=radius;this.back.addChild(this.rope,this.curtain);
  if(level>=2){
   this.rope.addChild(rope(r*.84,level===4?80:48));
   for(let i=0;i<(level===4?24:level===3?18:12);i++){
    const p=new Container(),g=new Graphics(),length=level>=3?37:27;p.addChild(g);this.curtain.addChild(p);this.folds.push(p);
    g.poly([-6,-4,7,-4,7,3,2,10,7,14,1,22,6,length-4,0,length+6,-8,length-1,-4,length-8,-10,19,-4,11,-9,7]).fill({color:CREAM}).stroke({color:GOLD,width:.8});
    g.moveTo(-3,6).lineTo(3,11).moveTo(-4,19).lineTo(3,24).stroke({color:0xc8ac7c,width:.7,alpha:.55});
   }
  }
  const fireCount=level===1?2:level===2?3:4;
  for(let i=0;i<fireCount;i++){const f=new SealFire(r,i,fireCount);this.back.addChild(f.art);this.fires.push(f);}
  if(level>=2)for(let i=0;i<(level===4?8:4);i++){
   const p=new Container(),g=new Graphics();p.addChild(g);this.front.addChild(p);this.lanterns.push(p);
   g.moveTo(-23,-25).quadraticCurveTo(0,-19,23,-25).lineTo(17,-14).lineTo(-17,-14).closePath().fill({color:INK}).stroke({color:GOLD,width:1.1});
   g.poly([-16,-13,16,-13,18,22,12,29,-12,29,-18,22]).fill({color:WINE}).stroke({color:GOLD,width:1.2});
   g.rect(-12,-9,24,32).fill({color:RED}).rect(-8,-5,16,25).fill({color:GOLD});
   sealFlower(g,0,9,7);g.moveTo(-12,-8).lineTo(-12,22).moveTo(12,-8).lineTo(12,22).stroke({color:INK,width:2});
   g.rect(-20,25,40,5).fill({color:WINE}).stroke({color:GOLD,width:.8});tassel(g,0,34,23);
   g.circle(0,-32,3).fill({color:GOLD});g.moveTo(0,-32).lineTo(0,-25).stroke({color:GOLD,width:1.3});
  }
  if(level>=3)for(let i=0;i<4;i++){
   const p=new Container(),g=new Graphics();p.addChild(g);this.front.addChild(p);this.blades.push(p);
   g.poly([0,-70,8,-36,19,-10,9,23,0,43,-9,23,-19,-10,-8,-36]).fill({color:RED,alpha:.35}).stroke({color:RED,width:5,alpha:.25});
   g.poly([0,-66,5,-32,13,-8,5,23,0,40,-5,23,-13,-8,-5,-32]).fill({color:CREAM}).stroke({color:GOLD,width:1.4});
   g.poly([0,-50,3,-19,6,-5,2,18,0,30,-2,18,-6,-5,-3,-19]).fill({color:RED});sealFlower(g,0,-5,7,RED);
  }
  if(level===4)for(let i=0;i<4;i++){
   const p=new Container(),g=new Graphics(),ribbon=new Graphics();p.addChild(ribbon,g);this.front.addChild(p);this.knots.push(p);this.streamers.push(ribbon);
   g.poly([0,-19,20,0,0,21,-20,0]).fill({color:WINE}).stroke({color:GOLD,width:3});
   g.poly([0,-13,13,0,0,14,-13,0]).fill({color:GOLD});sealFlower(g,0,0,9,WINE);tassel(g,0,24,29);
   for(const sign of [-1,1])g.moveTo(sign*6,7).bezierCurveTo(sign*35,-8,sign*37,20,sign*6,9).stroke({color:RED,width:5});
  }
  if(level>=2)for(let i=0;i<(level===4?6:4);i++){const cloud=new WardCloud(20+i);cloud.scale.set(level===4?.58:level===3?.43:.32);this.front.addChildAt(cloud,0);this.clouds.push(cloud);}
  for(let i=0;i<[12,20,30,44][level-1];i++){
   const g=new Graphics();this.front.addChild(g);this.leaves.push(g);
   if(i%5===0)g.poly([-2,-8,4,-3,2,5,-3,1]).fill({color:GOLD});
   else g.poly([0,-10,3,-4,7,-7,6,-1,11,-2,7,3,8,7,2,6,0,11,-2,6,-8,7,-7,3,-11,-2,-6,-1,-7,-7,-3,-4]).fill({color:i%4?RED:CREAM,alpha:.9});
  }
 }
 update(t:number,breaking:number){
  const r=this.radius,form=clamp((t-.13)/.48),veil=1-breaking;
  this.rope.scale.set(1.1-.1*form+breaking*.13);this.rope.alpha=form*veil;this.rope.rotation=Math.sin(t*.65)*.012;
  this.folds.forEach((p,i)=>{const a=i*Math.PI*2/this.folds.length-.12,rr=r*(.84+.1*(1-form)+breaking*.16);p.position.set(Math.cos(a)*rr,Math.sin(a)*rr);p.rotation=a+Math.PI/2+Math.sin(t*2.1-i*.4)*.07;p.alpha=form*veil;});
  this.fires.forEach(f=>{f.update(t);f.art.alpha=clamp(t/.35)*(1-breaking*.45);f.art.scale.set(1+breaking*.15);});
  this.lanterns.forEach((p,i)=>{const a=i*Math.PI*2/this.lanterns.length+Math.PI/8;p.position.set(Math.cos(a)*r*.94,Math.sin(a)*r*.94+Math.sin(t*1.4+i)*4);p.scale.set(this.level===4?.92:.6);p.rotation=Math.sin(t*1.8-i*.5)*.07;p.alpha=clamp((t-.32-i*.022)/.28)*veil;});
  this.blades.forEach((p,i)=>{const a=Math.PI/4+i*Math.PI/2;p.position.set(Math.cos(a)*r*(.73+breaking*.14),Math.sin(a)*r*(.73+breaking*.14));p.rotation=a-Math.PI/2;p.scale.set(.7+.3*form);p.alpha=clamp((t-.3-i*.05)/.35)*veil*(.88+Math.sin(t*3+i)*.12);});
  this.knots.forEach((p,i)=>{const a=-Math.PI/2+i*Math.PI/2;p.position.set(Math.cos(a)*r*.84,Math.sin(a)*r*.84);p.scale.set(.82);p.alpha=form*veil;const g=this.streamers[i],sway=Math.sin(t*2-i)*10;g.clear();
   for(const sign of [-1,1]){g.moveTo(sign*10,10).bezierCurveTo(sign*35,19+sway,sign*12,43-sway,sign*48,72).lineTo(sign*30,64).bezierCurveTo(sign*4,41-sway,sign*23,23+sway,sign*10,10).closePath().fill({color:RED});g.moveTo(sign*14,20).quadraticCurveTo(sign*19,46-sway,sign*39,63).stroke({color:GOLD,width:1,alpha:.6});}
  });
  this.clouds.forEach((cloud,i)=>{const a=i*Math.PI*2/this.clouds.length+.35+t*.03,rr=r*(1.04+Math.sin(t*.8+i)*.018);cloud.position.set(Math.cos(a)*rr,Math.sin(a)*rr);cloud.update(t);cloud.alpha=clamp((t-.3)/.5)*(1-breaking*.5);});
  this.leaves.forEach((g,i)=>{const a=i*2.399+t*(.13+(i%3)*.04),rr=r*(.86+(i%7)*.037+breaking*.18);g.position.set(Math.cos(a)*rr,Math.sin(a)*rr+Math.sin(t*1.8+i)*7);g.rotation=a+t*.45;g.scale.set(.35+(i%4)*.09,.3+Math.abs(Math.sin(t*1.6+i))*.45);g.alpha=clamp((t-.1-i*.006)/.35)*(1-breaking*.8);});
 }
}
