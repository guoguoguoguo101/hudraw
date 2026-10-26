import type {EliteKind,EliteState} from '../gameplay/hualing-elites';
export type ElitePose={time:number;charge:number;cast:number;impact:number;recoil:number;weak:number;recover:number;arrival:number;death:number;work:number;side:number};
export type EliteBone={name:string;pivot:[number,number];region:[number,number,number,number]};
export type JointPose={angle:number;x:number;y:number;sx:number;sy:number};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const u=clamp(n);return u*u*(3-2*u);};
const pulse=(age:number,speed=5)=>age>=0&&age<1.4?(1-Math.exp(-age*48))*Math.exp(-age*speed):0;
export function elitePose(s:EliteState,hit=0):ElitePose{
 const m=s.motion,age=m?.age??10,action=m?.action;
 const cast=action==='cast'?pulse(age)*(m?.power??1):0,impact=action==='impact'?pulse(age,7)*(m?.power??1):0;
 const recoil=Math.max(hit>0?smooth(hit/.23)*.7:0,action==='parry'?pulse(age,5)*(m?.power??1):0,action==='break'?pulse(age,4):0);
 return {time:s.clock,charge:s.phase==='windup'?smooth(s.age/.9):s.phase==='dash'&&action==='prepare'?1-smooth(age/.9)*.25:cast?(1-smooth(age/.2))*.75:0,cast,impact,recoil,weak:s.phase==='stagger'?smooth(s.age/.25):0,recover:s.phase==='recover'?1-smooth(s.age/1.1):0,arrival:s.phase==='arrive'?smooth(s.age/.65):1,death:0,work:s.phase==='dash'?.35:0,side:m?.side??1};
}
const bone=(name:string,x:number,y:number,cx:number,cy:number,rx:number,ry:number):EliteBone=>({name,pivot:[x,y],region:[cx,cy,rx,ry]});
const head=(x=.5,y=.4)=>bone('head',x,y+.12,x,y,.26,.24);
const arms=()=>[bone('left-arm',.35,.58,.16,.65,.25,.28),bone('right-arm',.65,.58,.84,.65,.25,.28)];
const feet=()=>[bone('left-foot',.35,.77,.28,.93,.16,.14),bone('right-foot',.65,.77,.72,.93,.16,.14)];
export const ELITE_BONES:Record<EliteKind,EliteBone[]>={
 umbrella:[bone('canopy',.5,.37,.5,.17,.65,.29),head(.5,.54),...arms(),bone('skirt',.5,.66,.5,.81,.38,.22),...feet()],
 lantern:[bone('body',.5,.63,.5,.5,.6,.5),bone('left-horn',.32,.32,.24,.12,.2,.23),bone('right-horn',.68,.32,.76,.12,.2,.23),bone('tassel',.5,.77,.5,.9,.2,.19),...feet()],
 puppet:[head(.5,.53),...arms(),bone('skirt',.5,.67,.5,.83,.4,.24),...feet()],
 stele:[head(.38,.39),bone('body',.4,.69,.4,.56,.39,.38),bone('left-arm',.26,.48,.14,.68,.2,.3),bone('right-arm',.55,.5,.65,.57,.21,.3),bone('stele',.77,.85,.78,.63,.24,.38),...feet()],
 moth:[head(.5,.56),bone('left-wing',.45,.52,.18,.38,.3,.39),bone('right-wing',.55,.52,.82,.38,.3,.39),bone('left-wing-low',.45,.65,.2,.84,.3,.22),bone('right-wing-low',.55,.65,.8,.84,.3,.22),bone('antennae',.5,.32,.5,.12,.25,.24)],
 reefCrab:[head(.5,.4),bone('left-claw',.32,.55,.13,.72,.26,.33),bone('right-claw',.68,.55,.87,.72,.26,.33),bone('left-foot',.36,.65,.28,.87,.25,.22),bone('right-foot',.64,.65,.72,.87,.25,.22)],
 jelly:[bone('bell',.5,.43,.5,.25,.6,.43),...[-.3,-.1,.1,.3].map((v,i)=>bone('tentacle-'+i,.5+v,.45,.5+v,.78,.18,.33))],
 clam:[bone('shell',.5,.66,.5,.25,.65,.46),head(.5,.51),bone('pearl',.5,.7,.5,.74,.19,.18),bone('left-arm',.4,.7,.18,.73,.27,.25),bone('right-arm',.6,.7,.82,.73,.27,.25)],
 hermit:[bone('ship',.5,.52,.5,.35,.55,.25),bone('sail',.6,.39,.58,.15,.3,.25),head(.5,.65),bone('left-claw',.3,.64,.15,.82,.25,.23),bone('right-claw',.7,.64,.85,.82,.25,.23)],
 rays:[bone('left-wing',.5,.3,.19,.21,.31,.28),bone('right-wing',.6,.3,.81,.22,.28,.27),bone('left-wing-low',.5,.67,.23,.7,.31,.3),bone('right-wing-low',.6,.72,.83,.79,.3,.28),bone('ribbon',.5,.5,.5,.54,.45,.25)],
 mirror:[head(.5,.49),...arms(),bone('left-mirror',.31,.25,.12,.18,.17,.24),bone('right-mirror',.69,.25,.88,.18,.17,.24),bone('crown',.5,.25,.5,.08,.2,.23),bone('skirt',.5,.67,.5,.85,.42,.24)],
 weaver:[head(.5,.39),...arms(),bone('left-sleeve',.29,.6,.15,.78,.25,.23),bone('right-sleeve',.71,.6,.85,.78,.25,.23),bone('skirt',.5,.62,.5,.86,.32,.24)],
 bell:[bone('bell',.5,.15,.5,.48,.6,.5),bone('clapper',.5,.66,.5,.89,.23,.2),bone('left-bell',.36,.3,.14,.62,.24,.3),bone('right-bell',.64,.3,.86,.62,.24,.3)],
 official:[head(.5,.47),...arms(),bone('crown',.5,.32,.5,.13,.64,.25),bone('stamp',.5,.65,.5,.76,.25,.25),...feet()],
 blade:[head(.5,.44),bone('left-blade',.31,.6,.13,.43,.25,.43),bone('right-blade',.69,.6,.87,.43,.25,.43),bone('skirt',.5,.65,.5,.85,.38,.25),...feet()],
 frostApe:[head(.5,.38),...arms(),bone('body',.5,.72,.5,.62,.37,.28),...feet()],
 crone:[head(.54,.48),bone('hood',.53,.45,.53,.2,.4,.32),bone('lantern',.3,.48,.15,.68,.24,.3),bone('skirt',.55,.64,.59,.84,.4,.25)],
 pineApe:[head(.38,.28),bone('left-arm',.3,.4,.2,.61,.2,.33),bone('right-arm',.58,.46,.52,.65,.25,.31),bone('pine',.72,.83,.77,.47,.29,.51),...feet()],
 deer:[bone('head',.3,.49,.3,.2,.3,.3),bone('rear-head',.76,.61,.76,.4,.25,.31),bone('left-foot',.27,.72,.24,.91,.2,.2),bone('right-foot',.58,.72,.58,.91,.2,.2),bone('rear-foot',.79,.76,.85,.9,.18,.2)],
 guardian:[head(.5,.77),bone('armor',.5,.7,.5,.23,.55,.38),bone('left-armor',.4,.74,.13,.52,.23,.35),bone('right-armor',.6,.74,.87,.52,.23,.35),...feet()],
};
export function eliteInfluence(b:EliteBone,u:number,v:number){const [x,y,rx,ry]=b.region;return 1-smooth(Math.hypot((u-x)/rx,(v-y)/ry));}
/** The phases share a timeline; anatomy and work gestures are specific to each spirit. */
export function eliteJoint(kind:EliteKind,b:EliteBone,p:ElitePose):JointPose{
 const n=b.name,t=p.time,c=p.charge,k=p.cast,h=p.recoil,i=p.impact,w=p.weak,d=p.death,work=p.work,s=n.startsWith('left')?-1:1;
 let angle=0,x=0,y=0,sx=1,sy=1;const wave=Math.sin(t*2+(s<0?0:1.3)),slow=Math.sin(t*1.6),jiggle=Math.sin(t*9)*h;
 if(n.includes('head')){angle=slow*.025-c*.12+k*.22-h*.18+w*(.11+Math.sin(t*4)*.04)+d*.3;y=c*.016-k*.022+h*.014+w*.025;}
 if(n.includes('arm')||n.includes('sleeve')){angle=s*(-wave*.045+c*.38-k*.62+h*.22+w*.15+d*.25);y=-c*.02+k*.026;}
 if(n.includes('foot')){angle=s*(c*.1-k*.22-i*.25+h*.14+w*.1)+wave*.025;y=-c*.018+k*.026+i*.03;}
 if(n==='skirt'){angle=wave*.035-k*.07+h*.1+w*.05;y=k*.018;sy=1+w*.035+d*.15;}
 if(kind==='umbrella'&&n==='canopy'){sx=1-c*.13+k*.19+w*.1;sy=1+c*.08-k*.13;angle=wave*.025+c*.08-k*.18+h*.2;y=-c*.035+k*.028;}
 if(kind==='lantern'){
  if(n==='body'){sx=1+slow*.018-c*.09+k*.1+h*.05;sy=1+slow*.025+c*.13-k*.12-h*.07;angle=wave*.025-h*.11+w*.08;}
  if(n.includes('horn'))angle=s*(wave*.055+c*.13-k*.17+h*.2);
  if(n==='tassel'){angle=wave*.16+c*.12-k*.42+h*.28;y=wave*.012;}
 }
 if(kind==='puppet'&&n.includes('arm')){angle=s*(wave*.08+work*Math.sin(t*3)*.18+c*.7-k*.85-h*.2+w*.4);x=s*k*.035;}
 if(kind==='stele'){
  if(n==='stele'){angle=c*.18-k*.3-i*.28+h*.2+w*.2;y=-c*.04+k*.035+i*.05;}
  if(n==='body'){sy=1-c*.13+k*.09-i*.1;angle=-c*.08+k*.18+h*.11;}
 }
 if(kind==='moth'||kind==='rays'){
  if(n.includes('wing')){const low=n.includes('low'),flap=Math.sin(t*(kind==='moth'?7:3.8)+(low?1:0));angle=s*(flap*.13+c*.3-k*.45+h*.22+w*.25+d*.5);sx=1-.12*(.5+.5*flap)-c*.1+k*.1;sy=1+flap*.04;}
  if(n==='antennae'||n==='ribbon')angle=wave*.09+c*.12-k*.23+h*.2;
 }
 if(kind==='reefCrab'||kind==='hermit'){
  if(n.includes('claw')){angle=s*(wave*.035+c*.55-k*.75-i*.18+h*.3+w*.35+d*.35);x=s*(c*.018+k*.026);y=-c*.045+k*.03;}
  if(n==='ship'){angle=wave*.045+c*.12-k*.23+h*.17+w*.11;y=slow*.01-c*.025;}
  if(n==='sail'){angle=Math.sin(t*3)*.08+c*.19-k*.3+h*.18;}
 }
 if(kind==='jelly'){
  if(n==='bell'){sx=1+slow*.035+c*.14-k*.21+h*.09;sy=1-slow*.025-c*.12+k*.18-h*.12;y=-c*.025+k*.026;}
  if(n.startsWith('tentacle')){const z=Number(n.at(-1));angle=Math.sin(t*2.7+z*.8)*.17+(z-1.5)*(c*.16-k*.22)+h*wave*.2;sy=1+c*.13-k*.14+w*.06;}
 }
 if(kind==='clam'){
  if(n==='shell'){sy=1+c*.16+k*.08+w*.25;angle=wave*.025+h*.12;y=-c*.08+w*-.08+k*.025;}
  if(n==='pearl'){sx=sy=1+slow*.04+c*.16-k*.2+h*.12;y=-c*.02+k*.03;}
 }
 if(kind==='mirror'&&n.includes('mirror')){angle=s*(wave*.08+c*.24-k*.48+h*.2);y=-c*.035+k*.025;}
 if(n==='crown'){angle=wave*.025+c*.05-k*.12+h*.14;y=-c*.025+k*.02;}
 if(kind==='weaver'&&n.includes('arm')){angle=s*(Math.sin(t*3+s)*.12*work+c*.6-k*.7+h*.25);x=s*(Math.sin(t*3+s)*.013*work+k*.02);}
 if(kind==='bell'){
  if(n==='bell'){angle=Math.sin(t*2.4)*(.045+work*.1)+c*.2-k*.38-h*.3+w*.17;sy=1+c*.04-k*.06;}
  if(n==='clapper'){angle=Math.sin(t*3.4)*(.12+work*.32)+c*.28-k*.65+h*.48;y=-c*.02+k*.025;}
  if(n.includes('-bell'))angle=s*(c*.08-k*.13+h*.1);
 }
 if(kind==='official'&&n==='stamp'){y=-c*.13+k*.14+i*.15-h*.05;angle=c*.08-k*.12;sy=1-k*.08;}
 if(kind==='blade'&&n.includes('blade')){angle=s*(Math.sin(t*2)*.06+c*.65-k*.95+h*.28+w*.23);x=s*(-c*.015+k*.04);}
 if(kind==='frostApe'&&n==='body'){sy=1-c*.1+k*.1-i*.12;angle=c*.04-k*.08+h*.08;}
 if(kind==='crone'){
  if(n==='lantern'){angle=Math.sin(t*2.5)*.15-c*.3+k*.5+h*.3;y=-c*.03+k*.02;}
  if(n==='hood'){angle=slow*.02+c*.05-k*.08+h*.12+w*.1;}
 }
 if(kind==='pineApe'&&n==='pine'){angle=Math.sin(t*8)*work*.055+c*.2-k*.35+i*.13+h*.2;y=-c*.055+k*.045;}
 if(kind==='deer'){
  if(n==='head'){angle=slow*.03+c*.22-k*.4-h*.22+w*.23;y=c*.02+k*.03;}
  if(n==='rear-head'){angle=Math.sin(t*2+1)*.035-c*.2+k*.25+h*.2;}
  if(n.includes('foot'))angle+=Math.sin(t*6+s)*work*.25;
 }
 if(kind==='guardian'){
  if(n.includes('armor')){const side=n==='armor'?0:s;angle=side*(c*.13-k*.2+h*.14+w*.18);x=side*(c*.018+w*.025);y=-c*.065+k*.055+h*.018;}
  if(n==='head'){y+=c*.04-k*.035;angle+=-c*.1+k*.13;}
 }
 angle+=jiggle*.025+p.recover*(n.includes('head')?.05:0);
 // Arrival uncoils the paper figure. Defeat folds limbs toward their own hinges.
 if(n.includes('arm')||n.includes('wing')||n.includes('claw'))angle+=s*((1-p.arrival)*.18+d*.32);
 y+=(1-p.arrival)*.02+d*.025;
 return {angle,x,y,sx,sy};
}
export function deformEliteVertex(kind:EliteKind,u:number,v:number,p:ElitePose){let dx=0,dy=0,total=0;for(const b of ELITE_BONES[kind]){const a=eliteInfluence(b,u,v);if(a<.0001)continue;const q=eliteJoint(kind,b,p),px=(u-b.pivot[0])*q.sx,py=(v-b.pivot[1])*q.sy,c=Math.cos(q.angle),s=Math.sin(q.angle);dx+=(b.pivot[0]+px*c-py*s+q.x-u)*a;dy+=(b.pivot[1]+px*s+py*c+q.y-v)*a;total+=a;}return {x:u+dx/Math.max(1,total),y:v+dy/Math.max(1,total)};}
