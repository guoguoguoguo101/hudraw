import {Container,Graphics} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {FOX_RUSH} from '../gameplay/fox-rush';
import {createOrbitFox} from './fox-orbit';
const GOLD=0xffca69,RED=0xeb4129,WHITE=0xfff2d0,INK=0x263b37;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export class FoxRushRenderer{
 back=new Container();front=new Container();private gate=new Graphics();private shadows=new Graphics();private maskBack=new Graphics();private maskFront=new Graphics();private boundsKey='';
 private rigs=Array.from({length:FOX_RUSH.count},()=>{const root=new Container(),body=new Container(),fox=createOrbitFox(),trails=[createOrbitFox(RED),createOrbitFox(GOLD)];body.addChild(fox);root.addChild(body);for(const t of trails)this.front.addChild(t);this.front.addChild(root);return{root,body,trails};});
 constructor(){this.back.eventMode=this.front.eventMode='none';this.back.addChild(this.shadows,this.gate,this.maskBack);this.front.addChild(this.maskFront);this.back.mask=this.maskBack;this.front.mask=this.maskFront;}
 update(g:Game,low=false){
  const m=g.foxRush,enabled=g.frontlineTest&&g.state!=='menu';this.back.visible=this.front.visible=enabled;this.gate.clear();this.shadows.clear();for(const r of this.rigs){r.root.visible=false;for(const t of r.trails)t.visible=false;}if(!enabled)return;
  const b=g.hualing.bounds,key=[b.left,b.top,b.right,b.bottom].join(':');if(key!==this.boundsKey){this.boundsKey=key;for(const mask of [this.maskBack,this.maskFront])mask.clear().rect(b.left,b.top,b.right-b.left,b.bottom-b.top).fill(0xffffff);}
  if(m.active&&m.age<.85){const u=clamp(m.age/.85),fade=1-u,p=m.origin,a=this.gate;a.ellipse(p.x,p.y+7,48+u*75,13+u*19).fill({color:INK,alpha:fade*.25}).stroke({color:GOLD,width:2,alpha:fade});a.ellipse(p.x,p.y+7,36+u*60,10+u*15).stroke({color:RED,width:3,alpha:fade*.6});for(let i=0;i<9;i++){const x=p.x+(i-4)*14,y=p.y-12-Math.sin(u*Math.PI)*22;a.poly([x,y-5,x+3,y,x,y+5,x-3,y]).fill({color:i%2?GOLD:WHITE,alpha:fade});}}
  for(const f of m.units){if(f.age<0)continue;const r=this.rigs[f.id],intro=clamp(f.age/.14),fade=clamp((f.y-b.top+24)/70),stride=Math.sin(f.age*22+f.id*.8),scale=.44+(f.id%3)*.024,hop=4*Math.max(0,stride);r.root.visible=true;r.root.position.set(f.x,f.y-hop);r.root.rotation=f.angle;r.root.scale.set(scale*(.88+intro*.12));r.root.alpha=intro*fade;r.body.scale.set(1+stride*.035,1-stride*.05);
   this.shadows.ellipse(f.x,f.y+13,19,5).fill({color:INK,alpha:.16*intro*fade});
   for(let i=0;i<r.trails.length;i++){const t=r.trails[i];t.visible=!low||i===0;t.position.set(f.x-Math.cos(f.angle)*(14+i*12),f.y-Math.sin(f.angle)*(14+i*12)-hop);t.rotation=f.angle;t.scale.set(scale*(.96-i*.07));t.alpha=intro*fade*(i===0?.2:.08);}
  }
 }
}
