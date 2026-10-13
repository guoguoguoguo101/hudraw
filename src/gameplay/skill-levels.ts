import {configureThunder,THUNDER_STAGES} from './thunder';
import {configureArrows} from './arrows';
import {configureSlash,SLASH_STAGES} from './slash';
import {CIRCLE_STAGES} from './circle-levels';
import {configureCircle} from './circle';
import type {Skill} from '../core/types';
export const SKILL_LEVELS={
 line:SLASH_STAGES.map(stage=>({name:stage.name,detail:`伤害${stage.damage} · 穿透${stage.pierce} · 射程${stage.range}`})),
 circle:CIRCLE_STAGES.map(stage=>({name:stage.name,detail:`${stage.shield}护盾 · 半径${stage.radius} · 伤害×${stage.damage} · ${stage.duration}秒`})),
 triangle:[{name:'穿甲矢',detail:'单箭追踪，命中破甲'},{name:'追魂矢',detail:'伤害×1.5，强化云焰追踪'},{name:'诛妖矢',detail:'伤害×2.2，三箭伴飞'},{name:'灵狐降灵',detail:'大招：灵狐钻出、绕身盘旋、绘卷法衣、守护定格；80护盾与伤害×3.5净化'}],
 z:THUNDER_STAGES.map(stage=>({name:stage.name,detail:`${stage.targets}目标 · ${stage.duration}秒演出`}))
} as const;
export type ActiveRune=keyof typeof SKILL_LEVELS;
export function applySkillLevel(s:Skill,level:number){
 if(s.rune==='circle'&&s.released)return;
 s.testLevel=Math.max(1,Math.min(s.rune==='circle'||s.rune==='line'?5:4,Math.floor(level)));const i=s.testLevel-1;if(s.rune==='line'){s.damage*=60/SLASH_STAGES[(s.slash?.level??1)-1].damage;configureSlash(s,s.testLevel);return;}
 if(s.rune==='circle'){configureCircle(s,s.testLevel);return;}
 s.damage*=[1,1.5,2.2,3.5][i];s.range*=[1,1.1,1.2,1.3][i];
 if(s.rune==='triangle')configureArrows(s,s.testLevel);
 if(s.rune==='z')configureThunder(s,s.testLevel);
 if(s.rune==='z'&&s.testLevel>=3){s.shock=true;s.shockDuration=Math.max(s.shockDuration,s.testLevel===4?4:2);}
}
