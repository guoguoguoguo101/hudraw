import {worldPoint} from '../src/input/coordinates';
import './circle';
import './slash-length';
import assert from 'node:assert/strict';
import {recognize,resample,type Point,type Rune} from '../src/input/recognizer';
import {InputController} from '../src/input/controller';
import {Game} from '../src/gameplay/game';
import {CombatClock} from '../src/gameplay/clock';
import {COMBAT,SPELLS} from '../src/gameplay/config';
import {frameDelta} from '../src/gameplay/frame-budget';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {SkillTargetResolver} from '../src/gameplay/target';
import {Timeline,Animator,easing} from '../src/animation/timeline';
import type {PlatformAdapter,InputEvent} from '../src/platform/adapter';
let passed=0;function test(name:string,fn:()=>void){fn();passed++;console.log('PASS '+name);}
const polygon=(n:number,step=1)=>resample(Array.from({length:n+1},(_,i)=>({x:360+Math.cos(-Math.PI/2+i*step*Math.PI*2/n)*115,y:590+Math.sin(-Math.PI/2+i*step*Math.PI*2/n)*115})),150);
const samples={wave:Array.from({length:120},(_,i)=>({x:180+i*3,y:590+Math.sin(i/119*Math.PI*2)*70})),arc:Array.from({length:80},(_,i)=>({x:450+Math.cos(-Math.PI/2+i/79*Math.PI)*80,y:590+Math.sin(-Math.PI/2+i/79*Math.PI)*80})),line:resample([{x:210,y:590},{x:510,y:600}],100),circle:Array.from({length:120},(_,i)=>{const a=i/119*Math.PI*2;return {x:360+Math.cos(a)*(110+Math.sin(a*3)*5),y:590+Math.sin(a)*103};}),triangle:resample([{x:230,y:680},{x:360,y:460},{x:490,y:680}],120),star:polygon(5,2),z:resample([{x:230,y:490},{x:490,y:493},{x:232,y:701},{x:490,y:703}],150),spiral:Array.from({length:160},(_,i)=>{const a=i/159*Math.PI*5,r=8+i/159*117;return {x:360+Math.cos(a)*r,y:590+Math.sin(a)*r};})} satisfies Partial<Record<Rune,Point[]>>;
const transform=(pts:Point[],scale:number,angle:number)=>pts.map(p=>({x:360+((p.x-360)*Math.cos(angle)-(p.y-590)*Math.sin(angle))*scale,y:590+((p.x-360)*Math.sin(angle)+(p.y-590)*Math.cos(angle))*scale}));
for(const rune of ['line','circle','triangle','z'] as const)test(rune+' 标准/逆向/缩放/旋转/抖动识别',()=>{for(const [scale,angle] of [[1,0],[.48,.3],[1.2,-.45],[.75,1.3]]){const pts=transform(samples[rune],scale,angle);assert.equal(recognize(pts).rune,rune,JSON.stringify({rune,scale,angle,result:recognize(pts).rune}));assert.equal(recognize([...pts].reverse()).rune,rune);const jitter=pts.map((p,i)=>({x:p.x+Math.sin(i*1.7)*.8,y:p.y+Math.cos(i*1.9)*.8}));assert.equal(recognize(jitter).rune,rune);}});
test('短误触无消耗；有效乱画断符消散；单圆基础、多圈束缚',()=>{const g=new Game();g.start();const short=recognize([{x:350,y:500},{x:352,y:501}]);assert.equal(short.valid,false);assert.equal(g.cast(short),false);assert.equal(g.ink.currentInk,100);const doodle=recognize(resample([{x:210,y:440},{x:405,y:720},{x:235,y:640},{x:510,y:490},{x:270,y:810},{x:445,y:710}]));assert.equal(doodle.rune,'ink');g.cast(doodle);assert.ok(g.ink.currentInk<100);const repeated=recognize([...samples.circle,...samples.circle]);assert.equal(repeated.rune,'spiral');});
const tick=(g:Game,seconds:number)=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.update(1/60);};
const isolated=()=>{const g=new Game();g.start();g.director.disabled=true;return g;};
test('符境2秒=1战斗秒，30/60/120FPS一致，敌人不停，资源不受战斗慢动作扣费',()=>{for(const fps of [30,60,120]){const g=isolated(),e=g.spawn('ink',{x:530,y:665})!;e.ai='Approach';for(let i=0;i<fps*2;i++)g.advance(1/fps,true);assert.ok(Math.abs(g.time-1)<1e-8);assert.ok(e.x<530&&e.x>490);assert.equal(g.ink.currentInk,100);assert.ok(Math.abs(g.clock.real-2)<1e-8);}});
test('卡顿帧限制补算，不累积多秒战斗债务',()=>{assert.equal(frameDelta(3),.1);assert.equal(frameDelta(Infinity),0);assert.equal(frameDelta(-1),0);const c=new CombatClock();let steps=0;c.advance(frameDelta(3),false,false,()=>{steps++;});assert.equal(steps,6);assert.equal(frameDelta(1/60),1/60);});
test('独立时间累加器普通速度与暂停',()=>{const c=new CombatClock();let simulated=0;c.advance(2,false,true,d=>simulated+=d);assert.ok(Math.abs(simulated-1)<1e-8);c.advance(8,true,false,d=>simulated+=d);assert.ok(Math.abs(simulated-1)<1e-8);assert.equal(c.real,2);});
test('六符真实输入管线、3秒自动结束与单指约束',()=>{let callback:(e:InputEvent)=>void=()=>{};const port={input:(_c:unknown,fn:(e:InputEvent)=>void)=>{callback=fn;return ()=>{};}} as PlatformAdapter;const inputGame=new Game();inputGame.start();inputGame.director.disabled=true;inputGame.ink.setUnlimited(true);const results:string[]=[];const input=new InputController(port,{} as never,()=>true,r=>{results.push(r.rune!);return inputGame.cast(r);},()=>false,undefined,inputGame.pen,inputGame.ink);for(const rune of ['line','circle','triangle','z'] as const){const pts=samples[rune];callback({...pts[0],kind:'down',id:1});callback({x:600,y:900,kind:'down',id:2});for(const p of pts)callback({...p,kind:'move',id:1});callback({...pts.at(-1)!,kind:'up',id:1});inputGame.update(.1);assert.equal(inputGame.skills.at(-1)!.rune,rune);assert.equal(inputGame.skills.at(-1)!.geometry.points.length,64);}assert.deepEqual(results,['line','circle','triangle','z']);callback({...samples.line[0],kind:'down',id:1});for(const p of samples.line)callback({...p,kind:'move',id:1});input.update(2);assert.equal(input.drawing,true);input.update(2);assert.equal(input.drawing,false);assert.equal(results.at(-1),'line');});
test('灵墨按活动真实时间恢复；暂停不恢复，慢动作仍保持',()=>{const g=isolated();g.ink.setAmount(50);g.ink.update(2,g.active);assert.equal(g.ink.currentInk,66);g.pause();const t=g.time;g.advance(3,true);g.ink.update(3,g.active);assert.equal(g.ink.currentInk,66);assert.equal(g.time,t);g.pause();g.advance(.5,true);assert.ok(Math.abs(g.time-t-.25)<1e-8);});
test('一字斩方向、范围内全部穿透、同一次不重复伤害',()=>{const g=isolated();for(let i=0;i<4;i++)g.spawn('crow',{x:440+i*65,y:665});g.enemies.forEach(e=>e.hp=e.maxHp=500);g.spawn('ink',{x:280,y:665});g.cast('line',{x:1,y:0});tick(g,.2);assert.equal(g.enemies.filter(e=>e.hp===440).length,4);const hp=g.enemies[0].hp;tick(g,.25);assert.equal(g.enemies[0].hp,hp);assert.equal(g.enemies.at(-1)!.hp,40);});
test('圆半径、30伤害、20护盾、4秒过期',()=>{const g=isolated(),a=g.spawn('oni',{x:490,y:665})!,b=g.spawn('oni',{x:630,y:665})!;g.cast('circle');tick(g,.1);assert.equal(a.hp,210);assert.equal(b.hp,240);assert.equal(g.shield,20);g.hurt(10);assert.equal(g.life,100);assert.equal(g.shield,10);tick(g,4.1);assert.equal(g.shield,0);});
test('三角顶点索敌、破甲、精英/Boss蓄力打断',()=>{const g=isolated(),e=g.spawn('boss',{x:520,y:665})!;e.ai='Telegraph';e.stateAge=2;g.cast('triangle',{x:1,y:0});tick(g,.45);assert.equal(e.armorPool,0);assert.ok(Math.abs(e.hp-(1800-110*1.25))<.001);assert.equal(e.ai,'Hit');assert.equal(g.life,100);});
test('星芒多方向、单目标最多两次命中',()=>{const g=isolated(),e=g.spawn('boss',{x:360,y:665})!;e.armorPool=0;e.ai='Recovery';g.cast('star');tick(g,.12);assert.ok(e.hp>=1800-64);assert.ok(e.hp<1800);const hp=e.hp;tick(g,.2);assert.equal(e.hp,hp);});
test('雷法沿笔迹延迟命中，线外目标不自动索敌',()=>{const g=isolated();g.cast(recognize(samples.z));const e=g.spawn('oni',{x:450,y:490})!;e.hp=e.maxHp=500;e.ai='Telegraph';e.stateAge=-100;tick(g,.1);assert.equal(e.hp,500);tick(g,.8);assert.ok(e.hp<500);const h=isolated(),off=h.spawn('oni',{x:680,y:990})!;h.cast(recognize(samples.z));tick(h,1);assert.equal(off.hp,240);});
test('缚妖低伤害、控制与同时2个上限',()=>{const g=isolated();g.ink.setUnlimited(true);g.cast('spiral');const s=g.skills[0],e=g.spawn('oni',{x:s.x+50,y:s.y})!;e.ai='Telegraph';e.stateAge=-100;tick(g,2);assert.ok(e.hp>=240-s.damage);g.cast('spiral');g.cast('spiral');g.cast('spiral');assert.equal(g.skills.filter(s=>s.rune==='spiral').length,2);});
test('敌人预告→攻击→恢复；无敌1.2秒；死亡不再攻击',()=>{const g=isolated(),e=g.spawn('ink',{x:400,y:665})!;e.ai='Approach';tick(g,.1);assert.equal(e.ai,'Telegraph');assert.equal(g.life,100);tick(g,.7);assert.equal(g.life,90);g.hurt(20);assert.equal(g.life,90);g.damage(e,999);tick(g,1.3);assert.equal(g.life,90);g.hurt(20);assert.equal(g.life,70);});
test('鬼王三阶段、召唤、6秒血月、护盾应对与爆发打断',()=>{const g=isolated(),e=g.spawn('boss',{x:360,y:325})!;e.hp=1200;e.ai='Recovery';tick(g,4);assert.equal(e.phase,2);assert.ok(g.enemies.some(v=>v.kind==='crow'));g.enemies=g.enemies.filter(v=>v===e);e.hp=500;e.ai='Recovery';tick(g,3);assert.equal(e.phase,3);e.ai='Telegraph';e.stateAge=0;g.shield=20;g.shieldTime=10;tick(g,5.95);assert.equal(g.life,100);tick(g,.1);assert.equal(g.life,72);e.ai='Telegraph';e.stateAge=0;e.vx=0;g.damage(e,300);assert.equal(e.ai,'Hit');});
test('六件法宝逻辑与视觉字段、示范组合可用',()=>{for(const id of ['brush','seal','mirror','gourd','bell','feather'] as const){const g=isolated();g.modifiers.add(id);const rune=id==='gourd'?'spiral':id==='bell'?'z':id==='mirror'?'line':'star';g.cast(rune);const s=g.skills[0];if(id==='brush'){assert.equal(s.copies,1);assert.equal(s.damage,32);}if(id==='seal')assert.ok(s.seal&&s.duration>=2.5);if(id==='mirror')assert.equal(TalismanSpellFactory.directions(s).length,2);if(id==='gourd')assert.ok(s.radius>0&&s.strength>1);if(id==='bell')assert.equal(s.shock,true);if(id==='feather'){const e=g.spawn('oni',{x:540,y:665})!;g.ink.setAmount(100);g.cast('line');g.cast('line');assert.equal(e.hp,195);}}});
test('升级自动吸收灵气、三选一暂停、恢复与叠加',()=>{const g=isolated();for(let i=0;i<6;i++){const e=g.spawn('ink',{x:600,y:665})!;g.damage(e,100);}assert.equal(g.state,'upgrade');assert.equal(g.choices.length,3);assert.equal(new Set(g.choices).size,3);const t=g.time;g.advance(2);assert.equal(g.time,t);g.choose(0);assert.equal(g.state,'playing');assert.equal(g.modifiers.owned.size,1);});
test('预算刷怪上限、独立精英/Boss限制、完整胜负结算',()=>{const g=isolated();for(let i=0;i<80;i++)g.spawn('ink');assert.equal(g.enemies.length,35);for(let i=0;i<10;i++)g.spawn('oni');assert.equal(g.enemies.filter(e=>e.kind==='oni').length,3);g.spawn('boss');g.spawn('boss');assert.equal(g.enemies.filter(e=>e.kind==='boss').length,1);g.enemies=[];g.time=179.9;g.bossDead=true;tick(g,.2);assert.equal(g.state,'win');g.start();g.director.disabled=true;g.hurt(200);assert.equal(g.state,'lose');g.start(true);assert.equal(g.duration,90);assert.equal(g.life,100);});
test('目标危险评分、扇区与坐标方向一致',()=>{const g=isolated(),a=g.spawn('ink',{x:480,y:665})!,b=g.spawn('crow',{x:500,y:665})!,c=g.spawn('oni',{x:240,y:665})!;b.ai='Telegraph';assert.equal(SkillTargetResolver.priority(g.enemies,{x:1,y:0},520)!.id,b.id);assert.ok(!SkillTargetResolver.sector(g.enemies,{x:1,y:0},520).includes(c));assert.equal(recognize(transform(samples.line,1,Math.PI/2)).direction.y>0,true);});
test('原时间轴 easing、序列、循环、取消保持正常',()=>{const obj={x:0},t=new Timeline().step(obj,{x:10},1,easing.linear).step(obj,{x:20},1,easing.linear);t.repeat=1;t.update(2);assert.equal(obj.x,0);t.update(.5);assert.equal(obj.x,5);t.cancel();t.update(9);assert.equal(obj.x,5);});
test('375/390/430手机画幅的屏幕→世界方向一致',()=>{for(const width of [375,390,430]){const rect={x:17,y:50,width,height:width*1280/720};const a=worldPoint({x:17+width*.25,y:50+rect.height*.4},rect),b=worldPoint({x:17+width*.75,y:50+rect.height*.4},rect);assert.ok(Math.abs(a.x-180)<1e-8&&Math.abs(b.x-540)<1e-8);assert.ok(Math.abs(a.y-b.y)<1e-8);}});
test('感电按1秒两次结算，死亡状态清理',()=>{const g=isolated(),e=g.spawn('oni',{x:650,y:400})!;e.ai='Recovery';e.shock=2;tick(g,.1);assert.equal(e.hp,240);tick(g,1.95);assert.equal(e.hp,216);g.damage(e,999);assert.equal(e.shock,0);});
test('未成符无伤害、不触发法宝或生成技能',()=>{const g=isolated();for(let i=0;i<10;i++){g.modifiers.add('brush');g.modifiers.add('mirror');g.modifiers.add('feather');}g.casts=2;const e=g.spawn('oni',{x:340,y:580})!;g.cast('ink',{x:1,y:0});tick(g,.1);assert.equal(e.hp,240);assert.equal(g.formalCasts,0);assert.equal(g.skills.length,0);assert.equal(g.ink.last.refund,0);});
test('升级瞬间停止当前帧剩余战斗时间',()=>{const c=new CombatClock();let calls=0;c.advance(.1,false,false,()=>{calls++;return false;});assert.equal(calls,1);assert.ok(Math.abs(c.world-1/60)<1e-8);assert.equal(c.accumulator,0);});
test('Arrow and Z in every direction, reversed and uneven strokes',()=>{
 const arrow=resample([{x:230,y:680},{x:350,y:470},{x:470,y:660}],100);
 const z=resample([{x:230,y:490},{x:490,y:520},{x:270,y:700},{x:470,y:685}],100);
 for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8)for(const [rune,points] of [['triangle',arrow],['z',z]] as const){
  const rotated=transform(points,.8,angle);const expected=recognize(rotated);
  assert.equal(expected.rune,rune);const reverse=recognize([...rotated].reverse());assert.equal(reverse.rune,rune);
  if(rune==='triangle')assert.ok(expected.direction.x*reverse.direction.x+expected.direction.y*reverse.direction.y>.99);
 }
 assert.equal(recognize(samples.star).rune,'ink');assert.equal(recognize(samples.spiral).rune,'spiral');
 assert.notEqual(recognize(polygon(3)).rune,'triangle');
});
console.log('\n'+passed+' suites passed.');


