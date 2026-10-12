import type {Graphics} from 'pixi.js';
type Knot={x:number;y:number};
const RED=0xb83b30,GOLD=0xe6ba70;

function brocadeCloud(g:Graphics,x:number,y:number,a:number){
 g.moveTo(x-5,y-11).bezierCurveTo(x-14,y-4,x-9,y+6,x-1,y+5).bezierCurveTo(x+10,y+7,x+12,y-4,x+5,y-5).bezierCurveTo(x+1,y-7,x-2,y-2,x+2,y).stroke({color:GOLD,width:1.2,alpha:a});
 g.moveTo(x-8,y+9).quadraticCurveTo(x,y+15,x+9,y+8).stroke({color:GOLD,width:.9,alpha:a});
}
function lotus(g:Graphics,x:number,y:number,a:number){
 for(let i=-1;i<=1;i++){const q=i*6;g.moveTo(x,y+5).quadraticCurveTo(x+q-4,y-3,x+q,y-10+Math.abs(i)*4).quadraticCurveTo(x+q+5,y,x,y+5).closePath().fill({color:GOLD,alpha:a});}
 g.moveTo(x-11,y+7).quadraticCurveTo(x,y+12,x+11,y+7).stroke({color:GOLD,width:1,alpha:a});
}
export function rollHead(g:Graphics,top:Knot,bottom:Knot,alpha:number,turn:number){
 const x=(top.x+bottom.x)/2,low=top.y-10,high=bottom.y+10,mid=(low+high)/2;
 // Silk knots stream behind the two brass collars, without obscuring the painting.
 for(const [y,sign] of [[low,-1],[high,1]]){
  const sway=Math.sin(turn+sign)*6;
  g.moveTo(x+8,y).bezierCurveTo(x+24,y+sign*22,x+42,y+sign*(13+sway),x+57,y+sign*27)
   .lineTo(x+43,y+sign*15).bezierCurveTo(x+29,y+sign*(8+sway),x+19,y+sign*11,x+8,y).closePath().fill({color:0x983326,alpha});
  g.moveTo(x+10,y+sign*3).bezierCurveTo(x+19,y+sign*28,x+34,y+sign*8,x+42,y+sign*20).stroke({color:GOLD,width:1.1,alpha:alpha*.8});
 }
 // A wrapped brocade sleeve: flat shaded red, double gilt piping, patterned silk.
 g.moveTo(x-18,low).bezierCurveTo(x-28,low+20,x-21,high-20,x-18,high)
 .quadraticCurveTo(x,high+13,x+19,high).bezierCurveTo(x+25,high-20,x+24,low+20,x+19,low)
 .quadraticCurveTo(x,low-13,x-18,low).closePath().fill({color:RED,alpha}).stroke({color:GOLD,width:2,alpha});
 g.moveTo(x+13,low+6).bezierCurveTo(x+19,mid,x+15,high-6,x+13,high-6).stroke({color:0x7e3028,width:7,alpha:alpha*.75});
 for(const offset of [-12,-8])g.moveTo(x+offset,low+9).bezierCurveTo(x+offset-5,mid,x+offset,high-9,x+offset,high-9).stroke({color:0xf3d396,width:offset===-12?2:1,alpha:alpha*.8});
 const span=high-low;
 if(span>90)for(let y=low+27;y<high-20;y+=34){if(Math.abs(y-mid)<23)continue;brocadeCloud(g,x+2,y,alpha*.85);}
 for(const y of [low+14,high-14]){g.moveTo(x-15,y).quadraticCurveTo(x,y+4,x+17,y).stroke({color:GOLD,width:2,alpha});g.moveTo(x-15,y+4).quadraticCurveTo(x,y+8,x+17,y+4).stroke({color:GOLD,width:.9,alpha:alpha*.7});}
 // Central fox-eye seal ties the two roll ends to the talisman vocabulary.
 g.moveTo(x-12,mid).lineTo(x,mid-12).lineTo(x+12,mid).lineTo(x,mid+12).closePath().fill({color:0x892e28,alpha}).stroke({color:GOLD,width:1.5,alpha});
 g.moveTo(x-7,mid).quadraticCurveTo(x,mid-7,x+7,mid).quadraticCurveTo(x,mid+6,x-7,mid).stroke({color:0xffe4a3,width:1.3,alpha});g.circle(x,mid,2).fill({color:GOLD,alpha});
 if(span>110){lotus(g,x,mid-23,alpha*.75);lotus(g,x,mid+25,alpha*.75);}
 // Layered metal discs, engraved petals and the visible spiral paper core.
 for(const y of [low,high]){
  g.ellipse(x,y,22,13).fill({color:0x773b2b,alpha}).stroke({color:GOLD,width:1.6,alpha});
  g.ellipse(x,y,19,11).fill({color:0xd2a256,alpha});
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;g.moveTo(x+Math.cos(a)*14,y+Math.sin(a)*8).lineTo(x+Math.cos(a+.09)*18,y+Math.sin(a+.09)*10).stroke({color:0xffe7b2,width:1.5,alpha});}
  g.ellipse(x,y,13,8).fill({color:0x4c392b,alpha}).stroke({color:0xffe7b2,width:1,alpha});
  g.moveTo(x+2,y);for(let i=0;i<=36;i++){const a=i/36*Math.PI*4+turn,r=1+i/36*10;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.55);}g.stroke({color:0xffe7b2,width:1.3,alpha});
 }
 // Braided tie, jade bead and a small gold tassel follow the motion.
 const y=high+15,sway=Math.sin(turn*.8)*5;
 g.moveTo(x+8,high+4).bezierCurveTo(x+26,y+5,x+29,y+sway,x+37,y+7).stroke({color:0x9a3028,width:2.5,alpha});
 g.circle(x+37,y+7,4).fill({color:0x729181,alpha}).stroke({color:GOLD,width:1,alpha});
 for(let i=0;i<5;i++)g.moveTo(x+41,y+5+i).quadraticCurveTo(x+49,y+7+i+sway,x+57+(i%2)*4,y+9+i+sway).stroke({color:GOLD,width:1,alpha:alpha*.85});
}

