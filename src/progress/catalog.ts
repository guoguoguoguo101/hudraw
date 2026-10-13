import {NAMES,type Rune} from '../input/recognizer';
import {RELICS,type RelicId} from '../gameplay/modifiers';
import {SKILL_LEVELS} from '../gameplay/skill-levels';
import type {EnemyKind} from '../core/types';

export const CHAPTERS=[
 {id:'sunset-valley',name:'落日妖谷',available:true},
 {id:'bamboo-sea',name:'幽篁竹海',available:false},
 {id:'blood-moon-shrine',name:'血月妖祠',available:false},
 {id:'star-palace',name:'星河天宫',available:false}
] as const;
export type ChapterId=typeof CHAPTERS[number]['id'];

export const SPELLS=(['line','circle','triangle','z','star','spiral'] as Rune[]).map(id=>({
 id,name:NAMES[id],school:id==='z'?'雷':id==='circle'?'护':id==='spiral'?'风':'符',
 available:id!=='star'&&id!=='spiral',
 levels:Array.from({length:5},(_,i)=>{
  const defined=SKILL_LEVELS[id as keyof typeof SKILL_LEVELS] as readonly {name:string;detail:string}[]|undefined;
  return {level:i+1,name:defined?.[i]?.name??`第${i+1}重 · 尚未开放`,description:defined?.[i]?.detail??'该形态尚未完成',implemented:!!defined?.[i]};
 })
}));
export const ENEMIES:{id:EnemyKind;name:string;type:string;description:string}[]=[
 {id:'ink',name:'墨团妖',type:'普通妖怪',description:'潜伏于墨迹中的小妖。'},
 {id:'crow',name:'纸鸦',type:'普通妖怪',description:'会绕行并短距离冲刺的纸影。'},
 {id:'oni',name:'赤面鬼',type:'精英妖怪',description:'身披赤面剪纸，蓄势后重击。'},
 {id:'boss',name:'赤面鬼王',type:'妖王',description:'落日妖谷试炼的守关妖王。'}
];
export const TREASURES=RELICS.map(r=>({id:r.id as RelicId,name:r.name,description:r.description,levels:[1,2,3].map(level=>({level,implemented:r.id==='brush'||level===1}))}));

export type AchievementDef={id:string;name:string;description:string;category:'镇妖'|'绘符'|'修行'|'山海'|'挑战';target:number;metric:string;available:boolean;hidden?:boolean};
export const ACHIEVEMENTS:AchievementDef[]=[
 {id:'kill100',name:'初入山海',description:'累计击败100只妖怪',category:'镇妖',target:100,metric:'totalKills',available:true},
 {id:'kill500',name:'斩妖新秀',description:'累计击败500只妖怪',category:'镇妖',target:500,metric:'totalKills',available:true},
 {id:'kill2000',name:'镇妖道者',description:'累计击败2000只妖怪',category:'镇妖',target:2000,metric:'totalKills',available:true},
 {id:'run100',name:'百妖退散',description:'单局击败100只妖怪',category:'镇妖',target:100,metric:'bestRunKills',available:true},
 {id:'run300',name:'妖潮克星',description:'单局击败300只妖怪',category:'镇妖',target:300,metric:'bestRunKills',available:true},
 {id:'firstBoss',name:'首破妖王',description:'首次击败妖王',category:'镇妖',target:1,metric:'totalBossKills',available:true},
 {id:'cast10',name:'初学符术',description:'累计成功绘符10次',category:'绘符',target:10,metric:'totalSuccessfulCasts',available:true},
 {id:'cast500',name:'妙笔生花',description:'累计成功绘符500次',category:'绘符',target:500,metric:'totalSuccessfulCasts',available:true},
 {id:'cast3000',name:'符法大师',description:'累计成功绘符3000次',category:'绘符',target:3000,metric:'totalSuccessfulCasts',available:true},
 {id:'line5',name:'一笔清场',description:'一次一字斩击败5只妖怪',category:'绘符',target:5,metric:'bestLineKills',available:false},
 {id:'thunder5',name:'五雷齐鸣',description:'一次雷法命中5只不同妖怪',category:'绘符',target:5,metric:'bestThunderHits',available:false},
 {id:'awaken10',name:'符法通玄',description:'累计完成10次高阶觉醒',category:'绘符',target:10,metric:'totalAwakenings',available:false},
 {id:'firstAwaken',name:'初次觉醒',description:'首次完成高阶觉醒',category:'修行',target:1,metric:'totalAwakenings',available:false},
 {id:'fourSpells',name:'百变符法',description:'单局成功使用4种符术',category:'修行',target:4,metric:'bestRunSpellKinds',available:true},
 {id:'allSpells',name:'符录收藏家',description:'发现全部首版符术',category:'修行',target:6,metric:'discoveredSpells',available:false},
 {id:'threeAwaken',name:'万象初成',description:'解锁3种高阶觉醒',category:'修行',target:3,metric:'awakenedSpells',available:false},
 {id:'secondChapter',name:'山海初游',description:'进入第二章节',category:'山海',target:1,metric:'secondChapterEntered',available:false},
 {id:'firstClear',name:'绘卷初成',description:'首次完成章节',category:'山海',target:1,metric:'totalChapterClears',available:true},
 {id:'allChapters',name:'绘尽山海',description:'完成首版全部章节',category:'山海',target:4,metric:'clearedInitialChapters',available:false},
 {id:'clear20',name:'镇守山海',description:'累计通关章节20次',category:'山海',target:20,metric:'totalChapterClears',available:true},
 {id:'lowHpBoss',name:'绝境符生',description:'低于20%生命时击败妖王',category:'挑战',target:1,metric:'lowHpBossKills',available:true},
 {id:'noDamage',name:'毫发无伤',description:'无伤完成章节',category:'挑战',target:1,metric:'noDamageClears',available:true},
 {id:'beidou',name:'北斗初现',description:'完成北斗七星事件',category:'挑战',target:1,metric:'beidouEvents',available:false,hidden:true},
 {id:'runCast100',name:'灵笔无双',description:'单局成功绘符100次',category:'挑战',target:100,metric:'bestRunCasts',available:true}
];
