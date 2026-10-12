import type {Graphics} from 'pixi.js';

type Point=[number,number];
/** Paint upright motifs into attack-local paper coordinates; the face mask clips everything. */
function polygon(g:Graphics,x:number,y:number,points:Point[],color:number,alpha:number){
 g.moveTo(x+points[0][1],y-points[0][0]);
 for(const [u,v] of points.slice(1))g.lineTo(x+v,y-u);
 g.closePath().fill({color,alpha});
}
function peak(g:Graphics,x:number,y:number,w:number,h:number,alpha:number){
 polygon(g,x,y,[[-w*.6,6],[-w*.34,-h*.32],[-w*.19,-h*.24],[0,-h],[w*.1,-h*.69],[w*.2,-h*.75],[w*.45,-h*.18],[w*.6,6]],0x9b3f32,alpha);
 polygon(g,x,y,[[0,-h],[w*.1,-h*.69],[w*.2,-h*.75],[w*.45,-h*.18],[w*.6,6],[w*.04,-h*.12]],0xc87553,alpha);
 polygon(g,x,y,[[-w*.34,-h*.32],[-w*.19,-h*.24],[0,-h],[-w*.04,-h*.33],[w*.04,-h*.12],[-w*.2,4]],0x65332d,alpha*.85);
 for(let i=0;i<3;i++){const u=(i-1)*w*.14,v=-h*(.25+i*.12);g.moveTo(x+v,y-u).lineTo(x+v+12,y-u+5).lineTo(x+v+24,y-u+2).stroke({color:0xe7ba68,width:.9,alpha:alpha*.65});}
}
function pagoda(g:Graphics,x:number,y:number,size:number,alpha:number){
 for(let i=0;i<3;i++){const v=-i*size*.62,w=size*(.7-i*.12);
  polygon(g,x,y,[[-w*.6,v],[-w*.6,v-size*.45],[w*.6,v-size*.45],[w*.6,v]],0x513b32,alpha);
  polygon(g,x,y,[[-w*1.3,v-size*.42],[-w*.7,v-size*.6],[0,v-size*.95],[w*.7,v-size*.6],[w*1.3,v-size*.42],[w*.9,v-size*.3],[-w*.9,v-size*.3]],0x402e2b,alpha);
  polygon(g,x,y,[[-w*1.3,v-size*.42],[-w*.7,v-size*.6],[0,v-size*.95],[w*.7,v-size*.6],[w*1.3,v-size*.42],[w*.7,v-size*.47],[0,v-size*.8],[-w*.7,v-size*.47]],0xd6a65d,alpha);
  for(const u of [-w*.32,w*.32])polygon(g,x,y,[[u-1,v-size*.12],[u-1,v-size*.3],[u+1,v-size*.3],[u+1,v-size*.12]],0xf5d799,alpha);
 }
 g.moveTo(x-size*2.25,y).lineTo(x-size*2.55,y).stroke({color:0x513b32,width:1.2,alpha});
}
export function paintShanhai(g:Graphics,length:number,width:number,bend:(x:number)=>number,alpha:number){
 const palette=[0xe8c8a3,0xdba083,0xbd725b,0x864437];
 for(let layer=0;layer<4;layer++){
  g.moveTo(0,bend(0)+width);
  for(let i=0;i<=36;i++){const x=length*i/36,base=width*(.02+layer*.10),h=i%3===1?width*(.27+Math.sin(i*1.2+layer)*.13):width*.035;g.lineTo(x,base-h+bend(x));}
  g.lineTo(length,bend(length)+width).lineTo(0,bend(0)+width).closePath().fill({color:palette[layer],alpha:alpha*(.48+layer*.09)});
 }
 for(let i=0;i<5;i++){const f=.16+i*.16,x=length*f,y=bend(x)+width*.13,w=32+f*25,h=28+f*30;peak(g,x,y,w,h,alpha*.92);if(i===1||i===3)pagoda(g,x-h*.82,y-3,10+f*5,alpha);}
 // Clear red sun and layered cloud cuts, all painted into the parchment.
 const sunX=length*.78,sunY=bend(sunX)+width*.10;
 g.circle(sunX,sunY,26).fill({color:0xc34b38,alpha:alpha*.86});
 for(let i=0;i<4;i++){const y=sunY-15+i*10;g.moveTo(sunX-35,y).bezierCurveTo(sunX-12,y-4,sunX+8,y+4,sunX+36,y).stroke({color:0xfff6df,width:3,alpha:alpha*.55});}
 // Water courses and gold flowing lines weave between the peaks.
 for(let i=0;i<5;i++){const offset=width*(.16+i*.10);g.moveTo(0,bend(0)+offset);for(let j=1;j<=12;j++){const x=length*j/12,prev=length*(j-1)/12;g.bezierCurveTo(prev+length/36,bend(prev)+offset+5,x-length/36,bend(x)+offset-5,x,bend(x)+offset);}g.stroke({color:i%2?0xe3b773:0xfff6df,width:i%2?1:2,alpha:alpha*.7});}
}