export function paperFlames(g:Graphics,edges:{top:Knot[];bottom:Knot[]},open:number,time:number,alpha:number){
 const growth=.2+.8*open;
 for(const [side,sign] of [[edges.top,-1],[edges.bottom,1]] as const){
  for(let i=0;i<18;i++){
   const f=(i+.25)/18,k=f*(side.length-1),index=Math.floor(k),u=k-index,a=side[index],b=side[Math.min(index+1,side.length-1)];
   const phase=time*17+i*2.7,x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u;
   const h=(12+growth*30)*( .7+.3*Math.sin(phase)),sweep=25+growth*36;
   g.moveTo(x-15,y+sign*2).bezierCurveTo(x+3,y+sign*h*.4,x+13,y+sign*h,x+sweep*.6,y+sign*h*.55)
    .quadraticCurveTo(x+sweep*.83,y+sign*h*.35,x+sweep,y+sign*h*1.2)
    .lineTo(x+sweep*.72,y+sign*h*.16).lineTo(x+sweep*.93,y+sign*h*.30)
    .bezierCurveTo(x+18,y+sign*4,x+6,y-sign*5,x-15,y+sign*2).closePath().fill({color:i%3?RED:0xdd5536,alpha:alpha*(.45+.45*growth)});
   if(i%2===0)g.moveTo(x,y+sign*2).quadraticCurveTo(x+15,y+sign*h*.4,x+sweep*.7,y+sign*h*.55).quadraticCurveTo(x+18,y+sign*2,x,y+sign*2).closePath().fill({color:GOLD,alpha:alpha*.7*growth});
   if(open>.45&&i%3===0){const flight=(time*3+i*.17)%1;const px=x+flight*25,py=y+sign*(h+flight*38);g.moveTo(px,py-4).lineTo(px+6,py).lineTo(px+2,py+5).lineTo(px-3,py+1).closePath().fill({color:RED,alpha:alpha*(1-flight)});}
  }
 }
}
