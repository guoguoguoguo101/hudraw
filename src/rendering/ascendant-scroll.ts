import {Container,Graphics} from 'pixi.js';
const PAPER=0xffe9c2,GOLD=0xd7aa60,RED=0xad3025,INK=0x383b36;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
type Motif={points:number[];color:number;alpha:number;stroke?:number};
/** Every paper panel and its ink are projected through the same evolving silk bend. */
export class AscendantScroll extends Container{
 face=new Container();art=new Graphics();maskShape=new Graphics();rollers:Container[]=[];open=0;motifs:Motif[]=[];bend=0;twist=0;time=0;
 themes=['雪岭松风','朱日古塔','飞瀑青山','云海仙鹤','山门红枫','溪桥远岫','群峰归云'];
 constructor(public index:number,public length=190,public paperWidth=66){
  super();this.face.addChild(this.art);this.addChild(this.face,this.maskShape);this.face.mask=this.maskShape;
  this.design();const w=paperWidth/2;
  for(let side=0;side<2;side++){
   const roll=new Container(),art=new Graphics();roll.addChild(art);this.addChild(roll);this.rollers.push(roll);
   art.roundRect(-6,-w-6,12,paperWidth+12,4).fill({color:GOLD}).stroke({color:INK,width:1.4});art.rect(-4,-w-2,3,paperWidth+4).fill({color:PAPER});
   for(const y of [-w-5,w+5])art.ellipse(0,y,7,3).fill({color:INK}).stroke({color:GOLD,width:1.4});
   art.moveTo(0,w+7).bezierCurveTo(8,w+20,-10,w+26,4,w+40).stroke({color:RED,width:2});art.poly([4,w+40,-1,w+51,7,w+50]).fill({color:RED});
  }
 }
 design(){
  const l=this.length/2,w=this.paperWidth/2,add=(points:number[],color:number,alpha=1,stroke?:number)=>this.motifs.push({points,color,alpha,stroke});
  const circle=(x:number,y:number,r:number,color:number,alpha=1)=>add(Array.from({length:24},(_,i)=>[x+Math.cos(i*Math.PI/12)*r,y+Math.sin(i*Math.PI/12)*r]).flat(),color,alpha);
  for(let layer=0;layer<3;layer++){
   const points=[-l,w-5],centers=[-.65+Math.sin(this.index+layer)*.12,.03+Math.cos(this.index*.9+layer)*.13,.65+Math.sin(this.index*1.2-layer)*.1];
   for(let j=0;j<=48;j++){const x=-l+j*this.length/48,peak=Math.max(...centers.map(c=>Math.exp(-(((x/l-c)/(.27+layer*.045))**2)))),y=w-5-peak*(42-layer*10)+Math.sin(j*.85+this.index)*peak*1.4;points.push(x,y);}points.push(l,w-5);add(points,[0xb6b19f,0x7a7e73,INK][layer],[.38,.45,.64][layer]);
   if(layer===1)for(const c of centers){const x=c*l;add([x-3,w-35,x-6,w-19,x-18,w-6],INK,.35,.7);add([x+3,w-32,x+9,w-22,x+18,w-7],PAPER,.55,.8);}
  }
  const pine=(x:number,y:number)=>{add([x,y+13,x-2,y-2,x+6,y-17],INK,.9,1.4);for(let k=0;k<4;k++){const yy=y-15+k*6;add([x-12+k*2,yy+4,x+2,yy-2,x+17-k*2,yy+4,x+7,yy+6],INK,.88);}};
  const pagoda=(x:number,y:number)=>{for(let k=0;k<3;k++){const yy=y-k*9,ww=12-k*2;add([x-ww*.6,yy-7,x+ww*.6,yy-7,x+ww*.6,yy,x-ww*.6,yy],0x783e30,.85);add([x-ww,yy-7,x,yy-12,x+ww,yy-7,x+ww*.8,yy-4,x-ww*.8,yy-4],INK,.92);}};
  switch(this.index%7){
   case 0:pine(-l*.60,7);pine(l*.45,12);for(let i=0;i<5;i++)add([-l+i*31,2-i%2*11,-l+12+i*31,-6-i%2*11,-l+21+i*31,0-i%2*11],PAPER,.9);break;
   case 1:circle(l*.52,-13,12,RED,.78);pagoda(-l*.23,14);pine(l*.75,18);break;
   case 2:add([-18,-25,-5,-25,3,26,-12,26],PAPER,.92);add([-12,-24,-9,1,-3,25],GOLD,.7,1);pine(l*.5,11);break;
   case 3:for(let i=0;i<4;i++){const x=-l*.7+i*34,y=-8+i%2*10;add([x-9,y+4,x-3,y-5,x,y,x+3,y-5,x+9,y+4,x,y+1],PAPER,.96);}break;
   case 4:add([-12,-13,-9,-13,-9,15,-12,15, -12,-13],RED);add([10,-13,13,-13,13,15,10,15],RED);add([-21,-18,0,-14,22,-18,18,-12,-18,-12],INK);add([-18,-9,18,-9,18,-6,-18,-6],RED);for(let i=0;i<12;i++)circle(-l*.7+Math.sin(i*2.3)*21,i*3-20,2.1,RED,.8);break;
   case 5:add([-44,13,-24,2,-2,0,24,13],INK,.9,2);add([-24,3,-24,13,-8,1,-8,11,8,3,8,13],INK,.65,1);for(let i=0;i<4;i++)add([-l,18+i*3,-15,14+i*3,18,22+i*3,l,14+i*3],GOLD,.65,1);break;
   case 6:pagoda(l*.46,17);pine(-l*.5,18);for(let i=0;i<5;i++)add([-l+i*34,-19,-l+11+i*34,-24,-l+29+i*34,-20],PAPER,.85,2);break;
  }
 }
 project(x:number,y:number){
  const u=x/this.length,angle=this.twist*Math.sin(u*Math.PI*1.4+this.index*.7);
  return {x:x+y*Math.sin(angle)*.23,y:this.bend*Math.sin(u*Math.PI*2+this.index*.61)+y*Math.cos(angle)};
 }
 update(t:number){
  this.time=t;const u=clamp((t-.28-this.index*.14)/.45);this.open=1-(1-u)**3;
  this.bend=9+Math.sin(t*.63+this.index*.91)*(8+this.index%3*3);this.twist=Math.sin(t*.48+this.index*.8)*.55;
  const l=this.length*.5,w=this.paperWidth*.5,g=this.art;g.clear();
  const outline:number[]=[];for(let j=0;j<=32;j++){const p=this.project(-l+j*this.length/32,-w);outline.push(p.x,p.y);}for(let j=32;j>=0;j--){const p=this.project(-l+j*this.length/32,w);outline.push(p.x,p.y);}g.poly(outline).fill({color:PAPER}).stroke({color:GOLD,width:1.3});
  for(const motif of this.motifs){const pts:number[]=[];for(let j=0;j<motif.points.length;j+=2){const p=this.project(motif.points[j],motif.points[j+1]);pts.push(p.x,p.y);}if(motif.stroke){g.moveTo(pts[0],pts[1]);for(let j=2;j<pts.length;j+=2)g.lineTo(pts[j],pts[j+1]);g.stroke({color:motif.color,alpha:motif.alpha,width:motif.stroke});}else g.poly(pts).fill({color:motif.color,alpha:motif.alpha});}
  for(const sign of [-1,1]){const p=this.project(-l,sign*(w-4));g.moveTo(p.x,p.y);for(let j=1;j<=32;j++){const q=this.project(-l+j*this.length/32,sign*(w-4));g.lineTo(q.x,q.y);}g.stroke({color:RED,width:2,alpha:.8});}
  const revealed=l*this.open,mask:number[]=[];for(let j=0;j<=24;j++){const p=this.project(-revealed+j*revealed/12,-w-2);mask.push(p.x,p.y);}for(let j=24;j>=0;j--){const p=this.project(-revealed+j*revealed/12,w+2);mask.push(p.x,p.y);}this.maskShape.clear().poly(mask).fill({color:0xffffff});
  this.rollers.forEach((roll,i)=>{const x=(i===0?-1:1)*revealed,p=this.project(x,0),q=this.project(x+1,0);roll.position.set(p.x,p.y);roll.rotation=Math.atan2(q.y-p.y,q.x-p.x);roll.scale.y=Math.cos(this.twist*Math.sin(x/this.length*Math.PI*1.4+this.index*.7));});
  this.alpha=clamp((t-.25-this.index*.14)/.16);
 }
}
