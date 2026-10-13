import {drawPaperLight} from './slash-paper-light';
import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import {slashVariation} from './slash-upgrades';
const IVORY=0xfff4dc,GOLD=0xe7ba68,RED=0xb83e32,WHITE=0xfffdf1;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
type P={x:number;y:number};
export function evolutionTiming(level:number,t:number){const duration=level===1?.30:level===2?.38:level===3?.50:1.15;return {duration,launch:level===5?.10:.05,travel:smooth((t-(level===5?.10:.05))/(level===5?.18:.16)),open:level===5?smooth((t-.23)/.25):0,finish:level===5?smooth((t-.65)/.075):0,dissolve:level===5?smooth((t-.78)/.37):smooth((t-duration+.10)/.10)};}
function curve(g:Graphics,points:P[],move=true){if(move)g.moveTo(points[0].x,points[0].y);for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];g.bezierCurveTo(b.x+(c.x-a.x)/6,b.y+(c.y-a.y)/6,c.x-(d.x-b.x)/6,c.y-(d.y-b.y)/6,c.x,c.y);}}
export function parchmentContour(g:Graphics,start:number,length:number,half:number,time:number,tear=0){
 const top:P[]=[],bottom:P[]=[];for(let i=0;i<=14;i++){const f=i/14,x=start+length*f,bend=Math.sin(f*6-time*5)*half*.09,width=half*(.65+.29*Math.sin(f*Math.PI)+.075*Math.sin(f*19+time*4));
  const notch=tear*(i%3===0?15:3);top.push({x,y:bend-width+notch});bottom.push({x,y:bend+width-notch*(i%2?.35:1)});}
 curve(g,top);const tip=top.at(-1)!,end=bottom.at(-1)!;g.bezierCurveTo(tip.x+12,tip.y+half*.25,end.x-9,end.y-half*.3,end.x,end.y);curve(g,[...bottom].reverse(),false);g.bezierCurveTo(start-12,half*.3,start+8,-half*.6,top[0].x,top[0].y).closePath();
}
function cloud(g:Graphics,x:number,y:number,r:number,sign:number,alpha:number){g.save().setTransform(1,0,0,sign,x,y);
 g.moveTo(-r*1.6,r*.2).bezierCurveTo(-r*.8,r*.3,-r*.65,-r*.9,r*.18,-r*.7).bezierCurveTo(r*.95,-r*.65,r*.95,-r*.08,r*.42,r*.04).bezierCurveTo(r*.13,r*.1,r*.14,r*.37,r*.62,r*.32).bezierCurveTo(r*1.5,r*.1,r*1.1,r*.92,r*.35,r*.83).bezierCurveTo(-r*.6,r*.96,-r*.63,r*.12,-r*1.6,r*.2).closePath().fill({color:IVORY,alpha}).stroke({color:GOLD,width:1,alpha:alpha*.7});
 g.moveTo(-r*.96,r*.19).bezierCurveTo(-r*.5,r*.03,-r*.2,-r*.65,r*.35,-r*.40).bezierCurveTo(r*.7,-r*.08,r*.03,-r*.02,r*.14,r*.32).stroke({color:GOLD,width:1.2,alpha:alpha*.8});g.restore();}
