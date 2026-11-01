import assert from 'node:assert/strict';
import {EnemySpatialIndex} from '../src/gameplay/enemy-spatial-index';
import {EnemyAI} from '../src/gameplay/ai';
import {setupAI,verifyAIOriginal} from './ai-neighbours-regression';
import type {Enemy} from '../src/core/types';

const {g}=setupAI(350,'spread'),source=g.enemies,index=new EnemySpatialIndex();
index.rebuild(source);assert.equal(index.indexed,true);
const expected=(x:number,y:number,r:number)=>source.filter(e=>Math.abs(e.x-x)<=r&&Math.abs(e.y-y)<=r).map(e=>e.id);
for(const [x,y,r]of [[0,0,145],[300,500,95],[-.001,-.001,47],[96,192,145],[720,1000,145]]){
 const actual=index.query(x,y,r).filter(e=>Math.abs(e.x-x)<=r&&Math.abs(e.y-y)<=r).map(e=>e.id);
 assert.deepEqual(actual,expected(x,y,r),'conservative query keeps original ordering and all exact neighbours');
}
// Moving a high-rank entity into an early bucket cannot move it ahead in accumulation order.
const moved=source.at(-1)!;moved.x=100;moved.y=100;index.update(moved);
assert.deepEqual(index.query(100,100,30).filter(e=>Math.abs(e.x-100)<=30&&Math.abs(e.y-100)<=30).map(e=>e.id),expected(100,100,30));
moved.x=-400;moved.y=-500;index.update(moved);assert.ok(index.query(-400,-500,1).includes(moved));assert.ok(!index.query(100,100,30).includes(moved));

const replacement=source.filter(e=>e!==moved);const added={...source[0],id:99999,x:-400,y:-500};replacement.push(added);index.syncSource(replacement);
assert.ok(index.query(-400,-500,1).includes(added));assert.ok(!index.query(-400,-500,1).includes(moved));
const backwards=[...replacement].reverse();index.rebuild(backwards);
assert.deepEqual(index.query(250,500,145).filter(e=>Math.abs(e.x-250)<=145&&Math.abs(e.y-500)<=145).map(e=>e.id),backwards.filter(e=>Math.abs(e.x-250)<=145&&Math.abs(e.y-500)<=145).map(e=>e.id),'an explicit new source order is preserved');

const small=source.slice(0,35);index.rebuild(small);assert.equal(index.indexed,false);assert.equal(index.query(0,0,1),small,'small encounters keep the original zero-sort source path');
const dense=setupAI(1000,'dense').g.enemies;index.rebuild(dense);assert.equal(index.indexed,false);assert.equal(index.query(180,260,145),dense,'a fully crowded cluster avoids pointless bucket maintenance');

// The elite-only 145 range must not accidentally become the ordinary 95 range.
const scene=setupAI(100,'spread').g;scene.enemies.forEach((e,i)=>{e.x=4000+i*100;e.y=4000;e.elite=undefined;e.chapterBoss=undefined;e.kind='ink';e.hp=1e6;});
const actor=scene.enemies[0],elite=scene.enemies[1],boss=scene.enemies[2];
Object.assign(actor,{x:100,y:300,ai:'Approach',look:undefined,vx:0,vy:0,age:0,stateAge:0,speed:35});
Object.assign(elite,{x:230,y:300,elite:{kind:'guardian'}});Object.assign(boss,{x:101,y:300,kind:'boss'});
const dt=1/60,d=Math.hypot(260,365),wantX=100+(260/d*35-16.5)*dt,wantY=300+365/d*35*dt;
EnemyAI.beginStep(scene);EnemyAI.update(scene,actor,dt);EnemyAI.syncEnemy(scene,actor);EnemyAI.endStep(scene);
assert.ok(Math.abs(actor.x-wantX)<1e-12&&Math.abs(actor.y-wantY)<1e-12,'elite at distance 130 repels, ordinary bosses retain their original exclusion');

// A direct update after endStep must not use a previous phase's stale spatial cells.
Object.assign(actor,{x:100,y:300,ai:'Approach',age:0,stateAge:0,vx:0,vy:0});elite.x=140;
const expectedDirect=100+(260/d*35-(145-40)*1.1)*dt;EnemyAI.update(scene,actor,dt);assert.ok(Math.abs(actor.x-expectedDirect)<1e-12);
verifyAIOriginal();
console.log('PASS stable spatial neighbours: source order, immediate cross-cell movement, removals/appends, negative coordinates, exact elite reach, boss exclusion, small/dense fallbacks, direct-update lifetime and 26 original AI goldens');
