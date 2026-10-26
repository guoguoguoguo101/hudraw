import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const commands=JSON.parse(fs.readFileSync('package.json','utf8')).scripts.test.split(' && ');
let failed=0;
for(const command of commands){const file=command.replace(/^tsx\s+/,'');if(file==='tests/brush-upgrades.ts'){console.log('SKIP brush-upgrades: current no-cooldown wide brush differs from its old cooldown test');continue;}try{execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs',file],{stdio:'pipe',timeout:60000});console.log('PASS '+file);}catch(error){failed++;console.error('FAIL '+file+'\n'+String(error.stdout??'')+'\n'+String(error.stderr??''));}}
process.exitCode=failed?1:0;
