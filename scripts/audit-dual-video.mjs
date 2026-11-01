import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
const folder=process.argv[2]??'screenshots/dual-flight-audit/before',data=JSON.parse(await fs.readFile(`${folder}/telemetry.json`,'utf8'));
function command(name,args){const r=spawnSync(name,args,{encoding:'utf8',maxBuffer:2e6});if(r.status)throw new Error(r.stderr);return r.stdout;}
const duration=Number(JSON.parse(command('ffprobe',['-v','quiet','-show_format','-of','json',`${folder}/raw.webm`])).format.duration),offset=Math.max(0,Math.min(data.offset,duration-17.6));
command('ffmpeg',['-y','-v','error','-ss',String(offset),'-i',`${folder}/raw.webm`,'-t','17.6','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','22','-movflags','+faststart',`${folder}/flight.mp4`]);
await fs.mkdir(`${folder}/frames`,{recursive:true});
command('ffmpeg',['-y','-v','error','-i',`${folder}/flight.mp4`,'-q:v','7',`${folder}/frames/frame-%04d.jpg`]);
const files=(await fs.readdir(`${folder}/frames`)).filter(f=>f.endsWith('.jpg')).sort(),columns=8,rows=5,tw=180,th=318;
for(let start=0;start<files.length;start+=columns*rows){
 const layers=[];
 for(let k=start;k<Math.min(files.length,start+columns*rows);k++){
  const input=await sharp(`${folder}/frames/${files[k]}`).extract({left:0,top:100,width:430,height:740}).resize(tw,th-18).jpeg().toBuffer(),i=k-start,x=i%columns*tw,y=Math.floor(i/columns)*th;
  layers.push({input,left:x,top:y});
  const text=Buffer.from(`<svg width="${tw}" height="18"><rect width="100%" height="100%" fill="#fff5de"/><text x="5" y="13" font-family="Arial" font-size="12">${(k/25).toFixed(2)}s · frame ${k}</text></svg>`);layers.push({input:text,left:x,top:y+th-18});
 }
 await sharp({create:{width:tw*columns,height:th*rows,channels:3,background:'#1c3033'}}).composite(layers).jpeg({quality:85}).toFile(`${folder}/sheet-${String(start/40).padStart(2,'0')}.jpg`);
}
const stats=[];
for(let side=0;side<2;side++){
 const records=data.frames.filter(f=>f.sides[side]?.body.length>1&&f.t<17).map(f=>({t:f.t,clock:f.clock,...f.sides[side],bounds:f.bounds}));let clipped=0,knotted=0,stalled=0,clipMax=0,maxTurn=0;const bad=[];
 for(let i=1;i<records.length;i++){
  const r=records[i],p=records[i-1],dt=r.clock-p.clock;if(dt<=0)continue;
  const clip=r.body.filter(q=>q.x<r.bounds.left||q.x>r.bounds.right||q.y<r.bounds.top||q.y>r.bounds.bottom).length/r.body.length;
  if(clip>.15){clipped++;bad.push({t:r.t,kind:'clip',score:clip});}clipMax=Math.max(clipMax,clip);
  const near=r.body.slice(0,28).some(q=>Math.hypot(q.x-r.head.x,q.y-r.head.y)<32);if(near)knotted++;
  if(Math.hypot(r.head.x-p.head.x,r.head.y-p.head.y)/dt<15)stalled++;
  const angle=Math.abs(Math.atan2(p.direction.x*r.direction.y-p.direction.y*r.direction.x,p.direction.x*r.direction.x+p.direction.y*r.direction.y));maxTurn=Math.max(maxTurn,angle/dt);
 }
 stats.push({side,samples:records.length,clippedFrames:clipped,clipPercent:+(clipped/records.length*100).toFixed(1),maxClippedFraction:+clipMax.toFixed(2),headNearTailFrames:knotted,stalledFrames:stalled,maxTurn:+maxTurn.toFixed(2),worst:bad.sort((a,b)=>b.score-a.score).slice(0,5)});
}
await fs.writeFile(`${folder}/audit.json`,JSON.stringify({videoFrames:files.length,sheets:Math.ceil(files.length/40),offset,stats,errors:data.errors},null,2));console.log(JSON.stringify({videoFrames:files.length,sheets:Math.ceil(files.length/40),stats}));
