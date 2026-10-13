import {Container,Graphics} from 'pixi.js';

const GOLD=0xc29856,INK=0x192027,RED=0xb84034;

function blossom(g:Graphics,x:number,y:number,r:number,color=0xb84034){
 for(let j=0;j<5;j++){const a=j*Math.PI*2/5;g.ellipse(x+Math.cos(a)*r*.68,y+Math.sin(a)*r*.68,r*.55,r*.55).fill({color,alpha:.94});}
 g.circle(x,y,r*.22).fill({color:0xf7d69d});
}

function cloud(g:Graphics,x:number,y:number,s:number,alpha=.5){
 g.moveTo(x-70*s,y).bezierCurveTo(x-42*s,y-11*s,x-25*s,y+2*s,x-4*s,y-12*s).bezierCurveTo(x+21*s,y-33*s,x+44*s,y-15*s,x+35*s,y+1*s).bezierCurveTo(x+63*s,y-11*s,x+84*s,y+2*s,x+94*s,y+5*s).stroke({color:GOLD,width:1.6*s,alpha});
 g.moveTo(x-43*s,y+11*s).bezierCurveTo(x-9*s,y+1*s,x+14*s,y+15*s,x+48*s,y+8*s).stroke({color:GOLD,width:1*s,alpha:alpha*.65});
}

function mountain(g:Graphics,y:number,color:number,alpha:number,offset=0){
 g.moveTo(0,1230).lineTo(0,y+80).bezierCurveTo(80,y+28,98,y+87,155,y+42).bezierCurveTo(210,y-12,250,y+91,302,y+31).bezierCurveTo(343,y-25,390,y+76,455,y+34).bezierCurveTo(510,y-18,552,y+77,615,y+11).bezierCurveTo(652,y-18,683,y+39,720,y+7).lineTo(720,1230).closePath().fill({color,alpha});
 g.moveTo(190+offset,y+55).quadraticCurveTo(252+offset,y+3,306+offset,y+48).moveTo(470-offset,y+44).quadraticCurveTo(530-offset,y+4,588-offset,y+36).stroke({color:0xffefcf,width:1,alpha:alpha*.7});
}

function pagoda(g:Graphics,x:number,y:number,s:number,color=INK){
 g.rect(x-11*s,y-36*s,22*s,36*s).fill({color});
 g.moveTo(x-20*s,y-36*s).lineTo(x+20*s,y-36*s).lineTo(x+12*s,y-43*s).lineTo(x-13*s,y-43*s).closePath().fill({color});
 g.rect(x-7*s,y-56*s,14*s,13*s).fill({color});
 g.moveTo(x-17*s,y-56*s).lineTo(x+17*s,y-56*s).lineTo(x+9*s,y-62*s).lineTo(x-9*s,y-62*s).closePath().fill({color});
 g.moveTo(x,y-68*s).lineTo(x,y-63*s).stroke({color,width:1.5*s});
}

export function drawArchiveScenery(parent:Container){
 const g=new Graphics();parent.addChild(g);
 g.rect(0,0,720,1280).fill({color:0xf3e7cb});
 g.rect(12,157,696,1060).stroke({color:GOLD,width:1,alpha:.35});
 g.circle(382,480,175).fill({color:0xdb8a60,alpha:.12});
 mountain(g,1005,0xb9a88d,.18);mountain(g,1080,0x8d7d6b,.18,28);mountain(g,1145,0x544d49,.13,75);
 for(let i=0;i<60;i++){const x=31+(i*137%653),y=180+(i*191%995);g.circle(x,y,i%4===0?1.2:.6).fill({color:0x8d6846,alpha:i%3===0?.1:.06});}
 cloud(g,108,1030,.8,.22);cloud(g,536,1105,1.05,.24);cloud(g,85,1172,.72,.25);
 pagoda(g,605,1135,.85,0x806e63);pagoda(g,505,1175,.55,0x9c8875);
 // A small fox watches the mountain path beneath the scrolls.
 g.moveTo(50,1196).bezierCurveTo(92,1180,97,1145,137,1150).bezierCurveTo(159,1152,173,1175,153,1189).bezierCurveTo(135,1202,93,1210,50,1196).fill({color:0xc34e43,alpha:.75});
 g.moveTo(90,1167).lineTo(96,1134).lineTo(110,1148).lineTo(126,1134).lineTo(128,1163).bezierCurveTo(116,1187,103,1189,90,1167).fill({color:0xffeee0,alpha:.9});
 g.moveTo(73,1192).bezierCurveTo(27,1180,18,1145,46,1133).bezierCurveTo(29,1176,75,1160,96,1183).fill({color:0xc34e43,alpha:.7});
 g.circle(104,1163,1.5).fill({color:INK});g.circle(119,1163,1.5).fill({color:INK});
 return g;
}

