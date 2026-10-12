import {Container,Graphics} from 'pixi.js';
const PAPER=0xffeed4,LIGHT=0xfff9e4,GOLD=0xe7b769,RED=0xd93629,SHADOW=0x9b6546;
type Point={x:number;y:number};
function cubic(a:Point,b:Point,c:Point,d:Point,u:number){const v=1-u;return {x:v**3*a.x+3*v*v*u*b.x+3*v*u*u*c.x+u**3*d.x,y:v**3*a.y+3*v*v*u*b.y+3*v*u*u*c.y+u**3*d.y};}
// Independent skyward, lateral and inward destinations, rather than a ring fan.
const ROUTES=[
 [-.30,-.90,-1.14,-1.05,-.83,-.61,-.56,-.25,-.35,-1.02,-.69,-1.28],
 [.37,-.89,1.18,-.92,.93,-.38,.70,.04,.50,-.48,1.05,-.71],
 [-.52,-.72,-1.12,-.20,-.82,.30,-.48,.61,-.22,.14,-.50,-.08],
 [.56,-.55,1.02,.18,.57,.35,.19,.45,.08,-.09,.27,-.20],
 [-.65,-.28,-1.09,.56,-.74,.83,-.41,1.06,-.30,.63,-.06,.79],
 [.56,-.38,1.18,.51,.88,.73,.52,.96,.36,.49,.53,.38],
 [-.70,-.40,-1.16,.78,-.57,1.03,.08,1.32,.43,.83,.70,.94],
 [.41,-.88,.99,-1.25,.61,-1.01,.24,-.73,.65,-.55,.87,-1.08],
 [-.20,-.95,.39,-1.44,.10,-1.38,-.20,-1.33,-.26,-1.01,-.42,-1.45],
];
/** Tapered overlapping locks and strands create fur on a solid guardian face. */
export class AscendantSpirit{
 root=new Container();front=new Container();body=new Container();tails:Graphics[]=[];foregroundTails:Graphics[]=[];ribbons=new Graphics();tips:Point[]=[];light=new Graphics();shards:Graphics[]=[];
 constructor(public radius:number){
  for(let i=0;i<9;i++){const g=new Graphics(),f=new Graphics();this.root.addChild(g);this.front.addChild(f);this.tails.push(g);this.foregroundTails.push(f);}
  this.root.addChild(this.ribbons,this.body);const g=new Graphics();this.body.addChild(g);this.body.scale.set(1.48);
  g.poly([-27,-4,-45,23,-35,20,-44,44,-28,37,-30,63,-15,54,-13,84,0,105,13,84,15,54,30,63,28,37,44,44,35,20,45,23,27,-4]).fill({color:PAPER}).stroke({color:GOLD,width:1,alpha:.8});
  g.poly([3,15,25,12,35,24,21,21,28,44,16,40,15,68,0,105,8,65,0,77,-3,51]).fill({color:SHADOW,alpha:.34});
  for(const s of [-1,1]){
   g.poly([s*21,-63,s*27,-98,s*61,-144,s*59,-117,s*64,-123,s*53,-92,s*58,-98,s*39,-63]).fill({color:PAPER}).stroke({color:GOLD,width:1.1});
   g.moveTo(s*51,-122).quadraticCurveTo(s*46,-89,s*32,-76).lineTo(s*36,-97).closePath().fill({color:RED,alpha:.88});
   g.moveTo(s*54,-127).quadraticCurveTo(s*49,-101,s*40,-85).stroke({color:LIGHT,width:2});
  }
  g.moveTo(0,-84).bezierCurveTo(-19,-88,-31,-78,-37,-60).lineTo(-47,-49).lineTo(-40,-49).lineTo(-62,-38).lineTo(-43,-37).lineTo(-57,-24).lineTo(-35,-29).lineTo(-45,-13).lineTo(-28,-20).bezierCurveTo(-24,0,-12,17,0,23).bezierCurveTo(12,17,24,0,28,-20).lineTo(45,-13).lineTo(35,-29).lineTo(57,-24).lineTo(43,-37).lineTo(62,-38).lineTo(40,-49).lineTo(47,-49).lineTo(37,-60).bezierCurveTo(31,-78,19,-88,0,-84).closePath().fill({color:LIGHT}).stroke({color:GOLD,width:1.1,alpha:.85});
  g.moveTo(4,-83).quadraticCurveTo(32,-77,37,-60).lineTo(47,-49).lineTo(40,-49).lineTo(62,-38).lineTo(43,-37).lineTo(57,-24).lineTo(35,-29).lineTo(45,-13).lineTo(28,-20).quadraticCurveTo(23,5,0,23).lineTo(9,4).lineTo(16,-38).closePath().fill({color:0xc79d70,alpha:.40});
  for(const s of [-1,1])for(let k=0;k<5;k++){
   const x=s*(24+k%2*3),y=-69+k*10,tip=s*(41+k%3*7);
   g.moveTo(x,y).quadraticCurveTo(tip-s*10,y+8,tip,y+4).quadraticCurveTo(tip-s*9,y+12,x-s*5,y+13).closePath().fill({color:LIGHT,alpha:s===1?.6:.85});
  }
  for(const s of [-1,1]){
   g.moveTo(s*31,-41).quadraticCurveTo(s*23,-29,s*8,-24).quadraticCurveTo(s*24,-27,s*31,-41).fill({color:RED});
   g.moveTo(s*27,-33).lineTo(s*12,-26).stroke({color:0xffc365,width:1.8});
   g.poly([s*34,-15,s*15,-7,s*29,-8,s*25,2,s*43,-13]).fill({color:RED});
   g.moveTo(s*10,-12).quadraticCurveTo(s*9,2,s*4,11).stroke({color:GOLD,width:.8,alpha:.8});
   for(let k=0;k<7;k++){const y=-66+k*7,x=23+k%3*3;g.moveTo(s*x,y).quadraticCurveTo(s*(x+9),y+3,s*(x+18),y+1).stroke({color:k%2?GOLD:LIGHT,width:k%2?.65:1.1,alpha:.52});}
  }
  g.poly([0,-78,9,-60,0,-42,-9,-60]).fill({color:RED});g.poly([0,-69,3,-60,0,-52,-3,-60]).fill({color:LIGHT});
  g.moveTo(-5,6).quadraticCurveTo(0,4,5,6).lineTo(0,11).closePath().fill({color:RED});g.moveTo(0,11).lineTo(0,15).moveTo(-7,16).quadraticCurveTo(0,20,7,16).stroke({color:GOLD,width:.8});
  g.moveTo(-28,24).quadraticCurveTo(0,39,28,24).lineTo(25,33).quadraticCurveTo(0,46,-25,33).closePath().fill({color:RED});g.circle(0,49,8).fill({color:GOLD}).stroke({color:LIGHT,width:1});g.moveTo(0,45).lineTo(0,51).stroke({color:RED,width:1.4});
  for(let i=0;i<28;i++){const s=i%2?-1:1,k=Math.floor(i/2),x=s*(7+k%5*4),y=35+k*3.4;g.moveTo(x,y).quadraticCurveTo(x*.85+s*3,y+10,x*.56,y+20).stroke({color:i%3?LIGHT:GOLD,width:i%3?1.1:.7,alpha:.6});}
  this.body.addChild(this.light);
  for(let i=0;i<63;i++){const shard=new Graphics();shard.poly([0,-7,2,0,0,13,-2,2]).fill({color:i%4?PAPER:GOLD});this.front.addChild(shard);this.shards.push(shard);}
 }
 update(t:number){
  const r=this.radius,origin={x:0,y:-r*.71};this.body.position.set(0,origin.y);this.body.rotation=Math.sin(t*.65)*.018;this.tips=[];
  this.tails.forEach((g,i)=>{
   const route=ROUTES[i],start={x:(i%2?-1:1)*28,y:origin.y+37},p=Array.from({length:6},(_,j)=>({x:route[j*2]*r,y:route[j*2+1]*r}));
   // Preserve the tangent across the two curves: no folded corners at the bend.
   p[3]={x:p[2].x+(p[2].x-p[1].x)*.65,y:p[2].y+(p[2].y-p[1].y)*.65};
   const pts:Point[]=[],norms:Point[]=[],widths:number[]=[];const count=80;
   for(let k=0;k<=count;k++){
    const u=k/count,q=u<.5?cubic(start,p[0],p[1],p[2],u*2):cubic(p[2],p[3],p[4],p[5],(u-.5)*2),wave=Math.sin(t*1.22-u*5.6+i*.94)*r*.12*u**1.3;
    q.x+=wave*Math.cos(i*.8);q.y+=wave*Math.sin(i*.8)+Math.sin(t*.9-u*6+i)*r*.04*u;pts.push(q);
   }
   pts.forEach((q,k)=>{const a=pts[Math.max(0,k-1)],b=pts[Math.min(count,k+1)],len=Math.hypot(b.x-a.x,b.y-a.y)||1;norms.push({x:-(b.y-a.y)/len,y:(b.x-a.x)/len});const u=k/count;widths.push((8+Math.sin(Math.PI*u)**.7*r*(.090+i%3*.016))*(1-u)**.65*(1+.12*Math.sin(u*15+i)));});
   const contour=(from:number,to:number,lo=-1,hi=1)=>{const poly:number[]=[];for(let k=from;k<=to;k++){const q=pts[k],n=norms[k],w=widths[k]*(1+(hi===1?Math.sin(k*2.4+i)*.08:0));poly.push(q.x+n.x*w*hi,q.y+n.y*w*hi);}for(let k=to;k>=from;k--){const q=pts[k],n=norms[k],w=widths[k]*(1+(lo===-1?Math.sin(k*2.8+i)*.09:0));poly.push(q.x+n.x*w*lo,q.y+n.y*w*lo);}return poly;};
   g.clear();const f=this.foregroundTails[i];f.clear();const solidity=[.9,.74,.54][i%3];
   g.poly(contour(0,57)).fill({color:PAPER,alpha:solidity});g.poly(contour(57,70)).fill({color:PAPER,alpha:solidity*.73});g.poly(contour(72,80)).fill({color:PAPER,alpha:solidity*.34});
   g.poly(contour(6,64,-1,-.35)).fill({color:SHADOW,alpha:.21});if(i===6)f.poly(contour(48,72)).fill({color:PAPER,alpha:.67});
   // Tapered edge locks follow the growth direction; strands break toward the tip.
   for(let k=5;k<77;k+=4){const q=pts[k],n=norms[k],w=widths[k],next=pts[Math.min(80,k+4)],end=pts[Math.min(80,k+8)],nw=widths[Math.min(80,k+8)];for(const sign of [-1,1]){const length=6+(k*7+i*3)%11;g.moveTo(q.x+n.x*w*sign*.78,q.y+n.y*w*sign*.78).quadraticCurveTo(next.x+n.x*(w+length)*sign,next.y+n.y*(w+length)*sign,end.x+n.x*nw*sign*.9,end.y+n.y*nw*sign*.9).lineTo(next.x+n.x*w*sign*.55,next.y+n.y*w*sign*.55).closePath().fill({color:LIGHT,alpha:solidity*(1-k/105)*.9});}}
   for(let strand=0;strand<13;strand++){
    const offset=(strand/12-.5)*1.65,from=8+strand%5*4,to=Math.min(77,from+22+strand%4*7);g.moveTo(pts[from].x+norms[from].x*widths[from]*offset,pts[from].y+norms[from].y*widths[from]*offset);
    for(let k=from+1;k<=to;k++){const q=pts[k],n=norms[k],w=widths[k],v=offset+.05*Math.sin(k*.4+strand);if(k===55+strand)g.moveTo(q.x+n.x*w*v,q.y+n.y*w*v);else g.lineTo(q.x+n.x*w*v,q.y+n.y*w*v);}g.stroke({color:strand===1?RED:strand%3?LIGHT:GOLD,width:strand===1?3:.8,alpha:strand===1?.68:.52*solidity});
   }
   this.tips.push(pts[count]);
  });
  const g=this.ribbons;g.clear();for(const sign of [-1,1]){const wave=Math.sin(t*1.6+sign)*16;g.moveTo(sign*35,origin.y+43).bezierCurveTo(sign*105,origin.y+29,sign*90,origin.y+100+wave,sign*167,origin.y+76).bezierCurveTo(sign*135,origin.y+131,sign*86,origin.y+65,sign*35,origin.y+53).closePath().fill({color:RED,alpha:.8});}
  this.light.clear();const pulse=.65+.15*Math.sin(t*1.8);this.light.moveTo(-30,-64).quadraticCurveTo(-40,-35,-14,-4).stroke({color:0xffb453,width:10,alpha:.14*pulse}).moveTo(-30,-64).quadraticCurveTo(-40,-35,-14,-4).stroke({color:LIGHT,width:2,alpha:pulse});
  this.shards.forEach((shard,i)=>{const tip=this.tips[i%9],u=(t*.28+i*.137)%1;shard.position.set(tip.x+Math.sin(i*2.4+u)*u*65,tip.y-u*69);shard.rotation=t*.6+i;shard.alpha=(1-u)*.7;shard.scale.set(.35+i%4*.16);});
 }
}
