import {Container,Graphics} from 'pixi.js';
import {ultimateTiming,type UltimateParams} from '../gameplay/ultimate';

const WHITE=0xfff9e9,GOLD=0xe8bb6b,RED=0xad352a;
type Point={x:number;y:number};
export type WaveLayers={root:Container;body:Graphics;ink:Graphics;mask:Graphics;clouds:Graphics;axis:Graphics};
export function createWaveLayers(source?:WaveLayers):WaveLayers{
 const graphics=(g?:Graphics)=>new Graphics(g?{context:g.context}:undefined);
 const body=graphics(source?.body),ink=graphics(source?.ink),mask=graphics(source?.mask),clouds=graphics(source?.clouds),axis=graphics(source?.axis),root=new Container();
 ink.mask=mask;root.addChild(body,ink,mask,clouds,axis);return {root,body,ink,mask,clouds,axis};
}
function curve(g:Graphics,points:Point[],move=true){
 if(move)g.moveTo(points[0].x,points[0].y);
 for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];g.bezierCurveTo(b.x+(c.x-a.x)/6,b.y+(c.y-a.y)/6,c.x-(d.x-b.x)/6,c.y-(d.y-b.y)/6,c.x,c.y);}
}
function envelope(f:number,width:number,t:number,sign:number){
 return 12+width*Math.pow(f,1.65)+Math.sin(f*19-t*8+sign)*width*.10*Math.pow(f,.9);
}
function contour(g:Graphics,length:number,width:number,t:number,color:number,alpha:number){
 const top:Point[]=[],bottom:Point[]=[];
 for(let i=0;i<=12;i++){const f=i/12,x=8+length*f;top.push({x,y:-envelope(f,width,t,-1)});bottom.push({x,y:envelope(f,width,t,1)});}
 curve(g,top);const x=length+8;
 // Scalloped advancing front: several forward lobes, no rigid sheet edge or arrow icon.
 g.bezierCurveTo(x+65,-width*1.07,x-25,-width*.73,x+38,-width*.55)
 .bezierCurveTo(x+6,-width*.28,x+60,-width*.20,x+98,0)
 .bezierCurveTo(x+42,width*.16,x+3,width*.29,x+45,width*.56)
 .bezierCurveTo(x-15,width*.81,x+70,width*1.04,x,bottom.at(-1)!.y);
 curve(g,[...bottom].reverse(),false);g.closePath().fill({color,alpha});
}
function cloudRoll(g:Graphics,x:number,y:number,r:number,sign:number,alpha:number){
 g.save().setTransform(1,0,0,sign,x,y);
 g.moveTo(-r*1.5,r*.3).bezierCurveTo(-r*.9,r*.25,-r*.6,-r*.7,r*.1,-r*.6)
 .bezierCurveTo(r*.7,-r*.55,r*.8,-r*.13,r*.4,r*.02)
 .bezierCurveTo(r*.1,r*.22,r*.12,r*.5,r*.75,r*.43)
 .bezierCurveTo(r*1.4,r*.27,r*1.25,r*.85,r*.6,r*.9)
 .bezierCurveTo(-r*.3,r*1.12,-r*.35,r*.4,-r*1.5,r*.3).closePath().fill({color:WHITE,alpha}).stroke({color:GOLD,width:1.1,alpha:alpha*.85});
 g.moveTo(-r,r*.28).bezierCurveTo(-r*.52,r*.20,-r*.2,-r*.53,r*.25,-r*.32).bezierCurveTo(r*.6,-r*.1,-r*.15,r*.15,r*.03,r*.38).bezierCurveTo(r*.2,r*.65,r*.68,r*.43,r*.9,r*.6).stroke({color:GOLD,width:1.2,alpha:alpha*.7});
 g.restore();
}
function peak(g:Graphics,x:number,y:number,w:number,h:number,sign:number,alpha:number){
 g.save().setTransform(1,0,0,sign,x,y);
 g.moveTo(-w*.65,8).lineTo(-w*.4,-h*.18).lineTo(-w*.21,-h*.27).lineTo(-w*.07,-h*.70).lineTo(w*.07,-h).lineTo(w*.18,-h*.6).lineTo(w*.28,-h*.66).lineTo(w*.43,-h*.25).lineTo(w*.65,8).closePath().fill({color:0x845447,alpha});
 g.moveTo(w*.07,-h).lineTo(w*.18,-h*.6).lineTo(w*.28,-h*.66).lineTo(w*.43,-h*.25).lineTo(w*.65,8).lineTo(w*.17,-h*.08).closePath().fill({color:0xd5a075,alpha:alpha*.8});
 g.moveTo(w*.07,-h).lineTo(-w*.06,-h*.4).lineTo(w*.02,-h*.35).lineTo(-w*.1,-h*.10).stroke({color:WHITE,width:1.1,alpha:alpha*.7});g.restore();
}
function tower(g:Graphics,x:number,y:number,r:number,sign:number,alpha:number){
 g.save().setTransform(1,0,0,sign,x,y);
 for(let i=0;i<3;i++){const h=-i*r*.70,w=r*(.65-i*.10);g.rect(-w*.5,h-r*.35,w,r*.38).fill({color:0x40332d,alpha});g.moveTo(-w*1.25,h-r*.34).lineTo(-w*.55,h-r*.50).lineTo(0,h-r*.86).lineTo(w*.55,h-r*.50).lineTo(w*1.25,h-r*.34).lineTo(w*.8,h-r*.25).lineTo(-w*.8,h-r*.25).closePath().fill({color:0x40332d,alpha}).stroke({color:GOLD,width:.7,alpha});g.rect(-1,h-r*.23,2,3).fill({color:GOLD,alpha});}
 g.moveTo(0,-r*2.1).lineTo(0,-r*2.7).stroke({color:0x40332d,width:1,alpha});g.restore();
}
function flowingLandscape(g:Graphics,length:number,width:number,alpha:number){
 // Fixed longitudinal anchors keep the landscape stable as the wave advances over it.
 for(const sign of [-1,1]){
  for(let layer=0;layer<2;layer++){
   g.moveTo(12,sign*10);
   for(let i=0;i<=25;i++){const f=i/25,x=length*f,y=12+width*Math.pow(f,1.5)*(.26+layer*.16),spike=width*f*(i%4===1?.22:i%3===1?.10:0);g.lineTo(x,sign*(y+spike));}
   g.lineTo(length,sign*width*.88).lineTo(12,sign*15).closePath().fill({color:layer?0xc8a784:0xa8876c,alpha:alpha*(layer?.38:.26)});
  }
  for(let i=0;i<5;i++){const f=.33+i*.13,x=length*f,y=sign*(15+width*Math.pow(f,1.6)*.56),h=width*f*(.17+i%2*.06);peak(g,x,y,40+f*42,h,-sign,alpha*.82);if(i===1||i===3)tower(g,x-8,y-sign*h*.82,7+f*6,-sign,alpha*.8);}
  for(let i=0;i<3;i++){g.moveTo(15,sign*(7+i*4));g.bezierCurveTo(length*.40,sign*(12+i*5),length*.62,sign*width*(.20+i*.10),length+25,sign*width*(.58+i*.16)).stroke({color:GOLD,width:1,alpha:alpha*.7});}
 }
}
export function drawShanhaiWave(wave:WaveLayers,p:UltimateParams,t:number,silhouette=false){
 for(const g of [wave.body,wave.ink,wave.mask,wave.clouds,wave.axis]){g.clear();g.resetTransform();}
 const {waveProgress, waveAlpha:alpha}=ultimateTiming(p,t);if(t<.08||alpha<=0)return;
 const length=p.slashLength*waveProgress,width=(p.visualWaveWidth??p.slashWidth)*(.70+.30*waveProgress),a=alpha;
 if(!silhouette){contour(wave.body,length,width+13,t,RED,a*.85);contour(wave.body,length,width+6,t,GOLD,a*.7);}
 contour(wave.body,length,width,t,WHITE,a*.85);
 if(!silhouette){
  contour(wave.mask,length,width-4,t,0xffffff,1);
  flowingLandscape(wave.ink,p.slashLength,width,a*(p.wavePatternOpacity??.50));
  for(const sign of [-1,1]){
   // Thin cloud streams break up the wide energy face without becoming a paper border.
   for(let lane=0;lane<3;lane++){
    const band:Point[]=[];
    for(let i=0;i<=12;i++){const f=i/12;band.push({x:8+length*f,y:sign*(9+width*Math.pow(f,1.5)*(.17+lane*.20)+Math.sin(f*11-t*6+lane)*f*10)});}
    curve(wave.body,band);
    curve(wave.body,band.map((q,i)=>({x:q.x,y:q.y+sign*(2+i*1.3)})).reverse(),false);
    wave.body.closePath().fill({color:0xfffdf2,alpha:a*.55});
   }
   for(let i=0;i<4;i++){const f=.35+i*.17;if(f>waveProgress+.05)continue;const x=p.slashLength*f,y=sign*(15+width*Math.pow(f,1.55)*.53);cloudRoll(wave.ink,x,y,10+f*13,sign,a*.6);}
   for(let i=0;i<8;i++){
    const f=.2+i*.108,x=length*f,y=sign*envelope(f,width,t,sign),r=(15+f*30)*(p.waveCloudStrength??1),phase=Math.sin(t*18+i*2+sign),sweep=30+f*65,h=15+f*35+phase*7;
    wave.body.moveTo(x-20,y-sign*2).bezierCurveTo(x+8,y+sign*h,x+sweep*.6,y+sign*h*.65,x+sweep,y+sign*h*1.25)
     .lineTo(x+sweep*.7,y+sign*h*.26).lineTo(x+sweep*.88,y+sign*h*.42).bezierCurveTo(x+32,y-sign*5,x,y-sign*8,x-20,y-sign*2).closePath().fill({color:i%3?RED:0xd74b30,alpha:a*.80});
    if(i%2===0||i===7)cloudRoll(wave.clouds,x+phase*4,y-sign*r*.28,r,sign,a*.95);
    wave.clouds.moveTo(x-30,y-sign*9).bezierCurveTo(x+12,y-sign*5,x+42,y+sign*h*.3,x+sweep+20,y+sign*h*.9).stroke({color:GOLD,width:1.2,alpha:a*.8});
    if(i%2===1){const sy=y+sign*(h+10);wave.clouds.moveTo(x+12,sy-9).lineTo(x+14,sy-2).lineTo(x+19,sy).lineTo(x+14,sy+2).lineTo(x+12,sy+9).lineTo(x+10,sy+2).lineTo(x+6,sy).lineTo(x+10,sy-2).closePath().fill({color:GOLD,alpha:a*.85});}
   }
   // The leading crest shoots ahead independently of the bright central beam.
   const tip=length+12,y=sign*width*.70;
   wave.clouds.moveTo(tip-34,y).bezierCurveTo(tip+15,y+sign*20,tip+32,y-sign*18,tip+102,y+sign*35).bezierCurveTo(tip+40,y+sign*12,tip+10,y+sign*42,tip-34,y).closePath().fill({color:WHITE,alpha:a}).stroke({color:GOLD,width:1,alpha:a*.7});
  }
 }
 // Stable white-gold axis: width and center do not wobble with the rolling outer layers.
 for(const [size,color,opacity] of [[25,GOLD,.24],[14,0xf6d895,.9],[7,0xffffff,1]] as const){
  wave.axis.moveTo(7,0).lineTo(length+65,0).stroke({color,width:size,alpha:a*opacity*Math.min(1,p.coreBrightness)});
 }
 wave.axis.moveTo(length+52,-4).lineTo(length+112,0).lineTo(length+52,4).closePath().fill({color:0xffffff,alpha:a});
}
