import {Container,Graphics} from 'pixi.js';
import type {Hualing} from '../gameplay/hualing';
import type {GameViewport} from '../platform/viewport';

type Palette={sky:number;horizon:number;far:number;middle:number;near:number;facet:number;ink:number;floor:number;stone:number;line:number;water:number;paper:number;leaf:number};
const PALETTES:Palette[]=[
 {sky:0xf4dfb6,horizon:0xf2b67a,far:0xcf8a70,middle:0xa95845,near:0x683f39,facet:0x8e5040,ink:0x293535,floor:0x303a39,stone:0x48504a,line:0xc3a777,water:0xeabf7d,paper:0xffe9b9,leaf:0xb63329},
 {sky:0xb6c2b8,horizon:0xe1c9a3,far:0x8baba0,middle:0x5a7976,near:0x344e50,facet:0x486361,ink:0x23383c,floor:0x293a3d,stone:0x405451,line:0x9ba78d,water:0xc5d0b0,paper:0xe4e4c8,leaf:0xb94730},
 {sky:0x102539,horizon:0x3c6069,far:0x365a6b,middle:0x294958,near:0x1b3341,facet:0x294654,ink:0x142731,floor:0x203039,stone:0x30444c,line:0x79938c,water:0xb8d9cd,paper:0xdde8d4,leaf:0x8b302e},
];
const GOLD=0xe3b972,RED=0xb83a2b;
const random=(i:number)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
const mix=(a:number,b:number,t:number)=>{let result=0;for(const shift of [16,8,0])result|=Math.round((a>>shift&255)*(1-t)+(b>>shift&255)*t)<<shift;return result;};
function leaf(g:Graphics,x:number,y:number,size:number,angle:number,color:number,alpha=1){
 const c=Math.cos(angle)*size,s=Math.sin(angle)*size;g.save().transform(c,s,-s,c,x,y).poly([0,-14,3,-5,9,-10,8,-2,14,-2,6,4,9,9,2,8,0,15,-2,8,-9,9,-6,4,-14,-2,-8,-2,-9,-10,-3,-5]).fill({color,alpha}).moveTo(0,-7).lineTo(0,16).stroke({color:0xf0bd75,width:.7,alpha:alpha*.4}).restore();
}
function pine(g:Graphics,x:number,y:number,size:number,color:number){
 g.save().transform(size,0,0,size,x,y).poly([0,-37,-9,-23,-4,-23,-17,-10,-8,-11,-23,3,-7,1,-7,8,0,5,7,8,7,1,23,3,8,-11,17,-10,4,-23,9,-23]).fill(color).rect(-2,0,4,15).fill(color).restore();
}
function cloud(g:Graphics,x:number,y:number,size:number,color:number,alpha:number){
 g.save().transform(size,0,0,size,x,y);
 g.moveTo(-100,10).quadraticCurveTo(-72,3,-57,7).bezierCurveTo(-75,-19,-44,-35,-32,-18).bezierCurveTo(-30,-45,7,-42,12,-19).bezierCurveTo(42,-38,67,-15,48,1).quadraticCurveTo(77,-3,95,10).lineTo(-100,10).fill({color,alpha});
 g.moveTo(-94,10).lineTo(104,10).moveTo(-53,1).bezierCurveTo(-72,-13,-47,-28,-40,-13).bezierCurveTo(-34,-4,-47,1,-51,-6).moveTo(-25,-13).bezierCurveTo(-25,-35,7,-31,2,-14).bezierCurveTo(-2,-5,-17,-11,-11,-17).moveTo(20,-7).bezierCurveTo(25,-25,54,-17,40,-4).lineTo(22,1).stroke({color,alpha:alpha*1.8,width:1.4});g.restore();
}
function pagoda(g:Graphics,x:number,y:number,size:number,p:Palette){
 g.save().transform(size,0,0,size,x,y);
 for(let i=0;i<4;i++){
  const yy=-i*26,w=51-i*8;
  g.rect(-w/2,yy-25,w,24).fill(p.ink).stroke({color:p.line,width:1,alpha:.4});
  g.moveTo(-w*.78,yy-21).quadraticCurveTo(-w*.37,yy-19,0,yy-35).quadraticCurveTo(w*.37,yy-19,w*.78,yy-21).lineTo(w*.64,yy-16).quadraticCurveTo(0,yy-17,-w*.64,yy-16).closePath().fill(p.ink).stroke({color:p.line,width:1,alpha:.7});
  for(const dx of [-.28,0,.28])g.rect(w*dx-2,yy-13,4,8).fill({color:p.paper,alpha:.2});
  g.moveTo(-w*.6,yy-15).quadraticCurveTo(0,yy-11,w*.6,yy-15).stroke({color:p.line,width:.8,alpha:.55});
 }
 g.moveTo(0,-113).lineTo(0,-133).stroke({color:p.line,width:2});g.circle(0,-121,3).fill(p.line);
 g.rect(-32,1,64,6).fill(p.stone).rect(-38,7,76,5).fill(p.ink);g.restore();
}
function gate(g:Graphics,x:number,y:number,size:number,p:Palette){
 g.save().transform(size,0,0,size,x,y);
 g.poly([-54,5,-43,-100,-31,-99,-38,5]).fill(RED).stroke({color:p.line,width:1});g.poly([38,5,31,-99,43,-100,54,5]).fill(RED).stroke({color:p.line,width:1});
 g.rect(-55,-91,110,10).fill(RED);g.rect(-56,-112,112,8).fill(p.ink);
 g.moveTo(-70,-122).quadraticCurveTo(-36,-104,0,-121).quadraticCurveTo(36,-104,70,-122).lineTo(60,-104).quadraticCurveTo(0,-96,-60,-104).closePath().fill(p.ink).stroke({color:p.line,width:1.6});
 g.moveTo(-54,-98).lineTo(54,-98).stroke({color:p.paper,width:1,alpha:.55});
 for(const dx of [-21,0,21])g.poly([dx-2,-80,dx+3,-80,dx+6,-57,dx,-49,dx+4,-39,dx-2,-37]).fill(p.paper);
 g.roundRect(-11,-100,22,18,1).fill(p.ink).stroke({color:p.line,width:1});g.moveTo(-5,-95).lineTo(5,-95).moveTo(-5,-90).lineTo(5,-90).stroke({color:p.line,width:1});
 for(let i=0;i<4;i++)g.rect(-65-i*5,8+i*7,130+i*10,6).fill(i%2?p.ink:p.stone);g.restore();
}
function ridge(g:Graphics,points:number[],bottom:number,color:number,facet:number,line:number,seed:number){
 g.poly([...points,points.at(-2)!,bottom,points[0],bottom]).fill(color);
 g.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)g.lineTo(points[i],points[i+1]);g.stroke({color:line,width:1.2,alpha:.38});
 for(let i=2;i<points.length-2;i+=2){const x=points[i],y=points[i+1],nextX=points[i+2],nextY=points[i+3];
  if(y<points[i-1]&&y<nextY){const endY=Math.min(bottom,y+120+random(seed+i)*170),xx=x+(nextX-x)*.65;
   g.poly([x,y,xx,endY,x-12,endY-20]).fill({color:facet,alpha:.75});
   g.moveTo(x,y+4).lineTo(x+4,y+29).lineTo(x-6,y+49).lineTo(x+8,y+68).lineTo(x+2,y+93).stroke({color:line,width:.8,alpha:.28});
   for(let k=0;k<3;k++){
    const dx=9+k*9,yy=y+35+k*14;
    g.moveTo(x+dx,yy).lineTo(x+dx-3,yy+18).lineTo(x+dx+5,yy+33).lineTo(x+dx+1,yy+49).lineTo(x+dx+10,yy+71).stroke({color:line,width:.7,alpha:.18});
    g.moveTo(x+dx-5,yy+35).lineTo(x+dx+8,yy+35).stroke({color:line,width:1,alpha:.24});
   }
  }
 }
 // Dry-brush fractures are clipped analytically to this ridge's silhouette before caching.
 for(let i=0;i<125;i++){
  const x=points[0]+random(i+seed*91)*(points.at(-2)!-points[0]);let top=bottom;
  for(let j=2;j<points.length;j+=2)if(x>=points[j-2]&&x<=points[j]){const t=(x-points[j-2])/(points[j]-points[j-2]);top=points[j-1]+(points[j+1]-points[j-1])*t;break;}
  if(bottom-top<25)continue;const y=top+10+random(i+seed*313)*(bottom-top-20),length=Math.min(5+random(i+72)*16,bottom-y-2);
  g.moveTo(x,y).lineTo(x+1,y+length*.5).lineTo(x-2,y+length).stroke({color:i%4?line:facet,width:i%7===0?1.5:.65,alpha:i%4?.13:.55});
 }
}
function terrain(g:Graphics,p:Palette){
 ridge(g,[-40,340,25,259,76,321,122,240,179,343,238,307,293,379,348,355,403,392,459,305,505,338,557,245,613,288,666,218,760,337],647,p.far,p.middle,p.paper,1);
 ridge(g,[-35,467,30,365,82,407,133,315,195,438,245,398,302,499,349,445,401,487,458,397,511,428,570,315,638,356,695,300,752,442],657,p.middle,p.near,p.paper,2);
 ridge(g,[-50,603,8,389,61,436,111,343,177,480,228,436,288,577,330,602],685,p.near,p.facet,p.line,3);
 ridge(g,[399,618,442,506,486,543,552,378,601,429,655,297,737,464,770,619],685,p.near,p.facet,p.line,4);
 // Carved rock faces: sparse long fractures, horizontal ledges and attached shrubs.
 for(let side=0;side<2;side++)for(let i=0;i<16;i++){
  const x=side?520+random(30+i)*170:random(50+i)*195,y=400+random(90+i)*190;
  g.moveTo(x,y).lineTo(x-5,y+20).lineTo(x+7,y+31).lineTo(x+2,y+47).stroke({color:p.line,width:.8,alpha:.19});
  if(i%3===0)g.moveTo(x-8,y+48).lineTo(x+17,y+48).stroke({color:p.line,width:1,alpha:.32});
 }
 // A continuous paper ribbon, not a texture, follows the same valley in every phase.
 const leftBank:number[]=[];for(let y=418;y<=655;y+=5){const x=360+Math.sin((y-418)*.043)*(5+(y-418)*.13),w=2+(y-418)*.105;leftBank.push(x-w,y);}
 // Build the right bank explicitly to preserve x/y pairs when reversing.
 const riverRight:number[]=[];for(let y=653;y>=418;y-=5){const x=360+Math.sin((y-418)*.043)*(5+(y-418)*.13),w=2+(y-418)*.105;riverRight.push(x+w,y);}
 g.poly([...leftBank,...riverRight]).fill({color:p.water,alpha:.9});
 g.moveTo(654,324).bezierCurveTo(646,395,648,444,616,489).quadraticCurveTo(613,511,594,537).lineTo(604,540).quadraticCurveTo(626,510,624,490).bezierCurveTo(655,447,656,394,661,326).closePath().fill({color:p.water,alpha:.8});
 for(let i=0;i<38;i++){const x=i%2?440+random(i)*245:20+random(i)*240,y=500+random(i+100)*121;pine(g,x,y,.2+random(i+50)*.33,p.ink);}
 pagoda(g,578,449,.74,p);pagoda(g,191,468,.28,p);gate(g,86,577,.68,p);
 // Tiny valley roofs reward looking into the layers without cluttering the arena.
 for(let i=0;i<9;i++){const x=275+random(i+201)*180,y=548+random(i+220)*54;g.poly([x-8,y,x,y-7,x+9,y,x+6,y+1,x-6,y+1]).fill(p.ink).rect(x-5,y+1,10,5).fill(p.facet);}
 g.moveTo(0,655).bezierCurveTo(144,615,577,615,720,655).lineTo(720,1280).lineTo(0,1280).closePath().fill(p.floor);
 g.moveTo(-20,665).bezierCurveTo(150,620,570,620,740,665).stroke({color:p.ink,width:22});
 g.moveTo(0,657).bezierCurveTo(160,618,560,618,720,657).stroke({color:p.line,width:2,alpha:.65});
 for(let i=0;i<13;i++){const x=i*60;g.rect(x-5,632+(Math.abs(x-360)/360)**2*22,10,19).fill(p.ink).rect(x-8,629+(Math.abs(x-360)/360)**2*22,16,5).fill(p.stone);}
 // Perspective paving leaves the center deliberately quieter than the frame.
 for(let i=0;i<9;i++){const y=675+i*i*6;g.moveTo(24,y).quadraticCurveTo(360,y-22,696,y).stroke({color:p.line,width:1,alpha:.08});}
 for(let i=-4;i<=4;i++)g.moveTo(360+i*32,646).lineTo(360+i*130,1210).stroke({color:p.line,width:1,alpha:.065});
 for(const r of [224,237,257])g.ellipse(360,800,r,r*.29).stroke({color:p.line,width:r===237?1.4:.8,alpha:.25});
 for(let i=0;i<12;i++){const a=i*Math.PI/6,x=360+Math.cos(a)*243,y=800+Math.sin(a)*71;g.poly([x,y-4,x+7,y,x,y+4,x-7,y]).stroke({color:p.line,width:1,alpha:.3});}
 for(let i=0;i<4;i++){const x=360+Math.cos(i*Math.PI/2)*197,y=800+Math.sin(i*Math.PI/2)*57;g.moveTo(x-9,y-3).lineTo(x+9,y-3).moveTo(x-5,y+1).lineTo(x+5,y+1).moveTo(x,y-5).lineTo(x,y+5).stroke({color:p.line,width:1.2,alpha:.23});}
 for(let i=0;i<14;i++){const x=i%2?570+random(i+6)*85:60+random(i+8)*90,y=690+random(i+33)*440;g.moveTo(x,y).lineTo(x+7,y+2).lineTo(x+5,y+12).lineTo(x+15,y+20).stroke({color:p.ink,width:1.3,alpha:.8});}
 for(let i=0;i<65;i++){const x=random(i+401)*720,y=680+random(i+501)*560;if(x>130&&x<590)continue;g.moveTo(x,y).lineTo(x+random(i)*18+3,y-1).stroke({color:p.paper,width:.6,alpha:.06});}
}
function frame(g:Graphics,p:Palette){
 for(const side of [0,1]){g.save();if(side)g.transform(-1,0,0,1,720,0);
  g.poly([0,580,28,641,17,735,44,803,32,899,64,1015,57,1150,100,1280,0,1280]).fill(p.ink);
  g.poly([0,702,18,743,11,816,37,875,30,924,0,908]).fill(p.near);
  g.moveTo(-12,68).bezierCurveTo(43,102,87,40,137,51).moveTo(21,91).quadraticCurveTo(50,55,60,12).moveTo(58,69).quadraticCurveTo(103,89,139,72).stroke({color:p.ink,width:12,cap:'round'});
  g.moveTo(-5,740).quadraticCurveTo(24,800,16,886).quadraticCurveTo(67,921,58,979).moveTo(15,821).quadraticCurveTo(63,831,69,858).stroke({color:p.ink,width:9,cap:'round'});
  const twigs=[[15,746,65,723],[23,813,90,784],[31,903,79,920],[23,1054,75,1026],[34,1190,97,1154],[39,73,113,42],[69,65,151,97]];
  for(const [index,[x,y,xx,yy]] of twigs.entries()){
   g.moveTo(x,y).quadraticCurveTo((x+xx)/2+8,(y+yy)/2-10,xx,yy).stroke({color:p.ink,width:3,cap:'round'});
   for(let j=0;j<7;j++){const t=j/7,cx=x+(xx-x)*t,cy=y+(yy-y)*t+(j%2?9:-9);g.moveTo(cx,cy).lineTo(cx-3,cy+(j%2?-8:8)).stroke({color:p.ink,width:1.5});leaf(g,cx,cy,.48+random(j+index*20)*.48,-.5+random(j+index)*2,j%4?p.leaf:0xca6a35);}
  }
  for(let i=0;i<65;i++){const top=i<28,x=top?random(i+700)*150:random(i+900)*66,y=top?28+random(i+750)*105:710+random(i+950)*540;leaf(g,x,y,.32+random(i+780)*.48,random(i)*6.28,i%4?p.leaf:0xce6a37);}
  gate(g,29,922,.48,p);g.restore();
 }
}

