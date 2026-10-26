"""Offline reference -> flat native paper polygons. PNG/SVG are authoring only."""
from pathlib import Path
from PIL import Image, ImageFilter
import json, math, re, xml.etree.ElementTree as ET
import vtracer
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'assets/concepts/dual-dragon-companions-v02/authoring'
im=Image.open(ART/'red-paper-dragon-reference.png').convert('RGBA')
im=im.crop(im.getchannel('A').getbbox());im.thumbnail((768,300),Image.Resampling.LANCZOS)
alpha=im.getchannel('A').point(lambda x:255 if x>150 else 0)
# Reserve ink/mouth tones explicitly. Adaptive quantization otherwise spends
# every color on red armor and erases the rare but essential small black eye.
palette=[0x202a28,0x662320,0x8f2b25,0xa9372b,0xbf3f2c,0xd24c31,0xdf6240,0xa77539,0xbf8e48,0xd0a565,0xe1bc7e,0xf0d39e,0xb5a080,0xcabb9a,0xdbc9a6,0xe8dab8,0xf5e6c8,0xfff2d6]
swatches=Image.new('P',(1,1));swatches.putpalette([v for c in palette for v in [c>>16&255,c>>8&255,c&255]]+[0]*(768-len(palette)*3))
im=im.convert('RGB').filter(ImageFilter.MedianFilter(3)).quantize(palette=swatches,dither=Image.Dither.NONE).convert('RGBA');im.putalpha(alpha)
im.save(ART/'flat-reference.png')
vtracer.convert_image_to_svg_py(str(ART/'flat-reference.png'),str(ART/'paper-dragon.svg'),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=5,color_precision=8,layer_difference=16,corner_threshold=65,length_threshold=3,max_iterations=10,splice_threshold=45,path_precision=2)
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
# Deliberately reserved semantic accents: the tiny eye is too important to
# entrust to a speckle filter. These paper shapes follow the reference skull.
def accent(color,points):paths.append({'color':color,'rings':[[[round(x/768*im.width,2),round(y/255*im.height,2)] for x,y in points]]})
accent(0x24312e,[(688,105),(700,108),(708,113),(705,117),(697,116),(691,111)])
accent(0xffefcf,[(693,108),(701,110),(705,114),(700,115),(695,112)])
accent(0x24312e,[(700,110),(703,111),(704,115),(701,114)])
accent(0xffefcf,[(700,110),(701,110),(701,111),(700,111)])
accent(0x5a2820,[(736,127),(742,129),(740,132),(736,131)])
(ART/'polygons.json').write_text(json.dumps({'width':im.width,'height':im.height,'paths':paths},separators=(',',':')),encoding='utf-8')
print('native contours',len(paths), 'points',sum(len(r) for p in paths for r in p['rings']))
