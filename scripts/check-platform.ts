import fs from 'node:fs';
const files=['src/gameplay/game.ts','src/input/recognizer.ts','src/input/controller.ts','src/platform/adapter.ts','src/animation/timeline.ts','src/core/types.ts','src/input/coordinates.ts','src/gameplay/config.ts','src/gameplay/clock.ts','src/gameplay/ai.ts','src/gameplay/director.ts','src/gameplay/modifiers.ts','src/gameplay/target.ts','src/gameplay/spells.ts'];
let errors=0;for(const file of files){const content=fs.readFileSync(file,'utf8');if(/\b(document|window|localStorage|AudioContext)\b/.test(content)){console.error('FAIL: platform dependency in '+file);errors++;}}
for(const file of ['public/art/atlas.json','public/art/atlas.png','public/art/landscape.png'])if(!fs.existsSync(file)){console.error('FAIL: missing '+file);errors++;}
const manifest=JSON.parse(fs.readFileSync('public/art/manifest.json','utf8'));if(new Set(manifest.assets.map((a:{name:string})=>a.name)).size!==manifest.assets.length)errors++;
console.log(errors?'Platform source checks failed':'PASS: gameplay / recognizer / timeline are DOM-free; atlas assets exist; asset names are unique.');process.exitCode=errors?1:0;
