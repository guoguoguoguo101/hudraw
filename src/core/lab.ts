import {SLASH_STAGES} from '../gameplay/slash';
import {THUNDER_STAGES} from '../gameplay/thunder';
import {ARROW_STAGES} from '../gameplay/arrows';
import {FOX_GUARDIAN_DEFAULTS,playFoxGuardianSkill,guardianTimeline,type FoxGuardianConfig} from '../gameplay/fox-guardian';
import {circleStage} from '../gameplay/circle-levels';
import {FOX_SCALE} from '../rendering/appearance';
import {SKILL_LEVELS,applySkillLevel,type ActiveRune} from '../gameplay/skill-levels';
import {selectUltimate,ultimateParams,type UltimateVariant,type UltimateParams} from '../gameplay/ultimate';
import type {Game} from '../gameplay/game';
import type {GameView} from '../rendering/view';
import type {InputController} from '../input/controller';
import {RELICS,type RelicId} from '../gameplay/modifiers';
import {recognize,resample,NAMES,type Rune,type Recognition} from '../input/recognizer';

export function setupLab(game:Game,view:GameView,input:InputController){
 document.title='灵魂画卷 · 技能测试场';document.body.classList.add('lab');
 const panel=document.createElement('aside');panel.className='lab-panel';document.body.append(panel);
 panel.id='lab-controls';
 const mobileLayout=matchMedia('(max-width:800px), (max-height:500px)');
 const controlsToggle=document.createElement('button');controlsToggle.className='lab-controls-toggle';controlsToggle.textContent='技能栏';controlsToggle.setAttribute('aria-controls',panel.id);document.body.append(controlsToggle);
 let controlsOpen=false;
 const setControls=(open:boolean)=>{controlsOpen=open;document.body.classList.toggle('lab-controls-open',open);controlsToggle.textContent=open?'收起技能栏':'技能栏';controlsToggle.setAttribute('aria-expanded',String(open));panel.inert=mobileLayout.matches&&!open;};
 controlsToggle.onclick=()=>setControls(!controlsOpen);mobileLayout.addEventListener('change',()=>setControls(false));setControls(false);
 panel.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('button'):null;if(mobileLayout.matches&&target&&/^(雷符 Lv|符箭 Lv|圆阵 Lv|预览 Lv|释放$|重播)/.test(target.textContent??'')){setControls(false);controlsToggle.focus({preventScroll:true});}});
 const ranks=new Map<Rune,number>();let direction=0,frozen=false,spawnAt=0;
 panel.innerHTML='<h1>技能测试场</h1><p>无限符纸 · 无敌 · 不结算 · 不保存进度</p><p>点击技能自动画符；也可以在画面中手画。</p>';
 const row=(title:string)=>{const el=document.createElement('div');el.className='lab-row';const label=document.createElement('span');label.textContent=title;el.append(label);panel.append(el);return el;};
 const button=(parent:HTMLElement,label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;parent.append(b);return b;};
 const number=(parent:HTMLElement,value:number,min:number,max:number,change:(n:number)=>void)=>{const el=document.createElement('input');el.type='number';el.value=String(value);el.min=String(min);el.max=String(max);const set=(n:number)=>{n=Math.max(min,Math.min(max,Math.floor(Number.isFinite(n)?n:min)));el.value=String(n);change(n);};button(parent,'−',()=>set(Number(el.value)-1));parent.append(el);button(parent,'+',()=>set(Number(el.value)+1));el.onchange=()=>set(Number(el.value));return el;};
 const aim=row('施法方向');const select=document.createElement('select');for(const [i,name] of ['→ 右','↘ 右下','↓ 下','↙ 左下','← 左','↖ 左上','↑ 上','↗ 右上'].entries()){const option=document.createElement('option');option.value=String(i*Math.PI/4);option.textContent=name;select.append(option);}select.onchange=()=>direction=Number(select.value);aim.append(select);
 const status=document.createElement('p');status.className='lab-status';
 const afterCast=(r:Recognition)=>{const s=game.skills.at(-1);if(s){applySkillLevel(s,ranks.get(s.rune)??1);status.textContent=`${s.rune in SKILL_LEVELS?SKILL_LEVELS[s.rune as ActiveRune][(s.testLevel??1)-1].name:r.reason} Lv${s.testLevel} · 伤害参数 ${s.damage.toFixed(1)} · 范围 ${s.radius||s.range} · 持续 ${s.duration.toFixed(2)}秒`;}game.charges.papers=3;};
 const points=(rune:Rune)=>{
  const base=rune==='circle'?Array.from({length:100},(_,i)=>({x:Math.cos(i/99*Math.PI*2)*120,y:Math.sin(i/99*Math.PI*2)*120})):rune==='triangle'?resample([{x:-90,y:-100},{x:100,y:0},{x:-90,y:100}],100):rune==='z'?resample([{x:-110,y:-100},{x:110,y:-100},{x:-110,y:100},{x:110,y:100}],100):resample([{x:-140,y:0},{x:140,y:0}],100);
  const angle=rune==='z'?direction-Math.atan2(200,220):direction;
  return base.map(p=>({x:360+p.x*Math.cos(angle)-p.y*Math.sin(angle),y:665+p.x*Math.sin(angle)+p.y*Math.cos(angle)}));
 };
 panel.insertAdjacentHTML('beforeend','<h2>技能栏 · 1 / 2 / 3 / 4 键施放</h2><p>直线、圆形护阵支持Lv1–Lv5，其余技能支持Lv1–Lv4。等级同时改变伤害、范围或攻击方式。</p>');
 const cast=(rune:ActiveRune)=>{if(game.state==='paused')game.pause();input.cancel();const pts=points(rune);game.charges.papers=3;input.event({...pts[0],id:777,kind:'down'});for(const p of pts)input.event({...p,id:777,kind:'move'});input.event({...pts.at(-1)!,id:777,kind:'up'});};
 const runes=['line','circle','triangle','z'] as const;
 for(const [index,rune] of runes.entries()){
  ranks.set(rune,1);const el=row(`${index+1} · ${NAMES[rune]}`);button(el,'释放',()=>cast(rune));
  const choices=document.createElement('div');choices.className='lab-levels';panel.append(choices);
  for(const [i,spec] of SKILL_LEVELS[rune].entries()){
   const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name=`level-${rune}`;radio.value=String(i+1);radio.checked=i===0;radio.onchange=()=>ranks.set(rune,i+1);
   label.append(radio,document.createTextNode(`Lv${i+1} ${spec.name}`));label.title=spec.detail;choices.append(label);
  }
 }
 window.addEventListener('keydown',e=>{if(e.repeat||(e.target instanceof HTMLElement&&['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)))return;const rune=runes[Number(e.key)-1];if(rune){e.preventDefault();cast(rune);}});
 const previewPanel=document.createElement('section');previewPanel.className='slash-preview';previewPanel.innerHTML='<h2>一字斩 · 五级动画预览</h2><p>一键切换并重播；可冻结动画，拖动时间检查每层特效。预览靶不移动。</p>';panel.insertBefore(previewPanel,panel.querySelector('h2'));
 const previewRow=document.createElement('div');previewRow.className='lab-row';previewPanel.append(previewRow);
 let previewRepeat=false;let previewActive=false,previewLevel=1,previewTime=0,previewPlaying=false,previewRune:ActiveRune='line',previewEnd=1.05;let movingArrows=true;const arrowBases=new Map<number,{x:number;y:number;phase:number}>();
 const scrub=document.createElement('input');scrub.type='range';scrub.min='0';scrub.max='1.05';scrub.step='.005';scrub.value='0';scrub.style.width='100%';previewPanel.append(scrub);
 const timeLabel=document.createElement('p');previewPanel.append(timeLabel);
 const moveArrowTargets=(dt:number)=>{if(previewRune!=='triangle')return;for(const e of game.enemies){const b=arrowBases.get(e.id);if(b){const offset=movingArrows?Math.sin((game.time+dt)*3.6+b.phase)*55:0;e.x=b.x-Math.sin(direction)*offset;e.y=b.y+Math.cos(direction)*offset;e.ai='Recovery';e.stateAge=0;e.vx=e.vy=0;}}};
 const arrowOptions:Partial<FoxGuardianConfig>={};
 const preparePreview=(level:number,time?:number,rune:ActiveRune='line')=>{
  previewRune=rune;previewEnd=rune==='z'?THUNDER_STAGES[level-1].duration:rune==='circle'?circleStage(level).duration:rune==='triangle'?ARROW_STAGES[level-1].duration:level===4?1.05:SLASH_STAGES[level-1].visual_duration;scrub.max=String(previewEnd);
  previewActive=true;previewPlaying=time===undefined;previewLevel=level;previewTime=0;input.cancel();game.brush.clear();game.skills=[];game.events=[];game.enemies=[];game.state='playing';game.pendingLevels=0;game.xp=0;game.time=0;game.score=0;game.kills=0;game.casts=0;game.hitStopRemaining=0;view.begin();view.animator.clear();view.entrance.y=665;view.entrance.scale=FOX_SCALE;
  arrowBases.clear();
  if(rune==='z'){for(let i=0;i<[1,3,6,8][level-1];i++){const a=-Math.PI/2+i*(level===2?.8:Math.PI*2/[1,3,6,8][level-1]),r=level===2?170:220;const e=game.spawn('crow',{x:360+Math.cos(a)*r,y:665+Math.sin(a)*r})!;e.hp=e.maxHp=3000;e.ai='Recovery';}}else if(rune==='triangle')for(let i=0;i<(level===4?1:level===3?3:1);i++){
   const a=direction+(level===4?i*Math.PI/3:(i-((level===3?3:1)-1)/2)*.38),distance=level===4?260:220+(i%2)*40;
   const e=game.spawn('crow',{x:360+Math.cos(a)*distance,y:665+Math.sin(a)*distance})!;e.hp=e.maxHp=2000;e.ai='Recovery';arrowBases.set(e.id,{x:e.x,y:e.y,phase:i*.8});
  }else for(let i=0;i<3;i++){const distance=100+i*105;const e=game.spawn('ink',{x:360+Math.cos(direction)*distance,y:665+Math.sin(direction)*distance})!;e.hp=e.maxHp=level===4?190:600;e.ai='Recovery';}
  ranks.set(rune,level);const radio=panel.querySelector<HTMLInputElement>(`input[name="level-${rune}"][value="${level}"]`);if(radio)radio.checked=true;view.ui.show(game.state,game);cast(rune);const previewSkill=game.skills.at(-1);if(previewSkill&&previewSkill.testLevel!==level)applySkillLevel(previewSkill,level);if(rune==='triangle'&&level===4){const s=game.skills.at(-1);if(s){game.shield=game.shieldTime=0;playFoxGuardianSkill(s,arrowOptions);previewEnd=s.duration;}scrub.max=String(previewEnd);}if(rune==='triangle'||rune==='z')input.traceAge=1;
  if(time!==undefined){for(let t=0;t<time-1e-8;){const dt=Math.min(1/120,time-t);moveArrowTargets(dt);game.update(dt);for(const event of game.drain())view.event(event);view.update(game,input,dt,60);t+=dt;}previewTime=time;}
  view.update(game,input,0,60);view.ui.timer.text='∞';scrub.value=String(previewTime);timeLabel.textContent=`Lv${level} · ${SKILL_LEVELS[rune][level-1].name} · ${previewTime.toFixed(3)}秒`;
 };
 for(let lv=1;lv<=5;lv++)button(previewRow,`预览 Lv${lv}`,()=>preparePreview(lv));
 const repeatButton=button(previewRow,'自动重播：关',()=>{previewRepeat=!previewRepeat;repeatButton.textContent=previewRepeat?'自动重播：开':'自动重播：关';if(previewRepeat)preparePreview(previewLevel,undefined,previewRune);});
 const captureRow=document.createElement('div');captureRow.className='lab-row';previewPanel.append(captureRow);for(const [i,time] of [.14,.18,.24,.37,.56].entries())button(captureRow,`截图定格 Lv${i+1}`,()=>preparePreview(i+1,time,'line'));
 const awakeningRow=document.createElement('div');awakeningRow.className='lab-row';previewPanel.append(awakeningRow);for(const [label,time] of [['Lv5 起笔',.07],['Lv5 冲击波',.20],['Lv5 展卷',.38],['Lv5 卷面',.56],['Lv5 终结斩',.70],['Lv5 消散',.95]] as const)button(awakeningRow,label,()=>preparePreview(5,time,'line'));
 const variantControls=document.createElement('div');variantControls.className='lab-row';previewPanel.append(variantControls);
 const knobs=new Map<keyof UltimateParams,HTMLInputElement>();
 const chooseVariant=(variant:UltimateVariant)=>{selectUltimate(variant);for(const [key,el] of knobs)el.value=String(ultimateParams[key]);preparePreview(4);};
 variantControls.textContent='Lv4 · 先波后卷 · 冲击波 → 垂直展开山海绘卷斩';
 const parameters=document.createElement('details');parameters.innerHTML='<summary>Lv4可调参数 · 修改后重播生效</summary>';previewPanel.append(parameters);
 for(const [key,label,min,max,step] of [
  ['visualWaveWidth','冲击波卷气宽度',100,300,5],['wavePatternOpacity','冲击波山海浓度',.1,.9,.05],['waveCloudStrength','冲击波云卷幅度',.5,1.5,.1],['slashStartWidth','起点宽度',4,40,1],['slashMidWidth','中段宽度',40,180,5],['slashEndWidth','后段宽度',100,280,5],['scrollPatternOpacity','山海纹样浓度',.05,.5,.01],['scrollPatternDensity','山峦层数',3,7,1],['visualScrollLength','绘卷展开长度',300,850,10],['visualScrollWidth','书卷卷面宽度',80,240,5],['scrollOpenAt','书卷开始秒',.18,.26,.01],['visualOpenDuration','书卷展开秒',.10,.18,.01],['visualHoldDuration','书卷停留至秒',.1,.4,.01],['visualFadeDuration','余韵消散秒',.18,.50,.01],['smokeAmount','妖气碎裂数量',0,6,1],['slashWidth','主斩宽度',50,260,5],['slashLength','主斩长度',300,900,10],['coreBrightness','白芯亮度',.2,1.5,.05],['outerGlow','金刃强度',.1,1,.05],['paperCount','符纸数量',6,80,1],['paperScatter','符纸散射',30,250,5],['burstCount','爆裂碎片',6,48,1],['hitStop','命中停顿秒',0,.08,.005],['knockbackForce','斩飞力度',200,1200,25],['secondaryDamage','副斩伤害',0,150,5]
 ] as const){const row=document.createElement('label');row.className='lab-row';row.textContent=label;const el=document.createElement('input');el.type='number';el.min=String(min);el.max=String(max);el.step=String(step);el.value=String(ultimateParams[key]);el.onchange=()=>{ultimateParams[key]=Math.max(min,Math.min(max,Number(el.value)||min));el.value=String(ultimateParams[key]);};row.append(el);parameters.append(row);knobs.set(key,el);}
 button(previewPanel,'退出预览 / 持续刷怪',()=>{previewActive=false;spawnAt=game.time;});
 scrub.oninput=()=>preparePreview(previewLevel,Number(scrub.value),previewRune);
 Object.assign(window,{__SLASH_PREVIEW__:{frame:preparePreview,variant:chooseVariant,params:()=>({...ultimateParams})}});
 const circlePanel=document.createElement('section');circlePanel.className='slash-preview';circlePanel.innerHTML='<h2>圆形护阵 · 五级动画预览</h2><p>红金阵纹 → 灵光护罩 → 镇妖重阵 → 九尾结界 → 天狐山海界。Lv5 全屏展卷、九尾降临；下方勾选图层可单独查看，共用时间轴可检查起符、展开与消散。</p>';previewPanel.after(circlePanel);
 const circleRow=document.createElement('div');circleRow.className='lab-row';circlePanel.append(circleRow);
 for(let lv=1;lv<=5;lv++)button(circleRow,`圆阵 Lv${lv}`,()=>preparePreview(lv,undefined,'circle'));
 button(circlePanel,'冻结 / 播放圆阵',()=>{if(previewRune!=='circle')preparePreview(1,0,'circle');else previewPlaying=!previewPlaying;});
 const layerRow=document.createElement('div');layerRow.className='lab-levels';circlePanel.append(layerRow);
 for(const [key,name] of [['Core','本体核心'],['Inner Circle','内圈'],['Outer Circle','外圈'],['Scroll Ring','绘卷环'],['Ofuda','符纸'],['Fox Spirit','九尾狐灵'],['Shrine Props','神社云鹤'],['Light FX','光效花瓣']]){
  const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;check.onchange=()=>view.circles.setLayerVisibility(key,check.checked);label.append(check,document.createTextNode(name));layerRow.append(label);
 }
 Object.assign(window,{__CIRCLE_PREVIEW__:{frame:(level:number,time?:number)=>preparePreview(level,time,'circle')}});
 const arrowPanel=document.createElement('section');arrowPanel.className='slash-preview';arrowPanel.id='arrow-preview';arrowPanel.innerHTML='<h2>符箭 / 狐灵降临 · 四级动画预览</h2><p>Lv4 灵狐降灵 · 起势 → 灵狐钻出 → 绕身一圈 → 绘卷法衣 → 守护定格。尾巴与红白长卷连续收成披帛、腰环和衣摆。</p>';circlePanel.after(arrowPanel);
 const arrowRow=document.createElement('div');arrowRow.className='lab-row';arrowPanel.append(arrowRow);
 for(let lv=1;lv<=4;lv++)button(arrowRow,`符箭 Lv${lv}`,()=>preparePreview(lv,undefined,'triangle'));
 button(arrowPanel,'重播符箭',()=>preparePreview(previewRune==='triangle'?previewLevel:1,undefined,'triangle'));
 button(arrowPanel,'冻结 / 播放符箭',()=>{if(previewRune!=='triangle')preparePreview(1,0,'triangle');else previewPlaying=!previewPlaying;});
 const movement=document.createElement('label'),moving=document.createElement('input');moving.type='checkbox';moving.checked=true;movement.append(moving,document.createTextNode('移动靶 · 查看弯曲追踪'));arrowPanel.append(movement);
 moving.onchange=()=>{movingArrows=moving.checked;preparePreview(previewRune==='triangle'?previewLevel:1,undefined,'triangle');};
 const arrowScrub=document.createElement('input');arrowScrub.type='range';arrowScrub.min='0';arrowScrub.max='4.8';arrowScrub.step='.005';arrowScrub.value='0';arrowScrub.style.width='100%';arrowPanel.append(arrowScrub);
 const arrowTime=document.createElement('p');arrowPanel.append(arrowTime);
 const syncArrow=()=>{if(previewRune==='triangle'){arrowScrub.max=String(previewEnd);arrowScrub.value=String(previewTime);const phase=previewLevel===4?['起势','灵狐钻出','绕身盘旋','绘卷法衣','守护定格','收招'][guardianTimeline(previewTime,game.skills[0]?.arrows?.guardian).phase]:'';arrowTime.textContent=`Lv${previewLevel} · ${phase} · ${previewTime.toFixed(3)} / ${previewEnd.toFixed(1)}秒`;}};
 arrowScrub.oninput=()=>{preparePreview(previewRune==='triangle'?previewLevel:1,Number(arrowScrub.value),'triangle');syncArrow();};
 const arrowParams=document.createElement('details');arrowParams.innerHTML='<summary>天狐演出参数 · 修改后重播生效</summary>';arrowPanel.append(arrowParams);
 for(const [key,label,min,max,step] of [['foxScale','守护狐体量',.8,1.8,.05],['orbitRadius','盘旋半径',60,185,5],['scrollWidth','法衣卷面宽度',.5,1.5,.05],['paperCount','符纸数量',0,18,1],['patternOpacity','绘卷纹样浓度',0,1,.05],['cameraStrength','镜头推拉幅度',0,1,.05]] as const){const row=document.createElement('label');row.className='lab-row';row.textContent=label;const el=document.createElement('input');el.type='number';el.min=String(min);el.max=String(max);el.step=String(step);el.value=String(FOX_GUARDIAN_DEFAULTS[key]);el.onchange=()=>{arrowOptions[key]=Math.max(min,Math.min(max,Number(el.value)||min));};row.append(el);arrowParams.append(row);}
 for(let i=0;i<5;i++){const row=document.createElement('label');row.className='lab-row';row.textContent=['起势秒','钻出秒','盘旋秒','法衣成形秒','定格秒'][i];const el=document.createElement('input');el.type='number';el.min='.1';el.max='3';el.step='.05';el.value=String(FOX_GUARDIAN_DEFAULTS.phaseDurations[i]);el.onchange=()=>{const times=arrowOptions.phaseDurations??[...FOX_GUARDIAN_DEFAULTS.phaseDurations];times[i]=Math.max(.1,Math.min(3,Number(el.value)||.1));arrowOptions.phaseDurations=times;};row.append(el);arrowParams.append(row);}
 Object.assign(window,{__ARROW_PREVIEW__:{frame:(level:number,time?:number)=>{preparePreview(level,time,'triangle');syncArrow();},moving:(enabled:boolean)=>{movingArrows=enabled;moving.checked=enabled;},direction:(angle:number)=>{direction=angle;select.value=String(angle);},params:(options?:Partial<FoxGuardianConfig>)=>{if(options)Object.assign(arrowOptions,options);return {...FOX_GUARDIAN_DEFAULTS,...arrowOptions};}}});
 const thunderPanel=document.createElement('section');thunderPanel.className='slash-preview';thunderPanel.innerHTML='<h2>Z · 天狐雷劫 · 四级矢量动画</h2><p>一道引雷 → 三段奔雷 → 六目标天符雷网 → 天狐开卷、八道雷劫。共用时间轴可检查起势、落雷与消散。</p>';arrowPanel.after(thunderPanel);
 const thunderRow=document.createElement('div');thunderRow.className='lab-row';thunderPanel.append(thunderRow);
 for(let lv=1;lv<=4;lv++)button(thunderRow,`雷符 Lv${lv}`,()=>preparePreview(lv,undefined,'z'));
 button(thunderPanel,'冻结 / 播放雷符',()=>{if(previewRune!=='z')preparePreview(1,0,'z');else previewPlaying=!previewPlaying;});
 button(thunderPanel,'重播雷符',()=>preparePreview(previewRune==='z'?previewLevel:4,undefined,'z'));
 Object.assign(window,{__THUNDER_PREVIEW__:{frame:(level:number,time?:number)=>preparePreview(level,time,'z')}});
 const brushPanel=document.createElement('section');brushPanel.innerHTML='<h2>朱砂灵笔 · 独立副笔测试</h2><p>25% / 35% / 45% · 延迟0.12秒 · 不加主技能伤害或护盾。先选下方法宝等级，再点技能预览。</p>';panel.append(brushPanel);for(const rune of runes){button(brushPanel,NAMES[rune],()=>preparePreview(ranks.get(rune)??1,undefined,rune));button(brushPanel,'定格·'+NAMES[rune],()=>{const lv=ranks.get(rune)??1;const time=rune==='line'?.24:rune==='circle'?.3:rune==='triangle'?(lv===4?2.6:.42):THUNDER_STAGES[lv-1].start+(THUNDER_STAGES[lv-1].targets-1)*THUNDER_STAGES[lv-1].interval+.2;preparePreview(lv,time,rune);});}
 panel.append(status);panel.insertAdjacentHTML('beforeend','<h2>法宝等级</h2><p>0为未获得；朱砂灵笔Lv1–Lv3独立副笔，不改变主技能。调整后下一次施法生效。</p>');
 for(const relic of RELICS){const el=row(relic.name);number(el,relic.id==='brush'?Math.max(0,Math.min(3,Number(new URLSearchParams(location.search).get('brush'))||0)):0,0,relic.id==='brush'?3:100,n=>{if(n)game.modifiers.owned.set(relic.id as RelicId,n);else game.modifiers.owned.delete(relic.id as RelicId);});const description=document.createElement('small');description.textContent=relic.description;panel.append(description);}
 panel.insertAdjacentHTML('beforeend','<h2>修行与靶场</h2>');
 number(row('局外修行（0–10阶）'),0,0,10,n=>{game.cultivation=n;game.maxHp=100+4*n;game.life=game.maxHp;});
 const targets=()=>{game.brush.clear();game.enemies=[];for(const [x,y] of [[510,665],[590,710],[480,810],[360,850],[205,665],[360,460],[220,510],[500,490]]){const e=game.spawn('ink',{x,y})!;e.ai='Recovery';}game.skills=[];view.begin();};
 const tools=row('');button(tools,'重置靶子 / 清特效',targets);const toggle=button(tools,'小怪：移动',()=>{frozen=!frozen;toggle.textContent=frozen?'小怪：静止':'小怪：移动';});button(tools,'暂停 / 继续',()=>game.pause());
 const beforeFrame=(dt=0)=>{game.charges.papers=3;game.invulnerable=999;game.life=game.maxHp;game.xp=0;if(game.state==='upgrade'){game.pendingLevels=0;game.choices=[];game.state='playing';}if(previewActive){game.state='playing';if(previewPlaying){const step=Math.min(dt,Math.max(0,previewEnd-previewTime));const held=Math.min(step,game.hitStopRemaining);game.hitStopRemaining-=held;moveArrowTargets(step-held);game.update(step-held);for(const event of game.drain())view.event(event);view.update(game,input,step-held,60);previewTime+=step;syncArrow();scrub.value=String(previewTime);timeLabel.textContent=`Lv${previewLevel} · ${previewTime.toFixed(3)}秒`;if(previewTime>=previewEnd){if(previewRepeat)preparePreview(previewLevel,undefined,previewRune);else previewPlaying=false;}}for(const e of game.enemies){if(e.ai!=='Hit'){e.ai='Recovery';e.stateAge=0;}}return;}if(game.active&&game.time>=spawnAt){spawnAt=game.time+.6;if(game.enemies.length<24)game.spawn(game.random()<.3?'crow':'ink');}for(const e of game.enemies){if(frozen&&e.ai!=='Hit'){e.ai='Recovery';e.stateAge=0;e.vx=e.vy=0;}}};
 Object.assign(window,{__BRUSH_PREVIEW__:{frame:(rune:ActiveRune,skillLevel:number,brushLevel:number,time?:number)=>{game.modifiers.owned.set('brush',Math.max(0,Math.min(3,brushLevel)));preparePreview(skillLevel,time,rune);}}});
 game.cultivation=0;game.start();const initialBrush=Math.max(0,Math.min(3,Number(new URLSearchParams(location.search).get('brush'))||0));if(initialBrush)game.modifiers.owned.set('brush',initialBrush);game.duration=1e9;game.director.disabled=true;targets();if(new URLSearchParams(location.search).get('thunder')==='1'){direction=-Math.PI/2;select.value=String(Math.PI*1.5);preparePreview(4,undefined,'z');thunderPanel.scrollIntoView({block:'nearest'});}if(new URLSearchParams(location.search).get('arrow')==='1'){direction=-Math.PI/2;select.value=String(Math.PI*1.5);preparePreview(4,2.16,'triangle');syncArrow();arrowPanel.scrollIntoView({block:'nearest'});}if(new URLSearchParams(location.search).get('ultimate')==='1'){direction=Math.PI/4;select.value=String(direction);preparePreview(4);}
 return {beforeFrame,afterCast,ownsSimulation:()=>previewActive};
}
