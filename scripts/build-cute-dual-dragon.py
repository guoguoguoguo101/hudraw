"""Approved ink-blob reference -> native polygons. PNG/SVG are authoring only.

After this step run:
node scripts/build-dual-dragon.mjs assets/concepts/dual-dragon-cute-v03/authoring/polygons.json src/rendering/dragon-art/ink-blob-dragon.json
Offline dependencies: pillow and vtracer (normal Python path or .art-backups/python-tools).
"""
from pathlib import Path
from PIL import Image, ImageFilter
import json, math, re, xml.etree.ElementTree as ET
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'.art-backups/python-tools'))
import vtracer
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'assets/concepts/dual-dragon-cute-v03/authoring'
ART.mkdir(parents=True,exist_ok=True)
im=Image.open(ART.parent/'ink-dragon-sprite-reference.png').convert('RGBA')
im=im.crop(im.getchannel('A').getbbox());im.thumbnail((768,300),Image.Resampling.LANCZOS)
alpha=im.getchannel('A').point(lambda x:255 if x>150 else 0)
# Reserve the soft black horns/pupils and cream face accents explicitly.
palette=[0x25221f,0x382925,0x59302a,0x7b3027,0xa63124,0xc43624,0xdd442a,0xe95b35,0xc7a780,0xe2c59c,0xf3dcaf,0xffebc7]
swatches=Image.new('P',(1,1));swatches.putpalette([v for c in palette for v in [c>>16&255,c>>8&255,c&255]]+[0]*(768-len(palette)*3))
im=im.convert('RGB').filter(ImageFilter.MedianFilter(3)).quantize(palette=swatches,dither=Image.Dither.NONE).convert('RGBA');im.putalpha(alpha)
im.save(ART/'flat-reference.png')
vtracer.convert_image_to_svg_py(str(ART/'flat-reference.png'),str(ART/'paper-dragon.svg'),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=7,color_precision=6,layer_difference=32,corner_threshold=65,length_threshold=3,max_iterations=10,splice_threshold=45,path_precision=2)
paths=[]
for node in ET.parse(ART/'paper-dragon.svg').getroot():
    if not node.tag.endswith('path'):continue
    color=int(node.attrib['fill'][1:],16)
    xy=[float(n) for n in re.findall(r'-?\d+(?:\.\d+)?',node.attrib.get('transform',''))]
    ox,oy=(xy+[0,0])[:2];tokens=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',node.attrib['d'])
    rings=[];ring=[];i=0;x=y=0
    while i<len(tokens):
        op=tokens[i];i+=1
        if op=='M':
            if ring:rings.append(ring)
            x,y=map(float,tokens[i:i+2]);i+=2;ring=[[x+ox,y+oy]]
        elif op=='L':
            x,y=map(float,tokens[i:i+2]);i+=2;ring.append([x+ox,y+oy])
        elif op=='C':
            a,b,c,d,ex,ey=map(float,tokens[i:i+6]);i+=6
            length=math.hypot(a-x,b-y)+math.hypot(c-a,d-b)+math.hypot(ex-c,ey-d)
            steps=max(1,min(16,math.ceil(length/8)))
            for k in range(1,steps+1):
                t=k/steps;v=1-t
                ring.append([round(v**3*x+3*v*v*t*a+3*v*t*t*c+t**3*ex+ox,2),round(v**3*y+3*v*v*t*b+3*v*t*t*d+t**3*ey+oy,2)])
            x,y=ex,ey
        elif op=='Z':
            if ring:rings.append(ring);ring=[]
        else:raise ValueError(op)
    if ring:rings.append(ring)
    rings=[r for r in rings if len(r)>=3]
    if rings:paths.append({'color':color,'rings':rings})
# The approved oversized eyes survive native tracing without synthetic accents.
(ART/'polygons.json').write_text(json.dumps({'width':im.width,'height':im.height,'paths':paths},separators=(',',':')),encoding='utf-8')
print('native contours',len(paths), 'points',sum(len(r) for p in paths for r in p['rings']))
