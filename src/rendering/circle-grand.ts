import {WardCloud,SpiritFlame} from './ward-atmosphere';
import {FoxSpirit} from './fox-spirit';
import {FoxOrbit} from './fox-orbit';
import {Container,Graphics} from 'pixi.js';
const GOLD=0xffc968,WHITE=0xfff0cb,RED=0xed4227;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** Higher wards use cached paper-cut silhouettes, never bitmap effects. */
export class GrandWard{
 fox?:FoxSpirit;orbit?:FoxOrbit;front=new Container();decor=new Container();flames:SpiritFlame[]=[];clouds:WardCloud[]=[];petals:Graphics[]=[];root=new Container();halo=new Container();scrolls=new Container();spirit=new Container();
 echoes:Graphics[]=[];leaves:Graphics[]=[];birds:Container[]=[];tails:Graphics[]=[];
 constructor(public level:number,public radius:number){
  const r=radius;this.root.addChild(this.halo,this.scrolls,this.spirit);
  for(let j=0;j<3;j++){const g=new Graphics();this.halo.addChild(g);g.circle(0,0,r*(.78+j*.10)).stroke({color:RED,width:28-j*4,alpha:.22}).circle(0,0,r*(.78+j*.10)).stroke({color:GOLD,width:12-j*2,alpha:.5}).circle(0,0,r*(.78+j*.10)).stroke({color:WHITE,width:3,alpha:.95});}
  for(let j=0;j<3;j++){const g=new Graphics();this.root.addChild(g);g.circle(0,0,r*.8).stroke({color:RED,width:20,alpha:.25}).circle(0,0,r*.8).stroke({color:GOLD,width:8,alpha:.7}).circle(0,0,r*.8).stroke({color:WHITE,width:3,alpha:1});this.echoes.push(g);}
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,g=new Graphics(),p=new Container();p.addChild(g);p.position.set(Math.cos(a)*r*.81,Math.sin(a)*r*.81);p.rotation=a+Math.PI/2;this.scrolls.addChild(p);
   g.moveTo(0,-26).lineTo(9,-6).lineTo(5,18).lineTo(0,32).lineTo(-5,18).lineTo(-9,-6).closePath().fill({color:WHITE}).stroke({color:RED,width:2});g.moveTo(0,-15).lineTo(0,21).moveTo(-4,-3).lineTo(4,2).moveTo(-4,7).lineTo(4,10).stroke({color:RED,width:1.6});
  }
  for(let i=0;i<(level===4?42:26);i++){
   const g=new Graphics();this.root.addChild(g);g.poly([0,-11,3,-4,7,-8,6,-1,12,-2,7,3,9,7,2,6,0,11,-2,6,-9,7,-7,3,-12,-2,-6,-1,-7,-8,-3,-4]).fill({color:i%4?RED:GOLD});g.moveTo(0,8).lineTo(0,-6).stroke({color:WHITE,width:.6,alpha:.55});this.leaves.push(g);
  }
  for(let i=0;i<(level===4?9:5);i++){
   const bird=new Container(),g=new Graphics();bird.addChild(g);this.root.addChild(bird);
   g.moveTo(-3,0).quadraticCurveTo(-20,-23,-36,-13).lineTo(-23,-5).lineTo(-30,1).quadraticCurveTo(-10,7,0,4).quadraticCurveTo(10,7,30,1).lineTo(23,-5).lineTo(36,-13).quadraticCurveTo(20,-23,3,0).lineTo(5,8).lineTo(0,5).lineTo(-5,8).closePath().fill({color:i%2?RED:WHITE}).stroke({color:GOLD,width:1.2});this.birds.push(bird);
  }
  if(level===4){this.fox=new FoxSpirit(r);this.spirit.addChild(this.fox.root);this.orbit=new FoxOrbit();this.root.addChild(this.orbit.back);this.front.addChild(this.orbit.front);}
  this.buildDecor();this.root.addChild(this.spirit);
 }
 buildDecor(){
  const r=this.radius;this.root.addChild(this.decor);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,cloud=new WardCloud(i),flame=new SpiritFlame(i);
   cloud.position.set(Math.cos(a)*r*.99,Math.sin(a)*r*.99);cloud.scale.set(.72+(i%3)*.10);this.decor.addChild(cloud);this.clouds.push(cloud);
   flame.position.set(Math.cos(a+.18)*r*.91,Math.sin(a+.18)*r*.91);flame.rotation=a+Math.PI/2;flame.scale.set(.75+(i%3)*.1);this.decor.addChild(flame);this.flames.push(flame);
  }
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+Math.PI/4,p=new Container(),g=new Graphics();p.addChild(g);p.position.set(Math.cos(a)*r*.74,Math.sin(a)*r*.74);p.rotation=a;this.decor.addChild(p);
   g.rect(-19,-19,38,38).fill({color:RED,alpha:.8}).stroke({color:GOLD,width:2});g.rect(-14,-14,28,28).stroke({color:WHITE,width:1});
   g.moveTo(-9,-8).lineTo(9,-8).lineTo(9,0).lineTo(-9,0).lineTo(-9,8).lineTo(9,8).moveTo(0,-12).lineTo(0,12).stroke({color:WHITE,width:2});
  }
  for(let i=0;i<36;i++){const g=new Graphics();this.root.addChild(g);g.moveTo(0,0).quadraticCurveTo(-9,-7,-5,-14).quadraticCurveTo(7,-13,0,0).fill({color:i%3?RED:WHITE,alpha:.85});this.petals.push(g);}
 }
 update(t:number){
  const r=this.radius,open=1-(1-clamp((t-.10)/.45))**3;this.root.scale.set(.6+.4*open);this.root.alpha=clamp((t-.10)/.25);
  this.halo.alpha=.75+.25*Math.sin(t*3);this.scrolls.rotation=-t*.18;
  this.echoes.forEach((g,i)=>{const u=((t*.55+i/3)%1);g.scale.set(.8+u*.65);g.alpha=(1-u)*.7;});
  this.leaves.forEach((g,i)=>{const a=i*2.399+t*(.3+i%3*.09),distance=r*(.76+(i%7)*.055);g.position.set(Math.cos(a)*distance,Math.sin(a)*distance);g.rotation=a+t*.8;g.scale.set(.65+(i%4)*.16, .6+Math.abs(Math.sin(t*2+i))*.45);g.alpha=.55+.35*Math.sin(t+i)**2;});
  this.birds.forEach((g,i)=>{const a=i*Math.PI*2/this.birds.length-t*.42;g.position.set(Math.cos(a)*r*.98,Math.sin(a)*r*.98);g.rotation=a-Math.PI/2;g.scale.set(.58+.12*Math.sin(t*7+i),.62+.20*Math.sin(t*8+i));});
  this.spirit.alpha=clamp((t-.24)/.5)*(.78+.12*Math.sin(t*2));this.spirit.position.y=-8+Math.sin(t*1.7)*6;this.fox?.update(t);this.orbit?.update(t,r);this.decor.rotation=0;this.clouds.forEach((cloud,i)=>{const a=i*Math.PI/4+t*.04;cloud.position.set(Math.cos(a)*r*.99,Math.sin(a)*r*.99+Math.sin(t*.7+i)*5);cloud.update(t);});this.flames.forEach((f,i)=>{const a=i*Math.PI/4+.18+t*.12;f.position.set(Math.cos(a)*r*.91,Math.sin(a)*r*.91);f.rotation=a+Math.PI/2;f.update(t);});this.petals.forEach((p,i)=>{const a=i*2.399+t*.32,rr=r*(.55+(i%9)*.065);p.position.set(Math.cos(a)*rr,Math.sin(a)*rr+Math.sin(t*2+i)*12);p.rotation=a+t;p.scale.y=.4+Math.abs(Math.sin(t*2+i))*.6;});
 }
}
