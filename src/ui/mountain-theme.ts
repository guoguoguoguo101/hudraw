import {Container,Graphics} from 'pixi.js';
import type {HualingChapter} from '../gameplay/hualing-chapters';
import type {BrushSkill} from '../gameplay/brush-upgrades';
export const MOUNTAIN_THEMES={
 valley:{paper:0xf4dfb6,ink:0x492d25,accent:0xa43b27,line:0xb78544,muted:0x805d42,dark:0x392a25,title:0xffe7ba},
 sea:{paper:0xdceee3,ink:0x174f58,accent:0x247a86,line:0xc9b781,muted:0x4f8083,dark:0x123e49,title:0xffedce},
 palace:{paper:0x202b48,ink:0xf5dfab,accent:0xe5bf74,line:0xc6a45e,muted:0xc6bda6,dark:0x121b33,title:0xf4dfad},
 snow:{paper:0xe6eceb,ink:0x304653,accent:0x5a7a8c,line:0x99b2be,muted:0x637e89,dark:0x263b4a,title:0xf2f4ea},
} as const;
export function chapterMark(g:Graphics,ch:HualingChapter,x:number,y:number,r=18){const t=MOUNTAIN_THEMES[ch];
 if(ch==='valley'){g.poly([x,y-r,x+4,y-r*.35,x+r*.65,y-r*.6,x+r*.4,y,x+r,y+r*.15,x+5,y+r*.4,x+2,y+r,x-2,y+r*.4,x-r*.7,y+r*.3,x-r*.4,y,x-r*.75,y-r*.55,x-4,y-r*.35]).fill(t.accent);g.moveTo(x,y+r*.8).lineTo(x,y-r*.6).stroke({color:t.line,width:1});}
 else if(ch==='sea'){g.moveTo(x,y+r*.6).bezierCurveTo(x-r*1.4,y-r*.2,x-r,y-r,x,y-r).bezierCurveTo(x+r,y-r,x+r*1.4,y-r*.2,x,y+r*.6).fill(t.paper).stroke({color:t.line,width:1.3});for(let i=-2;i<=2;i++)g.moveTo(x,y+r*.55).quadraticCurveTo(x+i*r*.25,y,x+i*r*.3,y-r*.65).stroke({color:t.accent,width:1,alpha:.6});g.circle(x,y+r*.55,r*.23).fill(0xfff8e6).stroke({color:t.line,width:1});}
 else if(ch==='palace'){g.circle(x,y,r*.7).stroke({color:t.line,width:1});g.ellipse(x,y,r*1.25,r*.35).stroke({color:t.line,width:1});g.poly([x,y-r,x+r*.18,y-r*.18,x+r,y,x+r*.18,y+r*.18,x,y+r,x-r*.18,y+r*.18,x-r,y,x-r*.18,y-r*.18]).fill(t.line);}
 else{for(let i=0;i<6;i++){const a=i*Math.PI/3,dx=Math.cos(a),dy=Math.sin(a);g.moveTo(x,y).lineTo(x+dx*r,y+dy*r).stroke({color:t.accent,width:1.3});for(const s of [-1,1])g.moveTo(x+dx*r*.65,y+dy*r*.65).lineTo(x+dx*r*.4-dy*s*r*.2,y+dy*r*.4+dx*s*r*.2).stroke({color:t.accent,width:1});}}
}
/** Distinct material silhouettes, interpreted from the approved AI reference board. */
export function chapterPanel(parent:Container,ch:HualingChapter,x:number,y:number,w:number,h:number,selected=false,alpha=.97){const t=MOUNTAIN_THEMES[ch],g=new Graphics();parent.addChild(g);
 g.poly([x+8,y+7,x+w-5,y+6,x+w+7,y+h-1,x+5,y+h+8]).fill({color:0x091b24,alpha:.2});
 if(ch==='sea'){g.moveTo(x+22,y).bezierCurveTo(x+6,y-8,x-6,y+18,x+4,y+35).lineTo(x+3,y+h-26).bezierCurveTo(x-8,y+h+4,x+23,y+h+12,x+35,y+h-2).lineTo(x+w-26,y+h).bezierCurveTo(x+w+12,y+h+6,x+w+9,y+h-26,x+w-2,y+h-35).lineTo(x+w,y+22).bezierCurveTo(x+w+8,y-8,x+w-22,y-9,x+w-35,y+2).closePath().fill({color:t.paper,alpha}).stroke({color:t.line,width:selected?2.5:1.3});g.roundRect(x+9,y+7,w-18,h-14,16).stroke({color:t.accent,width:1,alpha:.35});for(const [xx,yy]of [[x+8,y+8],[x+w-8,y+h-8]]){g.circle(xx,yy,9).fill(0xe3e9d8).stroke({color:t.line,width:1});g.circle(xx-2,yy-2,3).fill(0xfff9e8);} }
 else if(ch==='palace'){g.poly([x+15,y,x+w-15,y,x+w,y+15,x+w,y+h-15,x+w-15,y+h,x+15,y+h,x,y+h-15,x,y+15]).fill({color:t.paper,alpha}).stroke({color:t.line,width:selected?2.2:1});g.rect(x+7,y+7,w-14,h-14).stroke({color:t.line,width:.7,alpha:.55});for(const xx of[x+5,x+w-5]){g.moveTo(xx,y+18).lineTo(xx,y+h-18).stroke({color:t.line,width:1.3});g.poly([xx,y+18,xx+4,y+26,xx,y+34,xx-4,y+26]).fill(t.line);}g.ellipse(x+w-25,y+23,22,7).stroke({color:t.line,width:1});g.circle(x+w-25,y+23,13).stroke({color:t.line,width:.8});}
 else if(ch==='snow'){g.poly([x+10,y+3,x+w*.23,y,x+w*.45,y+4,x+w*.7,y,x+w-7,y+2,x+w,y+17,x+w-4,y+h*.45,x+w,y+h*.7,x+w-8,y+h,x+w*.7,y+h-4,x+w*.4,y+h,x+w*.2,y+h-3,x+3,y+h,x,y+h-15,x+4,y+h*.5,x,y+22]).fill({color:t.paper,alpha}).stroke({color:t.line,width:selected?2:1});g.moveTo(x+10,y+3).lineTo(x+w-10,y+3).stroke({color:0xffffff,width:2,alpha:.75});g.moveTo(x+15,y+3).lineTo(x+12,y+h-4).stroke({color:0xa2473d,width:1.4});for(let i=0;i<4;i++)g.moveTo(x+7,y+15+i*10).lineTo(x+18,y+19+i*10).stroke({color:0x9c5148,width:1});chapterMark(g,ch,x+w-18,y+h-19,12);}
 else{g.poly([x+5,y+3,x+w*.3,y,x+w*.6,y+3,x+w-4,y,x+w,y+h-4,x+w*.7,y+h,x+w*.35,y+h-2,x+2,y+h,x,y+13]).fill({color:t.paper,alpha}).stroke({color:t.line,width:selected?2.3:1});g.rect(x+6,y+6,w-12,h-12).stroke({color:t.line,width:.6,alpha:.6});for(const xx of[x+2,x+w-2]){g.roundRect(xx-4,y-3,8,h+6,3).fill(t.line).stroke({color:t.ink,width:.6,alpha:.6});g.moveTo(xx-2,y+8).lineTo(xx-2,y+h-8).stroke({color:0xffefca,width:1,alpha:.6});}chapterMark(g,ch,x+w-12,y+10,17);}
 // Sparse paper fibers instead of a flat opaque block.
 if(ch!=='palace')for(let i=0;i<18;i++){const xx=x+16+(i*71%(Math.max(1,w-32))),yy=y+12+(i*41%Math.max(1,h-24));g.moveTo(xx,yy).lineTo(xx+4+i%7,yy-1).stroke({color:t.muted,width:.5,alpha:.12});}
 return g;
}
export function brushGlyph(parent:Container,ch:HualingChapter,id:BrushSkill,x:number,y:number,size=1){const t=MOUNTAIN_THEMES[ch],g=new Graphics();g.position.set(x,y);g.scale.set(size);parent.addChild(g);const ink=t.ink,accent=t.accent;
 if(id==='spray'){g.moveTo(-35,22).bezierCurveTo(-29,-22,16,-30,30,-5).stroke({color:ink,width:12,cap:'round'});g.moveTo(-29,18).bezierCurveTo(-11,-5,6,-8,24,-5).stroke({color:accent,width:3});for(let i=0;i<16;i++){const a=i*2.4,r=17+i*2.2;g.circle(Math.cos(a)*r,Math.sin(a)*r,1+i%3).fill({color:i%3?ink:accent,alpha:.8});}g.moveTo(18,-21).quadraticCurveTo(39,-25,35,-5).quadraticCurveTo(17,-6,18,-21).fill(ink);g.poly([33,-17,46,-23,44,-8]).fill(ink);}
 if(id==='wide'){for(let i=0;i<10;i++)g.moveTo(-44+i*.8,27-i*2).bezierCurveTo(-5,20-i*3,20,-5-i,45-i,-30).stroke({color:i%4?ink:accent,width:2.5,alpha:1-i*.045});g.moveTo(-34,27).lineTo(42,-25).stroke({color:t.line,width:1});}
 if(id==='splash'){for(const side of[-1,1]){g.moveTo(-40,side*15+8).bezierCurveTo(-13,-35*side,10,35*side,40,side*-12).stroke({color:side===1?ink:accent,width:7,cap:'round'});g.circle(39,-side*12,5).fill(side===1?ink:accent);g.moveTo(38,-side*12).lineTo(45,-side*19).stroke({color:t.line,width:1.4});}}
 if(id==='trail'){for(let i=0;i<4;i++)g.moveTo(-18-i*3,23+i*2).bezierCurveTo(-67,-7,12,-55,36,-14).bezierCurveTo(61,25,-29,42,-19,2).bezierCurveTo(-15,-14,5,-16,14,-8).stroke({color:i%2?accent:ink,width:3.8,alpha:.9-i*.12});for(let i=0;i<9;i++)g.circle(-34+Math.sin(i*4)*12,18+Math.cos(i*2)*13,1+i%2).fill(ink);}
}
