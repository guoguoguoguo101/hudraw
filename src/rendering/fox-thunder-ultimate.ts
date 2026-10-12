import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import {AscendantScroll} from './ascendant-scroll';
import {AscendantCrane} from './ascendant-crane';
const C={white:0xfff1d4,red:0xbc392b,gold:0xe2b66a,ink:0x24252a};
const sat=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-(1-sat(n))**3;
/** World-coordinate controls: adjust before replaying the skill. */
export const FOX_THUNDER_PARAMS={foxScale:.96,tailLength:275,tailWidth:29,cloudCount:8,paperCount:16,cloudTrailLength:290,impactRadius:278,skyAt:.08,foxAt:.36,chargeAt:1.05,strikeAt:1.65,fadeAt:3.15,duration:4.5};
export type FoxThunderPhase='openSky'|'summonFox'|'chargeLance'|'thunderImpact'|'disperse';
export function foxThunderPhase(t:number):FoxThunderPhase{const p=FOX_THUNDER_PARAMS;return t<p.foxAt?'openSky':t<p.chargeAt?'summonFox':t<p.strikeAt?'chargeLance':t<p.fadeAt?'thunderImpact':'disperse';}
function rune(g:Graphics,x:number,y:number,s:number){
 g.moveTo(x,y-13*s).lineTo(x-5*s,y-4*s).lineTo(x+5*s,y-4*s).lineTo(x-3*s,y+6*s).lineTo(x+4*s,y+10*s).moveTo(x-8*s,y).lineTo(x+8*s,y).stroke({color:C.red,width:1.8*s});
}
function curvedCloud(g:Graphics,t:number,index:number,scale=1){
 const w=Math.sin(t*2-index*.7)*9;g.clear();
 g.moveTo(-64,8).bezierCurveTo(-97,-8,-56,-35,-36,-19).bezierCurveTo(-48,-52,0,-68,19,-35).bezierCurveTo(37,-52,68,-35,56,-13).bezierCurveTo(101,-13,107,15+w,68,26).bezierCurveTo(30,42,8,20,-22,27).bezierCurveTo(-39,30,-42,10,-64,8).fill({color:C.white}).stroke({color:C.gold,width:1.5});
 g.moveTo(-31,4).bezierCurveTo(-39,-25,-6,-35,8,-14).bezierCurveTo(17,2,-4,15,-10,0).bezierCurveTo(-13,-7,-5,-11,0,-6).stroke({color:C.red,width:3});
 g.moveTo(38,8).bezierCurveTo(65,-13,79,6,66,17).stroke({color:C.gold,width:2});
 g.moveTo(67,23).bezierCurveTo(101,6+w,113,37+w,151,7+w).bezierCurveTo(120,45+w,96,28,70,31).fill({color:C.red,alpha:.85});g.scale.set(scale);
}
function lightning(g:Graphics,x1:number,y1:number,x2:number,y2:number,t:number,seed:number,width:number,alpha=1){
 const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,n=Math.max(4,Math.ceil(d/48));const p:number[]=[];
 for(let i=0;i<=n;i++){const f=i/n,o=i===0||i===n?0:(i%2?1:-1)*(9+Math.sin(seed+i*2.6+t*14)*5);p.push(x1+dx*f+nx*o,y1+dy*f+ny*o);}
 for(const [color,w,a] of [[C.red,width+9,alpha*.2],[C.gold,width+2,alpha*.95],[C.white,width,alpha]] as const){g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.stroke({color,width:w,alpha:a});}
}
function drawFoxBody(g:Graphics){
 g.moveTo(0,-132).bezierCurveTo(-43,-145,-85,-112,-87,-61).bezierCurveTo(-96,-7,-63,36,-37,68).lineTo(-14,92).lineTo(-19,28).lineTo(0,58).lineTo(19,28).lineTo(14,92).lineTo(37,68).bezierCurveTo(63,36,96,-7,87,-61).bezierCurveTo(85,-112,43,-145,0,-132).fill({color:C.white}).stroke({color:C.gold,width:2});
 for(const sign of [-1,1]){
  g.moveTo(sign*57,-89).bezierCurveTo(sign*105,-50,sign*118,12,sign*81,64).lineTo(sign*46,86).lineTo(sign*44,69).lineTo(sign*57,57).bezierCurveTo(sign*70,25,sign*57,-1,sign*31,-29).fill({color:C.white}).stroke({color:C.gold,width:2});
  g.moveTo(sign*79,61).lineTo(sign*64,70).moveTo(sign*71,67).lineTo(sign*58,77).stroke({color:C.red,width:2});
  g.moveTo(sign*57,-96).bezierCurveTo(sign*76,-45,sign*45,-18,sign*61,16).stroke({color:C.red,width:5});
  g.moveTo(sign*16,-13).lineTo(sign*31,7).lineTo(sign*22,6).lineTo(sign*26,33).stroke({color:C.gold,width:2});
 }
 g.moveTo(-46,-36).quadraticCurveTo(0,-15,46,-36).lineTo(40,-24).quadraticCurveTo(0,-5,-40,-24).fill({color:C.red});
 g.circle(0,-9,11).fill({color:C.gold}).stroke({color:C.ink,width:1});g.moveTo(0,-15).lineTo(0,-5).stroke({color:C.red,width:2});
}
function drawFoxHead(g:Graphics){
 for(const sign of [-1,1]){
  g.moveTo(sign*26,-133).bezierCurveTo(sign*38,-176,sign*69,-194,sign*78,-227).bezierCurveTo(sign*104,-186,sign*101,-147,sign*70,-113).fill({color:C.white}).stroke({color:C.gold,width:2});
  g.moveTo(sign*74,-206).quadraticCurveTo(sign*85,-157,sign*48,-136).lineTo(sign*55,-168).fill({color:C.red});
 }
 g.moveTo(0,-157).bezierCurveTo(-38,-163,-57,-145,-66,-120).lineTo(-94,-106).lineTo(-69,-105).lineTo(-105,-85).lineTo(-66,-88).lineTo(-83,-64).lineTo(-47,-70).bezierCurveTo(-31,-45,-16,-26,0,-18).bezierCurveTo(16,-26,31,-45,47,-70).lineTo(83,-64).lineTo(66,-88).lineTo(105,-85).lineTo(69,-105).lineTo(94,-106).bezierCurveTo(52,-137,44,-162,0,-157).fill({color:C.white}).stroke({color:C.gold,width:2});
 for(const sign of [-1,1]){
  g.moveTo(sign*52,-122).quadraticCurveTo(sign*36,-110,sign*13,-91).lineTo(sign*45,-98).lineTo(sign*61,-120).fill({color:C.red});
  g.poly([sign*50,-115,sign*18,-95,sign*42,-102]).fill({color:C.ink});g.moveTo(sign*43,-110).lineTo(sign*29,-101).stroke({color:C.gold,width:2});
  g.poly([sign*52,-89,sign*29,-68,sign*42,-72,sign*28,-48,sign*62,-78]).fill({color:C.red});
  g.moveTo(sign*13,-88).quadraticCurveTo(sign*16,-67,sign*5,-42).stroke({color:C.gold,width:1.4});
 }
 g.poly([0,-153,9,-131,0,-110,-9,-131]).fill({color:C.red});rune(g,0,-131,.57);g.moveTo(0,-142).lineTo(-4,-132).lineTo(4,-131).lineTo(0,-117).stroke({color:C.white,width:1.7});
 g.poly([-7,-41,7,-41,0,-33]).fill({color:C.ink});g.moveTo(0,-33).lineTo(0,-27).moveTo(-7,-26).quadraticCurveTo(0,-22,7,-26).stroke({color:C.red,width:1.6});
}
function drawFoxTail(g:Graphics,index:number,t:number,progress:number){
 const p=FOX_THUNDER_PARAMS,a=-Math.PI*1.03+index*Math.PI*1.06/8,len=p.tailLength*(.92+index%3*.055),pts:{x:number;y:number;w:number;a:number}[]=[];let x=0,y=-35;
 for(let j=0;j<=42;j++){const u=j/42,angle=a+Math.sin(t*1.5-index*.55-u*3)*u*.29+Math.sin(u*Math.PI)*.18+u**3*(index<4?-1:1)*2.65;if(j){x+=Math.cos(angle)*len/42*progress;y+=Math.sin(angle)*len/42*progress;}pts.push({x,y,w:(7+Math.sin(u*Math.PI)**.8*p.tailWidth)*(1-u**8)*progress,a:angle});}
 const outline:number[]=[];for(const q of pts)outline.push(q.x-Math.sin(q.a)*q.w,q.y+Math.cos(q.a)*q.w);for(const q of [...pts].reverse())outline.push(q.x+Math.sin(q.a)*q.w,q.y-Math.cos(q.a)*q.w);
 g.clear().poly(outline).fill({color:C.white}).stroke({color:C.gold,width:1.8});
 for(const side of [-.72,.65]){const strand=pts.slice(3,40);g.moveTo(strand[0].x-Math.sin(strand[0].a)*strand[0].w*side,strand[0].y+Math.cos(strand[0].a)*strand[0].w*side);for(const q of strand)g.lineTo(q.x-Math.sin(q.a)*q.w*side,q.y+Math.cos(q.a)*q.w*side);g.stroke({color:side<0?C.red:C.gold,width:side<0?5:1.2});}
 for(let k=9;k<32;k+=5){const q=pts[k],v=(k%3)*4;g.poly([q.x-13,q.y+8,q.x-5,q.y-10-v,q.x+2,q.y-2,q.x+9,q.y-15+v,q.x+19,q.y+8]).fill({color:C.ink,alpha:.25});g.moveTo(q.x-12,q.y+12).quadraticCurveTo(q.x,q.y+4,q.x+16,q.y+12).stroke({color:C.gold,width:1});}
 const end=pts.at(-1)!;g.moveTo(end.x,end.y).quadraticCurveTo(end.x+Math.sin(t*3+index)*16,end.y-20,end.x+8,end.y-30).stroke({color:C.red,width:2});
}
export class FoxThunderUltimate extends Container{
 phase:FoxThunderPhase='openSky';backdrop=new Graphics();runeCircleLayer=new Graphics();fox=new Container();foxBodyLayer=new Graphics();foxHeadLayer=new Graphics();foxTailLayers:Graphics[]=[];thunderLanceLayer=new Graphics();cloudLayers:Graphics[]=[];talismanLayers:Graphics[]=[];windLayer=new Graphics();impactLayer=new Graphics();scrolls:AscendantScroll[]=[];cranes:AscendantCrane[]=[];
 constructor(){
  super();this.addChild(this.backdrop,this.runeCircleLayer,this.fox);
  for(let i=0;i<9;i++){const tail=new Graphics();this.fox.addChild(tail);this.foxTailLayers.push(tail);}
  drawFoxBody(this.foxBodyLayer);drawFoxHead(this.foxHeadLayer);this.fox.addChild(this.foxBodyLayer,this.foxHeadLayer);
  for(let i=0;i<2;i++){const scroll=new AscendantScroll(i+1,260,73);this.addChild(scroll);this.scrolls.push(scroll);}
  this.addChild(this.windLayer,this.thunderLanceLayer,this.impactLayer);
  for(let i=0;i<FOX_THUNDER_PARAMS.cloudCount;i++){const g=new Graphics();this.addChild(g);this.cloudLayers.push(g);}
  for(let i=0;i<FOX_THUNDER_PARAMS.paperCount;i++){const g=new Graphics();g.rect(-7,-17,14,34).fill({color:i%3?C.white:C.red}).stroke({color:C.gold,width:1});g.rect(-5,-15,10,30).stroke({color:C.red,width:1});rune(g,0,0,.65);this.addChild(g);this.talismanLayers.push(g);}
  for(let i=0;i<3;i++){const crane=new AscendantCrane(i);this.addChild(crane);this.cranes.push(crane);}
 }
 update(s:Skill){
  const p=FOX_THUNDER_PARAMS,t=s.age;this.phase=foxThunderPhase(t);const fade=1-ease((t-p.fadeAt)/(p.duration-p.fadeAt));this.alpha=fade;
  const sky=ease((t-p.skyAt)/.55),reveal=ease((t-p.foxAt)/.7),impact=sat((t-p.strikeAt)/.22),after=Math.max(0,t-p.strikeAt);
  this.backdrop.clear().rect(25,200,670,830).fill({color:C.ink,alpha:sky*.38});
  const dive=ease((t-1.35)/.30)*(1-sat((t-2.3)/.8));
  this.fox.position.set(350+dive*10,349+reveal*20+dive*18+Math.sin(t*1.5)*3);this.fox.scale.set(p.foxScale*(.7+reveal*.3),p.foxScale*(.55+reveal*.17));this.fox.rotation=-.055+dive*.055;this.fox.alpha=reveal*(1-sat((t-2.7)/1.0)*.55);
  this.foxBodyLayer.scale.y=.8+reveal*.2;this.foxHeadLayer.rotation=-.07+Math.sin(t*1.6)*.025+dive*.07;this.foxHeadLayer.position.set(12,dive*8);
  this.foxTailLayers.forEach((g,i)=>{const open=ease((t-p.foxAt-i*.065)/.72);drawFoxTail(g,i,t,open);g.alpha=open;});
  this.scrolls.forEach((scroll,i)=>{scroll.update(t+.2);scroll.position.set(360+(i?1:-1)*(175+sky*65),275+Math.sin(t+i)*8);scroll.rotation=Math.PI/2+(i?.36:-.36);scroll.alpha*=sky*.8;});
  const ground=this.runeCircleLayer;ground.clear();for(let i=0;i<3;i++)ground.circle(360,690,64+i*18+sky*10).stroke({color:i===1?C.red:C.gold,width:i===1?3:1,alpha:sky*(.65-i*.12)});
  for(let i=0;i<12;i++){const a=i*Math.PI/6-t*.2;ground.moveTo(360+Math.cos(a)*99,690+Math.sin(a)*99).lineTo(360+Math.cos(a)*108,690+Math.sin(a)*108).stroke({color:C.gold,width:1.5,alpha:sky});}
  const wind=this.windLayer;wind.clear();for(let i=0;i<6;i++){const sign=i%2?-1:1,x=360+sign*(180+i%3*30),y=300+i*68;
   wind.moveTo(x,y).bezierCurveTo(x-sign*100,y+70+Math.sin(t+i)*18,x+sign*50,y+155,360+sign*90,y+p.cloudTrailLength).stroke({color:i%3?C.gold:C.red,width:i%3?1.6:7,alpha:sky*.24});
  }
  const lance=this.thunderLanceLayer;lance.clear();const charge=ease((t-p.chargeAt)/.45),fall=ease((t-(p.strikeAt-.16))/.16),beamFade=1-sat((after-.65)/.85);
  if(charge>0){
   const top=340,end=top+charge*60+fall*230,width=(12+fall*18)*(1+Math.sin(t*24)*.04),beamAlpha=charge*beamFade;
   // One straight ivory axis surrounded by folded paper lightning, never a web of equal-weight lines.
   const points=[360,top-25,360+width*.6,top+30,360+width*.35,top+68,360+width,top+105,360+width*.48,top+143,360+width*.65,end-70,360,end,360-width*.65,end-70,360-width*.48,top+143,360-width,top+105,360-width*.35,top+68,360-width*.6,top+30];
   lance.poly(points).stroke({color:C.red,width:14,alpha:beamAlpha*.16}).poly(points).fill({color:C.white,alpha:beamAlpha}).stroke({color:C.gold,width:2.5,alpha:beamAlpha});
   lance.moveTo(360,top).lineTo(360,end-20).stroke({color:0xffffff,width:7,alpha:beamAlpha});
   for(const sign of [-1,1])lance.moveTo(360+sign*8,top+8).lineTo(360+sign*9,top+62).lineTo(360+sign*20,top+104).lineTo(360+sign*10,top+145).lineTo(360+sign*15,end-70).lineTo(360,end-6).stroke({color:C.red,width:2.4,alpha:beamAlpha*.9});
   if(fall>0){
    for(let i=0;i<7;i++){const sign=i%2?-1:1,y=top+20+i*33;lightning(lance,360+sign*15,y,360+sign*(45+Math.sin(t*12+i)*14),y+65,t,i,2.1,beamAlpha*.85);}
    lance.poly([360,420,381,450,360,480,339,450]).stroke({color:C.gold,width:2,alpha:beamAlpha});
    lance.poly([360,436,369,450,360,464,351,450]).fill({color:C.red,alpha:beamAlpha});
   }
  }
  const g=this.impactLayer;g.clear();
  if(impact>0){
   for(let ring=0;ring<3;ring++){const age=after-ring*.16,u=sat(age/.72);if(age<0)continue;const r=70+u*p.impactRadius,al=(1-u)*fade;
    g.circle(360,690,r).stroke({color:C.gold,width:3-ring*.65,alpha:al});
    for(let j=0;j<8;j++){const a=j*Math.PI/4+t*.04;g.arc(360,690,r+8,a,a+.38).stroke({color:C.red,width:6,alpha:al*.6});}
   }
   const r=110+impact*133,star:number[]=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,rr=i%2?r*.84:r;star.push(360+Math.cos(a)*rr,690+Math.sin(a)*rr);}g.poly(star).stroke({color:C.red,width:8,alpha:.45*(1-sat(after/1.2))}).poly(star).stroke({color:C.gold,width:1.7,alpha:1-sat(after/1.2)});
   for(let i=0;i<24;i++){const a=i*Math.PI/12+.02*t,x=360+Math.cos(a)*(145+after*45),y=690+Math.sin(a)*(145+after*45);g.poly([x,y,x+Math.cos(a+.12)*20,y+Math.sin(a+.12)*20,x+Math.cos(a)*36,y+Math.sin(a)*36]).fill({color:i%3?C.red:C.gold,alpha:fade*.8*(1-sat(after/1.4))});}
   for(const [i,target] of s.thunder!.targets.entries()){
    const elapsed=t-target.at;if(elapsed<0)continue;const flash=1-sat(elapsed/.48);if(flash<=0)continue;
    const dx=target.x-360,dy=target.y-690,d=Math.hypot(dx,dy)||1;
    // Start outside the caster's clear space; chains flash at each hit and then disappear.
    lightning(g,360+dx/d*75,690+dy/d*75,target.x,target.y,t,i,2.4,flash*.75);
    if(i>0){const previous=s.thunder!.targets[i-1];lightning(g,previous.x,previous.y,target.x,target.y,t,i+6,1.3,flash*.38);}
    const rr=24+(1-flash)*26;g.circle(target.x,target.y,rr).stroke({color:C.red,width:3,alpha:flash}).circle(target.x,target.y,rr+5).stroke({color:C.gold,width:1.5,alpha:flash});
    for(let k=0;k<5;k++){const a=k*Math.PI*2/5+t*.2;g.poly([target.x+Math.cos(a)*rr,target.y+Math.sin(a)*rr,target.x+Math.cos(a+.1)*(rr+17),target.y+Math.sin(a+.1)*(rr+17),target.x+Math.cos(a+.2)*rr,target.y+Math.sin(a+.2)*rr]).fill({color:C.gold,alpha:flash});}
   }
   // White paper-flame impact corona leaves the player's center readable.
   for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=92+impact*40;const x=360+Math.cos(a)*rr,y=680+Math.sin(a)*rr;g.moveTo(x,y).quadraticCurveTo(x+Math.cos(a+.15)*26,y+Math.sin(a+.15)*26,x+Math.cos(a)*55,y+Math.sin(a)*55).quadraticCurveTo(x+Math.cos(a-.16)*25,y+Math.sin(a-.16)*25,x,y).fill({color:C.white,alpha:.7*(1-sat(after/.9))});}
  }
  this.cloudLayers.forEach((cloud,i)=>{curvedCloud(cloud,t,i,.45+(i%3)*.16);const side=i%2?-1:1;
   if(i<4){cloud.position.set(360+side*(205+Math.sin(t*1.2-i)*24),225+(i%2)*55+Math.floor(i/2)*80);}
   else{const side=i%2?-1:1,flow=ease((t-.8-i*.07)/.8);cloud.position.set(360+side*(150+flow*55+after*25),360+(i-4)*72+Math.sin(t*1.5-i)*14+impact*80);}
   cloud.rotation=Math.sin(t*1.7-i)*.15;cloud.alpha=sky*(i<4?.85:impact>0?.65:.5);
  });
  this.talismanLayers.forEach((paper,i)=>{const a=i*2.399+t*.6-i*.04,r=170+i%4*25+(impact?after*35:0);const x=360+Math.cos(a)*r;paper.position.set(Math.abs(x-360)<55?x+(x<360?-65:65):x,350+Math.sin(a)*130+(impact?after*45:0));paper.rotation=a+.3+Math.sin(t*2.6-i*.3)*.24;paper.alpha=sat((t-.15-i*.022)/.35);paper.scale.set(.65+i%3*.14);});
  this.cranes.forEach((crane,i)=>{const a=i*Math.PI*2/3+t*.32;crane.update(t);crane.position.set(360+Math.cos(a)*270,300+Math.sin(a)*85);crane.scale.set(.4);crane.rotation=Math.sin(a)*.24;crane.alpha=sat((t-.65)/.4);});
 }
}
export function playLv4FoxThunderSkill(){return new FoxThunderUltimate();}
