import {Container,Graphics,Text} from 'pixi.js';
import {INK} from '../gameplay/ink-config';
import type {InkResourceManager} from '../gameplay/ink-resource';
/** Visual interpolation never delays or changes the actual resource balance. */
export class InkHUD{
 displayedInk=100;
 root=new Container();bar=new Graphics();fx=new Graphics();value=new Text({text:'',style:{fontFamily:['KaiTi','serif'],fontSize:19,fill:0xfff7e8}});
 notice=new Text({text:'',style:{fontFamily:['KaiTi','serif'],fontSize:20,fill:0xffd887}});
 private refundSerial=0;private blockedSerial=0;private resetSerial=-1;private age=10;private refund=0;private flash=0;private emptyAge=10;
 constructor(){
  this.root.position.set(54,155);this.value.position.set(36,0);this.notice.position.set(400,24);
  const icon=new Graphics();icon.moveTo(14,0).bezierCurveTo(12,7,4,13,5,19).bezierCurveTo(5,29,23,29,23,19).bezierCurveTo(23,12,17,7,14,0).fill(0xe7ba68);
  this.root.addChild(icon,this.bar,this.fx,this.value,this.notice);
 }
 update(ink:InkResourceManager,dt:number){
  if(this.resetSerial!==ink.resetSerial){this.resetSerial=ink.resetSerial;this.age=this.emptyAge=10;this.refund=0;this.flash=0;}
  this.age+=dt;this.emptyAge+=dt;this.flash=Math.max(0,this.flash-dt);
  if(this.refundSerial!==ink.refundSerial){this.refundSerial=ink.refundSerial;this.refund=ink.lastRefund;this.age=0;this.emptyAge=10;}
  if(this.blockedSerial!==ink.blockedSerial){this.blockedSerial=ink.blockedSerial;this.emptyAge=0;this.flash=.4;this.age=10;}
  const u=Math.min(1,this.age/INK.refundAnimationSeconds),animating=ink.refundVisual&&u<1;
  // A new stroke cancels the old visual lag so consumption stays immediate.
  const lag=animating&&!ink.pending?this.refund*(1-u)**2:0;
  const shown=Math.max(0,ink.currentInk-lag);this.displayedInk=shown;const color=ink.currentInk<INK.minInkToStart?0xb77b4c:ink.currentInk<INK.lowInkThreshold?0xc99b58:0xe7ba68;
  this.value.text=ink.unlimited?'灵墨  ∞':`灵墨  ${Math.floor(ink.currentInk+1e-8)} / ${ink.maxInk}`;
  const x=248,y=8,w=336,h=12;
  this.bar.clear().roundRect(x,y,w,h,6).fill({color:0x101c22,alpha:.85}).stroke({color:0xe7ba68,width:1,alpha:this.flash>0?.9:.4});
  const fill=ink.unlimited?w:w*shown/ink.maxInk;if(fill>0)this.bar.roundRect(x,y,fill,h,Math.min(6,fill/2)).fill({color});
  this.fx.clear();
  if(animating){
   const alpha=Math.sin(u*Math.PI),end=x+w*shown/ink.maxInk;
   this.fx.roundRect(x-2,y-2,w+4,h+4,7).stroke({color:0xffd887,width:1.5,alpha:alpha*.65});
   for(let i=0;i<3;i++){const t=(u+i*.16)%1,px=x+w*(1-t),py=y-5-Math.sin(t*Math.PI)*8;this.fx.moveTo(px+12,py).quadraticCurveTo(px+4,py-4,px,py).stroke({color:0xffd887,width:1.4,alpha:alpha*.7});}
   this.fx.circle(end,y+h/2,3+alpha*2).fill({color:0xfff3dc,alpha:alpha*.7});
   this.notice.text=`回墨 +${this.refund.toFixed(1)}`;this.notice.alpha=1-u;this.notice.y=24-u*12;
  }else if(this.emptyAge<.8){this.notice.text='灵墨不足';this.notice.alpha=1-this.emptyAge/.8;this.notice.y=24;}
  else{this.notice.text='';this.notice.alpha=0;}
 }
}
