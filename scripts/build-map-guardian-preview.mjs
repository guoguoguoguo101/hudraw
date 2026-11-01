import sharp from 'sharp';
const folder='screenshots/map-vector-motion',frames=[],chapters=['valley','sea','palace','snow'];
for(let i=0;i<32;i++){
 const layers=await Promise.all(chapters.map(async(ch,n)=>({input:await sharp(`${folder}/${ch}-${String(i).padStart(2,'0')}.png`).resize(260,563).png().toBuffer(),left:n%2*260,top:Math.floor(n/2)*563})));
 frames.push(await sharp({create:{width:520,height:1126,channels:4,background:'#e8e0d1'}}).composite(layers).raw().toBuffer());
}
const output=`${folder}/guardians-clean-motion.gif`;
await sharp(Buffer.concat(frames),{raw:{width:520,height:1126*frames.length,channels:4,pageHeight:1126}}).gif({delay:Array(frames.length).fill(150),loop:0,effort:3,colours:128}).toFile(output);
const metadata=await sharp(output,{animated:true}).metadata();
if(metadata.pages!==frames.length||!metadata.delay.every(ms=>ms===150))throw new Error('Every preview frame needs its intended playback duration');
console.log('Saved actual-renderer preview: four independently animated vector guardians');
