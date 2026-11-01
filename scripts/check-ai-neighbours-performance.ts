import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {allAIScenarios,profileAI,verifyAIOriginal} from '../tests/ai-neighbours-regression';
const baseline=process.argv.includes('--record-baseline');
const report={note:'Desktop Node CPU cost per fixed 1/60 AI step, with identical coordinates restored each step. Spread uses a 680 by 920 arena; dense uses a 110 by 110 cluster. Not phone FPS or GPU/temperature measurements.',sourceHash:createHash('sha256').update(readFileSync('src/gameplay/ai.ts')).digest('hex'),scenarios:allAIScenarios(),performance:profileAI()};
mkdirSync('tests/fixtures',{recursive:true});mkdirSync('docs/performance',{recursive:true});
if(baseline){writeFileSync('tests/fixtures/ai-neighbours-baseline.json',JSON.stringify(report,null,2));console.log('Saved original ordered-neighbour AI baseline');}
else{verifyAIOriginal();const original=JSON.parse(readFileSync('tests/fixtures/ai-neighbours-baseline.json','utf8'));writeFileSync('docs/performance/ai-neighbours-optimized.json',JSON.stringify({...report,baselinePerformance:original.performance},null,2));console.log('PASS exact original AI: 35/350/1000 distributed and dense targets, ordinary/elite/boss gaps, dead targets, membership changes and immediate moved positions');}
console.log(JSON.stringify(report.performance));
