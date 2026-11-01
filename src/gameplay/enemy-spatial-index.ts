import type {Enemy} from '../core/types';

type Entry={enemy:Enemy;order:number;generation:number;cellX:number;cellY:number;bucket?:Entry[]};
const sourceOrder=(a:Entry,b:Entry)=>a.order-b.order;
export const ENEMY_SPATIAL_MINIMUM=48;
/** Reusable centre-position broad phase. Call update after every entity moves.
 *
 * Queries are conservative rectangles and preserve the source array's order.
 * Callers still apply their exact range/body-radius rules. A result is valid
 * until the next query; the index reuses its buffers instead of allocating them.
 */
export class EnemySpatialIndex{
 private source:readonly Enemy[]=[];private sourceLength=0;private generation=0;
 private enabled=false;private entries=new WeakMap<Enemy,Entry>();
 private rows=new Map<number,Map<number,Entry[]>>();
 private rowPool:Map<number,Entry[]>[]=[];private usedRows:Map<number,Entry[]>[]=[];
 private bucketPool:Entry[][]=[];private usedBuckets:Entry[][]=[];
 private nearbyBuckets:Entry[][]=[];private candidates:Entry[]=[];private result:Enemy[]=[];
 constructor(readonly cellSize=96,readonly minimumIndexed=ENEMY_SPATIAL_MINIMUM){}
 get indexed(){return this.enabled;}
 private releaseBuckets(){
  for(const bucket of this.usedBuckets){bucket.length=0;this.bucketPool.push(bucket);}this.usedBuckets.length=0;
  for(const row of this.usedRows){row.clear();this.rowPool.push(row);}this.usedRows.length=0;this.rows.clear();
  this.nearbyBuckets.length=this.candidates.length=this.result.length=0;
 }
 private bucket(x:number,y:number,create=false){
  let row=this.rows.get(y);
  if(!row&&create){row=this.rowPool.pop()??new Map();this.rows.set(y,row);this.usedRows.push(row);}
  let bucket=row?.get(x);
  if(!bucket&&create){bucket=this.bucketPool.pop()??[];row!.set(x,bucket);this.usedBuckets.push(bucket);}
  return bucket;
 }
 rebuild(source:readonly Enemy[]){
  this.releaseBuckets();this.source=source;this.sourceLength=source.length;this.generation++;
  this.enabled=source.length>this.minimumIndexed;if(!this.enabled)return;
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const e of source)if(Number.isFinite(e.x)&&Number.isFinite(e.y)){left=Math.min(left,e.x);right=Math.max(right,e.x);top=Math.min(top,e.y);bottom=Math.max(bottom,e.y);}
  // A packed cluster is a true all-to-all workload. Keep the ordered source
  // directly instead of maintaining cells that cannot discard any neighbours.
  if(right-left<=this.cellSize*2&&bottom-top<=this.cellSize*2){this.enabled=false;return;}
  for(let i=0;i<source.length;i++){
   const enemy=source[i];let entry=this.entries.get(enemy);
   if(!entry){entry={enemy,order:i,generation:this.generation,cellX:NaN,cellY:NaN};this.entries.set(enemy,entry);}
   entry.order=i;entry.generation=this.generation;entry.bucket=undefined;
   entry.cellX=Math.floor(enemy.x/this.cellSize);entry.cellY=Math.floor(enemy.y/this.cellSize);
   if(Number.isFinite(entry.cellX)&&Number.isFinite(entry.cellY)){entry.bucket=this.bucket(entry.cellX,entry.cellY,true)!;entry.bucket.push(entry);}
  }
 }
 /** Removal/replacement keeps array ordering; appends are visible this same step. */
 syncSource(source:readonly Enemy[]){if(source!==this.source||source.length!==this.sourceLength)this.rebuild(source);}
 update(enemy:Enemy){
  if(!this.enabled)return;const entry=this.entries.get(enemy);if(!entry||entry.generation!==this.generation)return;
  const x=Math.floor(enemy.x/this.cellSize),y=Math.floor(enemy.y/this.cellSize);
  if(x===entry.cellX&&y===entry.cellY)return;
  if(entry.bucket){const i=entry.bucket.indexOf(entry);if(i>=0)entry.bucket.splice(i,1);entry.bucket=undefined;}
  entry.cellX=x;entry.cellY=y;
  if(Number.isFinite(x)&&Number.isFinite(y)){entry.bucket=this.bucket(x,y,true)!;entry.bucket.push(entry);}
 }
 query(x:number,y:number,radius:number):readonly Enemy[]{return this.queryBox(x-radius,y-radius,x+radius,y+radius);}
 queryBox(left:number,top:number,right:number,bottom:number):readonly Enemy[]{
  if(!this.enabled||!Number.isFinite(left)||!Number.isFinite(top)||!Number.isFinite(right)||!Number.isFinite(bottom))return this.source;
  if(left>right||top>bottom){this.result.length=0;return this.result;}
  const x0=Math.floor(left/this.cellSize),x1=Math.floor(right/this.cellSize),y0=Math.floor(top/this.cellSize),y1=Math.floor(bottom/this.cellSize);
  if((x1-x0+1)*(y1-y0+1)>128)return this.source;
  const buckets=this.nearbyBuckets;buckets.length=0;let possible=0;
  for(let cy=y0;cy<=y1;cy++){const row=this.rows.get(cy);if(!row)continue;for(let cx=x0;cx<=x1;cx++){const b=row.get(cx);if(b?.length){buckets.push(b);possible+=b.length;}}}
  // All entities in one cluster are true neighbours. Scanning the already
  // ordered source is cheaper than sorting an almost complete candidate list.
  if(possible>this.sourceLength*.7)return this.source;
  const candidates=this.candidates;candidates.length=0;
  for(const bucket of buckets)for(const entry of bucket){const e=entry.enemy;if(e.x>=left&&e.x<=right&&e.y>=top&&e.y<=bottom)candidates.push(entry);}
  candidates.sort(sourceOrder);const result=this.result;result.length=0;for(const entry of candidates)result.push(entry.enemy);return result;
 }
}
