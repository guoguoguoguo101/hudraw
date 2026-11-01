import {CollectedTalismanRenderer} from '../src/rendering/collected-talismans';
import {CircleRenderer} from '../src/rendering/circle';
import {FoxThunderUltimate} from '../src/rendering/fox-thunder-ultimate';
import {FrontlineFox} from '../src/rendering/frontline-fox';
import {FoxMotion} from '../src/animation/fox-motion';
import type {FoxRig} from '../src/rendering/fox-rig';
import {frontlineRuneIcon} from '../src/rendering/frontline-rune-art';
import {COLLECTED_RUNES} from '../src/gameplay/collected-talismans';
import {PaperMeshRelief,paperStock} from '../src/rendering/paper-material';
import {MeshPlane,Texture} from 'pixi.js';
import assert from 'node:assert/strict';
import {Container,Graphics} from 'pixi.js';
import {FrontlineMonsterRig} from '../src/rendering/frontline-monsters';
import {FrontlineSpellRenderer} from '../src/rendering/frontline-spells';
import {PAPER_MONSTERS} from '../src/gameplay/paper-monsters';
import {Game} from '../src/gameplay/game';
function nodes(root:Container):Container[]{return [root,...root.children.flatMap(n=>nodes(n))];}
const g=new Game();g.startFrontline();g.hualing.upgrades.panel=null;g.hualing.upgrades.pending=0;g.director.disabled=true;g.hualing.frozen=true;
for(const model of PAPER_MONSTERS){
 const rig=new FrontlineMonsterRig(model.id),enemy=g.spawn(model.kind,{x:360,y:450},model.id)!;
 const staticCount=()=>nodes(rig.root).reduce((n,r)=>n+(r instanceof Graphics?r.context.instructions.length:0),0),count=staticCount();assert.ok(count>20&&count<800,model.id+' bounded authored geometry');
 const initial=nodes(rig.root).map(n=>[n.position.x,n.position.y,n.scale.x,n.scale.y,n.rotation]);
 for(const phase of ['Approach','Telegraph','Attack','Hit'] as const){enemy.ai=phase;enemy.stateAge=.4;enemy.hit=phase==='Hit'?.19:0;enemy.age=1.7;rig.update(enemy);for(const n of nodes(rig.root))assert.ok([n.position.x,n.position.y,n.scale.x,n.scale.y,n.rotation].every(Number.isFinite));assert.equal(staticCount(),count,'animation must not rebuild geometry');}
 const poses=nodes(rig.root).map(n=>[n.position.x,n.position.y,n.scale.x,n.scale.y,n.rotation]);assert.notDeepEqual(initial,poses);
 const bounds=rig.root.getLocalBounds();assert.ok(bounds.width<240&&bounds.height<240&&bounds.width>50&&bounds.height>50,model.id+' stays within its actor footprint');rig.root.destroy({children:true});g.enemies=[];
}
const fx=new FrontlineSpellRenderer();fx.update(g,0);for(let i=0;i<50;i++)fx.hit(300+i,500,i%2===0);
g.collected.preview(g,'ward',{x:360,y:500});g.pulse.release(g,{x:300,y:450});g.pulse.effect!.age=.15;
const before=JSON.stringify({pulse:g.pulse.effect,casts:g.collected.casts,time:g.time,enemies:g.enemies});fx.update(g,.1);assert.equal(JSON.stringify({pulse:g.pulse.effect,casts:g.collected.casts,time:g.time,enemies:g.enemies}),before,'cosmetic rendering cannot alter combat');
const count=nodes(fx.front).reduce((n,r)=>n+(r instanceof Graphics?r.context.instructions.length:0),0);assert.ok(count<2500&&count>100,'bounded contact particles and spell layers');
fx.update(g,0);const frozen=nodes(fx.front).reduce((n,r)=>n+(r instanceof Graphics?r.context.instructions.length:0),0);fx.update(g,0);assert.equal(nodes(fx.front).reduce((n,r)=>n+(r instanceof Graphics?r.context.instructions.length:0),0),frozen);
g.menu();fx.update(g,.1);assert.equal(fx.front.visible,false);assert.equal(fx.back.visible,false);
console.log('PASS frontline art: all fifteen bounded articulated actors, static geometry, finite motion, bounded spell/contact layers, pause and no gameplay mutation');

