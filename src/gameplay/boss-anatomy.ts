import type {Point} from '../input/recognizer';
import type {HualingChapter} from './hualing-chapters';
export type BossPart={name:string;tip:[number,number];pivot:[number,number]};
export const BOSS_PARTS:Record<HualingChapter,BossPart[]>={
 valley:[
  {name:'一尾',tip:[.43,.035],pivot:[.61,.58]},{name:'二尾',tip:[.27,.09],pivot:[.60,.58]},
  {name:'三尾',tip:[.065,.26],pivot:[.58,.59]},{name:'四尾',tip:[.025,.62],pivot:[.57,.60]},
  {name:'五尾',tip:[.20,.88],pivot:[.56,.62]},{name:'六尾',tip:[.60,.12],pivot:[.64,.57]},
  {name:'七尾',tip:[.81,.10],pivot:[.68,.55]},{name:'八尾',tip:[.97,.46],pivot:[.69,.59]},
  {name:'九尾',tip:[.98,.81],pivot:[.69,.63]},
 ],
 sea:[{name:'左蜃口',tip:[.13,.43],pivot:[.4,.57]},{name:'右蜃口',tip:[.87,.43],pivot:[.6,.57]},{name:'冠壳',tip:[.5,.15],pivot:[.5,.5]},{name:'潮心',tip:[.5,.55],pivot:[.5,.55]}],
 palace:[{name:'左掌',tip:[.08,.47],pivot:[.34,.34]},{name:'右掌',tip:[.92,.47],pivot:[.66,.34]},{name:'天枢',tip:[.5,.055],pivot:[.5,.22]},{name:'左星',tip:[.23,.22],pivot:[.5,.22]},{name:'右星',tip:[.77,.22],pivot:[.5,.22]}],
 snow:[{name:'左角',tip:[.15,.12],pivot:[.34,.42]},{name:'右角',tip:[.49,.10],pivot:[.34,.42]},{name:'前蹄',tip:[.27,.96],pivot:[.29,.63]},{name:'后蹄',tip:[.72,.94],pivot:[.71,.65]}],
};
const ART:Record<HualingChapter,[number,number]>={valley:[352,293],sea:[352,234],palace:[231,352],snow:[306,352]};
export function partWorld(chapter:HualingChapter,part:number,origin:Point,warp?:(u:number,v:number)=>Point):Point{
 const [w,h]=ART[chapter],scale=Math.min((chapter==='sea'?380:350)/w,(chapter==='palace'?315:295)/h),tip=BOSS_PARTS[chapter][part%BOSS_PARTS[chapter].length].tip,p=warp?warp(...tip):{x:tip[0],y:tip[1]};
 return {x:origin.x+(p.x-.5)*w*scale*.9,y:origin.y+(p.y-.5)*h*scale*.9};
}