function flame(g:Graphics,x:number,y:number,r:number,sign:number,alpha:number){g.moveTo(x-r*1.6,y).bezierCurveTo(x-r*.3,y-sign*r*.2,x+r*.45,y-sign*r*.9,x+r*1.6,y-sign*r*.35).lineTo(x+r*.55,y-sign*r*.08).bezierCurveTo(x-r*.2,y+sign*r*.35,x-r*.7,y+sign*r*.2,x-r*1.6,y).closePath().fill({color:RED,alpha});}
/** New Lv1–3 / Lv5 renderer. Lv4 stays in the existing renderer. All geometry is time-derived. */
export class SlashEvolution {
 root=new Container();outer=new Graphics();clouds=new Graphics();trail=new Graphics();flames=new Graphics();body=new Graphics();landscape=new Graphics();mask=new Graphics();backEdge=new Graphics();frontEdge=new Graphics();core=new Graphics();papers=new Graphics();impact=new Graphics();dissolve=new Graphics();
 private cached='';
 constructor(){this.root.label='SlashEvolution';const names=['SlashOuter','CloudRibbon','SlashTrail','PaperFlame','ScrollBody','ScrollLandscape','ScrollMask','ScrollBackEdge','ScrollFrontEdge','SlashCore','TalismanPieces','ImpactBurst','DissolvePieces'];const layers=[this.outer,this.clouds,this.trail,this.flames,this.body,this.landscape,this.mask,this.backEdge,this.frontEdge,this.core,this.papers,this.impact,this.dissolve];layers.forEach((g,i)=>g.label=names[i]);this.landscape.mask=this.mask;this.root.addChild(...layers);}
 update(s:Skill){
  const lv=s.slash!.level,t=s.age,q=evolutionTiming(lv,t),fade=1-q.dissolve;
  for(const g of [this.outer,this.clouds,this.trail,this.flames,this.body,this.mask,this.backEdge,this.frontEdge,this.core,this.papers,this.impact,this.dissolve])g.clear();
  this.landscape.visible=false;this.root.alpha=1;
  const dx=s.direction.x,dy=s.direction.y,edge=Math.min(Math.abs(dx)>.001?(dx>0?698-s.x:s.x-22)/Math.abs(dx):Infinity,Math.abs(dy)>.001?(dy>0?1180-s.y:s.y-175)/Math.abs(dy):Infinity);
  const reach=s.slash?.path?s.range:Math.max(120,Math.min(s.range,edge-12,lv===5?620:lv===3?560:480));
  const head=18+reach*q.travel,tail=Math.max(14,head-(lv===1?reach*.68:lv===2?reach*.8:reach*.9));
  if(t<q.launch){const a=clamp(t/q.launch);this.core.moveTo(12,0).quadraticCurveTo(25,-5,40*a,0).stroke({color:GOLD,width:2,alpha:Math.sin(a*Math.PI)});if(lv===5){this.flames.moveTo(-17,-14).lineTo(11,-18).lineTo(-3,13).lineTo(17,9).stroke({color:RED,width:2,alpha:1-a*.5});this.core.moveTo(-24,12).bezierCurveTo(-5,23,18,-13,36,0).stroke({color:GOLD,width:2,alpha:.8});}}
  if(lv===2&&t>=q.launch){drawPaperLight(s,{outer:this.outer,core:this.core,trail:this.trail,flames:this.flames,papers:this.papers,sparks:this.dissolve},reach,head,fade);this.hits(s,fade);return;}
  const waveFade=lv===5?clamp((.43-t)/.13):fade;
  if(t>=q.launch&&waveFade>0){const width=lv===1?10:lv===2?17:lv===3?36:48;
   const top:P[]=[],bottom:P[]=[];for(let i=0;i<=10;i++){const f=i/10,x=tail+(head-tail)*f,w=width*Math.sin(Math.PI*f)**.65*(.85+.15*Math.sin(f*15-t*16));top.push({x,y:-w});bottom.push({x,y:w*.65});}
   curve(this.outer,top);curve(this.outer,[...bottom].reverse(),false);this.outer.closePath().fill({color:GOLD,alpha:waveFade});
   this.core.moveTo(tail,0).bezierCurveTo(tail+(head-tail)*.35,-2,head-20,1,head,0).stroke({color:WHITE,width:lv===1?3:lv===2?4:6,alpha:waveFade});
   if(lv>=2){this.trail.moveTo(tail,4).bezierCurveTo(tail+(head-tail)*.25,16,head-40,-10,head-10,0).stroke({color:GOLD,width:1.7,alpha:waveFade*.75});for(let i=0;i<(lv===2?2:4);i++){const f=.2+i*.16,sign=i%2?-1:1;flame(this.flames,tail+(head-tail)*f,sign*(lv===2?10:27),lv===2?9:17,sign,waveFade*.7);}}
   if(lv>=3){const growth=smooth((t-q.launch-.025)/.065);for(let i=0;i<(lv===5?5:4);i++){const f=.2+i*.16,sign=i%2?-1:1,r=(lv===5?36:27)*( .8+slashVariation(s.id,i)*.35)*growth;cloud(this.clouds,tail+(head-tail)*f,sign*(16+r*.5),r,sign,waveFade*.88);}}
  }
  if(lv>=2&&t>=q.launch){for(let i=0;i<(lv===2?3:5);i++){const r=slashVariation(s.id,i+20),born=q.launch+i*.013,age=t-born;if(age<0)continue;const f=clamp(age/(lv===5?.55:.26)),x=22+reach*(.1+r*.25)+reach*.65*f,y=(i%2?-1:1)*(12+(25+r*30)*f),a=(r-.5)*.9+age*(r-.5)*5;this.paper(this.papers,x,y,a,lv===2?.75:.80,fade*clamp(1-f*.6));}}
  if(lv===5&&q.open>0)this.scroll(s,reach,q.open,q.finish,q.dissolve);
  this.hits(s,fade);
  if(lv===1&&t>.21){for(let i=0;i<3;i++){const f=slashVariation(s.id,i),x=tail+(head-tail)*f;this.dissolve.moveTo(x,(f-.5)*8).lineTo(x+10,(f-.5)*12).stroke({color:GOLD,width:1,alpha:fade});}}
 }
 private paper(g:Graphics,x:number,y:number,a:number,scale:number,alpha:number){g.save().setTransform(Math.cos(a)*scale,Math.sin(a)*scale,-Math.sin(a)*scale,Math.cos(a)*scale,x,y);g.moveTo(-6,-15).lineTo(7,-14).lineTo(5,14).lineTo(-5,16).closePath().fill({color:IVORY,alpha}).stroke({color:GOLD,width:.8,alpha});g.moveTo(-3,-8).lineTo(3,-8).lineTo(-2,2).lineTo(3,2).moveTo(0,-11).lineTo(0,10).stroke({color:RED,width:1.5,alpha});g.restore();}
 private scroll(s:Skill,reach:number,open:number,finish:number,tear:number){
  const t=s.age,start=48,dx=s.direction.x,dy=s.direction.y,boundX=Math.abs(dx)>.001?((dx>0?698-s.x:s.x-22)-138*Math.abs(dy))/Math.abs(dx)-start:Infinity,boundY=Math.abs(dy)>.001?((dy>0?1180-s.y:s.y-175)-138*Math.abs(dx))/Math.abs(dy)-start:Infinity,full=Math.max(80,Math.min(reach*.84,boundX,boundY)),length=Math.max(5,full*open*(1-tear*.28)),half=(70+Math.sin(open*Math.PI)*15+open*60)*(1-tear*.28),alpha=1-tear;
  parchmentContour(this.body,start,length,half,t,tear);this.body.fill({color:IVORY,alpha});parchmentContour(this.mask,start,length,half,t,tear);this.mask.fill(WHITE);
  const angle=Math.atan2(s.direction.y,s.direction.x),w=Math.abs(full*s.direction.x)+Math.abs(260*s.direction.y),h=Math.abs(full*s.direction.y)+Math.abs(260*s.direction.x);
  const cache=`${s.id}:${full.toFixed(2)}:${angle}`;if(this.cached!==cache){this.cached=cache;this.paintLandscape(w,h,s.id);}
  this.landscape.visible=true;this.landscape.position.set(start+full/2,Math.sin(t*7)*3);this.landscape.rotation=-angle;this.landscape.alpha=alpha*.88;
  // Both curled rims are curved bands, not scaled images or rectangular frames.
  for(const [g,x,sign] of [[this.backEdge,start,-1],[this.frontEdge,start+length,1]] as const){g.moveTo(x,-half).bezierCurveTo(x+sign*19,-half*.6,x-sign*13,half*.45,x,half).bezierCurveTo(x-sign*12,half*.36,x+sign*8,-half*.6,x,-half).closePath().fill({color:0xd9c39b,alpha}).stroke({color:GOLD,width:1,alpha});g.moveTo(x+sign*4,-half*.86).bezierCurveTo(x+sign*11,-half*.35,x-sign*5,half*.4,x+sign*3,half*.84).stroke({color:IVORY,width:3,alpha});}
  for(let i=0;i<5;i++){const f=.13+i*.18,x=start+length*f,sign=i%2?-1:1,y=sign*half*.95;flame(this.flames,x,y,16,sign,alpha*.75);cloud(this.clouds,x,y+sign*6,18+(i%2)*5,sign,alpha*.55);}
  if(finish>0&&t<.90){const f=clamp((t-.65)/.13),a=clamp((.90-t)/.12),tip=start+length*f;this.core.moveTo(start,0).bezierCurveTo(start+length*.4,-9,tip-16,-7,tip,0).bezierCurveTo(tip-16,6,start+length*.4,7,start,0).fill({color:WHITE,alpha:a});this.core.moveTo(start,0).lineTo(tip,0).stroke({color:GOLD,width:1.5,alpha:a});}
  if(tear>0){for(let i=0;i<22;i++){const r=slashVariation(s.id,i+80),f=slashVariation(s.id,i+110),x=start+full*r+tear*(20+f*55),y=(f-.5)*half*2+Math.sin(i*2.8)*tear*75,a=tear*(r-.5)*5;if(i%3===0)this.paper(this.dissolve,x,y,a,.48,alpha);else{this.dissolve.save().setTransform(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),x,y);this.dissolve.moveTo(-5,-3).lineTo(7,-5).lineTo(3,5).lineTo(-4,3).closePath().fill({color:i%4?IVORY:GOLD,alpha});this.dissolve.restore();}}}
 }
 private paintLandscape(w:number,h:number,seed:number){
  const g=this.landscape;g.clear();
  const sunX=w*.13,sunY=-h*.28,sunR=Math.max(14,Math.min(31,w*.16));g.circle(sunX,sunY,sunR).fill({color:0xbc4534,alpha:.85});
  for(let layer=0;layer<3;layer++){
   const points:P[]=[];for(let i=0;i<=16;i++){const f=i/16,x=-w/2+w*f,peak=(i%3===1?.8:.20)+slashVariation(seed,i+layer*30)*.3,y=h*(.02+layer*.13)-peak*h*(layer===2?.20:.25);points.push({x,y});}
   curve(g,points);g.lineTo(w/2,h/2).lineTo(-w/2,h/2).closePath().fill({color:[0xc6c3a6,0x8b9e89,0x426b63][layer],alpha:[.42,.48,.64][layer]});
   for(let i=2;i<15;i+=4){const p=points[i];g.moveTo(p.x,p.y).lineTo(p.x+6,p.y+17).lineTo(p.x-2,p.y+35).stroke({color:IVORY,width:1.3,alpha:.65});}
  }
  const x=-w*.17,y=h*.23,size=Math.min(13,w*.07);for(let i=0;i<3;i++){const z=y-i*size*.7,k=size*(1-i*.14);g.moveTo(x-k,z).lineTo(x-k*.45,z-k*.25).lineTo(x,z-k*.65).lineTo(x+k*.45,z-k*.25).lineTo(x+k,z).lineTo(x-k,z).fill({color:0x283e37,alpha:.9});g.rect(x-k*.38,z,k*.76,size*.52).fill({color:0x435548,alpha:.8});g.moveTo(x-k,z).lineTo(x+k,z).stroke({color:GOLD,width:.9,alpha:.8});}
  for(let i=0;i<4;i++){const y=h*(.27+i*.055);g.moveTo(-w*.4,y).bezierCurveTo(-w*.2,y-7,w*.12,y+9,w*.4,y-4).stroke({color:i%2?GOLD:IVORY,width:i%2?1:2,alpha:.65});}
  g.moveTo(-w*.43,-h*.19).bezierCurveTo(-w*.15,-h*.22,w*.02,-h*.16,w*.34,-h*.19).stroke({color:IVORY,width:4,alpha:.65});
 }
 private hits(s:Skill,fade:number){for(const hit of s.slash!.contacts){const age=s.age-hit.at;if(age<0||age>.18)continue;const dx=hit.x-s.x,dy=hit.y-s.y,x=dx*s.direction.x+dy*s.direction.y,y=-dx*s.direction.y+dy*s.direction.x,a=(1-age/.18)*fade,lv=s.slash!.level;
  if(lv>=3){for(let i=0;i<3;i++){const side=i%2?-1:1,r=(hit.secondary?23:14)*(1+age*2);cloud(this.impact,x+age*90+(i-1)*12,y+side*(i+1)*7,r,side,a*.7);}}
  for(let i=0;i<(lv===1?3:lv===2?4:7);i++){const r=slashVariation(s.id+hit.id,i),angle=(r-.5)*1.6,len=(lv===5?48:lv===3?30:14)*(1+age*2),px=x+Math.cos(angle)*len,py=y+Math.sin(angle)*len;this.impact.moveTo(x,y).lineTo(px,py-2).lineTo(px-7,py+3).closePath().fill({color:i%2?WHITE:GOLD,alpha:a});}
 }}
 destroy(){this.root.destroy({children:true});}
}