export function drawArchiveHeader(parent:Container){
 const g=new Graphics();parent.addChild(g);
 g.rect(0,0,720,151).fill({color:INK});
 g.circle(555,62,48).fill({color:0xb84034,alpha:.9});
 g.circle(555,62,37).stroke({color:0xf0b767,width:1,alpha:.25});
 g.moveTo(0,133).bezierCurveTo(102,92,128,131,207,104).bezierCurveTo(295,75,347,139,440,107).bezierCurveTo(539,69,632,124,720,84).lineTo(720,151).lineTo(0,151).closePath().fill({color:0x354046,alpha:.65});
 g.moveTo(0,146).bezierCurveTo(147,106,208,155,352,124).bezierCurveTo(500,95,598,149,720,113).lineTo(720,151).lineTo(0,151).closePath().fill({color:0x111c22});
 cloud(g,167,95,.9,.58);cloud(g,468,108,.65,.4);
 g.moveTo(0,7).bezierCurveTo(86,38,149,27,218,82).moveTo(720,133).bezierCurveTo(661,75,617,80,573,120).stroke({color:0x66363a,width:5});
 for(const [x,y,r] of [[40,28,8],[74,34,11],[108,48,8],[140,53,9],[186,75,7],[643,91,9],[685,69,8],[610,115,7]])blossom(g,x,y,r,x%3===0?0xf4c9ad:RED);
 g.moveTo(0,150).lineTo(720,150).stroke({color:GOLD,width:2});
 return g;
}

function bamboo(g:Graphics,x:number,y:number,h:number){
 g.moveTo(x,y).lineTo(x+2,y-h).stroke({color:0x53574c,width:3,alpha:.65});
 for(let k=0;k<4;k++){const yy=y-h*(k+.15)/4;g.moveTo(x,yy).lineTo(x+4,yy-1).stroke({color:0x53574c,width:1.2,alpha:.7});}
 for(let k=0;k<5;k++){const yy=y-h*(k+.24)/5;g.moveTo(x+1,yy).quadraticCurveTo(x+16,yy-15,x+30,yy-10).moveTo(x+1,yy-8).quadraticCurveTo(x-15,yy-17,x-25,yy-7).stroke({color:0x4d574e,width:1,alpha:.55});}
}

