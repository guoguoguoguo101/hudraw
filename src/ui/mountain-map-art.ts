import {Graphics} from 'pixi.js';
import type {HualingChapter} from '../gameplay/hualing-chapters';
import {MOUNTAIN_THEMES,chapterMark} from './mountain-theme';

/** Broad paper silhouettes leave the level numbers on a quiet, untextured field. */
export function mapBackdrop(g:Graphics,ch:HualingChapter,header:number,footer:number){
 const top=header+148,bottom=footer+1030,h=bottom-top;
 const colors={valley:[0xf3e5c9,0xd6ba90,0xb59b7c],sea:[0xe0eeea,0xb5d5cf,0x84b4b3],palace:[0x23324b,0x3d5068,0x596b80],snow:[0xeaf0f1,0xcddce0,0xaabfc8]} as const;
 const [paper,far,near]=colors[ch];g.clear().rect(0,header,720,1280+footer-header).fill(paper);
 if(ch==='valley'){
  g.circle(641,top+90,57).fill({color:0xd8b077,alpha:.27});
  g.poly([0,bottom,0,bottom-195,73,bottom-276,148,bottom-164,224,bottom-223,328,bottom-120,443,bottom-196,535,bottom-133,635,bottom-246,720,bottom-183,720,bottom]).fill({color:far,alpha:.4});
  g.moveTo(0,bottom-68).quadraticCurveTo(125,bottom-165,268,bottom-64).quadraticCurveTo(475,bottom-142,720,bottom-61).lineTo(720,bottom).lineTo(0,bottom).closePath().fill({color:near,alpha:.2});
  // A single branch at the edge echoes the chapter's autumn palette.
  g.moveTo(-8,top+88).quadraticCurveTo(35,top+129,61,top+180).stroke({color:near,width:3,alpha:.5});
  for(const [x,y] of [[12,113],[33,139],[49,165]])g.ellipse(x,top+y,12,5).fill({color:0xb46646,alpha:.42});
 }else if(ch==='sea'){
  g.circle(652,top+83,54).fill({color:0xfaf5dc,alpha:.8});
  for(let i=0;i<3;i++){
   const y=bottom-135+i*53;
   g.moveTo(0,y).bezierCurveTo(165,y-68,319,y+49,479,y-6).quadraticCurveTo(619,y-44,720,y-10).lineTo(720,bottom).lineTo(0,bottom).closePath().fill({color:i===0?far:near,alpha:.17+i*.05});
  }
  for(let i=0;i<3;i++)g.moveTo(7,top+100+i*14).quadraticCurveTo(36,top+85+i*14,66,top+100+i*14).stroke({color:near,width:1.5,alpha:.36});
 }else if(ch==='palace'){
  g.circle(645,top+91,51).fill({color:0xe4d7ae,alpha:.23});g.circle(629,top+79,46).fill(paper);
  for(const [x,v] of [[28,.11],[681,.27],[43,.43],[675,.64],[26,.78]]){
   const y=top+h*v;g.moveTo(x-4,y).lineTo(x+4,y).moveTo(x,y-4).lineTo(x,y+4).stroke({color:0xdac595,width:1,alpha:.48});
  }
  for(let i=0;i<2;i++)g.moveTo(0,bottom-74-i*57).bezierCurveTo(159,bottom-176-i*33,239,bottom+5-i*44,398,bottom-83-i*43).quadraticCurveTo(567,bottom-153-i*30,720,bottom-62-i*45).lineTo(720,bottom).lineTo(0,bottom).closePath().fill({color:i?far:near,alpha:.22});
 }else{
  g.circle(650,top+88,51).fill({color:0xffffff,alpha:.58});
  g.poly([0,bottom,0,bottom-124,99,bottom-246,171,bottom-158,259,bottom-220,373,bottom-91,511,bottom-180,611,bottom-263,720,bottom-133,720,bottom]).fill({color:far,alpha:.55});
  g.moveTo(0,bottom-60).quadraticCurveTo(190,bottom-144,361,bottom-58).quadraticCurveTo(565,bottom-135,720,bottom-59).lineTo(720,bottom).lineTo(0,bottom).closePath().fill({color:0xffffff,alpha:.55});
  for(const [x,v] of [[28,.15],[681,.34],[31,.61]]){const y=top+h*v;for(let i=0;i<3;i++){const a=i*Math.PI/3;g.moveTo(x-Math.cos(a)*7,y-Math.sin(a)*7).lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7).stroke({color:near,width:1,alpha:.45});}}
 }
}

/** Native level seals and scroll-edge controls over the illustrated map. */
export function mapSeal(g:Graphics,ch:HualingChapter,x:number,y:number,r:number,selected:boolean,boss:boolean,done:boolean){
 const t=MOUNTAIN_THEMES[ch],fill=selected?t.accent:ch==='valley'?0x7e3b2e:t.paper;
 if(ch==='palace'){
  g.poly([x,y-r-5,x+r+5,y,x,y+r+5,x-r-5,y]).fill({color:t.dark,alpha:.9}).stroke({color:t.line,width:selected?2:1});
  g.poly([x,y-r,x+r,y,x,y+r,x-r,y]).fill(fill).stroke({color:t.line,width:1});
 }else if(ch==='snow'){
  const p:number[]=[];for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;p.push(x+Math.cos(a)*(r+3),y+Math.sin(a)*(r+3));}
  g.poly(p).fill({color:fill,alpha:.98}).stroke({color:selected?t.accent:t.line,width:selected?2.5:1.5});
  if(boss)for(let i=0;i<6;i++){const a=i*Math.PI/3;g.moveTo(x+Math.cos(a)*(r+5),y+Math.sin(a)*(r+5)).lineTo(x+Math.cos(a)*(r+11),y+Math.sin(a)*(r+11)).stroke({color:t.line,width:1.5});}
 }else{
  g.circle(x,y,r+5).fill({color:t.dark,alpha:.5}).stroke({color:t.line,width:1});
  if(ch==='valley')g.circle(x,y,r).fill(fill).stroke({color:t.line,width:1.5});
  else{g.circle(x,y,r).fill(fill).stroke({color:t.line,width:1.4});g.moveTo(x+Math.cos(.15)*(r-5),y+Math.sin(.15)*(r-5)).arc(x,y,r-5,.15,Math.PI*.85).stroke({color:selected?t.title:0xffffff,width:1,alpha:.55});}
 }
 if(selected)g.circle(x,y,r+10).stroke({color:t.line,width:1,alpha:.65});
 if(boss){g.poly([x,y-r-13,x+4,y-r-8,x,y-r-3,x-4,y-r-8]).fill(t.line);}
 if(done)g.moveTo(x+r-9,y+r).lineTo(x+r-4,y+r+5).lineTo(x+r+6,y+r-7).stroke({color:ch==='palace'||ch==='valley'?t.line:t.accent,width:3});
}

export function mapStartButton(g:Graphics,ch:HualingChapter,x:number,y:number,w:number,h:number){
 const t=MOUNTAIN_THEMES[ch];
 g.poly([x+12,y,x+w-12,y,x+w,y+12,x+w,y+h-12,x+w-12,y+h,x+12,y+h,x,y+h-12,x,y+12]).fill(t.accent).stroke({color:t.line,width:1.4});
 g.moveTo(x+18,y+8).lineTo(x+w-18,y+8).moveTo(x+18,y+h-8).lineTo(x+w-18,y+h-8).stroke({color:ch==='palace'?t.dark:t.title,width:.8,alpha:.5});
 chapterMark(g,ch,x+w-35,y+h/2,14);
}
