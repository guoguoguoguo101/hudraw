import {Container,Graphics} from 'pixi.js';

type Drifter={art:Graphics;x:number;y:number;speed:number;sway:number;phase:number;spin:number;size:number;leaf:boolean};

/** A small, deterministic paper-cut breeze. Objects are reused each frame. */
export class ArchiveAtmosphere{
 readonly back=new Container();
 readonly front=new Container();
 private clouds:{art:Graphics;x:number;y:number;phase:number;range:number}[]=[];
 private drifters:Drifter[]=[];
 private time=0;

 constructor(){
  for(let i=0;i<5;i++){
   const art=new Graphics();
   art.moveTo(-95,15).bezierCurveTo(-75,-10,-40,8,-25,-18).bezierCurveTo(-10,-42,15,-35,25,-12).bezierCurveTo(42,-30,67,-13,68,3).bezierCurveTo(85,-8,104,4,106,19).lineTo(-95,19).closePath().fill({color:i%2?0xf9e6ce:0xfff6e7,alpha:.68});
   art.moveTo(-89,22).bezierCurveTo(-53,8,-28,21,-12,7).bezierCurveTo(1,-5,19,0,22,13).bezierCurveTo(27,27,12,30,6,21).moveTo(35,19).bezierCurveTo(52,8,67,13,83,17).stroke({color:0xc39251,width:1.5,alpha:.65});
   art.alpha=[.52,.44,.43,.5,.38][i];
   art.scale.set([1,.78,.9,1.15,.7][i]);
   const x=[102,575,265,485,80][i],y=[590,785,1000,1128,1190][i];
   art.position.set(x,y);this.back.addChild(art);
   this.clouds.push({art,x,y,phase:i*1.37,range:18+i*5});
  }
  for(let i=0;i<23;i++){
   const leaf=i%6===0;
   const art=this.makePetal(leaf,i);
   const lane=i%5===0?350+(i*47%180-90):i%2?36+(i*37%95):584+(i*43%100);
   const item={art,x:lane,y:174+(i*149%1050),speed:leaf?19+i%4*3:25+i%5*4,sway:leaf?14:22,phase:i*2.41,spin:(i%2?1:-1)*(.13+i%4*.06),size:.78+i%5*.1,leaf};
   art.alpha=leaf?.46:.42+i%4*.07;
   this.drifters.push(item);this.front.addChild(art);
  }
 }

 private makePetal(leaf:boolean,i:number){
  const art=new Graphics();
  if(leaf){
   art.moveTo(0,-10).bezierCurveTo(10,-9,12,3,0,12).bezierCurveTo(-9,8,-10,-4,0,-10).fill({color:i%2?0xa96838:0x9b743e});
   art.moveTo(0,-8).quadraticCurveTo(2,2,0,10).stroke({color:0xf4dbad,width:.8,alpha:.65});
  }else{
   art.moveTo(0,-11).bezierCurveTo(10,-10,13,-1,4,9).quadraticCurveTo(0,12,-4,9).bezierCurveTo(-13,-1,-10,-10,0,-11).fill({color:i%3===0?0xcf786d:i%3===1?0xb9464d:0xe5a99a});
   art.moveTo(0,-8).quadraticCurveTo(3,0,0,7).stroke({color:0xffe6d2,width:.9,alpha:.5});
  }
  return art;
 }

 update(dt:number){
  this.time+=Math.min(.05,Math.max(0,dt));const t=this.time;
  for(const cloud of this.clouds){cloud.art.x=cloud.x+Math.sin(t*.23+cloud.phase)*cloud.range;cloud.art.y=cloud.y+Math.sin(t*.36+cloud.phase)*4;}
  for(const p of this.drifters){
   p.y+=p.speed*Math.min(.05,Math.max(0,dt));if(p.y>1240)p.y=155;
   p.art.position.set(p.x+Math.sin(t*.75+p.phase)*p.sway+Math.sin(t*.23+p.phase)*12,p.y);
   p.art.rotation=t*p.spin+Math.sin(t*.9+p.phase)*.38;
   p.art.scale.set(p.size*(.64+.36*Math.cos(t*1.7+p.phase)),p.size);
  }
 }
}
