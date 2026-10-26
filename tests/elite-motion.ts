import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {createElite,ELITE_CATALOG,type EliteKind} from '../src/gameplay/hualing-elites';
import {elitePose,eliteJoint,ELITE_BONES,deformEliteVertex,type ElitePose} from '../src/rendering/elite-motion';
let groups=0;
for(const kind of Object.keys(ELITE_CATALOG) as EliteKind[]){
 const s=createElite(kind);s.phase='approach';s.clock=3;const idle=elitePose(s);
 s.phase='windup';s.age=.8;const charge=elitePose(s);assert.ok(charge.charge>.9);
 s.phase='dash';s.motion={action:'cast',age:.09,power:1,side:1,serial:1};const cast=elitePose(s);assert.ok(cast.cast>.5);s.motion.age=2;assert.equal(elitePose(s).cast,0);
 s.motion={action:'parry',age:.09,power:1,side:-1,serial:2};const recoil=elitePose(s);assert.ok(recoil.recoil>.5);s.phase='stagger';s.age=.8;const weak=elitePose(s);assert.equal(weak.weak,1);
 const changed=ELITE_BONES[kind].map(b=>{const [u,v]=b.region,a=deformEliteVertex(kind,u,v,idle),q=deformEliteVertex(kind,u,v,cast);return Math.hypot(a.x-q.x,a.y-q.y);});assert.ok(changed.filter(n=>n>.006).length>=3,kind+' must articulate multiple regions');
 for(const pose of [idle,charge,cast,recoil,weak,{...idle,death:1}])for(let y=0;y<=24;y++)for(let x=0;x<=24;x++){const u=x/24,v=y/24,p=deformEliteVertex(kind,u,v,pose);assert.ok(Number.isFinite(p.x+p.y));assert.ok(Math.hypot(p.x-u,p.y-v)<.5,kind+' bounded skin');}
 const left=ELITE_BONES[kind].find(b=>b.name.startsWith('left')),right=ELITE_BONES[kind].find(b=>b.name.startsWith('right'));if(left&&right){const a=eliteJoint(kind,left,cast),b=eliteJoint(kind,right,cast);assert.ok(Math.abs(a.angle-b.angle)>.01||Math.abs(a.x-b.x)>.01,kind+' opposite parts should not act like one rigid card');}
 groups++;
}
const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;const e=g.summonHualingElite('umbrella')!;g.enemies=[e];const f=g.hualing.elites.field;f.begin(e,g.hualing.bounds,g.enemies);assert.equal(e.elite!.motion!.action,'prepare');for(let i=0;i<57;i++)g.advance(1/60);assert.equal(e.elite!.motion!.action,'cast');const o=f.objects[0];g.strokeHualing({x:o.x-6,y:o.y},{x:o.x+6,y:o.y});assert.equal(e.elite!.motion!.action,'parry');g.advance(1/60);assert.equal(e.elite!.motion!.action,'parry','friendly projectiles must not retrigger enemy casting');const age=e.elite!.motion!.age;g.pause();g.advance(.1);assert.equal(e.elite!.motion!.age,age);
console.log(`PASS ${groups} independently articulated elite rigs: phase-driven prepare/cast/impact/recoil/weak/death, bounded joints, real projectile release/reflection and pause`);
