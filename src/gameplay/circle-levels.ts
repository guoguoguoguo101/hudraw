export const CIRCLE_STAGES=[
 {name:'护身阵',damage:1,radius:200,duration:4,shield:20},
 {name:'灵光阵',damage:1.5,radius:230,duration:4.5,shield:35},
 {name:'镇妖阵',damage:2.2,radius:270,duration:5,shield:50},
 {name:'九尾结界',damage:3.5,radius:320,duration:6,shield:80},
 {name:'天狐山海界',damage:5,radius:350,duration:7,shield:120}
] as const;
export const circleStage=(level=1)=>CIRCLE_STAGES[Math.max(0,Math.min(CIRCLE_STAGES.length-1,Math.floor(level)-1))];
