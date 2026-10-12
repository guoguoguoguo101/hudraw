import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {playFoxGuardianSkill,guardianTimeline,guardianPose} from '../src/gameplay/fox-guardian';
import {buildGuardianScene} from '../src/rendering/fox-vestment-scene';
const game=()=>{const g=new Game();g.start();g.director.disabled=true;g.invulnerable=999;return g;};
const tick=(g:Game,t:number)=>{for(let i=0;i<Math.ceil(t*120);i++){for(const e of g.enemies){e.ai='Recovery';e.stateAge=0;}g.update(1/120);}};
// Damage waits for physical contact, follows a moving target and is deduplicated.
for(const lv of [1,2,3])for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 const g=game(),dir={x:Math.cos(angle),y:Math.sin(angle)},e=g.spawn('boss',{x:360+dir.x*250,y:665+dir.y*250})!;
 e.hp=e.maxHp=20000;e.armorPool=0;g.cast('triangle',dir);const s=g.skills[0];applySkillLevel(s,lv);tick(g,.1);assert.equal(e.hp,20000);
 tick(g,.32);e.x-=dir.y*90;e.y+=dir.x*90;tick(g,1.2);
 assert.ok(s.arrows!.projectiles.some(p=>p.impact));assert.equal(s.hit.size,1);assert.ok(Math.abs(e.hp-(20000-s.damage*1.25))<.01);
 assert.equal(s.arrows!.projectiles.length,[1,1,3,1][lv-1]);assert.ok(s.arrows!.projectiles.every(p=>p.trail.length<=30));
 tick(g,2);assert.equal(g.skills.length,0);
}
// A dead locked target is reacquired; targets behind the gesture are excluded at Lv1.
{const g=game(),a=g.spawn('crow',{x:610,y:665})!,b=g.spawn('crow',{x:620,y:690})!;a.hp=b.hp=2000;g.cast('triangle');tick(g,.18);g.damage(a,9999);tick(g,.8);assert.ok(b.hp<2000);}
{const g=game(),e=g.spawn('crow',{x:200,y:665})!;g.cast('triangle');tick(g,2.5);assert.equal(e.hp,e.maxHp);assert.equal(g.skills.length,0);}
{const g=game();g.modifiers.add('mirror');const a=g.spawn('crow',{x:600,y:665})!,b=g.spawn('crow',{x:120,y:665})!;a.hp=b.hp=2000;g.cast('triangle');tick(g,.9);assert.ok(a.hp<2000&&b.hp<2000);assert.equal(g.skills[0].arrows!.projectiles.length,2);}
// Guardian Lv4 has no projectile. Hero hold completes before shield and area release.
{const g=game(),a=g.spawn('crow',{x:360,y:565})!,b=g.spawn('crow',{x:360,y:765})!,far=g.spawn('crow',{x:360,y:1100})!;a.hp=b.hp=far.hp=20000;g.cast('triangle');const s=g.skills[0];applySkillLevel(s,4);tick(g,2.38);assert.equal(s.arrows!.projectiles.length,0);assert.equal(g.shield,0);assert.equal(a.hp,20000);assert.equal(b.hp,20000);tick(g,.05);assert.equal(s.hit.size,2);assert.equal(far.hp,20000);assert.equal(g.shield,80);const hp=[a.hp,b.hp];tick(g,.3);assert.deepEqual([a.hp,b.hp],hp);tick(g,.4);assert.equal(g.skills.length,0);assert.ok(g.shieldTime>3);g.invulnerable=0;g.hurt(90);assert.equal(g.life,90);}
{const g=game();g.cast('triangle');const s=g.skills[0];applySkillLevel(s,4);const cfg=playFoxGuardianSkill(s,{phaseDurations:[.4,.7,.8,.9,.6],fadeDuration:.4});assert.ok(Math.abs(s.duration-3.8)<1e-8);tick(g,3.3);assert.equal(g.shield,0);tick(g,.12);assert.equal(g.shield,80);tick(g,.45);assert.equal(g.skills.length,0);assert.deepEqual([.2,.6,1.3,2.2,3,3.6].map(t=>guardianTimeline(t,cfg).name),['ritual','emerge','orbit','vestment','heroHold','fade']);}
for(const t of [.2,.69,1.14,1.5,1.9,2.16]){const scene=buildGuardianScene(t);assert.ok([...scene.back,...scene.front].every(s=>!s.d.includes('NaN')&&!s.d.includes('Infinity')));if(t===2.16){assert.equal(scene.clothProgress,1);assert.equal(scene.phase,'heroHold');assert.ok(scene.front.some(s=>s.id==='scroll-4'));assert.ok(scene.front.some(s=>s.id==='scroll-7'));}}
{const start=guardianPose(.8),end=guardianPose(1.4);assert.ok(Math.hypot(start.x-end.x,start.y-end.y)<1e-7);assert.equal(start.state.orbit,0);assert.equal(end.state.orbit,1);}
console.log('PASS Lv1–3 tracking, retarget and mirror; Lv4 guardian hold, shield, single radial release, tunable timeline, vector cloth and cleanup');
