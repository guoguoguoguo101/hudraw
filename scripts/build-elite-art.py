"""Build the five AI-designed elite silhouettes per chapter as native paper paths.
Approved v02 sheets match the original Shanhai boss: flat, compact, chapter colors.
Only small palette PNGs ship; contours and full sheets are authoring references.
"""
from pathlib import Path
from collections import deque
import importlib.util,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('paper_builder',ROOT/'scripts/build-chapter-vectors.py')
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
b.ART=ROOT/'assets/concepts/four-chapter-elites';b.OUT=ROOT/'public/art/elites';b.OUT.mkdir(parents=True,exist_ok=True)
rosters={'valley':['umbrella','lantern','puppet','stele','moth'],'sea':['reefCrab','jelly','clam','hermit','rays'],'palace':['mirror','weaver','bell','official','blade'],'snow':['frostApe','crone','pineApe','deer','guardian']}
for chapter,kinds in rosters.items():
 im=Image.open(b.ART/f'{chapter}-sprites-v02.png').convert('RGBA');w,h=im.size
 if im.getchannel('A').getextrema()[0]>=200:raise ValueError(chapter+' sheet lacks transparent alpha')
 # Assign connected paper fragments to their character, preserving props across nominal cells.
 anchors=[((i+.5)*w/5,h/2) for i in range(5)]
 alpha=im.getchannel('A');mask=bytearray(1 if a>=190 else 0 for a in alpha.get_flattened_data());groups=[[] for _ in kinds]
 for start in range(w*h):
  if not mask[start]:continue
  mask[start]=0;q=deque([start]);pixels=[]
  while q:
   v=q.popleft();pixels.append(v);x,y=v%w,v//w
   for nxt in ([v-1] if x else [])+([v+1] if x<w-1 else [])+([v-w] if y else [])+([v+w] if y<h-1 else []):
    if mask[nxt]:mask[nxt]=0;q.append(nxt)
  if len(pixels)<10:continue
  cx=sum(v%w for v in pixels)/len(pixels);cy=sum(v//w for v in pixels)/len(pixels)
  index=min(range(5),key=lambda i:(cx-anchors[i][0])**2+(cy-anchors[i][1])**2)
  groups[index].extend(pixels)
 for kind,pixels in zip(kinds,groups):
  if not pixels:raise ValueError(kind+' missing')
  matte=Image.new('L',(w,h),0);mp=matte.load()
  for v in pixels:mp[v%w,v//w]=255
  box=matte.getbbox();sprite=im.copy();sprite.putalpha(matte);sprite=sprite.crop(box);sprite.thumbnail((192,192),Image.Resampling.LANCZOS)
  sprite.save(b.ART/f'{kind}-cutout-v02.png');sprite.quantize(colors=96,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(b.OUT/f'{kind}.png',optimize=True);sprite.thumbnail((160,160),Image.Resampling.LANCZOS);b.trace(sprite,kind,12,18)
manifest={k:{'chapter':ch,'file':k+'.png','style':'simple-shanhai-v02'} for ch,ks in rosters.items() for k in ks}
(b.OUT/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')),encoding='utf-8')


