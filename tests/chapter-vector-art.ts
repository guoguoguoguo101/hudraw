import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GraphicsPath} from 'pixi.js';
import {decodePaperPath,type PaperVector} from '../src/rendering/chapter-art/vector-art';

for(const name of ['sea-landscape','palace-landscape','snow-landscape','sea-fish','sea-jelly','sea-crab','star-ray','star-bell','star-kite']){
 const location=name.endsWith('landscape')?'public/art/chapters':'src/rendering/chapter-art';
 const data=JSON.parse(readFileSync(`${location}/${name}.json`,'utf8')) as PaperVector;
 const svg=readFileSync(`assets/concepts/${name==='snow-landscape'?'snow-chapter-reference':'chapter-reference-v02'}/${name}.svg`,'utf8');
 const original=new GraphicsPath(svg.match(/<path d="([^"]+)"/)![1],true);
 const decoded=decodePaperPath(String(data.paths[0][1]),data.encoding);
 assert.equal(decoded.instructions.length,original.instructions.length);
 for(const [i,command] of original.instructions.entries()){
  const actual=decoded.instructions[i];assert.equal(actual.action,command.action);
  for(const [j,value] of command.data.entries())if(typeof value==='number')assert.ok(Math.abs(actual.data[j]-value)<=.063,`${name}: contour deviates from source`);
 }
 for(const [,encoded] of data.paths){
  const path=decodePaperPath(String(encoded),data.encoding);
  assert.ok(path.instructions.length>0, name+': '+encoded);
  for(const instruction of path.instructions)assert.ok(instruction.data.every(v=>typeof v!=='number'||Number.isFinite(v)));
 }
 assert.ok(!svg.includes('<image'),'Reference vectors must not embed raster images');
}
console.log('PASS all nine paper vector assets: source contour round trip within 1/16 pixel, finite geometry, no embedded bitmaps');
