import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';

// Pack the AI design sheet into padded, equal sprite cells without changing the artwork.
const source='assets/concepts/mountain-mascots-v2/ink-paper-source.png';
const {data,info:{width:w,height:h}}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),groups=Array.from({length:4},()=>[]);
const centers=[[.25,.26],[.76,.29],[.26,.77],[.77,.77]];
for(let start=0;start<w*h;start++){
 if(seen[start]||data[start*4+3]<8)continue;
 let head=0,end=1,sx=0,sy=0;queue[0]=start;seen[start]=1;
 while(head<end){const p=queue[head++],x=p%w,y=Math.floor(p/w);sx+=x;sy+=y;
  for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!seen[n]&&data[n*4+3]>=8){seen[n]=1;queue[end++]=n;}
 }
 if(end<20)continue;
 const x=sx/end/w,y=sy/end/h,dist=centers.map(c=>(c[0]-x)**2+(c[1]-y)**2),group=dist.indexOf(Math.min(...dist));
 for(let i=0;i<end;i++)groups[group].push(queue[i]);
}
const sprites=[];
for(let i=0;i<4;i++){
 const pixels=groups[i];let left=w,top=h,right=0,bottom=0;
 for(const p of pixels){const x=p%w,y=Math.floor(p/w);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 const cw=right-left+1,ch=bottom-top+1,raw=Buffer.alloc(cw*ch*4);
 for(const p of pixels){const x=p%w-left,y=Math.floor(p/w)-top;data.copy(raw,(y*cw+x)*4,p*4,p*4+4);}
 const sprite=await sharp(raw,{raw:{width:cw,height:ch,channels:4}}).resize(408,408,{fit:'inside'}).png().toBuffer();
 const meta=await sharp(sprite).metadata();
 sprites.push({input:sprite,left:i%2*512+Math.round((512-meta.width)/2),top:Math.floor(i/2)*512+Math.round((512-meta.height)/2)});
 console.log(['deer','whale','crane','fox'][i],cw,ch,'pixels',pixels.length);
}
await mkdir('public/art/maps',{recursive:true});
await sharp({create:{width:1024,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(sprites).png({palette:true,colours:128,dither:0}).toFile('public/art/maps/mascots-ink-v2.png');
