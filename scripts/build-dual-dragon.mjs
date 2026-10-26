import {earcut} from 'pixi.js';
import {readFile,writeFile} from 'node:fs/promises';
const source=JSON.parse(await readFile('assets/concepts/dual-dragon-companions-v02/authoring/polygons.json','utf8'));
const colors=[...new Set(source.paths.map(p=>p.color))],vertices=[],indices=[],lookup=new Map();
// Native triangles retain the reference's ordered overlapping paper layers.
function triangle(a,b,c,color,depth=0){
 const edges=[[a,b,c],[b,c,a],[c,a,b]].sort((p,q)=>Math.abs(q[0][0]-q[1][0])-Math.abs(p[0][0]-p[1][0]));
 const [u,v,w]=edges[0];
 if(Math.abs(u[0]-v[0])>28&&depth<6){const mid=[(u[0]+v[0])/2,(u[1]+v[1])/2];triangle(u,mid,w,color,depth+1);triangle(mid,v,w,color,depth+1);return;}
 for(const p of [a,b,c]){const x=Math.round(p[0]*20)/20,y=Math.round(p[1]*20)/20,key=x+','+y+','+color;let index=lookup.get(key);if(index===undefined){index=vertices.length/3;lookup.set(key,index);vertices.push(x,y,color);}indices.push(index);}
}
const contains=(ring,p)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const area=r=>Math.abs(r.reduce((sum,p,i)=>{const q=r[(i+1)%r.length];return sum+p[0]*q[1]-q[0]*p[1];},0));
for(const path of source.paths){
 // A traced color can contain multiple disjoint islands AND holes. Treating
 // every ring after the first as a hole silently deletes ivory jaws and armor.
 const rings=path.rings.map(points=>({points,area:area(points),parent:-1,depth:0}));
 for(let i=0;i<rings.length;i++){const larger=rings.map((r,j)=>({r,j})).filter(({r,j})=>j!==i&&r.area>rings[i].area&&contains(r.points,rings[i].points[0])).sort((a,b)=>a.r.area-b.r.area);rings[i].parent=larger[0]?.j??-1;rings[i].depth=larger.length;}
 for(let i=0;i<rings.length;i++){
  if(rings[i].depth%2)continue;
  const contours=[rings[i].points,...rings.filter(r=>r.parent===i&&r.depth%2===1).map(r=>r.points)];
  const points=contours.flat(),holes=[];let n=contours[0].length;for(let j=1;j<contours.length;j++){holes.push(n);n+=contours[j].length;}
  const triangles=earcut(points.flat(),holes,2),color=colors.indexOf(path.color);
  for(let j=0;j<triangles.length;j+=3)triangle(points[triangles[j]],points[triangles[j+1]],points[triangles[j+2]],color);
 }
}
const out={width:source.width,height:source.height,colors,vertices,indices};
await writeFile('src/rendering/dragon-art/talisman-dragon.json',JSON.stringify(out));
console.log('paper dragon',vertices.length/3,'vertices',indices.length/3,'triangles',colors.length,'colors');
