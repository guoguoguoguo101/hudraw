import type {Rune} from '../input/recognizer';
export const RELICS=[
 {id:'brush',name:'朱砂灵笔',description:'攻击增加35%；追加弱化红色笔迹'},
 {id:'seal',name:'镇妖古印',description:'圆阵、箭头留下2.5秒持续符阵'},
 {id:'mirror',name:'照妖古镜',description:'方向攻击追加镜像；圆阵伤害增加25%'},
 {id:'gourd',name:'聚风葫芦',description:'击退增强60%'},
 {id:'bell',name:'引雷铜铃',description:'雷符附加2秒感电，每秒12伤害'},
 {id:'feather',name:'灵狐尾羽',description:'每3次有效绘符追加45伤害追踪狐火'}
] as const;
export type RelicId=typeof RELICS[number]['id'];
export class CombatModifierSystem{
 owned=new Map<RelicId,number>();
 add(id:RelicId){this.owned.set(id,(this.owned.get(id)??0)+1);}
 count(id:RelicId){return this.owned.get(id)??0;}
 resolve(rune:Rune){if(rune==='ink')return {damage:1,copies:1,mirror:false,seal:false,strength:1,radius:1,sealDuration:0,sealPower:1,shockDuration:0,shock:false};return {damage:1+.35*this.count('brush')+(rune==='circle'?.25*this.count('mirror'):.1*Math.max(0,this.count('mirror')-1)),copies:this.count('brush')?2:1,mirror:!!this.count('mirror'),seal:!!this.count('seal')&&['circle','triangle','star'].includes(rune),strength:1+.6*this.count('gourd'),radius:rune==='spiral'?1+.25*this.count('gourd'):1,sealDuration:2.5+.8*Math.max(0,this.count('seal')-1),sealPower:1+.25*Math.max(0,this.count('seal')-1),shockDuration:2+Math.max(0,this.count('bell')-1),shock:!!this.count('bell')&&rune==='z'};}
}
