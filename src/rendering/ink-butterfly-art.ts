import type {Graphics} from 'pixi.js';

const PAPER=0xf3e6cd,LIGHT=0xfff5de,FOLD=0xc9b89b,INK=0x303331,GOLD=0xcfae73,RED=0xa74433;
const wings=[
 {closed:[0,11,-1,-38,-18,14,-6,8],open:[0,2,-43,-34,-33,6,-12,15],color:PAPER},
 {closed:[1,12,1,-38,24,12,8,20],open:[1,2,42,-31,30,11,13,17],color:LIGHT},
 {closed:[-1,10,-8,-1,-22,21,-7,15],open:[-2,9,-26,12,-28,35,-3,23],color:FOLD},
 {closed:[1,10,9,-1,18,22,5,17],open:[2,9,28,13,24,35,4,23],color:PAPER},
];

/** Faceted rice-paper wings: folded tent, open butterfly, with ink tips and a cinnabar seal. */
export function inkButterfly(g:Graphics,opening=0,alpha=1){
 const u=Math.max(0,Math.min(1,opening));
 // Rear wings are behind the two tall front folds.
 for(const i of [2,3,0,1]){
  const w=wings[i],p=w.closed.map((v,n)=>v+(w.open[n]-v)*u);
  g.poly(p).fill({color:w.color,alpha}).stroke({color:0x6e6050,width:.8,alpha:alpha*.7});
  const cx=p[0],cy=p[1],tx=p[2],ty=p[3],ex=p[4],ey=p[5];
  g.poly([cx,cy,tx,ty,(tx+ex)*.5,(ty+ey)*.5]).fill({color:i%2?PAPER:LIGHT,alpha:alpha*.75});
  g.poly([cx,cy,(tx+ex)*.5,(ty+ey)*.5,ex,ey]).fill({color:FOLD,alpha:alpha*.3});
  if(i<2){
   // Uneven ink washes stay at the wing tips, leaving most of the ivory face clear.
   const ax=tx+(cx-tx)*.36,ay=ty+(cy-ty)*.36,bx=tx+(ex-tx)*.35,by=ty+(ey-ty)*.35;
   g.poly([tx,ty,bx,by,(bx+ax)*.5+1,(by+ay)*.5-1,ax,ay]).fill({color:INK,alpha:alpha*(i===0?.8:.52)});
   g.poly([tx,ty,tx+(bx-tx)*.65,ty+(by-ty)*.65,tx+(ax-tx)*.7,ty+(ay-ty)*.7]).fill({color:0x1d2426,alpha:alpha*.45});
  }
  g.moveTo(cx,cy).lineTo(tx,ty).stroke({color:GOLD,width:.75,alpha:alpha*.7});
  g.moveTo(cx,cy).lineTo(ex,ey).stroke({color:0xa28f74,width:.6,alpha:alpha*.6});
  for(let k=1;k<=3;k++){
   const t=.22+k*.14,x=tx+(cx-tx)*t,y=ty+(cy-ty)*t;
   g.moveTo(x,y).lineTo(x+(ex-tx)*.065,y+(ey-ty)*.065).stroke({color:LIGHT,width:.55,alpha:alpha*.45});
  }
 }
 g.poly([-1,-6,2,-5,3,18,0,24,-2,17]).fill({color:INK,alpha:alpha*.85});
 g.moveTo(0,-5).lineTo(-5,-12).moveTo(1,-5).lineTo(6,-11).stroke({color:GOLD,width:.7,alpha:alpha*.7*u});
 const sx=8+u*7,sy=8+u*2;
 g.save().transform(.8,-.17,.17,.8,sx,sy);
 g.rect(-4.5,-6,9,12).fill({color:RED,alpha});
 g.rect(-3,-4.5,6,9).stroke({color:LIGHT,width:.6,alpha:alpha*.9});
 g.moveTo(-1.5,-3).lineTo(1,-3).lineTo(1,0).lineTo(-1,0).lineTo(-1,3).moveTo(1,1).lineTo(2,1).lineTo(2,3).stroke({color:LIGHT,width:.8,alpha:alpha*.9});
 g.restore();
}

export function inkPaperShard(g:Graphics,seed:number,alpha=1){
 const long=seed%3===0;
 g.poly(long?[-2,9,-5,-13,5,-7,3,4]:[-5,5,-3,-10,7,-6,1,9]).fill({color:seed%3===1?PAPER:LIGHT,alpha});
 g.poly(long?[-5,-13,5,-7,1,-1]:[-3,-10,7,-6,1,0]).fill({color:seed%3===1?RED:INK,alpha:alpha*.8});
 g.moveTo(-2,5).lineTo(0,-5).stroke({color:GOLD,width:.65,alpha:alpha*.6});
}

export function inkButterflyEmblem(g:Graphics){g.save().transform(.8,0,0,.8,0,0);inkButterfly(g,1);g.restore();}
