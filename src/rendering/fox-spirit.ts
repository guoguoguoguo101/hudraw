import {SpiritFlame} from './ward-atmosphere';
import {drawGuardianFox} from './guardian-fox';
import {Container,Graphics} from 'pixi.js';
import {geometry,geometryTime} from './shared-geometry';
const CREAM=0xffeac6,GOLD=0xffc968,RED=0xe94b30;
/** Articulated tails: motion propagates from rump to tip with a phase delay. */
export class FoxSpirit{
 root=new Container();tails:Graphics[]=[];body=new Container();ribbons=new Graphics();fires:SpiritFlame[]=[];charms:Container[]=[];
 constructor(public radius:number,public form:'coiled'|'guardian'|'ascendant'='guardian'){
  if(form==='guardian'){
   const halo=new Graphics();this.root.addChild(halo);
   halo.circle(0,-85,124).stroke({color:RED,width:14,alpha:.16}).circle(0,-85,124).stroke({color:GOLD,width:3,alpha:.9}).circle(0,-85,109).stroke({color:CREAM,width:1.5,alpha:.8});
   for(const sign of [-1,1])halo.moveTo(sign*146,-109).lineTo(sign*102,-109).moveTo(0,-85+sign*146).lineTo(0,-85+sign*102).stroke({color:GOLD,width:2});
   halo.poly([0,-238,7,-226,0,-214,-7,-226]).stroke({color:GOLD,width:2});
  }
  for(let i=0;i<9;i++){const tail=new Graphics();this.root.addChild(tail);this.tails.push(tail);}
  this.root.addChild(this.ribbons,this.body);const g=new Graphics();this.body.addChild(g);
  drawGuardianFox(g);
  for(let i=0;i<5;i++){
   const p=new Container(),g=new Graphics();p.addChild(g);this.root.addChild(p);g.moveTo(0,-15).lineTo(0,0).stroke({color:GOLD,width:1});g.rect(-9,0,18,38).fill({color:CREAM,alpha:.95}).stroke({color:RED,width:1});g.moveTo(0,4).lineTo(-3,10).lineTo(0,14).lineTo(3,10).closePath().stroke({color:RED,width:1.5});g.moveTo(0,14).lineTo(0,32).moveTo(-5,18).lineTo(5,20).moveTo(-5,26).lineTo(5,24).stroke({color:RED,width:1.5});this.charms.push(p);
  }
  for(let i=0;i<9;i++){const flame=new SpiritFlame(i+8);this.root.addChild(flame);this.fires.push(flame);}
 }
 update(t:number){
  this.tails.forEach((g,i)=>{
   const tip=geometry(g,`fox/${this.radius}/${this.form}/${i}/${geometryTime(t)}`,()=>{
   const coiled=this.form==='coiled',base=-Math.PI*1.1+i*Math.PI*1.2/8,len=this.radius*(.82+.10*Math.sin(i*Math.PI/8));
   const centers:{x:number;y:number;w:number;a:number}[]=[];
   let x=0,y=12;
   for(let j=0;j<=30;j++){
    const u=j/30;
    if(coiled){const a=i*Math.PI*2/9-t*.7+u*1.5,rr=this.radius*(.39+Math.sin(u*Math.PI)*.15)+Math.sin(t*1.5-i-u*2)*u*7;centers.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr,w:Math.sin(u*Math.PI)**.7*this.radius*.072,a:a+Math.PI/2});}
    else{const ascendant=this.form==='ascendant',a=base+Math.sin(t*1.5-i*.46-u*2.8)*u*(ascendant?.40:.24)+Math.sin(u*Math.PI)*.25+u**3*(i<4?-1:1)*(ascendant?1.8:.95);if(j){x+=Math.cos(a)*len/30;y+=Math.sin(a)*len/30;}centers.push({x,y,w:(7+Math.sin(u*Math.PI)**.8*this.radius*(ascendant?.115:.10))*(1-u**8),a});}
   }
   const outline:number[]=[];for(const p of centers)outline.push(p.x-Math.sin(p.a)*p.w,p.y+Math.cos(p.a)*p.w);for(const p of [...centers].reverse())outline.push(p.x+Math.sin(p.a)*p.w,p.y-Math.cos(p.a)*p.w);
   g.clear().poly(outline).stroke({color:RED,width:10,alpha:.12}).poly(outline).fill({color:CREAM,alpha:this.form==='ascendant'?.90:.67}).stroke({color:GOLD,width:1.6,alpha:.85});
   for(const side of [-.6,.4]){const strand=centers.slice(3,29);g.moveTo(strand[0].x-Math.sin(strand[0].a)*strand[0].w*side,strand[0].y+Math.cos(strand[0].a)*strand[0].w*side);for(const p of strand)g.lineTo(p.x-Math.sin(p.a)*p.w*side,p.y+Math.cos(p.a)*p.w*side);g.stroke({color:side<0?CREAM:RED,width:1.5,alpha:side<0?.75:.35});}
   return centers[30];
   });
   const fire=this.fires[i];fire.position.set(tip.x,tip.y);fire.rotation=tip.a+Math.PI/2;fire.scale.set(.42);fire.update(t);
  });
  const bodyScale=1.28;this.body.scale.set(bodyScale+Math.sin(t*2)*.019,bodyScale+Math.sin(t*2+.6)*.023);
  this.body.rotation=this.form==='coiled'?-.35+Math.sin(t)*.08:Math.sin(t*.8)*.015;
  geometry(this.ribbons,`fox-ribbon/${geometryTime(t)}`,()=>{this.ribbons.clear();for(const sign of [-1,1]){const wave=Math.sin(t*2.1+sign)*13;this.ribbons.moveTo(sign*13,-25).bezierCurveTo(sign*67,-49,sign*92,18+wave,sign*148,-12+wave).bezierCurveTo(sign*120,38+wave,sign*66,-20,sign*14,-17).closePath().fill({color:RED,alpha:.85}).stroke({color:GOLD,width:1,alpha:.7});}});
  this.charms.forEach((p,i)=>{const side=i%2?-1:1;p.position.set(side*this.radius*(.28+i*.042),this.radius*(-.26+(i%3)*.20)+Math.sin(t*1.8+i)*5);p.rotation=Math.sin(t*1.7+i)*.16;});
  this.root.position.y=-this.radius*(this.form==='ascendant'?.54:.49)+Math.sin(t*1.7)*4;
 }
}
