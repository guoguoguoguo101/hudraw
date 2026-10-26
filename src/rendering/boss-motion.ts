import {BOSS_PARTS} from '../gameplay/boss-anatomy';
import type {ChapterBossState} from '../gameplay/hualing-bosses';
import type {HualingChapter} from '../gameplay/hualing-chapters';

export type BossPose={time:number;charge:number;strike:number;recoil:number;weak:number;arrive:number;recover:number;rage:number;death:number;parts?:{charge:number;strike:number;recoil:number}[]};
export type PaperBone={name:string;pivot:[number,number];region:[number,number,number,number];strength?:number};
export type BonePose={angle:number;x:number;y:number;sx:number;sy:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const u=clamp(v);return u*u*(3-2*u);};
export function bossPose(s:ChapterBossState,hit=0):BossPose{
 let charge=0,strike=0;const parts=Array.from({length:9},()=>({charge:0,strike:0,recoil:0}));
 for(const a of s.field.attacks){
  if(a.age<0)continue;const part=parts[a.part??0];if(a.parried){part.recoil=Math.max(0,1-(a.age-a.resolvedAt)/.4);continue;}const t=a.age-a.charge;
  if(t<0&&!a.resolved)part.charge=Math.max(part.charge,ease(a.age/a.charge));else if(t>=0&&t<.85){part.charge=Math.max(part.charge,Math.exp(-t*12));part.strike=Math.max(part.strike,Math.exp(-t*5.5)*(1-Math.exp(-t*45)));}
  if(t<0&&!a.resolved)charge=Math.max(charge,ease(a.age/a.charge));
  else if(t>=0&&t<.85){charge=Math.max(charge,Math.exp(-t*12));strike=Math.max(strike,Math.exp(-t*5.5)*(1-Math.exp(-t*45)));}
 }
 if(s.phase==='attack'){charge=Math.max(charge,(1-ease(s.age/.22))*.8);strike=Math.max(strike,Math.exp(-Math.max(0,s.age-.16)*5)*ease(s.age/.16));}
 return {time:s.clock,charge,strike,parts,recoil:Math.max(clamp(s.field.flash/.32),clamp(hit/.23)*.4),weak:s.phase==='stagger'?ease(s.age/.3):0,arrive:s.phase==='arrive'?ease(s.age/1.25):1,recover:s.phase==='recover'?1-ease(s.age/.8):0,rage:s.enraged?1:0,death:0};
}
/** Normalised joints preserve the source contours. Each joint has a smooth skin influence. */
export const BOSS_BONES:Record<HualingChapter,PaperBone[]>={
 valley:[
  ...BOSS_PARTS.valley.map((part,i)=>({name:'tail-'+i,pivot:part.pivot,region:[part.tip[0],part.tip[1],.22,.27] as [number,number,number,number],strength:1.3})),
  {name:'chest',pivot:[.68,.73],region:[.66,.59,.2,.28]},
  {name:'head',pivot:[.71,.49],region:[.74,.33,.17,.23],strength:1.3},
  {name:'rear-leg',pivot:[.48,.73],region:[.4,.91,.12,.2]},
  {name:'front-leg',pivot:[.68,.72],region:[.68,.91,.12,.2]},
 ],
 sea:[
  {name:'upper-shell',pivot:[.5,.51],region:[.5,.17,.75,.48],strength:1.3},
  {name:'left-mantle',pivot:[.5,.61],region:[.2,.6,.32,.22]},
  {name:'right-mantle',pivot:[.5,.61],region:[.8,.6,.32,.22]},
  {name:'pearl-eye',pivot:[.5,.55],region:[.5,.55,.14,.11],strength:1.6},
  {name:'lower-shell',pivot:[.5,.68],region:[.5,.86,.75,.29],strength:1.3},
 ],
 palace:[
  {name:'astrolabe',pivot:[.5,.22],region:[.5,.14,.56,.25]},
  {name:'left-arm',pivot:[.34,.34],region:[.14,.52,.27,.24],strength:1.5},
  {name:'right-arm',pivot:[.66,.34],region:[.86,.52,.27,.24],strength:1.5},
  {name:'left-sleeve',pivot:[.3,.5],region:[.12,.75,.23,.29]},
  {name:'right-sleeve',pivot:[.7,.5],region:[.88,.75,.23,.29]},
  {name:'robe',pivot:[.5,.56],region:[.5,.85,.29,.31]},
  {name:'head',pivot:[.5,.31],region:[.5,.23,.12,.15],strength:1.3},
 ],
 snow:[
  {name:'neck',pivot:[.37,.56],region:[.31,.38,.23,.31]},
  {name:'head-antlers',pivot:[.34,.42],region:[.33,.16,.33,.32],strength:1.5},
  {name:'mane',pivot:[.37,.56],region:[.2,.51,.19,.24]},
  {name:'front-leg',pivot:[.29,.63],region:[.26,.87,.12,.22],strength:1.2},
  {name:'front-leg-far',pivot:[.39,.65],region:[.4,.88,.09,.22]},
  {name:'rear-leg',pivot:[.71,.65],region:[.72,.86,.17,.22]},
  {name:'ribbons',pivot:[.67,.49],region:[.87,.55,.29,.23]},
 ]
};
export function boneInfluence(b:PaperBone,u:number,v:number){const [x,y,rx,ry]=b.region,r=Math.hypot((u-x)/rx,(v-y)/ry);return (1-ease(r))*(b.strength??1);}
export function bonePose(chapter:HualingChapter,name:string,p:BossPose):BonePose{
 const index=name.startsWith('tail-')?Number(name.slice(5)):name==='left-arm'||name==='left-sleeve'||name==='left-mantle'?0:name==='right-arm'||name==='right-sleeve'||name==='right-mantle'?1:name==='front-leg'||name==='front-leg-far'?2:name==='rear-leg'?3:-1;
 const local=index>=0?p.parts?.[index]:undefined;
 const t=p.time,c=(local?.charge??p.charge)*(1+p.rage*.12),k=(local?.strike??p.strike)*(1+p.rage*.15),h=local?.recoil??p.recoil,w=p.weak,d=p.death,breath=Math.sin(t*1.8),q=(a=0)=>Math.sin(t*2+a);
 let angle=0,x=0,y=0,sx=1,sy=1;
 if(chapter==='valley'){
  if(name.startsWith('tail')){const i=Number(name.slice(5)),side=i<5?-1:1;angle=q(i*.9)*.014+side*(c*.28-k*.4+h*.28+w*.09+d*.22);y=q(i)*.007-c*.018+k*.027;}
  if(name==='chest'){angle=-c*.07+k*.12+h*.14;sy=1-c*.08+k*.1-w*.07;}
  if(name==='head'){angle=-.035+breath*.025-c*.19+k*.31-h*.25+w*.13+d*.5;x=c*.012+k*.028-h*.028;y=c*.025-k*.015+w*.025;}
  if(name==='front-leg'){angle=c*.13-k*.23+h*.17;y=-c*.025+Math.sin(Math.min(1,k*2)*Math.PI)*.04;}
  if(name==='rear-leg'){angle=-c*.1+k*.1+q(1)*.018;}
 }else if(chapter==='sea'){
  const open=.08+q()*.035+c*.42-k*.26+h*.25+w*.44;
  if(name==='upper-shell'){sy=1+open*.38;y=-open*.12;angle=breath*.012-h*.055+d*.16;}
  if(name==='lower-shell'){sy=1+open*.15;y=open*.055;angle=-breath*.012+h*.045+d*.12;}
  if(name==='left-mantle'||name==='right-mantle'){const side=name==='left-mantle'?-1:1;angle=side*(q(side)*.06+c*.2-k*.28+h*.15);x=side*open*.04;y=q(side)*.012;}
  if(name==='pearl-eye'){sx=1+c*.2-k*.34+h*.18;sy=1+c*.4-k*.25+w*.3;y=-c*.012+h*.018;}
 }else if(chapter==='palace'){
  if(name==='astrolabe'){angle=Math.sin(t*.65)*.1+c*.18+k*.2-h*.24+d*.3;}
  if(name==='left-arm'||name==='right-arm'){const side=name==='left-arm'?1:-1;angle=side*(q(side)*.05+c*.64-k*.42-h*.3-w*.24-d*.5);y=-c*.025+k*.025;}
  if(name==='left-sleeve'||name==='right-sleeve'){const side=name==='left-sleeve'?1:-1;angle=side*(q(side)*.045+c*.25-k*.37+h*.18+w*.1);x=q(side)*.009;y=k*.025;}
  if(name==='head'){angle=breath*.018-c*.07+k*.12+h*.16+w*.14+d*.45;y=-c*.018+k*.018;}
  if(name==='robe'){angle=q(2)*.025-c*.045+k*.09+h*.07;x=q()*.012;sy=1+w*.04+d*.1;}
 }else{
  if(name==='neck'){angle=-c*.16+k*.26-h*.19+w*.12+d*.3;sy=1+c*.04-k*.03;}
  if(name==='head-antlers'){angle=breath*.025-c*.26+k*.38-h*.3+w*.19+d*.5;x=c*.008+k*.025;y=-c*.026+k*.04;}
  if(name==='mane'){angle=q(2)*.045+c*.12-k*.18+h*.2;x=q()*.012;}
  if(name==='front-leg'){angle=c*.22-k*.32+h*.21+w*.11;y=-c*.04+k*.045;}
  if(name==='front-leg-far'){angle=-c*.1+k*.18+h*.12;}
  if(name==='rear-leg'){angle=c*.09-k*.16+h*.14+q(3)*.015;}
  if(name==='ribbons'){angle=q(2)*.07+c*.14-k*.2+h*.15;y=q()*.017;}
 }
 if(name.startsWith('tail'))angle+=(1-p.arrive)*.23+p.recover*.045;
 if(name.includes('head')){angle+=(1-p.arrive)*.2+p.recover*.06;y+=(1-p.arrive)*.025;}
 if(name.includes('arm'))angle+=(name.startsWith('left')?-1:1)*((1-p.arrive)*.3+p.recover*.12);
 if(name==='upper-shell')y+=(1-p.arrive)*.06+p.recover*.012;
 return {angle,x,y,sx,sy};
}

/** Smooth weighted skinning: joints move independently without exposed cut edges. */
export function deformBossVertex(chapter:HualingChapter,u:number,v:number,p:BossPose){
 let x=u,y=v,sum=0,dx=0,dy=0;
 for(const b of BOSS_BONES[chapter]){const weight=boneInfluence(b,u,v);if(weight<.0001)continue;const pose=bonePose(chapter,b.name,p),px=(u-b.pivot[0])*pose.sx,py=(v-b.pivot[1])*pose.sy,c=Math.cos(pose.angle),s=Math.sin(pose.angle);dx+=(b.pivot[0]+px*c-py*s+pose.x-u)*weight;dy+=(b.pivot[1]+px*s+py*c+pose.y-v)*weight;sum+=weight;}
 const divisor=Math.max(1,sum);x+=dx/divisor;y+=dy/divisor;return {x,y};
}