{
 const g=new Game();g.startFrontline();const actor=new FrontlineFox(),motion=new FoxMotion(),fox={motion,root:{alpha:1}} as FoxRig;
 for(const action of ['idle','cast','hit','victory','death'] as const){motion.act(action);motion.advance(.15);actor.update(g,fox,3.2);for(const n of nodes(actor.root))assert.ok([n.x,n.y,n.rotation,n.scale.x,n.scale.y].every(Number.isFinite));assert.ok(actor.root.getLocalBounds().width<260);}
 g.menu();actor.update(g,fox,4);assert.equal(actor.root.visible,false);actor.root.destroy({children:true});
 for(const kind of COLLECTED_RUNES){const art=new Graphics();frontlineRuneIcon(art,kind);const b=art.getLocalBounds();assert.ok(b.width>10&&b.height>10&&b.width<95&&b.height<95,kind+' card icon readable in its slot');art.destroy();}
 const root=new Container(),mesh=new MeshPlane({texture:Texture.EMPTY,verticesX:3,verticesY:3});root.addChild(mesh);const relief=new PaperMeshRelief(mesh);relief.update(true);const edges=root.children.filter(n=>n!==mesh) as MeshPlane[];assert.equal(edges.length,2);assert.ok(edges.every(e=>e.geometry===mesh.geometry),'material edges share the real skinned anatomy');relief.update(false);assert.ok(edges.every(e=>!e.visible));relief.destroy();assert.equal(root.children.length,1);
 for(const ch of ['valley','sea','palace','snow'] as const)for(const c of [0,0xffffff,0x9d422e,0x678c96])assert.ok(Number.isInteger(paperStock(c,ch)));
 console.log('PASS unified art: hero action poses, all ten painted icons, shared skinned material edges, legacy visibility and bounded four-chapter colors');
}

// The frontline art pass must never replace or hide either complete ultimate.
for(const frontline of [false,true]){
 const g=new Game();if(frontline)g.startFrontline();else g.start(false,true,false,false,true);g.hualing.upgrades.panel=null;g.hualing.upgrades.pending=0;g.hualing.upgrades.growth=false;g.hualing.bounds={left:34,right:686,top:260,bottom:1058};
 assert.ok(g.collected.preview(g,'ward',{x:360,y:550}));g.collected.casts[0].age=1;
 const renderer=new CollectedTalismanRenderer();renderer.update(g);
 const circles=(renderer as unknown as {circles:CircleRenderer}).circles,ward=circles.wards.get(g.collected.casts[0].id)!;
 assert.ok(ward.grand?.fox,'nine-tail ward retains the full fox spirit');assert.equal(ward.grand!.fox!.tails.length,9);assert.equal(ward.front.visible,true);assert.equal(ward.back.visible,true);
 assert.ok(g.collected.preview(g,'storm',{x:360,y:550}));const storm=g.collected.casts.find(c=>c.kind==='storm')!;storm.age=.9;storm.marks[0].push({x:360,y:500});renderer.update(g);
 const fox=renderer.root.children.find(n=>n instanceof FoxThunderUltimate) as FoxThunderUltimate;assert.ok(fox?.visible,'sky-thunder fox must be visible in both modes');assert.ok(fox.alpha>.5&&fox.fox.alpha>0);assert.equal(fox.foxTailLayers.length,9);assert.ok(fox.scrolls.length&&fox.cloudLayers.length&&fox.talismanLayers.length,'clouds, scrolls and flying talismans survive');
 g.collected.reset();renderer.update(g);assert.equal(circles.wards.size,0);assert.ok(!renderer.root.children.some(n=>n instanceof FoxThunderUltimate));renderer.root.destroy({children:true});
}
console.log('PASS ultimate rendering regression: full nine-tail spirit, fox/thunder/clouds/scrolls and cleanup in legacy and frontline modes');
