import {Container,Graphics} from 'pixi.js';
const GOLD=0xffca69,WHITE=0xfff2d0,RED=0xeb4129;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function silhouette(color:number){
 const g=new Graphics();
 // Three hooked tails, a flying body, pointed ears and a long fox muzzle.
 for(let i=0;i<3;i++)g.moveTo(-20,8).bezierCurveTo(-55,-7-i*9,-85,5-i*22,-81,-33-i*6).bezierCurveTo(-101,-6-i*7,-76,28-i*5,-20,8).fill({color,alpha:.75});
 g.moveTo(-26,1).quadraticCurveTo(-9,-20,17,-8).lineTo(27,-15).lineTo(28,-43).lineTo(39,-24).lineTo(47,-44).lineTo(48,-17).lineTo(65,-8).lineTo(57,2).lineTo(39,5).lineTo(27,13).lineTo(24,5).quadraticCurveTo(-3,23,-26,1).fill({color});
 g.poly([-11,13,-2,26,9,29,4,16,17,9]).fill({color});g.poly([22,9,24,29,35,25,30,12]).fill({color});
 g.moveTo(16,-3).bezierCurveTo(-9,-22,-18,-8,-48,-20).bezierCurveTo(-27,0,-4,-7,18,2).fill({color:RED,alpha:.7});
 g.moveTo(38,-16).lineTo(47,-12).stroke({color:RED,width:2});return g;
}
/** Nine separate fox shadows circle the player; old positions trail behind each. */
export class FoxOrbit{
 back=new Container();front=new Container();shadows:Container[]=[];trails:Container[][]=[];burst=new Graphics();
 constructor(){
  this.front.addChild(this.burst);this.burst.circle(0,0,200).stroke({color:RED,width:18,alpha:.2}).circle(0,0,200).stroke({color:GOLD,width:7,alpha:.85}).circle(0,0,200).stroke({color:WHITE,width:2,alpha:1});
  for(let i=0;i<9;i++){
   const shadow=new Container();shadow.addChild(silhouette(WHITE));this.shadows.push(shadow);this.back.addChild(shadow);
   const trails:Container[]=[];for(let j=0;j<2;j++){const trail=new Container();trail.addChild(silhouette(j===0?RED:GOLD));trails.push(trail);this.back.addChild(trail);}this.trails.push(trails);
  }
 }
 update(t:number,r:number){
  const appear=clamp((t-.45)/.3),orbit=r*.62,converge=clamp((t-1.65)/.3),radius=orbit*(1-converge*.30),pulse=1-converge*.55;
  this.shadows.forEach((shadow,i)=>{
   const a=i*Math.PI*2/9+t*1.8;
   for(const [j,item] of [shadow,...this.trails[i]].entries()){
    const angle=a-j*.10,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius,parent=y>0?this.front:this.back;
    if(item.parent!==parent)parent.addChild(item);item.position.set(x,y);item.rotation=angle+Math.PI/2;item.scale.set(.56+(i%3)*.035);item.alpha=appear*pulse*(j===0?.84:j===1?.23:.10);
   }
  });
  const u=clamp((t-1.80)/.55);this.burst.scale.set(.45+u*1.25);this.burst.alpha=t<1.80?0:(1-u)*.95;
 }
}
