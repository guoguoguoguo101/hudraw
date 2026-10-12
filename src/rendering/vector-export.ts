import {Container,Graphics} from 'pixi.js';
import type {GraphicsPath} from 'pixi.js';
const n=(v:number)=>Number(v.toFixed(3));
const color=(v:number)=>`#${v.toString(16).padStart(6,'0')}`;
/** Export the same Pixi vector instructions used by the live effect, without rasterization. */
function pathD(path:GraphicsPath):string{
 let d='';
 for(const ins of path.instructions){
  const a=ins.data;
  switch(ins.action){
   case 'moveTo':if(Number.isFinite(a[0])&&Number.isFinite(a[1]))d+=`M${n(a[0])} ${n(a[1])}`;break;
   case 'lineTo':d+=`L${n(a[0])} ${n(a[1])}`;break;
   case 'quadraticCurveTo':d+=`Q${a.slice(0,4).map(n).join(' ')}`;break;
   case 'bezierCurveTo':d+=`C${a.slice(0,6).map(n).join(' ')}`;break;
   case 'closePath':d+='Z';break;
   case 'poly':{const points=Array.from(a[0] as number[]);d+=`M${points.slice(0,2).map(n).join(' ')}L${points.slice(2).map(n).join(' ')}${a[1]===false?'':'Z'}`;break;}
   case 'circle':case 'ellipse':{const [x,y,rx]=a,ry=ins.action==='circle'?rx:a[3];d+=`M${n(x+rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 1 0 ${n(x-rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 1 0 ${n(x+rx)} ${n(y)}Z`;break;}
   case 'rect':case 'roundRect':{const [x,y,w,h]=a,r=ins.action==='roundRect'?Math.min(a[4]??0,w/2,h/2):0;d+=`M${n(x+r)} ${n(y)}H${n(x+w-r)}Q${n(x+w)} ${n(y)} ${n(x+w)} ${n(y+r)}V${n(y+h-r)}Q${n(x+w)} ${n(y+h)} ${n(x+w-r)} ${n(y+h)}H${n(x+r)}Q${n(x)} ${n(y+h)} ${n(x)} ${n(y+h-r)}V${n(y+r)}Q${n(x)} ${n(y)} ${n(x+r)} ${n(y)}Z`;break;}
   case 'arc':{const [x,y,r,start,end,ccw]=a;let delta=end-start;if(ccw&&delta>0)delta-=Math.PI*2;else if(!ccw&&delta<0)delta+=Math.PI*2;const steps=Math.max(1,Math.ceil(Math.abs(delta)/(Math.PI*.8)));d+=`M${n(x+Math.cos(start)*r)} ${n(y+Math.sin(start)*r)}`;for(let i=1;i<=steps;i++){const ang=start+delta*i/steps;d+=`A${n(r)} ${n(r)} 0 0 ${ccw?0:1} ${n(x+Math.cos(ang)*r)} ${n(y+Math.sin(ang)*r)}`;}break;}
   default:throw new Error(`Unsupported vector command: ${ins.action}`);
  }
 }
 return d;
}
export function vectorMarkup(node:Container,omitTransform=false):string{
 if(!node.visible||node.alpha<=0)return '';
 let own='';
 if(node instanceof Graphics)for(const instruction of node.context.instructions){
  if(instruction.action!=='fill'&&instruction.action!=='stroke')throw new Error(`Non-vector instruction: ${instruction.action}`);
  const {style,path}=instruction.data,d=pathD(path),paint=color(style.color),alpha=n(style.alpha);
  own+=instruction.action==='fill'?`<path d="${d}" fill="${paint}" fill-opacity="${alpha}"/>`:`<path d="${d}" fill="none" stroke="${paint}" stroke-opacity="${alpha}" stroke-width="${n('width' in style?style.width:1)}" stroke-linejoin="round" stroke-linecap="round"/>`;
 }
 const children=node.children.map(c=>vectorMarkup(c)).join(''),transform=omitTransform?'':` transform="translate(${n(node.x)} ${n(node.y)}) rotate(${n(node.rotation*180/Math.PI)}) scale(${n(node.scale.x)} ${n(node.scale.y)}) translate(${n(-node.pivot.x)} ${n(-node.pivot.y)})"`;
 const label=node.label?` data-layer="${node.label.replaceAll('&','&amp;').replaceAll('"','&quot;')}"`:'';
 return `<g${transform}${label} opacity="${n(node.alpha)}">${own}${children}</g>`;
}
export function vectorSvg(markup:string,viewBox='-400 -550 800 1100'){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markup}</svg>`;}