/** All scenery is authored as vector geometry. Three cached paper palettes crossfade; moving accents stay vector. */
export class ScrollLandscapeRenderer{
 back=new Container();front=new Container();private skies:Container[]=[];private lands:Container[]=[];private frames:Container[]=[];
 private skyFX=new Graphics();private air=new Graphics();private water=new Graphics();private edgeFX=new Graphics();
 constructor(){
  for(let stage=0;stage<3;stage++){
   const p=PALETTES[stage],sky=new Container(),sg=new Graphics();sky.addChild(sg);
   for(let i=0;i<48;i++)sg.rect(0,i*14,720,15).fill(mix(p.sky,p.horizon,(i/48)**1.3));
   for(let i=0;i<320;i++){const x=random(i+1000)*720,y=random(i+1200)*640;sg.moveTo(x,y).lineTo(x+2+random(i)*7,y).stroke({color:stage===2?p.paper:p.ink,width:.6,alpha:.045});}
   const land=new Container(),lg=new Graphics();terrain(lg,p);land.addChild(lg);
   const edge=new Container(),fg=new Graphics();frame(fg,p);edge.addChild(fg);
   for(const c of [sky,land,edge])c.cacheAsTexture({resolution:1,antialias:true});
   this.skies.push(sky);this.lands.push(land);this.frames.push(edge);
  }
  this.back.addChild(...this.skies,this.skyFX,...this.lands,this.water,this.air);this.front.addChild(...this.frames,this.edgeFX);
 }
 resize(rect:GameViewport){for(const layer of [this.back,this.front]){layer.y=rect.top;layer.scale.y=(rect.bottom-rect.top)/1280;}}
 update(model:Hualing,enabled:boolean,low=false){
  this.back.visible=this.front.visible=enabled;if(!enabled)return;
  const journey=model.journey,t=model.clock,night=journey.night,wind=journey.wind,weights=journey.weights;
  const opacity=[1,1-weights[0],night];
  for(let i=0;i<3;i++)for(const c of [this.skies[i],this.lands[i],this.frames[i]]){c.visible=opacity[i]>.001;c.alpha=opacity[i];}
  const g=this.skyFX;g.clear();
  const sunY=248+Math.min(1,journey.time/55)*92,sunAlpha=1-night;
  if(sunAlpha>.001){g.circle(355,sunY,145).fill({color:0xe25437,alpha:sunAlpha*(1-.3*wind)});
   for(let i=0;i<24;i++){const y=sunY-130+i*11,len=Math.sqrt(Math.max(0,145**2-(y-sunY)**2));g.moveTo(355-len+4,y).lineTo(355-len+12+(i*17%45),y).stroke({color:0x9e392c,width:.8,alpha:.16*sunAlpha});}
   for(let i=0;i<3;i++)g.circle(355,sunY,148+i*7).stroke({color:GOLD,width:1,alpha:.045*sunAlpha});
  }
  if(night>.001){
   for(let i=0;i<(low?22:42);i++){const x=80+random(i+31)*570,y=112+random(i+61)*160,a=night*(.25+.55*(.5+.5*Math.sin(t*.8+i)));g.circle(x,y,i%8===0?1.7:.85).fill({color:0xe8dfb8,alpha:a});if(i%11===0)g.moveTo(x-4,y).lineTo(x+4,y).moveTo(x,y-4).lineTo(x,y+4).stroke({color:0xe8dfb8,width:.7,alpha:a*.6});}
   for(let i=3;i>=0;i--)g.circle(445,239,85+i*7).fill({color:0xe8dfb5,alpha:night*(i===0?.97:.025)});
   for(let i=0;i<19;i++){const a=random(i+62)*6.28,r=Math.sqrt(random(i+82))*70,x=445+Math.cos(a)*r,y=239+Math.sin(a)*r;g.ellipse(x,y,3+random(i)*8,2+random(i+3)*5).fill({color:0xb2bca8,alpha:night*.18});}
  }
  this.water.clear();for(let i=0;i<(low?24:42);i++){
   const y=421+(i*13+t*(2+wind*3))%224,x=360+Math.sin((y-418)*.043)*(5+(y-418)*.13),w=2+(y-418)*.105;
   this.water.moveTo(x-w*.75,y).lineTo(x+w*.65,y).stroke({color:mix(GOLD,0xd5ebdf,night),width:i%5===0?1.4:.7,alpha:.16+.18*(.5+.5*Math.sin(t+i))});
  }
  for(let i=0;i<15;i++){const u=(t*.12+i/15)%1,y=330+u*205,x=y<455?655-(y-330)*.08:645-(y-455)*.55;this.water.moveTo(x,y).lineTo(x-2,y+11).stroke({color:mix(0xffe4b4,0xdcebe6,night),width:1,alpha:Math.sin(u*Math.PI)*.45});}
  this.air.clear();
  for(let i=0;i<(low?5:8);i++){
   const x=(i*191+t*(3+wind*12))%1050-160,y=[220,293,388,449,486,545,576,610][i],size=[.8,.65,.48,.6,.7,.55,.7,.5][i];
   cloud(this.air,x,y+Math.sin(t*.16+i)*5,size,mix(0xf7dfb6,0xabc4c0,night),(.16+wind*.13)*(i<3?.7:1));
  }
  for(let i=0;i<4;i++){const x=70+i*185+Math.sin(t*.1+i)*25,y=480+i%2*67;cloud(this.air,x,y,1.08,mix(0xf2d6ad,0x8eafb2,night),.075+wind*.055);}
  for(let i=0;i<3;i++){const y=480+i*48+Math.sin(t*.18+i)*5,x=180+Math.sin(t*.08+i)*90;this.air.moveTo(x-200,y).bezierCurveTo(x-70,y-14,x+90,y+12,x+350,y-5).stroke({color:mix(0xf7dfb6,0xabc4c0,night),width:8+i*3,alpha:.025+wind*.045});}
  if(wind>.1)for(let i=0;i<3;i++){const x=(t*90+i*270)%1000-150,y=235+i*108;this.air.moveTo(x,y).bezierCurveTo(x+65,y-33,x+130,y+35,x+235,y-9).stroke({color:mix(GOLD,0xc8ddd1,night),width:.8,alpha:wind*.26});}
  this.edgeFX.clear();const e=this.edgeFX;
  const lamps=[[53,558,.65],[650,494,.52],[43,891,.62],[674,849,.55],[62,1122,.75],[655,1094,.67]];
  for(const [i,[x,y,scale]] of lamps.entries()){
   const light=.25+night*.7,angle=Math.sin(t*(.6+wind*.6)+i)*(.025+wind*.09);e.save().transform(Math.cos(angle)*scale,Math.sin(angle)*scale,-Math.sin(angle)*scale,Math.cos(angle)*scale,x,y);
   for(let r=2;r>0;r--)e.ellipse(0,0,22+r*14,26+r*14).fill({color:GOLD,alpha:light*.035*(.85+.15*Math.sin(t*2+i))});
   e.poly([-16,-20,-11,-26,11,-26,16,-20]).fill(0x263639).stroke({color:GOLD,width:1.3});e.roundRect(-12,-18,24,36,4).fill(0xa92e23).stroke({color:GOLD,width:1.3});e.rect(-8,-14,16,26).fill({color:0xffcc72,alpha:.45+night*.5});
   for(const dx of [-5,5])e.moveTo(dx,-16).lineTo(dx,16).stroke({color:0x8d4227,width:1});e.rect(-14,17,28,4).fill(0x263639).moveTo(0,21).lineTo(0,38).stroke({color:GOLD,width:1.4});e.poly([-3,37,3,37,2,51,-2,51]).fill(RED);e.restore();
  }
  if(night>.01)for(let level=0;level<4;level++){const yy=449-level*26*.74;for(const dx of [-.28,0,.28]){const width=(51-level*8)*.74;e.rect(578+width*dx-1.5,yy-9,3,5).fill({color:0xf6cc7a,alpha:night*.8});}}
  for(let i=0;i<(low?14:27);i++){
   const speed=7+wind*100,phase=(t*speed+i*67)%1050,x=wind>.2?((t*(32+wind*70)+i*103)%960)-120:i%2?660+Math.sin(t*.4+i)*30:48+Math.sin(t*.3+i)*35,y=150+phase;
   leaf(e,x,y,.18+(i%4)*.07,t*(.25+wind)+i,mix(i%3?RED:0xe2a34e,0xa74532,night),.4+wind*.35);
  }
  if(night>.1)for(let i=0;i<(low?7:14);i++){const x=i%2?650+Math.sin(t*.6+i)*30:60+Math.cos(t*.4+i)*30,y=610+random(i+34)*370+Math.sin(t*.7+i)*16,a=(.25+.65*Math.sin(t*.9+i)**2)*night;e.circle(x,y,5).fill({color:GOLD,alpha:a*.06}).circle(x,y,1.5).fill({color:0xffe5a0,alpha:a});}
  // A recovered spirit leaves a quiet, lasting constellation above the shrine.
  const awakened=model.scenes.some(s=>s.mode==='beast'&&s.progress>=1);
  if(awakened&&night>.1){for(let i=0;i<5;i++){const x=518+i*13,y=360-Math.sin(i*.8)*17;e.circle(x,y,1.7).fill({color:GOLD,alpha:night*.65});if(i)e.moveTo(x-13,360-Math.sin((i-1)*.8)*17).lineTo(x,y).stroke({color:GOLD,width:.7,alpha:night*.25});}}
 }
}
