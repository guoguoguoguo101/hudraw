import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {contactCases,runContactCase,profileContacts,verifyContactRegression} from '../tests/dual-contact-regression';
const record=process.argv.includes('--record-baseline');
const cases=contactCases.flatMap(kind=>[30,60,120].map(fps=>runContactCase(kind,fps)));
const performance=profileContacts();
const sourceHash=createHash('sha256').update(readFileSync('src/gameplay/dual-brush.ts')).digest('hex');
const report={note:'Pure gameplay on desktop Node; 1200 substeps simulate ten seconds. This is not phone FPS, GPU time or temperature.',sourceHash,cases,performance};
mkdirSync('tests/fixtures',{recursive:true});mkdirSync('docs/performance',{recursive:true});
if(record){writeFileSync('tests/fixtures/dual-contact-baseline.json',JSON.stringify(report,null,2));console.log('Saved original hit-order, motion and CPU baseline');}
else{
 verifyContactRegression();const baseline=JSON.parse(readFileSync('tests/fixtures/dual-contact-baseline.json','utf8'));
 writeFileSync('docs/performance/dual-gameplay-optimized.json',JSON.stringify({...report,baselinePerformance:baseline.performance},null,2));
 console.log('PASS exact original hits, hit order, motion and cooldowns: dense, lethal removals, arena clipping, pre-dead targets and existing cooldowns at 30/60/120fps');
}
console.log(JSON.stringify({performance,candidates:cases.filter(c=>c.kind==='dense').map(c=>({fps:c.fps,contactCalls:c.contactCalls,candidateVisits:c.candidateVisits,hits:c.hits}))}));
