import {configureSancai} from './sancai';
import {SANCAI_STAGES} from './sancai-config';
import {configureWave,configureBinding,WAVE_STAGES,BINDING_STAGES} from './advanced-spells';
import {configureThunder,THUNDER_STAGES} from './thunder';
import {configureArrows} from './arrows';
import {configureSlash,SLASH_STAGES} from './slash';
import {CIRCLE_STAGES} from './circle-levels';
import {configureCircle} from './circle';
import type {Skill} from '../core/types';
import {configureMoonTail,MOON_TAIL_STAGES} from './moon-tail';
export const SKILL_LEVELS={
 sancai:SANCAI_STAGES.map(s=>({name:s.name,detail:s.detail})),
 wave:WAVE_STAGES.map(s=>({name:s.name,detail:`最多${s.segments}弧段 · 沿笔迹连斩${s.pull?' · 末段回卷':''}`})),
 spiral:BINDING_STAGES.map(s=>({name:s.name,detail:`最多${s.turns}圈 · 范围上限${s.radius} · 短束缚${s.hold}秒`})),
 arc:MOON_TAIL_STAGES.map((stage,i)=>({name:stage.name,detail:`伤害${stage.damage} · 宽度${stage.width} · ${i>=2?'回卷':'击退'}${i===3?' · 一次镇压':''}`})),
 line:SLASH_STAGES.map(stage=>({name:stage.name,detail:`伤害${stage.damage} · 宽度${stage.hit_width} · 手绘长度×1.5`})),
 circle:CIRCLE_STAGES.map(stage=>({name:stage.name,detail:`${stage.shield}护盾 · 半径${stage.radius} · 伤害×${stage.damage} · ${stage.duration}秒`})),
 triangle:[{name:'穿甲矢',detail:'单箭追踪，命中破甲'},{name:'追魂矢',detail:'伤害×1.5，强化云焰追踪'},{name:'诛妖矢',detail:'伤害×2.2，三箭伴飞'},{name:'灵狐降灵',detail:'大招：灵狐钻出、绕身盘旋、绘卷法衣、守护定格；80护盾与伤害×3.5净化'}],
 z:THUNDER_STAGES.map(stage=>({name:stage.name,detail:`最多${stage.targets}雷击节点 · ${stage.duration}秒演出`}))
} as const;
export type ActiveRune=keyof typeof SKILL_LEVELS;
export function applySkillLevel(s:Skill,level:number){
 if(s.released)return;
 if(s.rune==='sancai'){configureSancai(s,level);return;}
 if(s.rune==='wave'){configureWave(s,level);return;}if(s.rune==='spiral'){configureBinding(s,level);return;}
 if(s.rune==='z'){const previous=s.testLevel??1,next=Math.max(1,Math.min(4,Math.floor(level)));s.damage=s.damage/[1,1.5,2.2,3.5][previous-1]*[1,1.5,2.2,3.5][next-1];s.testLevel=next;configureThunder(s,next);return;}
 if(s.rune==='arc'){if(!s.released){configureMoonTail(s,level);s.testLevel=s.moonTail!.level;}return;}if(s.rune==='circle'&&s.released)return;
 s.testLevel=Math.max(1,Math.min(s.rune==='circle'||s.rune==='line'?5:4,Math.floor(level)));const i=s.testLevel-1;if(s.rune==='line'){s.damage*=60/SLASH_STAGES[(s.slash?.level??1)-1].damage;configureSlash(s,s.testLevel);return;}
 if(s.rune==='circle'){configureCircle(s,s.testLevel);return;}
 s.damage*=[1,1.5,2.2,3.5][i];s.range*=[1,1.1,1.2,1.3][i];
 if(s.rune==='triangle')configureArrows(s,s.testLevel);


}
