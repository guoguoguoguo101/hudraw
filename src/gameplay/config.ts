import type {Rune} from '../input/recognizer';
export const COMBAT={duration:180,trainingDuration:90,initialHp:100,invulnerability:1.2,drawScale:.2,drawLimit:2,chargePeriod:5,maxPapers:3,startPapers:2,ordinaryCap:35,eliteCap:3};
export const SPELLS:Record<Rune,{damage:number;range:number;width:number;radius:number;duration:number;hits:number;shield:number;tick:number;armor:number}>={
 line:{damage:60,range:500,width:70,radius:0,duration:.7,hits:3,shield:0,tick:0,armor:0},
 circle:{damage:30,range:0,width:0,radius:200,duration:4,hits:35,shield:20,tick:0,armor:0},
 triangle:{damage:110,range:520,width:0,radius:0,duration:.85,hits:1,shield:0,tick:0,armor:.25},
 star:{damage:32,range:450,width:48,radius:0,duration:.9,hits:35,shield:0,tick:0,armor:0},
 z:{damage:45,range:520,width:0,radius:0,duration:.7,hits:4,shield:0,tick:0,armor:0},
 spiral:{damage:12,range:320,width:0,radius:150,duration:3,hits:35,shield:0,tick:.5,armor:0},
 ink:{damage:8,range:160,width:25,radius:65,duration:.6,hits:2,shield:0,tick:0,armor:0}
};
export const ENEMIES={ink:{hp:40,speed:35,damage:10,score:10,xp:8,weight:1,windup:.7,recovery:1.2},crow:{hp:30,speed:75,damage:8,score:20,xp:12,weight:2,windup:.65,recovery:1.3},oni:{hp:240,speed:22,damage:20,score:60,xp:30,weight:6,windup:1.6,recovery:2},boss:{hp:1800,speed:0,damage:32,score:500,xp:120,weight:0,windup:2.5,recovery:3}};
export const LEVEL={budgetRates:[.35,.55,.75,.95,1.15,1.35],crowAt:30,eliteAt:60,bossAt:90,trainingBossAt:60,weights:{ink:6,crow:3,oni:1},cap:35,eliteCap:3};
export const BOSS={thresholds:[.7,.35],windups:[2.5,2.5,6],recoveries:[3.5,3.5,2.8],damage:[18,24,48],armorReduction:.4,armorPool:150,burstInterrupt:280};
