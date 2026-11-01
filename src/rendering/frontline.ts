import {Container,Graphics} from 'pixi.js';
import type {Game} from '../gameplay/game';
const PALETTES={valley:[0x34413c,0x263531,0xc39b64],sea:[0x284c50,0x1d383f,0x8fc8be],palace:[0x343a54,0x252a43,0xc4b7e5],snow:[0x536771,0x344c59,0xc8e0df]};
export class FrontlineRenderer{
 floor=new Container();flights=new Graphics();private ground=new Graphics();private key='';
 constructor(){this.floor.addChild(this.ground);}
 update(g:Game,top:number,bottom:number){
  this.floor.visible=this.flights.visible=g.frontlineTest;if(!g.frontlineTest){this.key='';return;}
  const b=g.hualing.bounds,p=g.playerPosition,[light,dark,line]=PALETTES[g.hualing.journey.chapter],key=[top,bottom,b.top,b.bottom,g.hualing.journey.chapter].join(':');
  if(key!==this.key){this.key=key;const a=this.ground;a.clear();
   // Preserve the chapter landmark; quiet the approach lane with layered, translucent paper.
   const start=Math.max(b.top+175,440),height=b.bottom-start;
   for(let i=0;i<28;i++){const y=start+height*i/28,u=i/28;a.rect(30,y,660,height/28+1).fill({color:dark,alpha:.05+.46*u*u});a.rect(94,y,532,height/28+1).fill({color:light,alpha:.025+u*.055});}
   for(let i=0;i<46;i++){const x=100+(i*173%520),y=start+18+(i*97%Math.max(1,height-35));a.moveTo(x,y).lineTo(x+3+i%9,y+.3).stroke({color:line,width:.6,alpha:.05});}
   for(const side of [-1,1])for(let i=0;i<5;i++){const x=side===-1?43+(i%2)*19:677-(i%2)*19,y=start+45+i*91;
    a.poly([x-20,y,x-13,y-10,x+15,y-8,x+22,y+5,x+11,y+12,x-16,y+10]).fill({color:light,alpha:.22}).stroke({color:line,width:.8,alpha:.12});a.moveTo(x-13,y-7).lineTo(x+12,y-6).lineTo(x+19,y+3).stroke({color:line,width:1,alpha:.24});
    if(g.hualing.journey.chapter==='sea')a.moveTo(x-17,y-16).quadraticCurveTo(x,-25+y,x+17,y-17).stroke({color:line,width:1,alpha:.16});
   }
   a.ellipse(p.x,p.y+43,84,18).fill({color:dark,alpha:.35}).stroke({color:line,width:1,alpha:.22});
   for(const side of [-1,1])a.moveTo(p.x+side*79,p.y+41).quadraticCurveTo(p.x+side*59,p.y+59,p.x+side*28,p.y+59).stroke({color:line,width:.8,alpha:.3});
   a.moveTo(36,b.bottom+18).lineTo(684,b.bottom+18).stroke({color:line,width:1,alpha:.3});
  }
  const a=this.flights;a.clear();for(const f of g.frontline.flights){const u=Math.min(1,f.age/f.duration),x=f.from.x+(f.target.x-f.from.x)*u,y=f.from.y+(f.target.y-f.from.y)*u-Math.sin(u*Math.PI)*95;
   a.ellipse(f.target.x,f.target.y,35,14).stroke({color:0xf1d192,width:2,alpha:.7});a.moveTo(f.from.x,f.from.y).quadraticCurveTo((f.from.x+f.target.x)/2,(f.from.y+f.target.y)/2-190,x,y).stroke({color:0xf1d192,width:2,alpha:.2});
   a.save().translateTransform(x,y).rotateTransform(u*2).roundRect(-14,-19,28,38,3).fill(0xf2dfad).stroke({color:0xa25038,width:2}).moveTo(-5,-9).lineTo(6,-9).lineTo(-4,7).lineTo(7,7).stroke({color:0xa25038,width:2}).restore();
  }
 }
}