test('中点锚定划斩：手绘长度1.5倍、反向保持位置、水平竖直斜线',()=>{
 for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:.6,y:.8}])for(const length of [100,400,800]){
  const g=isolated(),center={x:360,y:480};
  const points=[{x:center.x-d.x*length/2,y:center.y-d.y*length/2},{x:center.x+d.x*length/2,y:center.y+d.y*length/2}];
  assert.ok(g.cast(recognize(points)));const skill=g.skills.at(-1)!,path=skill.slash!.path!;
  assert.ok(Math.abs(skill.range-length*1.5)<1e-6);assert.ok(Math.abs((path[0].x+path[1].x)/2-center.x)<1e-6);assert.ok(Math.abs((path[0].y+path[1].y)/2-center.y)<1e-6);
  assert.ok(Math.abs(Math.hypot(path[1].x-path[0].x,path[1].y-path[0].y)-length*1.5)<1e-6);
 }
});
test('划斩左右两侧命中，范围外和角色原点不出刀，同一次只伤害一次',()=>{
 for(const reverse of [false,true]){
  const g=isolated(),a=g.spawn('crow',{x:240,y:350})!,b=g.spawn('crow',{x:360,y:350})!,c=g.spawn('crow',{x:650,y:350})!,fox=g.spawn('crow',{x:440,y:665})!;
  for(const e of [a,b,c,fox]){e.hp=e.maxHp=500;e.ai='Recovery';}
  const points=[{x:250,y:350},{x:350,y:350}];if(reverse)points.reverse();assert.ok(g.cast(recognize(points)));
  tick(g,.2);assert.ok(a.hp<500&&b.hp<500);assert.equal(c.hp,500);assert.equal(fox.hp,500);
  const hp=a.hp;tick(g,.2);assert.equal(a.hp,hp);
 }
});
test('手势划斩五个等级长度相同，绘卷尺寸保持原值',()=>{
 for(let level=1;level<=5;level++){
  const g=isolated();g.practice=true;g.practiceLevels.line=level;
  assert.ok(g.cast(recognize([{x:300,y:350},{x:400,y:350}])));
  const skill=g.skills.at(-1)!,path=skill.slash!.path!;
  assert.equal(skill.range,150);assert.ok(Math.abs((path[0].x+path[1].x)/2-350)<1e-6);
  if(skill.slash!.ultimate)assert.equal(skill.slash!.ultimate.slashLength,skill.range);
 }
});
