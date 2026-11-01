import type {HualingChapter} from '../../gameplay/hualing-chapters';
import {decodePaperPath,type PaperVector} from './vector-art';

type LandscapeChapter=Exclude<HualingChapter,'valley'>;
// A small set of paper stocks replaces the near-identical trace colors. The
// source contours stay intact, so the whale, palace and sleeping beast keep
// their silhouettes and the animation masks still fit the approved artwork.
const STOCKS:Record<LandscapeChapter,number[]>={
 sea:[0x173b46,0x275763,0x347480,0x458d92,0x64aaa5,0x8fbdb1,0xb8d0bf,0xd5dfca,0xf1e5c6,0xc9b78d,0x805b4e,0xb9503e],
 palace:[0x26344e,0x3c4d6b,0x586987,0x77839e,0x969eb3,0xb7b9c8,0xd2ced3,0xe6d9cf,0xf5e8d0,0xc9ac87,0x9c7561,0x79524e],
 snow:[0x354854,0x4d606c,0x728592,0x96a6ae,0xbac6cb,0xd4dcdb,0xe5e9e3,0xf1eee3,0x8d8171,0xb8ac97],
};
const prepared=new WeakMap<PaperVector,PaperVector>();

function paperColor(rgb:number,stock:number[]){
 const r=rgb>>16&255,g=rgb>>8&255,b=rgb&255,luma=r*.3+g*.5+b*.2;
 let closest=stock[0],distance=Infinity;
 for(const candidate of stock){
  const cr=candidate>>16&255,cg=candidate>>8&255,cb=candidate&255;
  const value=(r-cr)**2*.3+(g-cg)**2*.5+(b-cb)**2*.2+(luma-cr*.3-cg*.5-cb*.2)**2*.6;
  if(value<distance){distance=value;closest=candidate;}
 }
 return closest;
}

/** One-time background preparation; never used for characters, bosses or UI. */
export function landscapePaper(chapter:LandscapeChapter,source:PaperVector):PaperVector{
 const cached=prepared.get(source);if(cached)return cached;
 const colors=new Map<number,number>();
 const paths=source.paths.flatMap((entry,index)=>{
  const [rgb,encoded,offsetX=0,offsetY=0]=entry;
  const path=source.encoding?decodePaperPath(String(encoded),source.encoding):null;
  if(path&&index>0){
   let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
   for(const instruction of path.instructions)for(let i=0;i+1<instruction.data.length;i+=2){
    const x=Number(instruction.data[i])+Number(offsetX),y=Number(instruction.data[i+1])+Number(offsetY);
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   }
   // Keep edge framing and the large landmark. In the enemy approach lane,
   // discard more of the tiny texture islands that compete with white paper.
   const center=(left+right)/2,approach=center>112&&center<608&&top>300&&top<930;
   const minimum=approach?1100:top<330?480:680;
   if((right-left)*(bottom-top)<minimum)return [];
  }
  let color=colors.get(Number(rgb));
  if(color===undefined){color=paperColor(Number(rgb),STOCKS[chapter]);colors.set(Number(rgb),color);}
  return [[color,encoded,offsetX,offsetY]];
 });
 const result={...source,paths};prepared.set(source,result);return result;
}
