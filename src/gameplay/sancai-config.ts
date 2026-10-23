export const SANCAI_STAGES=[
 {name:'三才初成',detail:'定点旋刃 · 三剑阵持续4秒',speed:900,size:23,spinDuration:.55,spinTurns:2,childSpeed:560,childRange:210,pierce:0,pathWidth:9,gather:.14,strike:.2,arrayDuration:4,cut:false,finish:false},
 {name:'三锋展势',detail:'子刃远射穿透 · 剑阵持续4.5秒',speed:1000,size:27,spinDuration:.55,spinTurns:3,childSpeed:650,childRange:280,pierce:1,pathWidth:16,gather:.14,strike:.2,arrayDuration:4.5,cut:false,finish:false},
 {name:'裂影裁卷',detail:'剑阵持续5秒 · 结束裁切',speed:1100,size:32,spinDuration:.6,spinTurns:3,childSpeed:730,childRange:320,pierce:1,pathWidth:20,gather:.14,strike:.2,arrayDuration:5,cut:true,finish:false},
 {name:'山海三才',detail:'剑门阵持续6秒 · 狐灵裁卷',speed:1150,size:43,spinDuration:.65,spinTurns:4,childSpeed:800,childRange:360,pierce:1,pathWidth:25,gather:.16,strike:.22,arrayDuration:6,cut:true,finish:true}
] as const;
export const SANCAI={launch:.12,spread:35*Math.PI/180,fade:.28,cutDuration:.22,finishDuration:.32,nearFox:24};

/** One combat-time timeline shared by behavior and drawing; durations include fade. */
export function sancaiArrayTimeline(level:number){
 const cfg=SANCAI_STAGES[Math.max(0,Math.min(3,Math.floor(level)-1))],strikeEnd=cfg.gather+cfg.strike;
 const sustainEnd=cfg.arrayDuration-SANCAI.fade-(cfg.cut?SANCAI.cutDuration:0)-(cfg.finish?SANCAI.finishDuration:0);
 return {strikeEnd,sustainEnd,cutEnd:sustainEnd+(cfg.cut?SANCAI.cutDuration:0),finishEnd:cfg.arrayDuration-SANCAI.fade};
}
