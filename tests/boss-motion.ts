import assert from 'node:assert/strict';
import {createChapterBoss} from '../src/gameplay/hualing-bosses';
import {spawnAssault} from '../src/gameplay/boss-battlefield';
import {bossPose,deformBossVertex,BOSS_BONES} from '../src/rendering/boss-motion';
for(const chapter of ['valley','sea','palace','snow'] as const){
 const state=createChapterBoss(chapter);state.phase='windup';state.clock=3;const a=spawnAssault(state.field,chapter,state.arena,{x:360,y:550});
 a.age=a.charge*.5;const half=bossPose(state);a.age=a.charge*.95;const charge=bossPose(state);assert.ok(charge.charge>half.charge&&charge.strike===0);
 a.age=a.charge;assert.equal(bossPose(state).strike,0,'anticipation cannot fire before the gameplay release');a.age=a.charge+.08;const cast=bossPose(state);assert.ok(cast.strike>.5);
 a.age=a.charge+1;assert.equal(bossPose(state).strike,0,'follow-through must settle');a.age=a.charge*.5;a.parried=true;assert.equal(bossPose(state).charge,0,'cancelled beam cannot continue charging');
 const baseline={...charge,charge:0,strike:0,recoil:0,time:0,parts:charge.parts?.map(()=>({charge:0,strike:0,recoil:0}))},poses=[charge,cast,{...baseline,recoil:1},{...baseline,weak:1},{...baseline,death:1}];
 const regionChanges=BOSS_BONES[chapter].map(b=>{const [u,v]=b.region,start=deformBossVertex(chapter,u,v,baseline),end=deformBossVertex(chapter,u,v,charge);return Math.hypot(start.x-end.x,start.y-end.y);});assert.ok(regionChanges.filter(d=>d>.008).length>=1,'the firing anatomical joint must articulate');
 for(const pose of poses)for(let y=0;y<=36;y++)for(let x=0;x<=36;x++){const u=x/36,v=y/36,p=deformBossVertex(chapter,u,v,pose);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Math.hypot(p.x-u,p.y-v)<.45,'articulation must not explode or fling vertices off screen');}
 console.log('PASS '+chapter+' independent joints, gameplay-aligned charge/release/cancel, bounded finite charge/cast/recoil/weak/death skin');
}
