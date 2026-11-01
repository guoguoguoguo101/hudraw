import sharp from 'sharp';
const folder='output/art-revision-20261029';
const title=(label,width=390)=>Buffer.from(`<svg width="${width}" height="36" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="36" fill="#24282a"/><text x="${width/2}" y="25" text-anchor="middle" fill="#f3f1e8" font-size="21" font-family="Microsoft YaHei">${label}</text></svg>`);
const names=[['valley','落日妖谷'],['sea','鲸梦浮海'],['palace','星河天宫'],['snow','雪眠巨兽']];
await sharp({create:{width:1560,height:880,channels:3,background:'#24282a'}}).composite(names.flatMap(([id,label],i)=>[{input:title(label),left:i*390,top:0},{input:`${folder}/${id}-opening.png`,left:i*390,top:36}])).png().toFile(`${folder}/four-chapters-after.png`);
await sharp({create:{width:780,height:880,channels:3,background:'#24282a'}}).composite([{input:title('调整前'),left:0,top:0},{input:title('调整后'),left:390,top:0},{input:'output/art-review-20261029/snow-opening.png',left:0,top:36},{input:`${folder}/snow-opening.png`,left:390,top:36}]).png().toFile(`${folder}/snow-before-after.png`);
console.log('four-chapters-after.png, snow-before-after.png');