/** Four different painted vector vignettes, clipped inside their scroll cards. */
export function drawChapterScene(parent:Container,x:number,y:number,w:number,h:number,index:number){
 const scene=new Container();const mask=new Graphics().roundRect(x+3,y+3,w-6,h-6,15).fill(0xffffff);parent.addChild(scene,mask);scene.mask=mask;
 const g=new Graphics();scene.addChild(g);
 const dark=index!==0;
 g.roundRect(x+2,y+2,w-4,h-4,13).fill({color:dark?0xd8ccba:0xfff4dc});
 g.rect(x+w*.52,y+12,w*.46,h-24).fill({color:index===2?0xd0b7a8:index===3?0xdbd1be:index===1?0xcfc9b8:0xf4d7b4,alpha:.35});
 const cx=x+w*.78,cy=y+57;
 if(index===0){
  g.circle(cx,cy,33).fill({color:0xc95b3e,alpha:.75});
  g.moveTo(x+w*.53,y+h-8).bezierCurveTo(cx-70,y+72,cx-35,y+h-9,cx+4,y+86).bezierCurveTo(cx+35,y+52,cx+75,y+113,x+w,y+76).lineTo(x+w,y+h).closePath().fill({color:0xd8a27f,alpha:.55});
  g.moveTo(x+w*.52,y+h).bezierCurveTo(cx-28,y+100,cx+21,y+145,x+w,y+95).lineTo(x+w,y+h).closePath().fill({color:0x745958,alpha:.5});
  pagoda(g,x+w*.88,y+124,.68,0x5c4141);
 }else if(index===1){
  g.moveTo(x+w*.5,y+h).bezierCurveTo(cx-52,y+72,cx+23,y+132,x+w,y+84).lineTo(x+w,y+h).closePath().fill({color:0x8e8b78,alpha:.34});
  for(let i=0;i<7;i++)bamboo(g,x+w*.57+i*38,y+h-4,100+i%3*21);
  pagoda(g,x+w*.77,y+142,.48,0x595b52);
 }else if(index===2){
  g.circle(cx+24,cy-4,34).fill({color:0xa53134,alpha:.75});
  g.moveTo(x+w*.5,y+h).bezierCurveTo(cx-60,y+85,cx-5,y+99,cx+36,y+64).bezierCurveTo(cx+66,y+89,x+w,y+60,x+w,y+78).lineTo(x+w,y+h).closePath().fill({color:0x59444a,alpha:.65});
  pagoda(g,cx+47,y+137,.73,0x302b31);
  for(const bx of [cx-17,cx+93])g.moveTo(bx,y+94).lineTo(bx,y+145).quadraticCurveTo(bx+10,y+126,bx+15,y+139).stroke({color:0x8e3e3d,width:2,alpha:.8});
 }else{
  g.rect(x+w*.52,y+9,w*.47,h*.62).fill({color:0x455369,alpha:.7});
  for(let i=0;i<15;i++){const sx=x+w*.54+(i*37%(w*.43)),sy=y+16+(i*29%83),r=i%4===0?3:1;g.moveTo(sx-r,sy).lineTo(sx+r,sy).moveTo(sx,sy-r).lineTo(sx,sy+r).stroke({color:0xffde9a,width:.8,alpha:.7});}
  g.circle(cx+22,cy-5,32).stroke({color:0xe5c98f,width:1.5,alpha:.65});
  g.moveTo(x+w*.53,y+h).bezierCurveTo(cx-80,y+98,cx-4,y+103,cx+27,y+86).bezierCurveTo(cx+56,y+104,x+w,y+84,x+w,y+94).lineTo(x+w,y+h).closePath().fill({color:0xd0c3ab,alpha:.85});
  pagoda(g,cx+23,y+134,.7,0x5f6571);
 }
 cloud(g,cx-64,y+122,.57,dark?.45:.6);cloud(g,cx+36,y+155,.45,.5);
 return scene;
}

export function drawScrollFrame(parent:Container,x:number,y:number,w:number,h:number,locked:boolean){
 const g=new Graphics();parent.addChild(g);
 const metal=locked?0x8e775f:0xaa6739;
 g.roundRect(x,y,w,h,14).stroke({color:metal,width:3,alpha:.9});
 g.roundRect(x+5,y+5,w-10,h-10,11).stroke({color:GOLD,width:1,alpha:locked?.5:.8});
 for(const sx of [x,x+w]){
  g.moveTo(sx,y+7).quadraticCurveTo(sx+(sx===x?-9:9),y+h/2,sx,y+h-7).stroke({color:metal,width:5,alpha:.8});
  g.circle(sx,y+12,4).fill({color:GOLD});g.circle(sx,y+h-12,4).fill({color:GOLD});
 }
 for(const [px,py,dx,dy] of [[x+14,y+14,1,1],[x+w-14,y+14,-1,1],[x+14,y+h-14,1,-1],[x+w-14,y+h-14,-1,-1]])g.moveTo(px+dx*17,py).lineTo(px,py).lineTo(px,py+dy*17).stroke({color:GOLD,width:1.5,alpha:.7});
 return g;
}

