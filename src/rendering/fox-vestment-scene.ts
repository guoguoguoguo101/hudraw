import {FOX_GUARDIAN_DEFAULTS,guardianPose,guardianCamera,saturate,smooth,type FoxGuardianConfig} from '../gameplay/fox-guardian';
type Point={x:number;y:number};
type Matrix=[number,number,number,number,number,number];
export type VectorShape={d:string;fill?:string;stroke?:string;width?:number;opacity:number;matrix?:Matrix;id:string};
export type GuardianScene={back:VectorShape[];front:VectorShape[];core:VectorShape[];camera:ReturnType<typeof guardianCamera>;phase:string;clothProgress:number};
const WHITE='#fff5df',PAPER='#f5e2c0',RED='#c93228',GOLD='#d7a85b',INK='#29242a';
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;
function matrix(x:number,y:number,scale=1,a=0):Matrix{const c=Math.cos(a)*scale,s=Math.sin(a)*scale;return [c,s,-s,c,x,y];}
function cubic(a:Point,b:Point,c:Point,d:Point,u:number){const v=1-u;return {x:v**3*a.x+3*v*v*u*b.x+3*v*u*u*c.x+u**3*d.x,y:v**3*a.y+3*v*v*u*b.y+3*v*u*u*c.y+u**3*d.y};}
const f=(n:number)=>Number(n.toFixed(2));
const poly=(p:Point[],closed=true)=>p.map((q,i)=>`${i?'L':'M'}${f(q.x)} ${f(q.y)}`).join('')+(closed?'Z':'');
const ellipse=(x:number,y:number,rx:number,ry:number)=>`M${x+rx} ${y}A${rx} ${ry} 0 1 0 ${x-rx} ${y}A${rx} ${ry} 0 1 0 ${x+rx} ${y}Z`;
function add(out:VectorShape[],id:string,d:string,fill?:string,stroke?:string,width=1,opacity=1,m?:Matrix){out.push({id,d,fill,stroke,width,opacity,matrix:m});}
const ROBES=[
 [-26,13,-66,24,-101,107,-59,185,-17,255,-102,328,-167,278],
 [26,13,79,26,106,117,63,184,28,262,139,319,180,245],
 [-18,-27,-91,-92,-251,-37,-176,44,-97,128,-265,160,-294,64],
 [18,-27,101,-102,267,-74,214,35,155,113,291,151,293,64],
 [-23,3,-135,3,-194,89,-25,93,145,107,213,7,111,-55],
 [-21,22,-147,-219,-343,-151,-253,-46,-148,68,-317,229,-273,325],
 [27,16,169,-181,313,-243,269,-132,219,-24,365,117,266,242],
 [-10,15,-47,60,-23,133,-52,164,-99,208,-170,215,-125,259],
 [13,15,57,55,73,134,22,161,-47,190,-16,251,79,281],
];
const CLOUD='M-46 9C-32 7-36-8-22-7C-29-28-4-36 4-16C14-40 42-24 30-6C59-13 66 15 39 13C23 23-7 15-22 17Z';
const CLOUD_LINE='M-19-2C-31-17-3-25 0-12C4-2-9 2-10-7M12-7C8-27 35-22 28-9C24 0 15 1 18-9M-12 10Q12 4 41 12';
/** Nine tail-scroll materials interpolate into nine garment panels, never swap assets. */
function drawScroll(out:VectorShape[],index:number,t:number,cfg:FoxGuardianConfig,pose:ReturnType<typeof guardianPose>){
 const state=pose.state,reveal=smooth((state.emerge-index*.055)/.44);if(reveal<=0)return;
 const robe=ROBES[index],clothing=state.vestment,angle=-2.5+state.orbit*Math.PI*2-index*.25,route:Point[]=[];
 const start={x:pose.x-25,y:pose.y+58*pose.scale};
 for(let j=0;j<7;j++){
  const a=angle-j*.5-index%3*.13,r=135+index%3*45+j*12;
  const swirl=j===0?start:{x:Math.cos(a)*r,y:-55+Math.sin(a)*r*.79+j*13};
  const furl=smooth((state.emerge-.18)/.8),initial={x:start.x-j*27,y:start.y+j*16+Math.sin(t*5-j)*14};
  const orbitRoute={x:mix(initial.x,swirl.x,furl),y:mix(initial.y,swirl.y,furl)};
  route.push({x:mix(orbitRoute.x,robe[j*2],clothing),y:mix(orbitRoute.y,robe[j*2+1],clothing)});
 }
 const points:Point[]=[],normals:Point[]=[],widths:number[]=[],n=42;
 for(let k=0;k<=n;k++){
  const u=k/n*reveal,q=u<.5?cubic(route[0],route[1],route[2],route[3],u*2):cubic(route[3],route[4],route[5],route[6],(u-.5)*2);
  const wind=Math.sin(t*4-u*6-index*.6)*(8+index%3*3)*(1-clothing*.75)*u;
  q.x+=wind*.4;q.y+=wind;points.push(q);
 }
 points.forEach((p,k)=>{const a=points[Math.max(0,k-1)],b=points[Math.min(n,k+1)],l=Math.hypot(b.x-a.x,b.y-a.y)||1,u=k/n;normals.push({x:-(b.y-a.y)/l,y:(b.x-a.x)/l});widths.push((7+Math.sin(Math.PI*u)**.5*(index===4?23:22+index%3*7))*cfg.scrollWidth*(.55+.45*reveal)*(1-u)**.3);});
 const band=(lo:number,hi:number,from=0,to=n)=>{const pts:Point[]=[];for(let k=from;k<=to;k++)pts.push({x:points[k].x+normals[k].x*widths[k]*hi,y:points[k].y+normals[k].y*widths[k]*hi});for(let k=to;k>=from;k--)pts.push({x:points[k].x+normals[k].x*widths[k]*lo,y:points[k].y+normals[k].y*widths[k]*lo});return poly(pts);};
 const opacity=reveal*state.opacity;
 add(out,`scroll-${index}`,band(-1,1),WHITE,GOLD,.9,opacity);
 add(out,`red-brocade-${index}`,band(-1,index%2?-.35:-.52,3,n),RED,undefined,1,opacity);
 add(out,`gold-piping-${index}`,poly(points.map((p,k)=>({x:p.x+normals[k].x*widths[k]*.65,y:p.y+normals[k].y*widths[k]*.65})),false),undefined,GOLD,.7,opacity*.9);
 // Restrained ornaments stamped in the local tangent frame of the moving cloth.
 for(const k of [13,25,33]){
  const p=points[k],next=points[k+1],a=Math.atan2(next.y-p.y,next.x-p.x),m=matrix(p.x,p.y,.52,a);
  if((index+k)%3===0){add(out,`mountains-${index}-${k}`,'M-20 6L-9-8L0 0L10-14L24 6M-19 11L-9-3L0 5L10-8L22 11',undefined,RED,1.3,opacity*cfg.patternOpacity,m);add(out,`shrine-${index}-${k}`,'M-11-4Q0 0 11-4M-8 0L-8 13M8 0L8 13M-9 3L9 3',undefined,INK,1.6,opacity*cfg.patternOpacity,m);}
  else if((index+k)%3===1){add(out,`cloud-pattern-${index}-${k}`,'M-12 4C-22-9-2-16 1-5C5 8-11 9-8 0M-15 10Q0 4 17 10',undefined,GOLD,1.1,opacity*cfg.patternOpacity,m);}
  else {add(out,`branch-${index}-${k}`,'M-20 9Q0-2 20-8M-1 0L-3-9M7-4L13 5',undefined,INK,.9,opacity*cfg.patternOpacity,m);for(const [x,y] of [[-3,-9],[13,5],[-15,6]])add(out,`blossom-${index}-${k}-${x}`,`M${x} ${y-5}Q${x+5} ${y-8} ${x+4} ${y}Q${x+9} ${y+4} ${x+2} ${y+4}Q${x} ${y+11} ${x-3} ${y+4}Q${x-10} ${y+5} ${x-5} ${y}Q${x-8} ${y-7} ${x} ${y-5}Z`,RED,undefined,1,opacity*cfg.patternOpacity,m);}
 }
 if(clothing>.4&&index<4){const p=points[n-3],a=Math.atan2(points[n].y-p.y,points[n].x-p.x);add(out,`roll-end-${index}`,'M-8-13L8-13L8 13L-8 13Z',RED,GOLD,1,opacity*clothing,matrix(p.x,p.y,.9,a));add(out,`roll-core-${index}`,ellipse(0,-13,8,4),PAPER,GOLD,.8,opacity*clothing,matrix(p.x,p.y,.9,a));}
}
function drawSpirit(out:VectorShape[],t:number,pose:ReturnType<typeof guardianPose>){
 const {state}=pose;if(state.emerge<=0)return;
 const alpha=smooth(state.emerge*3)*state.opacity,m=matrix(pose.x,pose.y,pose.scale,pose.rotation),addHead=(id:string,d:string,fill?:string,stroke?:string,width=1,opacity=alpha)=>add(out,id,d,fill,stroke,width,opacity,m);
 // A long connected neck and curved torso visibly trails out of the summoning gate.
 const bodyAlpha=smooth((state.emerge-.18)/.52)*state.opacity;
 add(out,'spirit-torso',`M${pose.x-43} ${pose.y+12}C${pose.x-174} ${pose.y-27} -259 -218 -187 -280C-124-337-71-226-125-189C-171-151-116-91 ${pose.x+22} ${pose.y+54}Q${pose.x+42} ${pose.y+127} ${pose.x-23} ${pose.y+151}C${pose.x-58} ${pose.y+111} ${pose.x-123} ${pose.y+34} ${pose.x-43} ${pose.y+12}Z`,WHITE,GOLD,1,bodyAlpha);
 add(out,'body-red-stream',`M${pose.x-49} ${pose.y+30}C${pose.x-174} ${pose.y-28} -247 -217 -174 -263C-234-179-109-139 ${pose.x+12} ${pose.y+65}L${pose.x+7} ${pose.y+93}C${pose.x-31} ${pose.y+68} ${pose.x-84} ${pose.y+30} ${pose.x-49} ${pose.y+30}Z`,RED,undefined,1,bodyAlpha);
 addHead('guardian-chest','M-31 36Q-47 66-28 96L-19 90L-12 117L0 104L12 117L19 90L28 96Q47 66 31 36Z',WHITE,GOLD,.9,bodyAlpha);
 for(const s of [-1,1]){addHead(`folded-foreleg-${s}`,`M${s*31} 44Q${s*61} 59 ${s*55} 81L${s*33} 104L${s*17} 100L${s*17} 94L${s*33} 88L${s*36} 66Z`,PAPER,GOLD,.9,bodyAlpha);addHead(`paw-${s}`,`M${s*33} 90L${s*31} 97M${s*25} 94L${s*25} 100`,undefined,RED,.8,bodyAlpha);}
 for(const s of [-1,1]){
  addHead(`ear-${s}`,`M${s*23}-60L${s*27}-93L${s*75}-150L${s*62}-109L${s*69}-115L${s*49}-58Z`,WHITE,GOLD,1);
  addHead(`ear-red-${s}`,`M${s*34}-68Q${s*46}-98 ${s*65}-127L${s*48}-80Z`,RED);
 }
 addHead('divine-face','M0-87C-25-91-44-75-45-53L-65-39L-52-40L-83-19L-58-23L-69-1L-46-12C-39 11-18 31 0 62C18 31 39 11 46-12L69-1L58-23L83-19L52-40L65-39L45-53C44-75 25-91 0-87Z',WHITE,GOLD,1.1);
 addHead('face-plane','M7-82Q33-71 34-38L17 4L0 62L9 18L2-17Z',GOLD,undefined,1,alpha*.19);
 for(const s of [-1,1]){
  addHead(`cinnabar-cheek-${s}`,`M${s*34}-62L${s*61}-34L${s*48}-35L${s*69}-14L${s*49}-19L${s*59} 0L${s*34}-12L${s*23} 9Q${s*41}-21 ${s*34}-62Z`,RED);
  addHead(`eye-${s}`,`M${s*37}-32Q${s*23}-14 ${s*10}-8Q${s*28}-10 ${s*37}-22Z`,INK);
  addHead(`eye-red-${s}`,`M${s*37}-32Q${s*24}-21 ${s*13}-12`,undefined,RED,2.2);
  addHead(`eye-light-${s}`,`M${s*27}-23L${s*25}-17`,undefined,GOLD,1.7);
  addHead(`cheek-white-${s}`,`M${s*26}-45Q${s*49}-31 ${s*51}-31L${s*34}-31L${s*52}-10L${s*29}-20Z`,WHITE);
  addHead(`muzzle-line-${s}`,`M${s*11} 5Q${s*8} 22 ${s*3} 39`,undefined,GOLD,.7);
 }
 addHead('forehead-seal','M0-76L11-52L0-26L-11-52Z',RED);addHead('forehead-inlay','M0-65L5-52L0-39L-5-52Z',WHITE);
 addHead('nose','M-5 46Q0 44 5 46L0 51Z',INK);addHead('mouth','M0 51L0 55M-6 53Q0 58 6 53',undefined,RED,.8);
 addHead('collar','M-27 34Q0 54 27 34L23 44Q0 67-23 44Z',RED,GOLD,.8);
 addHead('guardian-bell',ellipse(0,70,7,9),GOLD,WHITE,1);addHead('bell-mark','M0 67L0 73',undefined,RED,1);
}
function drawCore(out:VectorShape[]){
 add(out,'hero-coat','M-14-9L-34 26L-18 21L-24 62Q0 74 24 62L18 21L34 26L14-9Z',WHITE,GOLD,1);
 add(out,'hero-sleeves','M-14 5L-51 24L-46 36L-17 22M14 5L51 24L46 36L17 22',WHITE,RED,3);
 add(out,'hero-head','M-25-22L-34-57L-12-39Q0-45 12-39L34-57L25-22Q18-3 0 2Q-18-3-25-22Z',WHITE,GOLD,1);
 add(out,'hero-eyes','M-18-23L-7-16M18-23L7-16',undefined,RED,2);add(out,'hero-mark','M0-35L5-28L0-21L-5-28Z',RED);add(out,'hero-collar','M-16 1Q0 13 16 1L14 9Q0 20-14 9Z',RED);add(out,'hero-feet','M-15 59L-17 72L-5 72L-3 59M15 59L17 72L5 72L3 59',INK);
}
/** Pure scene graph shared by Pixi Paths, Canvas 2D and SVG keyframes. */
export function buildGuardianScene(t:number,cfg=FOX_GUARDIAN_DEFAULTS):GuardianScene{
 const pose=guardianPose(t,cfg),state=pose.state,back:VectorShape[]=[],front:VectorShape[]=[],core:VectorShape[]=[];
 const ring=smooth(t/.25)*state.opacity;
 for(let i=0;i<3;i++)add(back,`ritual-ring-${i}`,ellipse(0,56,82+i*27,30+i*10),undefined,i===1?RED:GOLD,i===1?1.7:1,ring);
 for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.6,x=Math.cos(a)*128,y=56+Math.sin(a)*47;add(back,`ring-rune-${i}`,'M-3-5L3-5L3 5L-3 5ZM-2 0L2 0',undefined,GOLD,1,ring,matrix(x,y,1,a));}
 if(state.phase<2)add(back,'awakening-gate',ellipse(-52,9,34,48*state.emerge+12),undefined,GOLD,1.5,ring*(1-state.orbit));
 // Continuous materials start behind the hero; three panels settle in front as clothing.
 for(let i=0;i<9;i++){
  const first=back.length;drawScroll(back,i,t,cfg,pose);
  if(i===4||i>=7){for(let k=first;k<back.length;k++)back[k].opacity*=1-state.vestment;const top=front.length;drawScroll(front,i,t,cfg,pose);for(let k=top;k<front.length;k++)front[k].opacity*=state.vestment;}
 }
 drawSpirit(back,t,pose);
 if(state.vestment>0){
  const a=state.vestment*state.opacity;
  // A joined collar and shoulder cape connects the flowing panels into clothing.
  add(front,'vestment-yoke','M-25 10Q0 25 25 10L50 28L34 48L18 37L29 67Q0 78-29 67L-18 37L-34 48L-50 28Z',WHITE,GOLD,1,a);
  add(front,'vestment-lapels','M-19 15L-9 58L0 70L-3 34ZM19 15L9 58L0 70L3 34Z',RED,undefined,1,a);
  add(front,'vestment-clasp',ellipse(0,34,4,5),GOLD,RED,.8,a);
 }
 for(let i=0;i<6;i++){
  const a=-2+t*.8+i*1.047,r=160+i%2*50,x=Math.cos(a)*r,y=-40+Math.sin(a)*r*.65,opacity=smooth((state.emerge-i*.06)/.5)*state.opacity*.7;
  const m=matrix(x,y,.45+i%3*.1,Math.sin(t*2-i)*.1);add(back,`cloud-${i}`,CLOUD,PAPER,undefined,1,opacity,m);add(back,`cloud-lines-${i}`,CLOUD_LINE,undefined,GOLD,.9,opacity,m);
 }
 for(let i=0;i<cfg.paperCount;i++){
  const a=t*1.7+i/cfg.paperCount*Math.PI*2,r=110+state.emerge*95+Math.sin(t*3-i)*15,x=Math.cos(a)*r,y=-43+Math.sin(a)*r*.8,m=matrix(x,y,.65,a+.3*Math.sin(t*3-i));
  const opacity=smooth(t/.2)*state.opacity*(.5+state.emerge*.5);
  add(front,`paper-${i}`,'M-8-15L8-15L8 16L-8 16Z',WHITE,GOLD,.8,opacity,m);add(front,`paper-rune-${i}`,'M-4-10L4-10M0-8L0 11M-4-3L4-3L-3 2L4 6L-3 9',undefined,RED,1.4,opacity,m);
 }
 for(let i=0;i<3;i++){
  const a=t*.55+i*1.7,x=Math.cos(a)*(130+state.emerge*80),y=Math.sin(a)*70-15;
  add(front,`gold-flow-${i}`,`M${x-140} ${y+25}C${x-15} ${y-100} ${x+150} ${y+90} ${x+100} ${y+125}`,undefined,GOLD,.8,state.emerge*.55*state.opacity);
 }
 // Tiny deterministic petals only; the broad scrolls carry the visual weight.
 for(let i=0;i<12;i++){const u=(t*.35+i*.137)%1,a=i*2.4+t,r=100+u*160,x=Math.cos(a)*r,y=Math.sin(a)*r*.75-30;add(front,`petal-${i}`,'M0-5Q6-5 3 2L0 6L-3 2Q-6-5 0-5Z',i%3?RED:GOLD,undefined,1,(1-u)*state.emerge*state.opacity*.7,matrix(x,y,.5+i%3*.13,a));}
 if(state.phase>=4){const u=state.phase===4?state.hold:1,r=130+smooth(u)*28;add(front,'completion-seal',ellipse(0,45,r,r*.36),undefined,GOLD,1.6,state.opacity);add(front,'completion-red-seal',ellipse(0,45,r+7,(r+7)*.36),undefined,RED,.8,state.opacity*.7);}
 drawCore(core);return {back,front,core,camera:guardianCamera(t,cfg),phase:state.name,clothProgress:state.vestment};
}
export function guardianSceneSvg(t:number,cfg=FOX_GUARDIAN_DEFAULTS){
 const scene=buildGuardianScene(t,cfg),cam=scene.camera,markup=(shapes:VectorShape[])=>shapes.map(s=>`<path data-layer="${s.id}" d="${s.d}" fill="${s.fill??'none'}" stroke="${s.stroke??'none'}" stroke-width="${s.width??1}" opacity="${s.opacity}"${s.matrix?` transform="matrix(${s.matrix.join(' ')})"`:''} stroke-linejoin="round" stroke-linecap="round"/>`).join('');
 const background='<rect x="0" y="175" width="720" height="1005" fill="#f5e8cb"/><circle cx="380" cy="374" r="171" fill="#c93228" opacity=".87"/><path d="M0 623L99 402L214 555L314 447L436 598L564 395L720 563V1180H0Z" fill="#513e3b"/><path d="M0 741L102 589L223 693L333 604L457 731L613 552L720 730V1180H0Z" fill="#29242a"/>';
 const shrines=[90,623].map((x,i)=>`<g transform="translate(${x} ${i?610:540})"><path d="M-46-29Q0-10 46-29L36-14H-36ZM-29-10V91M29-10V91M-35 6H35" fill="#29242a" stroke="#c93228" stroke-width="8"/><path d="M-28 21V57M28 21V57" stroke="#d7a85b" stroke-width="3"/></g>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 175 720 1005">${background}${shrines}<g transform="translate(${360+cam.x} ${665+cam.y}) rotate(${cam.rotation*180/Math.PI}) scale(${cam.scale})">${markup(scene.back)}${markup(scene.core)}${markup(scene.front)}</g></svg>`;
}
export function drawGuardianCanvas(ctx:CanvasRenderingContext2D,t:number,width:number,height:number,cfg=FOX_GUARDIAN_DEFAULTS){
 const scene=buildGuardianScene(t,cfg),draw=(shapes:VectorShape[])=>{for(const s of shapes){ctx.save();if(s.matrix)ctx.transform(...s.matrix);ctx.globalAlpha=s.opacity;ctx.lineJoin='round';ctx.lineCap='round';const path=new Path2D(s.d);if(s.fill){ctx.fillStyle=s.fill;ctx.fill(path);}if(s.stroke){ctx.strokeStyle=s.stroke;ctx.lineWidth=s.width??1;ctx.stroke(path);}ctx.restore();}};
 ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(width/720,height/1005);ctx.fillStyle='#f5e8cb';ctx.fillRect(0,0,720,1005);ctx.translate(0,-175);
 ctx.fillStyle=RED;ctx.beginPath();ctx.arc(380,374,171,0,Math.PI*2);ctx.fill();
 for(const [d,color] of [['M0 623L99 402L214 555L314 447L436 598L564 395L720 563V1180H0Z','#513e3b'],['M0 741L102 589L223 693L333 604L457 731L613 552L720 730V1180H0Z',INK]]){ctx.fillStyle=color;ctx.fill(new Path2D(d));}
 for(const [x,y] of [[90,540],[623,610]]){ctx.save();ctx.translate(x,y);ctx.fillStyle=INK;ctx.strokeStyle=RED;ctx.lineWidth=8;const p=new Path2D('M-46-29Q0-10 46-29L36-14H-36ZM-29-10V91M29-10V91M-35 6H35');ctx.fill(p);ctx.stroke(p);ctx.restore();}
 ctx.translate(360+scene.camera.x,665+scene.camera.y);ctx.rotate(scene.camera.rotation);ctx.scale(scene.camera.scale,scene.camera.scale);draw(scene.back);draw(scene.core);draw(scene.front);ctx.restore();
}
