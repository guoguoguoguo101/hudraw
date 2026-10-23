import {Container,Graphics} from 'pixi.js';
import {TALISMAN_BARRAGE as C,type TalismanBarrage} from '../gameplay/talisman-barrage';
import type {Arena} from '../input/line-interaction-geometry';
import type {Point} from '../input/recognizer';

const GOLD=0xeabc68,IVORY=0xffedb3,RED=0xce392b,INK=0x251d25;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const hash=(n:number)=>{const x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x);};
type Frame={b:TalismanBarrage;at:(x:number,y:number)=>Point;t:number;strength:number;reach:number;angle:number;low:boolean};
type Swarm={g:Graphics;seed:number;speed:number;delay:number;lane:number;scale:number;depth:number;variant:number};

/** Irregular paper swarms with short, sparse accents that leave each paper readable.
 * Only the seven real projectile lanes deal damage; ornamental paper never creates combat events.
 * Geometry is shared and the entire cast is sampled from its own pausable clock. */
export class TalismanBarrageRenderer{
 back=new Container();root=new Container();
 private field=new Graphics();private wind=new Graphics();private ornaments=new Graphics();private seal=new Graphics();private hits=new Graphics();
 private backClip=new Graphics();private frontClip=new Graphics();private boundsKey='';
 private papers:Graphics[]=[];private swarm:Swarm[]=[];
 private templates=Array.from({length:6},(_,i)=>this.paper(i));
 constructor(){
  this.back.addChild(this.field,this.backClip);this.back.mask=this.backClip;
  this.root.addChild(this.wind);
  for(let i=0;i<210;i++){
   const seed=i+71,depth=hash(seed+3),variant=Math.floor(hash(seed+5)*6);
   const g=new Graphics({context:this.templates[variant].context});g.visible=false;
   this.swarm.push({g,seed,speed:650+hash(seed+7)*850,delay:hash(seed+11)*.65,
    lane:(hash(seed+13)*2-1),scale:.28+Math.pow(hash(seed+17),2)*1.5,depth,variant});
   if(depth<.65)this.root.addChild(g);
  }
  for(let i=0;i<C.maxProjectiles;i++){
   const p=new Graphics({context:this.templates[i%6].context});p.visible=false;this.papers.push(p);this.root.addChild(p);
  }
  for(const p of this.swarm)if(p.depth>=.65)this.root.addChild(p.g);
  this.root.addChild(this.ornaments,this.seal,this.hits,this.frontClip);this.root.mask=this.frontClip;
 }
 clear(){
  this.field.clear();this.wind.clear();this.ornaments.clear();this.seal.clear();this.hits.clear();this.back.visible=this.root.visible=false;
  for(const p of this.papers)p.visible=false;for(const p of this.swarm)p.g.visible=false;
 }
 update(b:TalismanBarrage,visible:boolean,bounds:Arena,low=false){
  this.back.visible=this.root.visible=visible&&b.busy;if(!this.root.visible)return;
  const key=JSON.stringify(bounds);if(key!==this.boundsKey){this.boundsKey=key;for(const mask of [this.backClip,this.frontClip])mask.clear().rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top).fill(0xffffff);}
  this.field.clear();this.wind.clear();this.ornaments.clear();this.seal.clear();this.hits.clear();
  const o=b.origin,at=(x:number,y:number)=>({x:o.x+b.direction.x*x-b.direction.y*y,y:o.y+b.direction.y*x+b.direction.x*y});
  const t=Math.max(0,b.age-C.charge),tail=clamp((C.charge+C.duration+.78-b.age)/.78);
  const strength=b.phase==='aiming'?.25:Math.min(clamp(b.age/C.charge),tail);
  const f:Frame={b,at,t,strength,reach:b.phase==='charging'?0:Math.min(C.range,t*1300),angle:Math.atan2(b.direction.y,b.direction.x),low};
  if(b.phase==='aiming'){
   const a=at(650,650*Math.tan(C.spread/2)),z=at(650,-650*Math.tan(C.spread/2)),tip=at(210,0);
   this.field.poly([o.x,o.y,a.x,a.y,z.x,z.y]).fill({color:GOLD,alpha:.12}).stroke({color:GOLD,width:1.2,alpha:.55});
   this.field.moveTo(o.x,o.y).lineTo(tip.x,tip.y).stroke({color:IVORY,width:2,alpha:.8});
   const left=at(190,12),right=at(190,-12);this.field.moveTo(left.x,left.y).lineTo(tip.x,tip.y).lineTo(right.x,right.y).stroke({color:IVORY,width:3});
  }else{
   this.field.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top).fill({color:INK,alpha:.19*strength});
   this.currents(f);this.source(f);this.impact(f);
  }
  this.flyingPapers(f);
 }
 private currents(f:Frame){
  const {b,at,t,strength,reach,low}=f;if(reach<20)return;
  const g=this.wind,front=this.ornaments,fade=clamp(t/.12)*strength,final=clamp((t-3.5)/.5);
  // Short, separated wisps replace the continuous ribbons spanning the whole attack.
  for(let i=0;i<(low?2:4);i++){
   const seed=251+i,speed=720+hash(seed)*250,life=820/speed,delay=hash(seed+1)*.5;
   const cycle=Math.floor((t-delay)/life),birth=delay+cycle*life,head=(t-birth)*speed+28;
   if(cycle<0||birth>C.duration||head>reach||head>C.range)continue;
   const length=65+hash(seed+2)*55,start=Math.max(26,head-length),edge:number[]=[],other:number[]=[];
   for(let j=0;j<=12;j++){
    const u=j/12,x=start+(head-start)*u,y=(i%2?1:-1)*x*.1+Math.sin(x*.02-t*7+i)*9;
    const w=Math.sin(u*Math.PI)*3.5,a=at(x,y-w),z=at(x,y+w);edge.push(a.x,a.y);other.unshift(z.x,z.y);
   }
   g.poly([...edge,...other]).fill({color:i%2?RED:GOLD,alpha:.22*fade});
  }
  // Asymmetric, broken cloud curls race around the stream rather than forming equal wave rings.
  for(let i=0;i<(low?1:3);i++){
   const seed=i+321,speed=510+hash(seed)*480,life=810/speed,delay=hash(seed+3)*.55;
   const cycle=Math.floor((t-delay)/life),birth=delay+cycle*life,x=(t-birth)*speed+28;
   if(cycle<0||birth>C.duration||x>reach||x>C.range)continue;
   const side=i%2?1:-1,y=side*(10+x*(.11+hash(seed+4)*.04));
   const p=at(x,y),scale=.6+hash(seed+6)*1.0,angle=f.angle+(side<0?Math.PI:0);
   this.curl(front,p.x,p.y,angle,scale*.6,fade*.45,seed);
  }
  // Decree seals drift through the paper storm at different speeds and scales.
  for(let i=0;i<1;i++){
   const speed=470+i*81,delay=i*.29,life=820/speed,cycle=Math.floor((t-delay)/life),birth=delay+cycle*life;
   if(cycle<0||birth>C.duration-.1)continue;
   const x=(t-birth)*speed+35;if(x>reach||x>800)continue;
   const side=i%2?1:-1,p=at(x,side*(8+x*.12)),size=12+i*4,alpha=fade*clamp((820-x)/120);
   front.poly([p.x,p.y-size,p.x+size,p.y,p.x,p.y+size,p.x-size,p.y]).fill({color:RED,alpha:alpha*.8}).stroke({color:GOLD,width:1.5,alpha});
   front.moveTo(p.x-4,p.y-5).lineTo(p.x+4,p.y-5).moveTo(p.x,p.y-8).lineTo(p.x,p.y+7).moveTo(p.x-5,p.y).lineTo(p.x+5,p.y).moveTo(p.x-4,p.y+5).lineTo(p.x+4,p.y+3).stroke({color:IVORY,width:1.4,alpha});
  }
  // Fine ink ribbons and sparking embers carry the small-scale motion.
  for(let i=0;i<(low?10:24);i++){
   const seed=i+541,speed=850+hash(seed)*760,life=800/speed,delay=hash(seed+2)*.6;
   const cycle=Math.floor((t-delay)/life),birth=delay+cycle*life,x=(t-birth)*speed+30;
   if(cycle<0||birth>C.duration||x>reach||x>800)continue;
   const y=(hash(seed+8)*2-1)*(12+x*.19),p=at(x,y),q=at(x-6-hash(seed+9)*20,y-2);
   g.moveTo(q.x,q.y).lineTo(p.x,p.y).stroke({color:i%3?GOLD:RED,width:.7+hash(seed+10),alpha:(.25+hash(seed+4)*.3)*fade});
   if(i%4===0)g.poly([p.x-2,p.y,p.x,p.y-4,p.x+2,p.y,p.x,p.y+4]).fill({color:IVORY,alpha:fade*.8});
  }
  // Opening shock and final pressure wave; purely ornamental, no extra damage pulse.
  for(const start of [0,3.62]){
   const u=(t-start)/.52;if(u<0||u>1)continue;
   const x=34+u*780;if(x>reach+40)continue;
   const points:number[]=[];for(let j=-12;j<=12;j++){const v=j/12,p=at(x-45*(1-v*v),v*(24+x*.19));points.push(p.x,p.y);}
   g.poly(points,false).stroke({color:RED,width:9*(1-u)+2,alpha:(1-u)*.7});
   g.poly(points,false).stroke({color:IVORY,width:2.4,alpha:(1-u)*.85});
  }
  if(final>0&&b.phase==='firing'){
   const p=at(45,0);g.circle(p.x,p.y,17+final*17).stroke({color:IVORY,width:1.7,alpha:final*.6});
  }
 }
 private flyingPapers(f:Frame){
  const {b,at,t,strength,low}=f,aim=b.phase==='aiming',charging=b.phase==='charging';
  for(let i=0;i<this.papers.length;i++){
   const p=b.papers[i],g=this.papers[i];g.visible=!!p;if(!p)continue;
   const seed=p.id+15,h=hash(seed),flutter=Math.sin(b.age*(13+hash(seed+1)*20)+seed);
   const variant=Math.floor(hash(seed+3)*6);if(g.context!==this.templates[variant].context)g.context=this.templates[variant].context;
   const size=.45+Math.pow(h,.7)*(variant===2||variant===5?1.05:1.6),fold=.22+Math.abs(Math.sin(b.age*(7+hash(seed+6)*8)+seed))*.95;
   g.position.set(p.x-Math.sin(p.angle)*flutter*4,p.y+Math.cos(p.angle)*flutter*4);
   g.rotation=p.angle+flutter*(.1+hash(seed+5)*.28);g.scale.set(size,fold*size*.85);
   g.alpha=clamp((C.range-p.distance)/95)*(.77+hash(seed+7)*.23);
  }
  for(let i=0;i<this.swarm.length;i++){
   const p=this.swarm[i],g=p.g;g.visible=false;
   if(aim||i>=(low?64:170))continue;
   if(charging){
    if(i>=18)continue;
    const u=clamp(b.age/C.charge),a=i*2.399+b.age*(4+hash(p.seed)*4),r=87*(1-u)+22;
    const pos=at(-18+Math.cos(a)*r,Math.sin(a)*r*.64);
    g.visible=true;g.position.set(pos.x,pos.y);g.rotation=f.angle+a+.5;g.scale.set(.4+u*.35,.5);g.alpha=u*.85;continue;
   }
   const life=820/p.speed+.04+hash(p.seed+23)*.13;
   const cycle=Math.floor((t-p.delay)/life),birth=p.delay+cycle*life;
   if(cycle<0||birth>C.duration-.03)continue;
   const x=(t-birth)*p.speed+26;if(x>820)continue;
   const u=x/820,phase=t*(4+hash(p.seed+19)*3)+p.seed*.6;
   // Uneven clumps alternate between three moving filaments; gaps remain readable.
   const braid=Math.sin(x*.012-t*5+p.depth*4),lane=p.lane*.72+braid*.24;
   const width=8+x*Math.tan(C.spread/2),y=Math.max(-width,Math.min(width,lane*width+Math.sin(phase)*9));
   const pos=at(x,y),flutter=Math.sin(phase*2.3),fold=.14+Math.abs(Math.cos(phase))*.92;
   const size=p.scale*(p.depth<.65?.65:.95)*(1+u*.12),finisher=birth>3.5?1.12:1;
   g.visible=true;g.position.set(pos.x,pos.y);g.rotation=f.angle+p.lane*.13+flutter*(.13+p.depth*.38);
   g.scale.set(size*finisher,fold*size);g.alpha=clamp((820-x)/95)*clamp((x-26)/22)*(p.depth<.65?.36:.82)*strength;
  }
 }
 private source(f:Frame){
  const {b,at,t,strength}=f,u=clamp(b.age/C.charge),g=this.field,s=this.seal,o=b.origin;
  // A low, rotating paper seal supports the fox silhouette, without a giant gate.
  for(let k=0;k<3;k++){
   const rad=39+k*16+Math.sin(b.age*11+k)*3;
   g.ellipse(o.x,o.y+10,rad,rad*.48).stroke({color:k===1?RED:GOLD,width:k===1?3:1,alpha:strength*(k===1?.6:.5)});
  }
  for(let i=0;i<10;i++){
   const a=i*Math.PI/5-b.age*1.7,r=63,p={x:o.x+Math.cos(a)*r,y:o.y+10+Math.sin(a)*r*.48};
   g.poly([p.x-4,p.y-6,p.x+4,p.y-6,p.x+4,p.y+6,p.x-4,p.y+6]).fill({color:i%3?RED:GOLD,alpha:strength*.65});
   g.moveTo(p.x-2,p.y-3).lineTo(p.x+2,p.y+3).moveTo(p.x,p.y-4).lineTo(p.x,p.y+4).stroke({color:IVORY,width:.8,alpha:strength*.7});
  }
  // Ink-brush pennants on either side, with tapered cream/gold cores.
  for(const side of [-1,1]){
   const a=at(-34,side*26),z=at(-68,side*(45+Math.sin(b.age*16)*7)),tip=at(-18,side*15);
   g.moveTo(a.x,a.y).quadraticCurveTo(z.x,z.y,tip.x,tip.y).stroke({color:RED,width:9*u,alpha:strength*.6});
   g.moveTo(a.x,a.y).quadraticCurveTo(z.x,z.y,tip.x,tip.y).stroke({color:GOLD,width:1.5,alpha:strength*.7});
  }
  const flare=clamp(t/.07)*clamp((C.duration+.12-t)/.25)*strength;
  const nose=at(24,0),power=1+Math.sin(b.age*43)*.18;
  s.ellipse(nose.x,nose.y,19*power,12*power).fill({color:RED,alpha:.55*flare});
  s.circle(nose.x,nose.y,6*power).fill({color:IVORY,alpha:.9*flare});
  for(let i=0;i<6;i++){
   const side=i%2?1:-1,p=at(28+(i%3)*9,side*(6+i*3)),z=at(64+i*5,side*(9+i*5));
   s.moveTo(p.x,p.y).lineTo(z.x,z.y).stroke({color:i%3?GOLD:IVORY,width:1.1,alpha:.5*flare});
  }
  const opening=(t/.33);if(opening>0&&opening<1){
   g.ellipse(o.x,o.y+10,42+opening*87,21+opening*43).stroke({color:RED,width:5*(1-opening)+1,alpha:(1-opening)*.8});
   g.ellipse(o.x,o.y+10,31+opening*83,15+opening*41).stroke({color:IVORY,width:1.5,alpha:(1-opening)*.65});
  }
 }
 private impact(f:Frame){
  const grouped=new Map<string,typeof f.b.impacts[number]>();
  for(const hit of f.b.impacts){const key=Math.round(hit.x/45)+':'+Math.round(hit.y/45);const old=grouped.get(key);if(!old||old.age>hit.age)grouped.set(key,hit);}
  const g=this.hits;
  for(const hit of grouped.values()){
   const u=clamp(hit.age/C.impactDuration),fade=1-u,r=22+u*42,phase=hit.seed*.3;
   // Cinnabar ink tear + sharp paper flashes; no identical circular target stamps.
   for(let i=0;i<7;i++){
    const a=phase+i*2.399,rad=r*(.55+hash(hit.seed+i)*.7),x=hit.x+Math.cos(a)*rad,y=hit.y+Math.sin(a)*rad;
    const px=hit.x+Math.cos(a+.7)*8,py=hit.y+Math.sin(a+.7)*8;
    g.poly([px,py,x,y,hit.x+Math.cos(a-.25)*rad*.7,hit.y+Math.sin(a-.25)*rad*.7]).fill({color:i%3?RED:GOLD,alpha:fade*.7});
   }
   const inner=9+Math.sin(u*Math.PI)*12;
   g.poly([hit.x-inner,hit.y,hit.x-3,hit.y-3,hit.x,hit.y-inner*1.6,hit.x+3,hit.y-3,hit.x+inner,hit.y,hit.x+3,hit.y+3,hit.x,hit.y+inner,hit.x-3,hit.y+3]).fill({color:IVORY,alpha:fade*.9});
   for(let j=0;j<(f.low?3:7);j++){
    const a=phase+j*2.4,x=hit.x+Math.cos(a)*(13+u*73),y=hit.y+Math.sin(a)*(13+u*73),s=(2+hash(j+hit.seed)*4)*fade;
    g.poly([x-s,y-s*2,x+s,y-s,x+s*.7,y+s*2,x-s*.8,y+s]).fill({color:j%2?GOLD:IVORY,alpha:fade});
   }
   if(hit.seed%3===0)this.curl(g,hit.x,hit.y,phase,.7,fade*.75,hit.seed);
  }
 }
 private curl(g:Graphics,x:number,y:number,angle:number,scale:number,alpha:number,seed:number){
  const ca=Math.cos(angle),sa=Math.sin(angle),at=(a:number,b:number)=>({x:x+(ca*a-sa*b)*scale,y:y+(sa*a+ca*b)*scale});
  const points:number[]=[];
  for(let i=0;i<=22;i++){const u=i/22,a=u*Math.PI*2.1,r=26*(1-u)+3,p=at(Math.cos(a)*r-15*u,Math.sin(a)*r*.65);points.push(p.x,p.y);}
  g.poly(points,false).stroke({color:seed%2?RED:GOLD,width:scale*4,alpha:alpha*.6});
  g.poly(points,false).stroke({color:IVORY,width:scale*1.2,alpha});
  const p=at(15,0),q=at(32+hash(seed)*12,-6);g.moveTo(p.x,p.y).quadraticCurveTo(x+ca*24,y+sa*24,q.x,q.y).stroke({color:GOLD,width:1,alpha:alpha*.45});
 }
 private paper(variant:number){
  const g=new Graphics(),long=variant===2||variant===5,L=long?35:variant===3?14:23,W=variant===4?12:long?8:9;
  const red=variant===1||variant===5,body=red?0xa92f28:variant===4?0xeac477:0xffe6b0,script=red?GOLD:RED;
  g.poly([-L-2,-W+2,-L+3,-W-2,L-3,-W,L+2,-W+5,L-1,W-1,-L+2,W]).fill({color:0x69292a,alpha:.85});
  g.poly([-L,-W,L-3,-W+1,L+1,-W+5,L-1,W,-L+2,W-1,-L+5,W-5]).fill({color:body}).stroke({color:IVORY,width:.65,alpha:.8});
  g.rect(-L+5,-W+3,L*2-10,W*2-6).stroke({color:script,width:.75});
  // Six different paper cuts and hand-drawn cinnabar scripts, not a repeated sprite row.
  for(let i=0;i<(long?5:3);i++){
   const x=L-9-i*(long?10:9),flip=(i+variant)%2?1:-1;
   g.moveTo(x,-4).lineTo(x,4).moveTo(x-3,-3).lineTo(x+3,-1).lineTo(x-2,2).lineTo(x+2,4)
    .moveTo(x-3,flip*3).lineTo(x+3,-flip*3).stroke({color:script,width:1.15,cap:'round',join:'round'});
  }
  if(variant===4)g.poly([L-6,-4,L-2,0,L-6,4,L-10,0]).stroke({color:script,width:1.2});
  if(long){
   g.moveTo(-L,3).quadraticCurveTo(-L-6,8,-L-12,3).stroke({color:script,width:1.4,alpha:.6});
  }else if(variant===0||variant===3){
   for(let i=0;i<3;i++)g.moveTo(-L+3+i*3,W-3).lineTo(-L-2+i*2,W+4+i).stroke({color:body,width:1.2});
  }
  return g;
 }
}
