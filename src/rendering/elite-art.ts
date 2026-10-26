import {Graphics} from 'pixi.js';
import type {Enemy} from '../core/types';
import {ELITE_CATALOG} from '../gameplay/elite-catalog';
import {eliteParts,type ElitePart} from '../gameplay/hualing-elites';
const INK=0x24382f,BONE=0xe9d9b4,GOLD=0xc9a56b,RED=0xa74d39;
function poly(g:Graphics,p:number[],color:number){g.poly(p).fill(color).stroke({color:INK,width:2,join:'round'});}
function line(g:Graphics,p:number[],color=GOLD,width=2){g.poly(p,false).stroke({color,width,cap:'round',join:'round'});}
function diamond(g:Graphics,x:number,y:number,r:number,c=GOLD){poly(g,[x,y-r,x+r*.65,y,x,y+r,x-r*.65,y],c);}
function eye(g:Graphics,x:number,y:number,side=1){poly(g,[x-9,y-3,x+9,y-5,x+5,y+4,x-5,y+4],BONE);g.ellipse(x+side*2,y,2,4).fill(INK);}
function mask(g:Graphics,x:number,y:number,size=1){
 g.save().transform(size,0,0,size,x,y);g.ellipse(0,0,25,24).fill(BONE);
 for(const side of [-1,1]){g.poly([side*3,-6,side*20,-15,side*19,-1,side*9,4]).fill(INK);line(g,[side*8,-1,side*16,-4],GOLD,2);}
 diamond(g,0,-14,5,RED);g.moveTo(-7,13).quadraticCurveTo(0,8,7,13).stroke({color:INK,width:2});g.restore();
}
function hems(g:Graphics,c:number,width=48,y=5){for(let i=-3;i<=3;i++){const x=i*width/3;poly(g,[x-12,y,x+12,y-3,x+18,y+60+Math.abs(i)*2,x+5,y+48,x-5,y+77-Math.abs(i)*5,x-17,y+56],i%2?c:INK);line(g,[x,y+8,x+5,y+48],GOLD,.8);}}
function carving(g:Graphics,x:number,y:number,n=3,c=BONE){for(let i=0;i<n;i++){diamond(g,x+(i%2)*3,y+i*10,3,c);}}
function antler(g:Graphics,x:number,y:number,side:number,c=BONE){line(g,[x,y,x+side*11,y-20,x+side*8,y-42,x+side*25,y-57],c,4);line(g,[x+side*11,y-20,x+side*31,y-33,x+side*35,y-49],c,3);line(g,[x+side*8,y-42,x-side*2,y-57],c,2);}
function ape(g:Graphics,c:number,frost=false){
 for(const side of [-1,1]){poly(g,[side*32,-42,side*69,-27,side*92,30,side*85,63,side*61,65,side*59,30,side*38,10],c);poly(g,[side*19,30,side*42,41,side*46,78,side*21,80,side*9,57],c);line(g,[side*66,43,side*73,57,side*84,57],BONE,2);carving(g,side*65,-5,4);}
 poly(g,[-48,-51,-15,-68,24,-62,51,-36,44,41,0,57,-42,36],c);poly(g,[-26,-53,-24,-84,-4,-95,24,-82,31,-51,15,-32,-13,-33],INK);mask(g,0,-60,.85);poly(g,[-17,-98,-6,-84,7,-86,19,-97,15,-72,-17,-72],c);
 for(const side of [-1,1])poly(g,[side*14,-52,side*25,-43,side*17,-37],BONE);
 if(frost){for(const side of [-1,1]){poly(g,[side*34,-48,side*60,-51,side*76,-29,side*49,-13],BONE);poly(g,[side*12,22,side*35,13,side*45,35,side*24,48],0x9aafa2);}}
 else for(let i=-1;i<=1;i++)line(g,[i*10,-12,i*15,20],BONE,2);
}
function deer(g:Graphics,x:number,y:number,scale:number,c:number){g.save().transform(scale,0,0,scale,x,y);poly(g,[-43,-12,-20,-28,24,-22,38,-9,28,17,-24,21,-44,6],c);for(const side of [-1,1]){line(g,[side*26,12,side*30,42,side*19,66],INK,7);line(g,[side*26,12,side*30,42,side*19,66],BONE,3);}poly(g,[18,-10,24,-52,38,-71,54,-63,45,-41,38,7],c);eye(g,43,-56,-1);antler(g,34,-68,-1);antler(g,42,-68,1);carving(g,-15,-10,3,GOLD);g.restore();}
function ray(g:Graphics,x:number,y:number,c:number,t:number){g.save().transform(1,0,0,1,x,y);poly(g,[0,-29,31,-19,63,-37,48,12,20,27,0,21,-20,27,-48,12,-63,-37,-31,-19],c);line(g,[0,18,10,43,4+Math.sin(t*2)*8,65],GOLD,2);for(const side of [-1,1]){line(g,[side*9,-13,side*28,-4,side*42,-17],GOLD,1.3);eye(g,side*12,-9,-side);}diamond(g,0,4,7,BONE);g.restore();}
export function drawEliteArt(g:Graphics,e:Enemy){
 const s=e.elite!,t=s.clock,chapter=ELITE_CATALOG[s.kind].chapter;
 const c=chapter==='sea'?0x3c7773:chapter==='palace'?0x55546c:chapter==='snow'?0x778b80:RED;
 const open=s.phase==='stagger',wind=s.phase==='windup',recover=s.phase==='recover';
 switch(s.kind){
 case 'umbrella':
  hems(g,RED,36,15);mask(g,0,-2,1.45);
  g.moveTo(-97,-34).quadraticCurveTo(-57,-91,0,-103).quadraticCurveTo(57,-91,97,-34).quadraticCurveTo(0,-55,-97,-34).fill(RED).stroke({color:GOLD,width:2});
  for(const side of [-1,1]){line(g,[0,-101,side*56,-43],GOLD,2);line(g,[side*85,-36,side*85,-5],GOLD,2);g.roundRect(side*85-7,-7,14,25,2).fill(RED);}diamond(g,0,-77,10,BONE);break;
 case 'lantern':
  g.ellipse(0,-2,69,70).fill(RED);g.ellipse(-25,-3,26,64).stroke({color:0x823638,width:2});g.ellipse(25,-3,26,64).stroke({color:0x823638,width:2});
  for(const side of [-1,1]){line(g,[side*36,-59,side*48,-85,side*45,-107],GOLD,7);line(g,[side*46,-83,side*63,-90],BONE,5);g.roundRect(side*27-9,60,18,19,3).fill(INK);}mask(g,0,0,1.8);g.roundRect(-36,-66,72,9,3).fill(INK);g.roundRect(-30,61,60,9,2).fill(INK);line(g,[0,65,0,86],GOLD,8);break;
 case 'puppet':
  hems(g,RED,44);poly(g,[-22,-46,0,-58,22,-46,27,11,-27,11],INK);mask(g,0,-64,.8);poly(g,[-32,-82,-18,-102,0,-89,18,-102,32,-82],GOLD);for(const side of [-1,1]){line(g,[side*12,-36,side*52,-49,side*87,-32],BONE,5);poly(g,[side*46,-47,side*68,-46,side*75,17,side*56,3],RED);carving(g,side*59,-30,3);}
  for(const p of eliteParts(e))if(!p.broken){const x=p.x-e.x,y=p.y-e.y;line(g,[-87,-32,x,y,87,-32],RED,1.7);poly(g,[x-10,y+3,x+11,y+3,x+9,y+34,x-8,y+31],BONE);carving(g,x,y+12,2,RED);}break;
 case 'stele':
  ape(g,0x655749);if(!open){g.save().transform(.99,-.16,.16,.99,0,-30);poly(g,[-46,-92,-32,-119,36,-119,50,-93,45,31,-46,31],0x687266);g.roundRect(-34,-99,68,102,5).stroke({color:BONE,width:2});for(let i=0;i<5;i++)line(g,[-19,-80+i*16,18,-80+i*16],GOLD,2);g.restore();}break;
 case 'moth':
  for(const side of [-1,1]){const flap=Math.sin(t*4)*5;poly(g,[side*6,-42,side*63,-91,side*108,-71+flap,side*91,-9,side*39,17,side*92,38,side*65,78,side*12,39],INK);poly(g,[side*25,-38,side*72,-70,side*87,-56,side*68,-17,side*29,3],RED);g.ellipse(side*64,-38,17,23).fill(GOLD).stroke({color:BONE,width:2});g.ellipse(side*64,-38,10,15).fill(INK);g.circle(side*62,-42,4).fill(BONE);carving(g,side*46,25,4,GOLD);for(let i=0;i<6;i++)diamond(g,side*(45+i*9),-65+i*7,2,BONE);line(g,[side*5,-52,side*28,-80,side*40,-74],GOLD,2);}
  g.ellipse(0,7,15,52).fill(open?BONE:0x83917a).stroke({color:INK,width:3});for(let i=0;i<5;i++)line(g,[-10,-15+i*14,10,-15+i*14],INK,2);mask(g,0,-45,.55);break;
 case 'reefCrab':
  for(const side of [-1,1]){for(let i=0;i<3;i++)line(g,[side*32,i*15,side*(74+i*5),i*16-8,side*99,i*17+17],INK,6);poly(g,[side*37,-19,side*68,-48,side*96,-40,side*105,-64,side*87,-72,side*72,-57,side*79,-88,side*108,-84,side*119,-55,side*102,-9,side*66,3],c);carving(g,side*89,-63,2);}
  poly(g,[-63,-27,-35,-54,0,-65,39,-50,65,-25,54,35,0,56,-54,35],open?BONE:c);for(const side of [-1,1]){antler(g,side*29,-50,side,RED);line(g,[side*19,-41,side*26,-58],BONE,4);eye(g,side*26,-60,-side);}for(let i=-1;i<=1;i++)line(g,[i*22,-10,i*24+10,19,i*20,35],GOLD,1.5);break;
 case 'jelly':
  for(let i=-3;i<=3;i++){const x=i*22;g.moveTo(x,-3).bezierCurveTo(x+Math.sin(t*2+i)*25,40,x-25,77,x+Math.sin(t+i)*17,98).stroke({color:i%2?BONE:c,width:i%2?4:7});}
  g.moveTo(-82,-15).bezierCurveTo(-75,-119,75,-119,82,-15).quadraticCurveTo(0,15,-82,-15).fill(c).stroke({color:INK,width:3});g.moveTo(-65,-25).bezierCurveTo(-48,-85,48,-85,65,-25).stroke({color:BONE,width:3});for(let i=-2;i<=2;i++)carving(g,i*20,-48,2);g.ellipse(0,-24,16,22).fill(open?BONE:GOLD);break;
 case 'clam':
  for(const side of [-1,1]){g.save().transform(side,0,0,1,side*9,0);poly(g,[0,40,12,-58,49,-87,83,-65,103,-22,84,30,43,61],c);for(let i=0;i<5;i++){const a=-1.4+i*.37;line(g,[7,32,35+Math.cos(a)*56,-11+Math.sin(a)*58],BONE,2);}g.restore();}
  if(wind||open){g.ellipse(0,16,43,38).fill(INK);g.circle(0,9,22).fill(BONE).stroke({color:GOLD,width:3});g.circle(-7,2,5).fill(0xffefcd);}mask(g,0,-16,.5);break;
 case 'hermit':
  for(const side of [-1,1]){line(g,[side*20,24,side*64,42,side*79,72],INK,7);line(g,[side*22,33,side*49,63,side*49,82],c,6);}
  poly(g,[-85,-8,-51,30,54,31,88,-12,31,1,-35,-4],0x6a5743);line(g,[-58,5,52,13],GOLD,2);line(g,[0,-2,0,-103],INK,5);poly(g,[5,-100,61,-85,57,-47,44,-55,29,-38,5,-44],c);for(let i=0;i<4;i++)line(g,[8,-86+i*12,53,-76+i*9],GOLD,1);poly(g,[-7,-88,-49,-75,-53,-43,-30,-49,-12,-27],BONE);mask(g,0,39,.7);break;
 case 'rays':ray(g,-64,-15,BONE,t);ray(g,62,12,c,t+1);g.moveTo(-62,18).quadraticCurveTo(0,80,62,39).stroke({color:GOLD,width:2});break;
 case 'mirror':
  hems(g,c,35,10);poly(g,[-41,-39,0,-57,41,-39,28,29,0,43,-28,29],BONE);for(const side of [-1,1]){poly(g,[side*26,-38,side*52,-33,side*60,1,side*36,6],c);carving(g,side*40,-26,3);line(g,[side*15,35,side*20,75,side*33,82],BONE,6);}mask(g,0,-62,.75);poly(g,[-26,-83,0,-111,26,-83,9,-88,0,-94,-9,-88],GOLD);diamond(g,0,-8,15,c);break;
 case 'weaver':
  hems(g,c,50);mask(g,0,-65,.7);g.ellipse(0,-87,29,13).fill(INK);diamond(g,0,-93,10,GOLD);for(const side of [-1,1]){g.moveTo(side*13,-40).quadraticCurveTo(side*100,-29,side*90,36).quadraticCurveTo(side*46,14,side*31,2).fill(c).stroke({color:INK,width:2});line(g,[side*20,-35,side*69,-22],BONE,4);for(let i=0;i<4;i++)line(g,[side*18,-21+i*14,side*75,29-i*12],GOLD,.9);}carving(g,-3,-29,5);break;
 case 'bell':
  line(g,[-57,-96,0,-113,57,-96],GOLD,3);g.moveTo(-48,-75).quadraticCurveTo(0,-112,48,-75).lineTo(57,22).lineTo(76,38).quadraticCurveTo(0,65,-76,38).lineTo(-57,22).closePath().fill(c).stroke({color:INK,width:3});g.ellipse(0,35,65,17).fill(INK).stroke({color:GOLD,width:3});for(let i=-2;i<=2;i++){carving(g,i*18,-52,5);line(g,[i*19,-60,i*22,15],GOLD,.8);}mask(g,0,-15,.65);line(g,[-45,-71,45,-71],BONE,3);break;
 case 'official':
  hems(g,c,58);poly(g,[-29,-48,29,-48,44,33,-44,33],c);mask(g,0,-72,.8);poly(g,[-48,-94,-20,-94,-20,-112,20,-112,20,-94,48,-94,48,-84,-48,-84],INK);for(const side of [-1,1]){poly(g,[side*24,-38,side*66,-21,side*54,25,side*19,9],c);carving(g,side*42,-16,3);}poly(g,[-34,-9,34,-9,41,24,-41,24],0x6d8d78);g.roundRect(-31,-4,62,22,2).stroke({color:GOLD,width:2});diamond(g,0,-10,18,GOLD);break;
 case 'blade':
  hems(g,c,39);mask(g,0,-68,.75);poly(g,[-30,-81,-13,-101,0,-92,19,-103,34,-78,19,-84,-17,-80],INK);for(const side of [-1,1]){line(g,[side*16,-38,side*43,-18,side*70,-43],BONE,4);g.moveTo(side*27,-30).quadraticCurveTo(side*110,-78,side*89,15).quadraticCurveTo(side*72,50,side*101,74).stroke({color:c,width:9});}carving(g,-2,-30,5);break;
 case 'frostApe':ape(g,c,true);break;
 case 'crone':
  hems(g,c,42,0);poly(g,[-46,18,-30,-53,0,-110,30,-53,46,18,18,-3,0,-65,-18,-3],c);mask(g,0,-36,.65);line(g,[35,-10,59,-32,81,-22,81,79],INK,5);poly(g,[69,-4,92,-4,98,23,81,34,64,23],GOLD);g.ellipse(81,12,8,15).fill(BONE);carving(g,-26,2,4);break;
 case 'pineApe':
  ape(g,c);line(g,[-78,58,21,-101],INK,12);line(g,[-78,58,21,-101],0x705e45,6);for(let i=0;i<4;i++){const x=-40+i*18,y=10-i*29;for(const side of [-1,1])poly(g,[x,y-23,x+side*(48-i*5),y+4,x+side*7,y+3,x+side*25,y+20,x,y+8],INK);}break;
 case 'deer':deer(g,48,-25,.76,c);deer(g,-30,14,1.05,BONE);if(!open)poly(g,[-63,-3,-43,-13,-12,-1,-28,31,-51,26],c);break;
 case 'guardian':
  poly(g,[-102,39,-97,-6,-62,-60,-9,-80,46,-62,86,-23,106,33,77,65,-72,69],INK);for(let row=0;row<3;row++)for(let i=0;i<5;i++){const x=-74+i*37+(row%2)*12,y=-28+row*29-Math.sin((i+1)/6*Math.PI)*30;poly(g,[x-18,y+9,x-15,y-13,x,y-25,x+20,y-12,x+24,y+12,x+4,y+25],(row+i)%2?c:BONE);line(g,[x-7,y-8,x+4,y+8,x+13,y-4],GOLD,1.3);}mask(g,70,29,.9);for(const side of [-1,1])poly(g,[side*56,49,side*83,56,side*94,80,side*44,80],BONE);if(open)diamond(g,0,0,27,GOLD);break;
 }
 if(open){g.ellipse(0,1,13,23).fill({color:GOLD,alpha:.6});diamond(g,0,0,9,BONE);}
}
export function drawElitePart(g:Graphics,p:ElitePart,e:Enemy){
 const s=e.elite!,x=p.x-e.x,y=p.y-e.y;if(p.broken)return;
 const c=p.active?GOLD:0x61766b;
 g.save().transform(1,0,0,1,x,y);
 if(p.shape==='moth'){for(const side of [-1,1])poly(g,[0,-4,side*19,-14,side*15,7,side*4,10],RED);g.ellipse(0,0,3,11).fill(BONE);}
 else if(p.shape==='pearl'||p.shape==='snow'){g.circle(0,0,p.shape==='pearl'?12:17).fill(BONE).stroke({color:c,width:2});g.circle(-4,-4,4).fill(0xfff0ce);}
 else if(p.shape==='sail'){poly(g,[-17,8,18,8,10,19,-10,18],INK);line(g,[0,8,0,-27],BONE,2);poly(g,[3,-27,19,-19,15,3,3,0],c);}
 else if(p.shape==='mirror'){g.ellipse(0,0,19,26).fill(INK).stroke({color:c,width:4});g.ellipse(0,0,12,19).fill(0x9caa9b);line(g,[-7,-9,7,5],BONE,2);}
 else if(p.shape==='shuttle')poly(g,[-24,0,0,-10,24,0,0,10],c);
 else if(p.shape==='clapper'){line(g,[-x,-62-y,0,0],BONE,3);g.circle(0,0,12).fill(c).stroke({color:INK,width:2});}
 else if(p.shape==='blade'){g.moveTo(-21,-21).quadraticCurveTo(35,-19,12,24).quadraticCurveTo(21,0,-21,-21).fill(BONE).stroke({color:c,width:2});}
 else if(p.shape==='lamp'){poly(g,[-12,-18,12,-18,17,9,0,22,-17,9],INK);poly(g,[0,-13,9,6,0,14,-9,6],c);line(g,[-9,-23,0,-30,9,-23],c,2);}
 else if(p.shape==='seal'){g.roundRect(-16,-16,32,32,2).stroke({color:RED,width:2});line(g,[-10,-8,3,-8,3,3,10,3,10,11],c,3);}
 else if(p.shape==='stone'||p.shape==='ice'){diamond(g,0,0,10,c);line(g,[-4,-3,0,2,5,-3],BONE,1.5);}
 else if(p.shape==='crack')line(g,[-12,-20,4,-7,-4,3,13,19],c,4);
 else if(p.shape==='antler'){antler(g,0,13,1,c);}
 else if(p.shape==='ray'){diamond(g,0,0,10,p.active?GOLD:INK);}
 else{g.circle(0,0,8).stroke({color:c,width:3});diamond(g,0,0,5,BONE);}
 if(p.active){const pulse=Math.sin(s.clock*7+p.index)*2;g.circle(0,0,p.radius+6+pulse).stroke({color:BONE,width:1.2,alpha:.65});for(const side of [-1,1])line(g,[side*(p.radius+10),-4,side*(p.radius+6),0,side*(p.radius+10),4],c,1.5);}
 g.restore();
}
