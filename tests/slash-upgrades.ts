import assert from 'node:assert/strict';
import {Graphics} from 'pixi.js';
import {Game} from '../src/gameplay/game';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {drawSlashUpgrade,slashPaperLayout} from '../src/rendering/slash-upgrades';

const layout=slashPaperLayout(23,580);
assert.deepEqual(layout,slashPaperLayout(23,580));
assert.notDeepEqual(layout,slashPaperLayout(24,580));
assert.equal(layout.filter(p=>p.y>0).length,3);
assert.equal(layout.filter(p=>p.y<0).length,2);
assert.ok(new Set(layout.map(p=>p.angle)).size===5);
assert.ok(layout.every(p=>Number.isFinite(p.x+p.y+p.scale+p.angle)));
for(const lv of [2,3]){
 const g=new Game();g.start();g.director.disabled=true;g.cast('line');const s=g.skills[0];applySkillLevel(s,lv);
 s.age=.20;s.slash!.contacts.push({id:3,x:500,y:665,at:.17,secondary:true});
 const layers=Array.from({length:5},()=>new Graphics());
 const paths=()=>layers.map(p=>p.context.instructions.map(i=>{const ins=i as unknown as {action:string;data:{path:{instructions:unknown[]}}};return {action:ins.action,path:ins.data.path.instructions};}));
 const damage=s.damage;drawSlashUpgrade(s,layers,lv===2?.07:.09,lv===2?.28:.38);const first=paths();
 for(const layer of layers)layer.clear();drawSlashUpgrade(s,layers,lv===2?.07:.09,lv===2?.28:.38);
 assert.deepEqual(paths(),first);assert.equal(s.damage,damage);
 assert.ok(layers[0].context.instructions.length>0);assert.equal(layers[2].context.instructions.length>0,lv===3);
 for(const layer of layers)layer.destroy();
}
console.log('PASS slash upgrades: deterministic layouts and vector paths, asymmetric papers, no gameplay mutation');
