import {readFileSync} from 'node:fs';
import {decodePaperPath} from '../../src/rendering/chapter-art/vector-art.ts';
for(const name of ['sea','palace','snow']){
 const data=JSON.parse(readFileSync(`public/art/chapters/${name}-landscape.json`,'utf8'));
 const counts=[0,0,0,0,0],colors=new Map();
 for(const [rgb,encoded,x=0,y=0] of data.paths){
  const path=decodePaperPath(encoded,data.encoding),xs=[],ys=[];
  for(const ins of path.instructions)for(let i=0;i<ins.data.length;i+=2){xs.push(ins.data[i]+x);ys.push(ins.data[i+1]+y);}
  const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),area=w*h;
  counts[area<100?0:area<300?1:area<800?2:area<2000?3:4]++;
  colors.set(rgb,(colors.get(rgb)??0)+area);
 }
 console.log(name,data.paths.length,counts,[...colors.entries()].sort((a,b)=>b[1]-a[1]).map(([rgb,weight])=>[rgb.toString(16),Math.round(weight)]));
}
