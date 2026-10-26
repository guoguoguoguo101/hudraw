import type {HualingChapter} from './hualing-chapters';
export const ELITE_CATALOG={
 umbrella:{chapter:'valley',name:'赤骨伞姬',hp:540,mechanic:'ribs',hint:'扫回旋伞，反打伞姬',breakText:'回旋伞反撞 · 大伞翻落'},
 lantern:{chapter:'valley',name:'吊魂灯主',hp:600,mechanic:'shade',hint:'拨灯聚拢，连爆反击',breakText:'魂灯聚爆 · 灯芯暴露'},
 puppet:{chapter:'valley',name:'缝面纸偶',hp:580,mechanic:'threads',hint:'横扫红线，回弹抽妖',breakText:'牵丝尽断 · 纸偶坠地'},
 stele:{chapter:'valley',name:'负碑山魈',hp:720,mechanic:'back',hint:'拨碑相撞，碎石反砸',breakText:'背碑崩落 · 妖骨显露'},
 moth:{chapter:'valley',name:'食墨螟母',hp:620,mechanic:'brood',hint:'画迹引蛾，聚群连爆',breakText:'蛾群散尽 · 腹心显露'},
 reefCrab:{chapter:'sea',name:'背礁蟹将',hp:760,mechanic:'joints',hint:'划过钳臂，拨钳相撞',breakText:'双钳相撞 · 腹甲翻开'},
 jelly:{chapter:'sea',name:'缚潮水母',hp:580,mechanic:'tentacles',hint:'长触须整段可切，回抽伤妖',breakText:'潮结尽断 · 水母坠落'},
 clam:{chapter:'sea',name:'吞珠蚌姬',hp:700,mechanic:'pearls',hint:'顺笔击珠，反撞蚌壳',breakText:'珍珠截断 · 蚌心暴露'},
 hermit:{chapter:'sea',name:'断舟寄居灵',hp:680,mechanic:'sails',hint:'划船侧掀浪，撞船破舟',breakText:'护舟漂散 · 寄居灵现身'},
 rays:{chapter:'sea',name:'潮镜双鳐',hp:650,mechanic:'alternating',hint:'拨转双鳐，交叉相撞',breakText:'潮镜共振 · 双鳐合拢'},
 mirror:{chapter:'palace',name:'巡星镜卫',hp:720,mechanic:'mirror',hint:'顺笔转镜，引光击妖',breakText:'镜光反噬 · 铠甲失守'},
 weaver:{chapter:'palace',name:'牵星织女',hp:610,mechanic:'shuttles',hint:'切网甩星线，追梭断源',breakText:'星梭断线 · 织女失衡'},
 bell:{chapter:'palace',name:'倒悬钟使',hp:740,mechanic:'clapper',hint:'迎着扩散圆弧划，反敲钟波',breakText:'钟舌逆撞 · 钟身震裂'},
 official:{chapter:'palace',name:'执印天官',hp:680,mechanic:'seals',hint:'扫动大印，借印砸妖',breakText:'印阵溃散 · 天官失势'},
 blade:{chapter:'palace',name:'折月刃姬',hp:630,mechanic:'returning',hint:'顺势借月刃，逆势碎刀反噬',breakText:'月刃反噬 · 身法中断'},
 frostApe:{chapter:'snow',name:'霜甲山魈',hp:780,mechanic:'frost',hint:'拨动冰甲，撞妖或撞碎',breakText:'霜甲剥落 · 关节暴露'},
 crone:{chapter:'snow',name:'提灯雪婆',hp:640,mechanic:'lamps',hint:'追灯驱雪，扫亮整段旧路',breakText:'雪灯熄灭 · 本命火暴露'},
 pineApe:{chapter:'snow',name:'抱松雪猿',hp:760,mechanic:'snowballs',hint:'拨大雪球反撞，逆笔打碎',breakText:'积雪散落 · 雪猿挥空'},
 deer:{chapter:'snow',name:'踏霜双鹿',hp:700,mechanic:'support',hint:'截霜花铺冰，绊鹿断补给',breakText:'双鹿滑霜失衡 · 霜甲消融'},
 guardian:{chapter:'snow',name:'眠山骨卫',hp:820,mechanic:'sequence',hint:'沿任意裂纹追画，灵力回流',breakText:'山脊回流 · 胸中灵核显露'},
} as const;
export type EliteKind=keyof typeof ELITE_CATALOG;
export const ELITE_NAMES=Object.fromEntries(Object.entries(ELITE_CATALOG).map(([k,v])=>[k,v.name])) as Record<EliteKind,string>;
export function chapterElites(chapter:HualingChapter){return (Object.keys(ELITE_CATALOG) as EliteKind[]).filter(k=>ELITE_CATALOG[k].chapter===chapter);}
