import {Container,Graphics} from 'pixi.js';
import type {Point} from '../input/recognizer';
import type {ThunderBrush,BrushArc} from '../gameplay/thunder-brush';
import type {InputController} from '../input/controller';

export function thunderBrushEmblem(g:Graphics){
 g.poly([6,-27,-20,3,-5,1,-12,25,22,-9,5,-5,13,-27]).fill(0xe5e2ce).stroke({color:0xa99b75,width:1.2});
 g.moveTo(-20,-12).lineTo(-25,-4).lineTo(-18,-5).stroke({color:0xc8c6b3,width:1});
}
type Node=Point&{age:number;seed:number};
/** One legible silver channel, sparse champagne edges and at most two subordinate forks. */
export class ThunderBrushRenderer{
 root=new Container();private halo=new Graphics();private edge=new Graphics();private core=new Graphics();private detail=new Graphics();
 constructor(){this.root.addChild(this.halo,this.edge,this.core,this.detail);}
 private channel(points:Point[],alpha:number,width=1){
  if(points.length<2)return;
  for(const [g,color,w,opacity] of [[this.halo,0x859391,9,.12],[this.edge,0xb5a585,5.5,.65],[this.core,0xe7e6da,3.1,.93]] as const){
   g.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))g.lineTo(p.x,p.y);
   g.stroke({color,width:w*width,alpha:alpha*opacity,cap:'butt',join:'bevel'});
  }
 }
 private groups(arcs:BrushArc[]){
  const groups:Node[][]=[];let group:Node[]=[];let previous:Point|undefined;
  for(const a of arcs){
   if(!previous||Math.hypot(a.a.x-previous.x,a.a.y-previous.y)>.2){if(group.length>1)groups.push(group);group=[{...a.a,age:a.age,seed:a.seed}];}
   group.push({...a.b,age:a.age,seed:a.seed});previous=a.b;
  }
  if(group.length>1)groups.push(group);return groups;
 }
 update(model:ThunderBrush,input:InputController,enabled:boolean,low=false){
  this.root.visible=enabled;for(const g of [this.halo,this.edge,this.core,this.detail])g.clear();if(!enabled)return;
  const rhythm=Math.floor(model.clock*10);let forks=0;
  for(const raw of this.groups(model.arcs)){
   const nodes:Node[]=[raw[0]];let length=0;
   for(let i=1;i<raw.length;i++){length+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].y-raw[i-1].y);if(length>=18||i===raw.length-1){nodes.push(raw[i]);length=0;}}
   const points=nodes.map((p,i)=>{
    if(i===0||i===nodes.length-1)return {...p};
    const a=nodes[i-1],b=nodes[i+1],dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
    const offset=(i%2?1:-1)*(6+3*Math.sin(p.seed+rhythm*.45));
    return {x:p.x-dy/n*offset,y:p.y+dx/n*offset};
   });
   for(let i=1;i<points.length;i++){
    const fade=Math.pow(Math.max(0,1-nodes[i].age/.32),.65);
    this.channel([points[i-1],points[i]],fade*(.88+.12*Math.sin(model.clock*13-i*1.4)),.78+.22*fade);
   }
   if(points.length>1){
    const travel=(model.clock*13)%(points.length-1),i=Math.floor(travel),u=travel-i,a=points[i],b=points[i+1];
    const x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u,fade=Math.max(0,1-nodes[i+1].age/.32);
    this.detail.ellipse(x,y,2.7,1.3).fill({color:0xf0e1b7,alpha:fade*.65});
    if(!low&&Math.sin(model.clock*18)>.65){const drift=2+3*Math.sin(model.clock*18);this.detail.moveTo(x+3,y-3).lineTo(x+drift+4,y-drift-4).stroke({color:0xd7c7a3,width:.7,alpha:fade*.6});}
   }
   // Branches are occasional accents, never a second network covering the whole stroke.
   for(let i=1;i<points.length-1&&forks<(low?1:2);i+=5){
    const p=points[i],a=points[i-1],dx=p.x-a.x,dy=p.y-a.y,n=Math.hypot(dx,dy)||1,side=forks%2?1:-1;
    const mid={x:p.x-dy/n*side*13+dx/n*5,y:p.y+dx/n*side*13+dy/n*5};
    const end={x:mid.x-dy/n*side*9-dx/n*3,y:mid.y+dx/n*side*9-dy/n*3};
    this.channel([p,mid,end],Math.max(0,1-nodes[i].age/.32)*.65,.34);forks++;
   }
  }
  for(const c of model.contacts.slice(-2)){
   const fade=Math.max(0,1-c.age/.22),tilt=c.seed*.73,dx=Math.cos(tilt),dy=Math.sin(tilt);
   this.channel([{x:c.x-dx*17,y:c.y-dy*17},c,{x:c.x+dx*22,y:c.y+dy*22}],fade,.65);
   this.channel([{x:c.x-dy*9,y:c.y+dx*9},c,{x:c.x+dy*12,y:c.y-dx*12}],fade*.55,.3);
  }
  const tip=model.active&&input.drawing?input.points.at(-1):undefined;
  if(tip)this.core.circle(tip.x,tip.y,1.8).fill({color:0xe9e7d8,alpha:.9});
 }
}