export type ArchiveSection='spells'|'enemies'|'treasures'|'achievements'|'cultivation'|'journal';

export function drawSectionBanner(parent:Container,kind:ArchiveSection,y=178){
 const g=new Graphics();parent.addChild(g);
 const x=58,w=604,h=104;
 g.roundRect(x,y,w,h,13).fill({color:kind==='enemies'?0x283137:kind==='achievements'?0x492c32:0x243038});
 g.roundRect(x+5,y+5,w-10,h-10,9).stroke({color:GOLD,width:1.2,alpha:.75});
 g.circle(x+57,y+52,34).stroke({color:GOLD,width:1.5,alpha:.75});
 g.circle(x+57,y+52,29).stroke({color:GOLD,width:.8,alpha:.45});
 const cx=x+57,cy=y+52;
 if(kind==='spells'){
  g.moveTo(cx-18,cy+16).lineTo(cx+18,cy-17).moveTo(cx-14,cy-17).lineTo(cx+17,cy+15).stroke({color:0xf0bd78,width:3});
  g.circle(cx,cy,13).stroke({color:0xb84034,width:2});
  for(const a of [0,1,2,3]){const r=a*Math.PI/2;g.moveTo(cx+Math.cos(r)*19,cy+Math.sin(r)*19).lineTo(cx+Math.cos(r)*24,cy+Math.sin(r)*24).stroke({color:GOLD,width:1.5});}
 }else if(kind==='enemies'){
  g.moveTo(cx-18,cy+17).bezierCurveTo(cx-20,cy-8,cx-10,cy-17,cx,cy-6).bezierCurveTo(cx+10,cy-17,cx+20,cy-8,cx+18,cy+17).closePath().fill({color:0x9d3b39});
  g.moveTo(cx-14,cy-8).lineTo(cx-21,cy-24).lineTo(cx-5,cy-13).moveTo(cx+14,cy-8).lineTo(cx+21,cy-24).lineTo(cx+5,cy-13).stroke({color:0xd9b380,width:2});
  g.circle(cx-7,cy+2,2).circle(cx+7,cy+2,2).fill({color:0xffd69b});
 }else if(kind==='treasures'){
  g.moveTo(cx,cy-21).lineTo(cx+17,cy-4).lineTo(cx+10,cy+19).lineTo(cx-10,cy+19).lineTo(cx-17,cy-4).closePath().stroke({color:0xf1ca88,width:2});
  g.moveTo(cx-14,cy-4).lineTo(cx+14,cy-4).moveTo(cx-9,cy+5).lineTo(cx+9,cy+5).stroke({color:0xa74f3b,width:2});
 }else if(kind==='achievements'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(cx+Math.cos(a)*17,cy+Math.sin(a)*17).lineTo(cx+Math.cos(a)*24,cy+Math.sin(a)*24).stroke({color:GOLD,width:2});}
  g.circle(cx,cy,15).fill({color:0xa73e39}).stroke({color:0xf3d9a9,width:1});
 }else if(kind==='cultivation'){
  g.circle(cx,cy,17).stroke({color:GOLD,width:2});g.moveTo(cx,cy-19).lineTo(cx,cy+19).moveTo(cx-19,cy).lineTo(cx+19,cy).stroke({color:0xe5bf86,width:1.5});
 }else{
  g.moveTo(cx-16,cy-20).lineTo(cx+15,cy-20).lineTo(cx+15,cy+20).lineTo(cx-16,cy+20).closePath().stroke({color:GOLD,width:2});
  for(let i=0;i<3;i++)g.moveTo(cx-10,cy-9+i*10).lineTo(cx+9,cy-9+i*10).stroke({color:0xe9bf80,width:1});
 }
 // Broad, quiet scene on the right side of the title strip.
 g.circle(x+w-88,y+43,31).fill({color:RED,alpha:.48});
 g.moveTo(x+340,y+h-6).bezierCurveTo(x+405,y+39,x+451,y+96,x+500,y+47).bezierCurveTo(x+544,y+17,x+571,y+72,x+w,y+40).lineTo(x+w,y+h-6).closePath().fill({color:0x56616a,alpha:.38});
 cloud(g,x+w-130,y+74,.45,.55);
 return g;
}

