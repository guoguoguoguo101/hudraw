import assert from 'node:assert/strict';
import {FoxMotion,FOX_ACTION_DURATION,foxSpell,type FoxAction} from '../src/animation/fox-motion';

const m=new FoxMotion();
assert.equal(m.act('attack'),true);m.advance(.1);
assert.equal(m.act('attack'),false,'continuous brush events must not restart the wind-up every frame');
assert.ok(m.pose.power>0);m.advance(.1);const side=m.side;m.act('attack');assert.equal(m.side,-side,'alternate paws');
m.act('hit');m.advance(.1);const age=m.age;
for(const action of ['attack','cast','summon','enchant','collect'] as FoxAction[])assert.equal(m.act(action),false,'recoil takes priority over '+action);
assert.equal(m.age,age);assert.equal(m.expression,'hurt');assert.ok(m.pose.hit>.5);
for(let i=0;i<6;i++)m.advance(.1);assert.equal(m.mode,'idle');assert.equal(m.act('cast',0,'dragon'),true);assert.equal(m.expression,'wonder');
m.reset();m.interaction='ready';m.advance(.1);assert.equal(m.expression,'wonder');assert.ok(m.energy>0);
m.act('cast',0,'guard');assert.equal(m.expression,'serene');
m.act('hit');m.act('victory');assert.equal(m.expression,'happy');assert.equal(m.act('hit'),false);
m.act('death');for(let i=0;i<20;i++)m.advance(.1);assert.equal(m.mode,'death');assert.equal(m.act('cast'),false);assert.equal(m.act('victory'),false);
m.act('idle');assert.equal(m.mode,'idle');assert.equal(m.energy,0);
for(const action of Object.keys(FOX_ACTION_DURATION) as FoxAction[]){
 m.reset();m.act(action);const frozen={...m.pose,age:m.age};m.advance(0);assert.deepEqual({...m.pose,age:m.age},frozen);
 for(let i=0;i<40;i++){m.advance(1/60);for(const value of Object.values(m.pose))if(typeof value==='number')assert.ok(Number.isFinite(value));}
}
assert.equal(foxSpell('z'),'thunder');assert.equal(foxSpell('circle'),'guard');assert.equal(foxSpell('line'),'slash');assert.equal(foxSpell('arc'),'moon');
console.log('PASS fox action priority, alternating paws, sustained input, spell expressions, recovery, terminal states and pause');
