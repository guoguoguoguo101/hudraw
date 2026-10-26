import {Graphics,GraphicsContext,GraphicsPath} from 'pixi.js';

export type PaperVector={width:number;height:number;encoding?:string;paths:(number|string)[][]};
const contexts=new Map<string,GraphicsContext>();
const decoded=new WeakMap<PaperVector,GraphicsPath[]>();

/** Small self-contained decoder also works in the WeChat runtime without atob or a DOM. */
export function decodePaperPath(encoded:string,encoding='delta-v2'){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',bytes:number[]=[];
 let value=0,bits=0;
 for(const ch of encoded){const n=alphabet.indexOf(ch);if(n<0)continue;value=(value<<6)|n;bits+=6;if(bits>=8){bits-=8;bytes.push(value>>bits&255);}}
 if(encoding==='delta-v2'){
  const path=new GraphicsPath(undefined,true),last=[0,0];let offset=0;
  const next=(axis:number)=>{let n=0,shift=0,byte:number;do{byte=bytes[offset++];n|=(byte&127)<<shift;shift+=7;}while(byte&128);last[axis]+=(n&1)?-(n+1)/2:n/2;return last[axis]/8;};
  while(offset<bytes.length){
   const op=bytes[offset++];
   if(op===0)path.moveTo(next(0),next(1));
   else if(op===1)path.lineTo(next(0),next(1));
   else if(op===2)path.bezierCurveTo(next(0),next(1),next(0),next(1),next(0),next(1));
   else if(op===3)path.quadraticCurveTo(next(0),next(1),next(0),next(1));
   else if(op===4)path.closePath();
   else throw new Error('Unsupported paper vector command');
  }
  return path;
 }
 const nums:number[]=[];for(let i=0;i<bytes.length;i+=2){const n=bytes[i]|bytes[i+1]<<8;nums.push(n>32767?n-65536:n);}
 const path=new GraphicsPath(undefined,true);let i=0;
 const next=()=>nums[i++]/8;
 while(i<nums.length){
  const op=nums[i++];
  if(op===-32768)path.moveTo(next(),next());
  else if(op===-32767)path.lineTo(next(),next());
  else if(op===-32766)path.bezierCurveTo(next(),next(),next(),next(),next(),next());
  else if(op===-32765)path.quadraticCurveTo(next(),next(),next(),next());
  else if(op===-32764)path.closePath();
  else throw new Error('Unsupported paper vector command');
 }
 return path;
}

/** Native paths avoid SVG DOM parsing, image decoding and external texture dependencies. */
export function paperArt(id:string,data:PaperVector,color:(rgb:number)=>number=rgb=>rgb){
 let context=contexts.get(id);
 if(!context){
  context=new GraphicsContext();
  let paths=decoded.get(data);
  if(!paths){paths=data.paths.map(p=>data.encoding?decodePaperPath(String(p[1]),data.encoding):new GraphicsPath(String(p[1]),true));decoded.set(data,paths);}
  for(const [index,[fill,,x=0,y=0]] of data.paths.entries()){
   context.save().translate(Number(x),Number(y));
   context.path(paths[index]).fill(color(Number(fill)));context.restore();
  }
  contexts.set(id,context);
 }
 return new Graphics(context);
}

export function sceneColor(chapter:'sea'|'palace'|'snow',stage:number,rgb:number){
 if(chapter==='snow'){
  if(stage===0)return rgb;
  let r=rgb>>16&255,g=rgb>>8&255,b=rgb&255;const light=(r*.3+g*.5+b*.2)/255,warm=r>g*1.12&&r>b*1.2;
  if(stage===1){r=r*.76+light*10;g=g*.84+light*16;b=b*.93+light*18;}
  else if(warm){r=r*.66+10;g=g*.65+13;b=b*.75+20;}
  else{r=r*.38+light*24+4;g=g*.47+light*31+8;b=b*.65+light*40+16;}
  return Math.min(255,Math.round(r))<<16|Math.min(255,Math.round(g))<<8|Math.min(255,Math.round(b));
 }
 if(chapter==='sea'&&stage===0||chapter==='palace'&&stage===2)return rgb;
 let r=rgb>>16&255,g=rgb>>8&255,b=rgb&255;
 const light=(r*.3+g*.5+b*.2)/255;
 if(chapter==='sea'){
  if(stage===1){r=r*.89+light*51;g=g*.82+light*12;b=b*.89;}
  else{r=r*.30+5;g=g*.43+12;b=b*.65+20;}
 }else if(stage===0){r=r*.59+101;g=g*.59+104;b=b*.53+118;}
 else{const warm=r>g*1.08;r=r*.7+(warm?67:23);g=g*.59+(warm?24:0);b=b*.69+(warm?0:8);}
 return Math.min(255,Math.round(r))<<16|Math.min(255,Math.round(g))<<8|Math.min(255,Math.round(b));
}

