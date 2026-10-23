import {Container,Graphics} from 'pixi.js';
import {BURNING_SEA as C,type BurningSea,type FireTrace} from '../gameplay/burning-sea';
import {BURNING_SEA_STYLES} from '../gameplay/burning-sea-styles';
import type {BrushId} from '../input/brush-settings';
import type {Point} from '../input/recognizer';

// Art direction: assets/vfx/burning_sea/references, cinnabar + ink/gold.
// Connect each actual stroke, then place ornaments by distance rather than input frequency.
type Knot=Point&{distance:number;nx:number;ny:number;fade:number};
type Stroke={points:Knot[];length:number;seed:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const noise=(seed:number)=>{const n=Math.sin(seed*127.1)*43758.5453;return n-Math.floor(n);};

function strokes(traces:FireTrace[],now:number):Stroke[]{
 const groups:FireTrace[][]=[];
 for(const trace of traces){
  const last=groups.at(-1),previous=last?.at(-1);
  if(!previous||previous.stroke!==trace.stroke||Math.hypot(previous.b.x-trace.a.x,previous.b.y-trace.a.y)>.5)groups.push([trace]);else last!.push(trace);
 }
 return groups.map(group=>{
  const raw=[{...group[0].a,trace:group[0]}];
  for(const trace of group)if(Math.hypot(raw.at(-1)!.x-trace.b.x,raw.at(-1)!.y-trace.b.y)>1)raw.push({...trace.b,trace});
  let distance=0;
  const points=raw.map((p,i)=>{
   if(i)distance+=Math.hypot(p.x-raw[i-1].x,p.y-raw[i-1].y);
   const before=raw[Math.max(0,i-1)],after=raw[Math.min(raw.length-1,i+1)],dx=after.x-before.x,dy=after.y-before.y,n=Math.hypot(dx,dy)||1;
   return {x:p.x,y:p.y,distance,nx:raw.length===1?0:-dy/n,ny:raw.length===1?1:dx/n,fade:clamp((p.trace.expires-now)/.65)*clamp(.35+(now-p.trace.born)*8)};
  });
  return {points,length:distance,seed:group[0].stroke};
 });
}
function sampler(stroke:Stroke){
 const points=stroke.points;let index=1;
 // Each visual pass walks forward once, including long scribbles on mobile.
 return (distance:number):Knot=>{
  if(points.length===1)return points[0];
  while(index<points.length-1&&points[index].distance<distance)index++;
  const a=points[index-1],b=points[index],t=clamp((distance-a.distance)/(b.distance-a.distance||1)),nx=a.nx+(b.nx-a.nx)*t,ny=a.ny+(b.ny-a.ny)*t,n=Math.hypot(nx,ny)||1;
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,distance,nx:nx/n,ny:ny/n,fade:a.fade+(b.fade-a.fade)*t};
 };
}
export class BurningSeaRenderer{
 styleId:BrushId='cinnabar';private style=BURNING_SEA_STYLES.cinnabar;
 root=new Container();private ground=new Graphics();private flame=new Graphics();
 private sampleStep=7;
 constructor(){this.root.addChild(this.ground,this.flame);}
 update(fire:BurningSea,visible:boolean,low=false,brush:BrushId='cinnabar'){
  this.styleId=brush;this.style=BURNING_SEA_STYLES[brush];
  this.root.visible=visible;this.ground.clear();this.flame.clear();if(!visible||!fire.traces.length)return;
  const paths=strokes(fire.traces,fire.now),total=paths.reduce((n,s)=>n+s.length,0),charge=fire.phase==='charging'?1-fire.chargeRemaining/C.chargeDuration:0;
  this.sampleStep=Math.max(7,total/(low?500:1200));let ornaments=low?100:240;
  this.flame.alpha=fire.phase==='charging'?.8+Math.sin(fire.now*(10+charge*14))*.18:1;
  for(const stroke of paths){
   if(fire.phase==='exploding'){ornaments=this.blast(stroke,fire.explosionAge,low,ornaments);continue;}
   if(stroke.length<2){if(ornaments-->0)this.motif(stroke.points[0],fire.now,stroke.seed,.55,1);continue;}
   this.ribbon(stroke,fire.now,1.03,0,this.style.palette.ash,.32);
   this.ribbon(stroke,fire.now,.79,0,this.style.palette.ink,.78);
   this.ribbon(stroke,fire.now,.55,-2,this.style.palette.body,.90);
   this.ribbon(stroke,fire.now,.28,2,this.style.palette.flame,.82);
   this.filament(stroke,fire.now,-7,1.4,this.style.palette.accent,.85);
   this.filament(stroke,fire.now,4,this.style.coreWidth,this.style.palette.core,.9);
   if(!low){this.filament(stroke,fire.now,10,.8,this.style.palette.accent,.55);this.filament(stroke,fire.now,-12,.65,this.style.palette.flame,.7);}
   if(charge>0)this.ribbon(stroke,fire.now,.34+charge*.18,0,this.style.palette.core,.25+charge*.3);
   const spacing=Math.max(this.style.spacing*(low?1.5:1),total/(low?100:240)),along=sampler(stroke);
   for(let d=12,index=0;d<stroke.length&&ornaments>0;d+=spacing,index++,ornaments--){
    const p=along(d),seed=stroke.seed*101+index*13;
    this.motif(p,fire.now,seed,.65+noise(seed)*.7,index%3===0?-1:1);
    if(!low)this.embers(p,fire.now,seed);
   }
  }
 }
 private blast(stroke:Stroke,age:number,low:boolean,budget:number){
  const u=clamp(age/C.blastDuration),power=1-u,flash=Math.max(0,1-u*3),P=this.style.palette;
  this.flame.alpha=1;
  this.ribbon(stroke,age,1.2+Math.sin(u*Math.PI)*1.3,0,P.flame,power*.65);
  this.ribbon(stroke,age,.9+u*.5,0,P.core,flash*.9);
  const along=sampler(stroke),spacing=Math.max(low?105:75,stroke.length/Math.max(1,budget));
  for(let d=0;d<=stroke.length&&budget>0;d+=spacing,budget--){
   const p=along(d),g=this.flame,r=8+Math.sin(u*Math.PI*.65)*49;
   if(this.styleId==='gold')g.poly([p.x,p.y-r,p.x+r*.8,p.y,p.x,p.y+r,p.x-r*.8,p.y]).stroke({color:P.core,width:2.3,alpha:power*.9});
   else if(this.styleId==='fox')g.ellipse(p.x,p.y,r*1.15,r*.65).stroke({color:P.flame,width:2,alpha:power*.85});
   else g.circle(p.x,p.y,r).stroke({color:this.styleId==='mountain'?P.accent:P.core,width:1.7,alpha:power*.7});
   this.motif({...p,fade:power},age,stroke.seed+d,1+u*.8,1);
   for(let k=0;k<(low?4:7);k++){
    const angle=k*2.399+stroke.seed,distance=10+u*(35+noise(k+stroke.seed)*38),x=p.x+Math.cos(angle)*distance,y=p.y+Math.sin(angle)*distance*.8,size=(2+noise(k*7+stroke.seed)*4)*power;
    g.moveTo(x-size,y).lineTo(x,y-size*1.8).lineTo(x+size,y).lineTo(x,y+size).closePath().fill({color:k%2?P.accent:P.flame,alpha:power*.9});
   }
   if(stroke.length<2)break;
  }
  return budget;
 }
 private ribbon(stroke:Stroke,time:number,scale:number,offset:number,color:number,alpha:number){
  const left:number[]=[],right:[number,number][]=[];
  for(const p of stroke.points){
   const taper=.15+.85*Math.min(1,p.distance/26,(stroke.length-p.distance)/24),wave=1+Math.sin(p.distance*.095+time*4+stroke.seed)*.16;
   const half=C.width*.5*scale*this.style.width*taper*wave*p.fade,shift=offset+Math.sin(p.distance*.044+stroke.seed)*2;
   left.push(p.x+p.nx*(shift+half),p.y+p.ny*(shift+half));right.push([p.x+p.nx*(shift-half),p.y+p.ny*(shift-half)]);
  }
  this.ground.poly([...left,...right.reverse().flat()]).fill({color,alpha:alpha*Math.max(...stroke.points.map(p=>p.fade))});
 }
 private filament(stroke:Stroke,time:number,offset:number,width:number,color:number,alpha:number){
  const g=this.flame,along=sampler(stroke);let started=false;
  for(let d=3;d<stroke.length-3;d+=this.sampleStep){
   const p=along(d),edge=Math.min(1,d/25,(stroke.length-d)/25),shift=(offset+Math.sin(d*.065+time*3+stroke.seed)*3)*edge;
   const x=p.x+p.nx*shift,y=p.y+p.ny*shift;
   if(Math.sin(d*.13+stroke.seed)>.84||p.fade<.12){started=false;continue;}
   if(!started)g.moveTo(x,y);else g.lineTo(x,y);started=true;
  }
  g.stroke({color,width,alpha:alpha*stroke.points[Math.floor(stroke.points.length/2)].fade,cap:'round',join:'round'});
 }
 private motif(p:Knot,time:number,seed:number,scale:number,side:number){
  if(this.styleId==='fox')this.fox(p,time,seed,scale,side);
  else if(this.styleId==='gold')this.imperial(p,time,seed,scale,side);
  else if(this.styleId==='mountain')this.mountain(p,time,seed,scale,1);
  else this.cloud(p,time,seed,scale,side);
 }
 private local(p:Knot,time:number,seed:number,scale:number,side:number){
  const g=this.flame,fade=p.fade,stretch=scale*(.94+Math.sin(time*5*this.style.speed+seed)*.06),s=side*stretch;
  const point=(x:number,y:number):[number,number]=>[p.x+p.ny*x*stretch+p.nx*y*s,p.y-p.nx*x*stretch+p.ny*y*s];
  return {g,fade,move:(x:number,y:number)=>g.moveTo(...point(x,y)),line:(x:number,y:number)=>g.lineTo(...point(x,y)),curve:(a:number,b:number,c:number,d:number,e:number,f:number)=>g.bezierCurveTo(...point(a,b),...point(c,d),...point(e,f)),poly:(points:number[])=>g.poly(Array.from({length:points.length/2},(_,i)=>point(points[i*2],points[i*2+1])).flat())};
 }
 private fox(p:Knot,time:number,seed:number,scale:number,side:number){
  const {g,fade,move,curve}=this.local(p,time,seed,scale,side),P=this.style.palette;
  if(fade<=0)return;
  // Long paired fox tails; the split tips drift instead of curling into cloud scrolls.
  move(-37,4);curve(-18,10,2,-13,11,-23);curve(23,-38,35,-25,54,-32);curve(36,-20,31,-7,16,0);curve(-2,10,-21,15,-37,4);g.fill({color:P.body,alpha:.8*fade});
  move(-25,5);curve(-9,6,1,-3,12,-13);curve(27,-27,37,-16,55,-26);curve(35,-6,23,8,6,10);curve(-4,12,-14,8,-25,5);g.fill({color:P.flame,alpha:.73*fade});
  move(-23,6);curve(-7,9,11,5,26,-7);curve(36,-14,42,-14,55,-26);curve(42,-8,30,7,12,11);curve(-1,13,-13,9,-23,6);g.fill({color:P.core,alpha:.8*fade});
  move(-31,0);curve(-10,-4,2,-24,22,-29);curve(34,-31,43,-27,58,-35);g.stroke({color:P.accent,width:.8,alpha:.66*fade});
  move(-28,12);curve(-3,24,26,10,51,-10);g.stroke({color:P.flame,width:1,alpha:.5*fade});
  const rise=4+Math.sin(time*4+seed)*4;
  move(12,-31-rise);curve(8,-38-rise,18,-43-rise,16,-50-rise);curve(28,-36-rise,15,-32-rise,19,-26-rise);curve(20,-19-rise,8,-23-rise,12,-31-rise);g.fill({color:P.flame,alpha:.8*fade});
  move(15,-30-rise);curve(13,-37-rise,18,-37-rise,17,-42-rise);curve(23,-33-rise,17,-30-rise,17,-27-rise);g.fill({color:P.core,alpha:.9*fade});
 }
 private imperial(p:Knot,time:number,seed:number,scale:number,side:number){
  const {g,fade,move,curve,poly}=this.local(p,time,seed,scale,side),P=this.style.palette;
  if(fade<=0)return;
  // Gilded brush-nib flames, split spear tips and hanging seal strokes.
  move(-32,6);curve(-12,4,0,-10,17,-37);curve(16,-22,26,-20,32,-31);curve(30,-15,29,-12,47,-24);curve(37,-6,19,13,0,12);curve(-12,12,-23,8,-32,6);g.fill({color:P.body,alpha:.9*fade});
  poly([-26,6,-7,2,17,-37,15,-17,27,-22,21,-7,40,-18,18,9,-1,12]).fill({color:P.flame,alpha:.9*fade});
  poly([-18,6,-1,2,14,-23,11,-7,25,-13,17,3,32,-9,14,9,0,11]).fill({color:P.core,alpha:.96*fade});
  move(-29,12);curve(-6,21,21,12,43,-13);g.stroke({color:P.accent,width:.85,alpha:.8*fade});
  poly([32,-39,36,-48,40,-40,36,-33]).fill({color:P.accent,alpha:.82*fade});
  poly([-20,-18,-14,-27,-10,-19,-14,-11]).fill({color:P.core,alpha:.72*fade});
  if(seed%3===0){
   poly([2,18,10,18,10,33,2,33,2,18]).stroke({color:P.accent,width:.9,alpha:.75*fade});
   poly([4,21,8,24,4,26,8,29]).stroke({color:P.core,width:.8,alpha:.85*fade});
   poly([6,36,8,39,6,42,4,39]).fill({color:P.accent,alpha:.75*fade});
  }
 }
 private mountain(p:Knot,time:number,seed:number,scale:number,side:number){
  const {g,fade,move,curve,poly}=this.local(p,time,seed,scale,side),P=this.style.palette;
  if(fade<=0)return;
  // Low ink ridges and drifting mist, with broken gold contours rather than flame leaves.
  poly([-35,8,-24,-3,-14,-31,-5,-18,3,-8,15,-25,26,-7,39,5,20,12,-2,15]).fill({color:P.ink,alpha:.9*fade});
  poly([-29,6,-17,-7,-14,-31,-7,-11,3,3,14,-10,15,-25,21,-3,34,7,9,10]).fill({color:P.body,alpha:.92*fade});
  poly([-24,0,-14,-31,-10,-17,-3,-9]).stroke({color:P.accent,width:1,alpha:.83*fade});
  poly([7,-3,15,-25,19,-11,27,-3]).stroke({color:P.core,width:.9,alpha:.65*fade});
  move(-34,13);curve(-22,5,-15,18,-2,13);curve(10,7,21,12,35,6);g.stroke({color:P.core,width:1.7,alpha:.78*fade});
  move(-38,18);curve(-18,9,-19,27,0,21);curve(10,16,22,22,40,15);g.stroke({color:P.flame,width:1.5,alpha:.58*fade});
  move(-29,22);curve(-5,15,11,30,31,20);g.stroke({color:P.accent,width:.6,alpha:.55*fade});
  for(let i=0;i<3;i++){const x=-26+noise(seed+i)*57,y=8+noise(seed+i*7)*10;poly([x,y,x+4,y-2,x+6,y,x+1,y+1]).fill({color:i?P.body:P.core,alpha:.7*fade});}
 }
 private cloud(p:Knot,time:number,seed:number,scale:number,side:number){
  const g=this.flame,fade=p.fade;if(fade<=0)return;
  const stretch=scale*(.9+Math.sin(time*5*this.style.speed+seed)*.1),s=side*stretch;
  const point=(x:number,y:number):[number,number]=>[p.x+p.ny*x*stretch+p.nx*y*s,p.y-p.nx*x*stretch+p.ny*y*s];
  const move=(x:number,y:number)=>g.moveTo(...point(x,y)),line=(x:number,y:number)=>g.lineTo(...point(x,y));
  const curve=(a:number,b:number,c:number,d:number,e:number,f:number)=>g.bezierCurveTo(...point(a,b),...point(c,d),...point(e,f));
  // Swept paper-cut fire with a curling head, tapering into the stroke's tangent.
  move(-28,1);curve(-15,4,-6,-5,-8,-15);curve(-12,-26,2,-33,9,-25);curve(20,-16,4,-8,5,-17);curve(10,-4,24,-10,40,-24);curve(35,-7,18,13,0,13);curve(-10,13,-20,8,-28,1);
  g.fill({color:this.style.palette.body,alpha:.88*fade});
  move(-23,2);curve(-8,7,4,7,16,-1);curve(25,-6,30,-11,40,-24);curve(30,-6,26,7,10,12);curve(-1,17,-15,9,-23,2);
  g.fill({color:this.style.palette.flame,alpha:.8*fade});
  move(-18,4);curve(-4,10,12,9,24,-4);curve(17,8,8,12,-2,10);
  g.stroke({color:this.style.palette.core,width:1.7,alpha:.92*fade,cap:'round'});
  move(-19,0);curve(-8,2,-3,-6,-7,-14);curve(-12,-23,0,-29,5,-23);curve(10,-17,-2,-13,-2,-20);
  g.stroke({color:this.style.palette.accent,width:1.25,alpha:.88*fade,cap:'round'});
  move(-29,8);curve(-15,20,9,21,30,5);g.stroke({color:this.style.palette.accent,width:.7,alpha:.48*fade});
  const x=13+noise(seed+3)*15,y=-22-noise(seed+4)*12;move(x,y);line(x+8,y-5);line(x+4,y+1);g.closePath().fill({color:this.style.palette.flame,alpha:.75*fade});
 }
 private embers(p:Knot,time:number,seed:number){
  const g=this.flame;
  for(let i=0;i<2;i++){
   const t=(time*(.3+noise(seed+i)*.2)+noise(seed+i*7))%1,dx=(noise(seed+i*3)-.5)*42,dy=-8-t*38,x=p.x+dx+Math.sin(t*4+seed)*6,y=p.y+dy;
   const size=1.2+noise(seed+i*9)*1.5,alpha=Math.sin(t*Math.PI)*p.fade;
   g.moveTo(x-size,y).lineTo(x+size*.6,y-size*1.8).lineTo(x+size,y).lineTo(x-size*.3,y+size*.8).closePath().fill({color:i?this.style.palette.flame:this.style.palette.accent,alpha:alpha*.85});
  }
 }
}
