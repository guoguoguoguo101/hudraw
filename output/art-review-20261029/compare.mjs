import sharp from 'sharp';
const folder='output/art-review-20261029';
const names=[['valley','落日妖谷'],['sea','鲸梦浮海'],['palace','星河天宫'],['snow','雪眠巨兽']];
const layers=[];
for(let i=0;i<names.length;i++){
 const [id,title]=names[i];
 layers.push({input:Buffer.from(`<svg width="390" height="36" xmlns="http://www.w3.org/2000/svg"><rect width="390" height="36" fill="#24282a"/><text x="195" y="25" text-anchor="middle" fill="#f3f1e8" font-size="21" font-family="Microsoft YaHei">${title}</text></svg>`),left:i*390,top:0});
 layers.push({input:`${folder}/${id}-opening.png`,left:i*390,top:36});
}
await sharp({create:{width:1560,height:880,channels:3,background:'#24282a'}}).composite(layers).png().toFile(`${folder}/four-chapters.png`);
console.log(`${folder}/four-chapters.png`);
