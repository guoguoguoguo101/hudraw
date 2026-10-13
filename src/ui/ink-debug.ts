import {Container,Graphics,Text} from 'pixi.js';
import type {InputEvent} from '../platform/adapter';
import type {InputController} from '../input/controller';
import type {Game} from '../gameplay/game';
import {INK} from '../gameplay/ink-config';
/** Constructed only in development; open from the existing D/debug toggle. */
export class InkDebugPanel{
 root=new Container();private label=new Text({text:'',style:{fontFamily:['KaiTi','serif'],fontSize:17,fill:0xfff3dc,lineHeight:25}});
 private zones:{x:number;y:number;w:number;h:number;run:()=>void}[]=[];
 constructor(private game:Game,private input:InputController){
  this.root.visible=false;this.root.addChild(new Graphics().roundRect(38,720,644,292,14).fill({color:0x14232a,alpha:.96}).stroke({color:0xe7ba68,width:1}));this.label.position.set(54,733);this.root.addChild(this.label);
  const button=(label:string,x:number,y:number,w:number,run:()=>void)=>{const g=new Graphics().roundRect(x,y,w,35,6).fill(0x33414c).stroke({color:0xe7ba68,width:1});const t=new Text({text:label,style:{fontSize:16,fill:0xfff3dc}});t.position.set(x+8,y+8);this.root.addChild(g,t);this.zones.push({x,y,w,h:35,run:()=>{input.cancel();run();}});};
  [100,50,8,0].forEach((n,i)=>button(`设为${n}`,54+i*100,906,92,()=>{game.ink.unlimited=false;game.ink.setAmount(n);}));
  button('暂停／恢复回墨',54,955,178,()=>game.ink.regenPaused=!game.ink.regenPaused);
  button('开关回墨动画',244,955,158,()=>game.ink.refundVisual=!game.ink.refundVisual);
  button('恢复速度 −4',414,955,120,()=>INK.inkRegenPerSecond=Math.max(4,INK.inkRegenPerSecond-4));
  button('+4',546,955,70,()=>INK.inkRegenPerSecond+=4);
 }
 handle(e:InputEvent){if(!this.root.visible||e.x<38||e.x>682||e.y<720||e.y>1012)return false;if(e.kind==='down')this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h)?.run();return true;}
 update(visible:boolean){this.root.visible=visible;if(!visible)return;const ink=this.game.ink,p=ink.pending,l=ink.last;
  this.label.text=`灵墨 ${ink.currentInk.toFixed(2)}/${ink.maxInk} · ${ink.state} · 恢复${INK.inkRegenPerSecond}/秒${ink.regenPaused?'（已暂停）':''}\n第${p?.id??l.id}笔 · 有效长度 ${(p?.length??l.length).toFixed(1)} · 成本 ${(p?.cost??l.cost).toFixed(2)}\n${p?'待结算（不预设返还）':`净成本 ${(l.cost-l.refund).toFixed(2)} · 回墨 ${l.refund.toFixed(2)} · ${l.rune||'未成符'}`}\n${l.reason} · 超时 ${this.input.timedOut} · 耗尽 ${p?.exhausted??l.exhausted} · 延迟 ${ink.delay.toFixed(2)}\n缺墨尝试 ${ink.stats.blockedStarts} · 低墨时间 ${ink.stats.emptySeconds.toFixed(1)}秒`;
 }
}
