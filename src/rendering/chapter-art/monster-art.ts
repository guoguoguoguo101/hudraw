import fish from './sea-fish.json';
import jelly from './sea-jelly.json';
import crab from './sea-crab.json';
import ray from './star-ray.json';
import bell from './star-bell.json';
import kite from './star-kite.json';
import {paperArt,type PaperVector} from './vector-art';
import type {EnemyLook} from '../../core/types';

const MODELS:Partial<Record<EnemyLook,PaperVector>>={'sea-fish':fish,'sea-jelly':jelly,'sea-crab':crab,'star-ray':ray,'star-bell':bell,'star-kite':kite};
export function chapterMonsterArt(look:EnemyLook){
 const data=MODELS[look];if(!data)return null;
 const g=paperArt(look,data),size=look==='sea-crab'?132:look==='star-ray'?147:look==='sea-fish'?138:126;
 const scale=size/Math.max(data.width,data.height);
 g.scale.set(scale);g.position.set(-data.width*scale/2,-data.height*scale/2-3);
 // Every instance reuses path geometry; static paper detail is cached once per body.
 g.cacheAsTexture({resolution:1.5,antialias:true});return g;
}
