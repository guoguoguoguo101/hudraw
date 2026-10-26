import type {LandscapeStage} from './scroll-journey';
import type {SceneMode} from './scene-seal';

export type HualingChapter='valley'|'sea'|'palace'|'snow';
export const HUALING_CHAPTERS:Record<HualingChapter,{name:string;scenes:Record<LandscapeStage,string>;events:readonly SceneMode[];description:string}>={
 valley:{name:'落日妖谷',scenes:{sunset:'落日',wind:'起风',night:'夜色'},events:['seal','fire','chain'],description:'秋山落日 · 风过山河 · 月下断链'},
 sea:{name:'鲸梦浮海',scenes:{sunset:'青碧浅湾',wind:'珊瑚绯潮',night:'月下鲸歌'},events:['seal','chain','fire'],description:'青碧浅湾 · 珊瑚绯潮 · 月下鲸歌'},
 palace:{name:'星河天宫',scenes:{sunset:'月白云庭',wind:'朱金日宫',night:'靛金星阙'},events:['seal','fire','chain'],description:'月白云庭 · 朱金日宫 · 靛金星阙'},
 snow:{name:'雪眠巨兽',scenes:{sunset:'霁雪初眠',wind:'风雪入梦',night:'月照苏灵'},events:['seal','chain','fire'],description:'霁雪初眠 · 风雪入梦 · 月照苏灵'},
};