export function drawCardMotif(parent:Container,kind:ArchiveSection,x:number,y:number,locked=false){
 const g=new Graphics();parent.addChild(g);const color=locked?0x8c8070:RED;
 g.alpha=locked?.45:.65;
 if(kind==='spells'){
  g.circle(x,y,17).stroke({color,width:1.6}).moveTo(x-11,y+12).lineTo(x+12,y-11).stroke({color,width:2});
 }else if(kind==='enemies'){
  g.moveTo(x-17,y+12).quadraticCurveTo(x-18,y-9,x,y-14).quadraticCurveTo(x+18,y-9,x+17,y+12).closePath().stroke({color,width:2});
  g.circle(x-7,y,2).circle(x+7,y,2).fill({color});
 }else if(kind==='treasures'){
  g.moveTo(x,y-18).lineTo(x+13,y-5).lineTo(x+10,y+13).lineTo(x,y+19).lineTo(x-10,y+13).lineTo(x-13,y-5).closePath().stroke({color,width:2});
 }else if(kind==='achievements'){
  g.circle(x,y-5,12).stroke({color,width:2}).moveTo(x-9,y+7).lineTo(x-12,y+20).lineTo(x,y+14).lineTo(x+12,y+20).lineTo(x+9,y+7).stroke({color,width:2});
 }else{
  g.moveTo(x-14,y-14).lineTo(x+12,y-14).lineTo(x+12,y+16).lineTo(x-14,y+16).closePath().stroke({color,width:2});
 }
 return g;
}

export function drawDetailEmblem(parent:Container,kind:'spell'|'enemy'|'treasure',x:number,y:number,active:boolean){
 const g=new Graphics();parent.addChild(g);
 const color=active?RED:0x8f8170;g.alpha=.2;
 g.circle(x,y,81).stroke({color:GOLD,width:2});g.circle(x,y,65).stroke({color:GOLD,width:1});
 for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(x+Math.cos(a)*69,y+Math.sin(a)*69).lineTo(x+Math.cos(a)*78,y+Math.sin(a)*78).stroke({color:GOLD,width:2});}
 if(kind==='spell'){
  g.moveTo(x-37,y+38).lineTo(x+36,y-37).moveTo(x-22,y-42).lineTo(x+24,y+36).stroke({color,width:7});
  g.circle(x,y,31).stroke({color,width:3});
 }else if(kind==='enemy'){
  g.moveTo(x-41,y+39).bezierCurveTo(x-51,y-12,x-20,y-48,x,y-27).bezierCurveTo(x+20,y-48,x+51,y-12,x+41,y+39).closePath().fill({color});
  g.moveTo(x-30,y-30).lineTo(x-44,y-59).lineTo(x-7,y-39).moveTo(x+30,y-30).lineTo(x+44,y-59).lineTo(x+7,y-39).stroke({color,width:5});
 }else{
  g.moveTo(x,y-55).lineTo(x+37,y-17).lineTo(x+25,y+42).lineTo(x,y+55).lineTo(x-25,y+42).lineTo(x-37,y-17).closePath().stroke({color,width:6});
  g.moveTo(x-28,y-12).lineTo(x+28,y-12).moveTo(x-21,y+13).lineTo(x+21,y+13).stroke({color,width:4});
 }
 return g;
}

