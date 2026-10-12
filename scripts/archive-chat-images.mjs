import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {readFile,writeFile,copyFile,mkdir,readdir,access,stat} from 'node:fs/promises';
import {dirname,join,relative,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const imageExtensions=/\.(png|jpg|jpeg|webp|svg)$/i;
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const slash='assets/vfx/slash_upgrade';
const topics=[
 {name:'一字斩',root:slash,note:'记录用户参考图、资源包基础图形、历史探索和现存实机快照。画卷造型得到用户“已经不错，先不改”的评价；后续主要调整冲击波及角色尺寸。历史图片不代表当前最终实现。'},
 {name:'角色尺寸',root:'assets/交互图片/角色尺寸',note:'手机画幅检查；375px和390px画面是浏览器模拟尺寸，并非手机硬件拍摄。现存快照对应狐狸再次缩小后的版本。'},
 {name:'四技能测试场',root:'assets/交互图片/四技能测试场',note:'早期四技能及测试窗口评审截图，供对照，不代表各技能当前最新外观。'}
];
const sources=[];
function source(topic,path,label,type,purpose,category='预览实机图',existing=false){sources.push({topic,path,label,type,purpose,category,existing});}

// Explicit conversation attachments only. Do not enumerate unrelated temporary files.
const uploads=[
 ['148c6515-5914-4006-a80e-a9ad39cf79c0','Lv4_纸符斩妖合成参考图','最初终极纸符斩目标，白金斩线、飞符与命中爆裂。'],
 ['1e56d6b7-fbc6-431d-ac0a-cea463716dfb','Lv4_白金冲击波参考图','阶段1参考：由窄至宽的白金冲击波。'],
 ['fb6d3ee1-435d-433e-9687-1ebffa7460fc','Lv4_山海绘卷参考图','阶段2参考：山海纹样、云海及绘卷展开。'],
 ['59e8a32a-2fe4-4285-979d-3980bcba93f1','Lv4_两段合成构图参考图','用户确认两段交叉构图，此后要求绘卷弯成弓弧。'],
 ['df21199a-478e-4cec-992f-8d3508e7ebc3','Lv4_第一段冲击波参考图','用于区分第一段冲击波与第二段绘卷的视觉身份。'],
 ['d172ed01-2564-4126-a1fc-b6d87c3d260c','Lv4_第二段绘卷参考图','再次提供绘卷造型，确认转向并交叉释放。'],
 ['9c3f3479-f925-48fe-b578-01e757dcd401','Lv4_符咒祥云纸焰参考图','追加飞符、朱砂封印、祥云、金边、火花，以及弓弧卷面。'],
 ['12ccbc5b-cd23-4e0f-8484-9915fc4cc3e8','Lv4_四阶段山海长卷设计参考图','丰富卷内山峦、云海、红日、楼阁；起势、展开、延展、最终形态参考。'],
 ['8b218102-5d08-45f4-b5cd-21c0a6dce30a','Lv4_双卷头燃烧纸焰参考图','用户要求两端卷轴与逐渐增强的燃烧纸焰。'],
 ['478c6fe9-f661-47fc-9c0c-0dd5d6adae4b','Lv4_山海卷气冲击波参考图','保留画卷，仅修改冲击波：稳定白金主束、外扩云卷、山海塔影与慢消散。']
];
for(const [id,label,purpose] of uploads)source('一字斩',join(tmpdir(),`codex-clipboard-${id}.png`),label,'用户上传',purpose,'用户参考图');

const stageNames={
 'comparison':'Lv1至Lv4_早期四级对照图','lv1':'Lv1_早期实机图','lv2':'Lv2_早期实机图','lv3':'Lv3_早期实机图','lv4':'Lv4_早期实机图','lv4-burst':'Lv4_早期爆裂实机图','lv4-fade':'Lv4_早期消散实机图','lv4-fan':'Lv4_早期扇斩实机图','lv4-line':'Lv4_早期主斩实机图',
 'afterglow':'Lv4_中期余韵预览图','battle':'Lv4_中期战斗实机图','charge':'Lv4_中期蓄力实机图','impact':'Lv4_中期命中实机图','skill':'Lv4_中期独立技能预览图','stage1':'Lv4_中期第一段预览图','stage2-opening':'Lv4_中期绘卷展开预览图','test-page':'Lv4_中期测试页面图','trail':'Lv4_中期尾迹实机图','unfold':'Lv4_中期展开实机图',
 'detail':'Lv4_卷气冲击波与双卷头细节预览图','live-sequence':'Lv4_当前动画连续过程图','scene':'Lv4_当前战斗实机图','outline-scroll':'Lv4_工作轮廓检查图_绘卷','outline-wave':'Lv4_工作轮廓检查图_冲击波','outlines':'Lv4_工作轮廓对照图',
 'live-140':'Lv4_当前动画第一帧实机图','live-280':'Lv4_当前动画第二帧实机图','live-440':'Lv4_当前动画第三帧实机图','live-610':'Lv4_当前动画第四帧实机图','live-780':'Lv4_当前动画第五帧实机图','live-1030':'Lv4_当前动画第六帧实机图'
};
async function addScreenshots(folder,topic,labels,purpose){
 for(const name of (await readdir(resolve(repo,folder))).sort())if(imageExtensions.test(name)){
  const base=name.replace(/\.[^.]+$/,'');
  source(topic,join(folder,name),labels[base]??`Lv4_${base}_历史预览图`,'实机/工具预览',purpose);
 }
}

async function collect(){
 for(const folder of ['screenshots/slash-upgrade','screenshots/ultimate-final','screenshots/flowing-scroll'])await addScreenshots(folder,'一字斩',stageNames,folder.endsWith('flowing-scroll')?'当前工作文件留存快照；固定文件名的历史轮次曾被覆盖。帧编号为截取顺序，不保证精确动画时刻。轮廓工作图也可能包含当前装饰，不能当作历史纯白轮廓。':'早期实现留存，供版本对照。');
 const labels={};for(const v of ['A','B'])for(const [key,value] of Object.entries({burst:'爆裂',charge:'蓄力',diagonal:'斜向',horizontal:'横向',isolated:'独立轮廓',main:'主斩',trail:'尾迹'}))labels[`${v}-${key}`]=`Lv4_历史${v}版_${value}预览图`;labels['AB-comparison']='Lv4_历史A与B方案实机对照图';labels['static-comparison']='Lv4_历史A与B方案独立对照图';
 await addScreenshots('screenshots/ultimate-rework','一字斩',labels,'历史A/B探索留存；用户后续要求只维护一个版本，不代表最终方案。');
 await addScreenshots('screenshots/mobile-size','角色尺寸',{'phone-375':'375px_狐狸缩小后手机画幅实机图','phone-390':'390px_狐狸缩小后手机画幅实机图'},'当前可访问的手机尺寸快照；早期同名截图已被覆盖。');
 await addScreenshots('screenshots/four-runes','四技能测试场',{'circle':'圆阵_Lv4_早期实机图','line':'一字斩_Lv4_早期实机图','triangle':'符箭_Lv4_早期实机图','z':'雷符_Lv4_早期实机图','lab':'四技能_测试窗口实机图','lab-levels':'四技能_Lv1至Lv4_等级测试页面图'},'本对话早期四技能测试及等级选择窗口。');
 // Preserve and index the original package's existing SVG/preview files.
 for(let level=1;level<=4;level++){
  for(const [folder,ext,type] of [['svg','svg','资源包矢量基础形状'],['preview','png','资源包预览图']])source('一字斩',`${slash}/${folder}/slash_lv${level}.${ext}`,`Lv${level}_资源包${folder==='svg'?'矢量基础形状':'预览图'}`,type,'用户提供资源包的基础形状，完整原件。',folder,true);
 }
 const pack='assert/灵狐绘符_一字斩四级技能资源包/灵狐绘符_一字斩四级技能资源包/references';
 const refLabels={'Lv1_参考_细线与锋芒.png':'Lv1_细线锋芒资源参考图','Lv2_参考_双层瞬斩.png':'Lv2_双层瞬斩资源参考图','Lv3_参考_符纸破阵.png':'Lv3_符纸破阵资源参考图','Lv4_参考_爆发终极.png':'Lv4_终极爆发资源参考图','download.png':'资源包_补充小尺寸参考图','c18e1416-0acb-44c6-8742-501f62fe19b5.png':'资源包_补充视觉参考图'};
 for(const name of (await readdir(resolve(repo,pack))).sort())if(imageExtensions.test(name))source('一字斩',join(pack,name),refLabels[name]??'资源包_补充参考图','用户资源包参考图','资源包references目录内原始视觉参考。','用户参考图');
 // Earlier resource copies use garbled filenames. Index their exact content via hash too.
 for(const name of (await readdir(resolve(repo,`${slash}/references`))).sort())if(imageExtensions.test(name))source('一字斩',`${slash}/references/${name}`,'资源包_既有参考图','既有项目参考图','早期复制的参考文件；相同内容共用清晰命名的归档。','用户参考图');
}
const exists=async path=>{try{await access(path);return true;}catch{return false;}};
const forward=path=>path.replaceAll('\\','/');
function link(path){return path.split('/').map(encodeURIComponent).join('/');}
const markerStart='<!-- chat-image-archive:start -->',markerEnd='<!-- chat-image-archive:end -->';

export async function archiveCurrentChatImages(){
 if(!sources.some(s=>s.path==='screenshots/flowing-scroll/detail.png'))await collect();
 const summary=[];
 for(const topic of topics){
  const root=resolve(repo,topic.root),manifestFile=join(root,'chat-images.manifest.json');await mkdir(root,{recursive:true});
  let manifest=await exists(manifestFile)?JSON.parse(await readFile(manifestFile,'utf8')):{schemaVersion:1,topic:topic.name,images:[],missingSources:[],unrecoverableHistory:[]};
  let changed=false;
  for(const src of sources.filter(s=>s.topic===topic.name)){
   const sourcePath=resolve(repo,src.path),baseName=sourcePath.split(/[\\/]/).at(-1),origin=sourcePath.startsWith(repo+'\\')||sourcePath.startsWith(repo+'/')?forward(relative(repo,sourcePath)):null;
   if(!await exists(sourcePath)){
    if(!manifest.images.some(e=>e.sources.some(s=>s.fileName===baseName)))manifest.missingSources.push({fileName:baseName,purpose:src.purpose});
    continue;
   }
   const buffer=await readFile(sourcePath),hash=sha(buffer),record={fileName:baseName,type:src.type,purpose:src.purpose,...(origin?{repositorySource:origin}:{})};
   let entry=manifest.images.find(e=>e.sha256===hash);
   if(!entry){
    const ext=baseName.match(/\.[^.]+$/)[0].toLowerCase(),prefix=`${topic.name}_${src.label}`;
    const versions=manifest.images.filter(e=>e.namingPrefix===prefix).map(e=>e.version);let version=Math.max(0,...versions)+1;
    let destination;
    if(src.existing)destination=sourcePath;
    else{do{destination=join(root,src.category,`${prefix}_v${String(version).padStart(2,'0')}${ext}`);if(await exists(destination))version++;else break;}while(true);await mkdir(dirname(destination),{recursive:true});await copyFile(sourcePath,destination,constants.COPYFILE_EXCL);}
    entry={name:prefix,namingPrefix:prefix,path:forward(relative(root,destination)),version,sha256:hash,bytes:buffer.length,sourceType:src.type,purpose:src.purpose,status:src.type==='用户上传'?'用户指定参考':src.type.startsWith('资源包')||src.type.includes('参考图')?'基础资源原件':'现存快照，不代表最终验收',archivedAt:new Date().toISOString(),sources:[]};
    manifest.images.push(entry);changed=true;
   }
   if(!entry.sources.some(s=>JSON.stringify(s)===JSON.stringify(record))){entry.sources.push(record);changed=true;}
   // Verify copies byte-for-byte; originals and source references remain untouched.
   if(sha(await readFile(resolve(root,entry.path)))!==hash)throw Error(`Archive hash mismatch: ${entry.path}`);
  }
  if(topic.name==='一字斩')manifest.unrecoverableHistory=[{status:'同名历史工作图被覆盖，无法恢复',sources:['screenshots/flowing-scroll/detail.png','screenshots/flowing-scroll/scene.png','screenshots/flowing-scroll/live-sequence.png','screenshots/flowing-scroll/outlines.png'],note:'这些路径在本对话中展示过多个不同轮次。仅能保存磁盘当前留存内容；本归档不将当前图片冒充每一轮旧图。'}];
  if(topic.name==='角色尺寸')manifest.unrecoverableHistory=[{status:'同名旧版手机预览被覆盖，无法恢复',sources:['screenshots/mobile-size/phone-375.png','screenshots/mobile-size/phone-390.png'],note:'原角色尺寸及第一次缩小的早期截图未独立保存。'}];
  if(changed||!manifest.updatedAt)manifest.updatedAt=new Date().toISOString();
  manifest.missingSources=[...new Map(manifest.missingSources.map(s=>[s.fileName,s])).values()].filter(s=>!manifest.images.some(e=>e.sources.some(o=>o.fileName===s.fileName)));
  await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n','utf8');
  let original=await exists(join(root,'README.md'))?await readFile(join(root,'README.md'),'utf8'):`# ${topic.name} · 交互图片归档\n`;
  const start=original.indexOf(markerStart);if(start>=0){const end=original.indexOf(markerEnd,start);if(end<0)throw Error('Unclosed archive README marker');original=original.slice(0,start)+original.slice(end+markerEnd.length);}
  const table=manifest.images.map(e=>`| [${e.name} · v${String(e.version).padStart(2,'0')}](${link(e.path)}) | ${e.sourceType} | ${e.purpose} ${e.sources.length>1?`同内容记录${e.sources.length}项使用来源。`:''} |`).join('\n');
  const history=manifest.unrecoverableHistory.map(e=>`- ${e.status}：${e.note}`).join('\n');
  const section=`${markerStart}\n## 对话图片归档\n\n${topic.note}\n\n已归档 **${manifest.images.length}** 个不同内容的图像文件；复制保留原始清晰度、原始字节，不删除源文件。完全相同的图片共用归档并保留多个来源。详见 [图片清单](chat-images.manifest.json)。\n\n| 图片名字 | 类型/来源 | 用途与版本状态 |\n|---|---|---|\n${table}\n\n### 历史缺失说明\n\n${history||'本主题未发现已知的缺失历史。'}\n${manifest.missingSources.length?'\n未找到源文件：'+manifest.missingSources.map(s=>s.fileName).join('、')+'。\n':''}\n### 后续保存\n\n运行 \`node scripts/archive-chat-images.mjs\` 可追加现存图片。相同内容不会重复保存；同用途文件变化后生成新版本，绝不覆盖旧版。\n\n当前归档只写入工作区；尚未提交或推送。提交这些目录后，其他电脑通过 Git 拉取即可获取原图。\n${markerEnd}\n`;
  await writeFile(join(root,'README.md'),original.trimEnd()+'\n\n'+section,'utf8');
  for(const entry of manifest.images){const target=resolve(root,entry.path);if(!target.startsWith(repo+'\\')&&!target.startsWith(repo+'/'))throw Error('Archive outside repository');if(!await exists(target))throw Error(`Missing archive: ${entry.path}`);}
  const candidates=manifest.images.map(e=>forward(relative(repo,resolve(root,e.path))));
  try{execFileSync('git',['check-ignore','--stdin'],{cwd:repo,input:candidates.join('\n'),encoding:'utf8',stdio:['pipe','pipe','pipe']});throw Error('Git ignores one or more archived images');}catch(error){if(error.status!==1)throw error;}
  summary.push({topic:topic.name,images:manifest.images.length,sources:manifest.images.reduce((n,e)=>n+e.sources.length,0),bytes:manifest.images.reduce((n,e)=>n+e.bytes,0),missingSources:manifest.missingSources.length});
 }
 const index=resolve(repo,'docs/交互图片索引.md');await mkdir(dirname(index),{recursive:true});
 await writeFile(index,'# 对话交互图片索引\n\n本次归档范围：本段对话明确使用的上传参考、原始资源包图形、一字斩实机/阶段/对照图、四技能测试窗口和手机尺寸预览。未扫描无关临时文件或归入其他对话素材。\n\n| 主题 | 归档目录与说明 | 不同内容文件数 |\n|---|---|---|\n'+topics.map((t,i)=>`| ${t.name} | [README](../${link(t.root)}/README.md) | ${summary[i].images} |`).join('\n')+'\n\n- 附件已从临时目录复制为真实文件。PNG/SVG保留原始字节，不重绘、不压缩。\n- 每个主题的清单记录来源文件名、用途、版本、SHA-256和多次使用来源，不保存本机私人绝对路径。\n- 一字斩与手机尺寸部分历史工作图使用同名文件，旧轮次被覆盖，详见各主题README的历史缺失说明。\n- 尚未执行Git提交或远程推送；将上述目录及本索引提交后，就能随Git上传和下载。\n- 后续重新运行 `node scripts/archive-chat-images.mjs` 会追加新内容，不覆盖已有版本。\n','utf8');
 console.log(JSON.stringify({topics:summary,totalImages:summary.reduce((n,t)=>n+t.images,0),gitIgnored:false,committed:false,pushed:false}));
 return summary;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await archiveCurrentChatImages();