export function drawJournalFrame(parent:Container){
 const g=new Graphics();parent.addChild(g);
 g.moveTo(360,335).lineTo(360,682).stroke({color:GOLD,width:1,alpha:.35});
 for(let row=0;row<3;row++){
  const y=397+row*87;g.moveTo(88,y).lineTo(632,y).stroke({color:GOLD,width:1,alpha:.32});
  g.moveTo(360,y-4).lineTo(364,y).lineTo(360,y+4).lineTo(356,y).closePath().fill({color:GOLD,alpha:.45});
 }
 return g;
}

export function drawChapterDetail(parent:Container,x:number,y:number,w:number,h:number,index:number){
 const scene=new Container(),mask=new Graphics().roundRect(x,y,w,h,12).fill(0xffffff);parent.addChild(scene,mask);scene.mask=mask;
 const g=new Graphics();scene.addChild(g);
 g.roundRect(x,y,w,h,12).fill({color:index===2?0xe1d1c7:index===3?0xe6e0d3:0xf5e9d0});
 const sunX=x+w*.72,sunY=y+105;
 if(index===0||index===2){
  g.circle(sunX,sunY,index===2?67:75).fill({color:index===2?0xa4393c:0xd86b4c,alpha:.7});
  g.circle(sunX,sunY,index===2?57:65).stroke({color:0xf3d29c,width:1,alpha:.45});
 }else if(index===3){
  g.rect(x,y,w,h*.55).fill({color:0x45566a,alpha:.82});
  g.circle(sunX,sunY,68).stroke({color:0xe5ce9b,width:2,alpha:.7});
  for(let i=0;i<27;i++){const sx=x+18+i*73%(w-36),sy=y+20+i*43%(h*.5-30),r=i%5===0?4:1.3;g.moveTo(sx-r,sy).lineTo(sx+r,sy).moveTo(sx,sy-r).lineTo(sx,sy+r).stroke({color:0xf5dca7,width:1,alpha:.7});}
 }
 g.moveTo(x,y+h).lineTo(x,y+h*.65).bezierCurveTo(x+90,y+h*.25,x+135,y+h*.73,x+205,y+h*.44).bezierCurveTo(x+280,y+h*.16,x+335,y+h*.67,x+420,y+h*.35).bezierCurveTo(x+480,y+h*.12,x+525,y+h*.5,x+w,y+h*.3).lineTo(x+w,y+h).closePath().fill({color:index===2?0x78616a:index===3?0x8e9a9d:0xc9aa90,alpha:.55});
 g.moveTo(x,y+h).lineTo(x,y+h*.79).bezierCurveTo(x+100,y+h*.56,x+160,y+h*.91,x+270,y+h*.62).bezierCurveTo(x+390,y+h*.45,x+450,y+h*.92,x+w,y+h*.68).lineTo(x+w,y+h).closePath().fill({color:index===2?0x493d43:index===3?0x65727c:0x7a6861,alpha:.62});
 if(index===1){
  for(let i=0;i<12;i++)bamboo(g,x+25+i*48,y+h+8,145+i%4*30);
  pagoda(g,x+w*.73,y+h*.69,1.25,0x555b53);
 }else{
  pagoda(g,x+w*.76,y+h*.68,1.35,index===2?0x302e33:index===3?0x48586a:0x554245);
  pagoda(g,x+w*.88,y+h*.78,.7,index===2?0x42363b:0x655a53);
 }
 cloud(g,x+125,y+h*.77,1.1,.7);cloud(g,x+w*.67,y+h*.91,.95,.7);
 parent.addChild(new Graphics().roundRect(x,y,w,h,12).stroke({color:GOLD,width:1.5,alpha:.65}));
}
