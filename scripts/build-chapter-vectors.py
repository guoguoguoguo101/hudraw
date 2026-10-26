"""Convert approved paper-art references to simplified, DOM-free vector path data.

Offline authoring dependency only: Python pillow and vtracer. Runtime uses Pixi paths,
never the source PNGs. Source references and SVGs remain reviewable in assets/.
"""
from pathlib import Path
from collections import deque
import json, re, struct, base64, xml.etree.ElementTree as ET
from PIL import Image, ImageFilter
import vtracer

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'assets/concepts/chapter-reference-v02'
OUT=ROOT/'src/rendering/chapter-art'
TMP=ROOT/'output/chapter-vector-build'
TMP.mkdir(parents=True,exist_ok=True)
OUT.mkdir(parents=True,exist_ok=True)

def trace(im, name, colors=32, speckle=12):
    # Quantization discards photographic grain while retaining the approved silhouettes.
    alpha=im.getchannel('A') if im.mode=='RGBA' else None
    im=im.convert('RGB').filter(ImageFilter.MedianFilter(3)).quantize(colors=colors).convert('RGBA')
    if alpha is not None: im.putalpha(alpha)
    im.save(TMP/f'{name}.png')
    svg=ART/f'{name}.svg'
    vtracer.convert_image_to_svg_py(str(TMP/f'{name}.png'),str(svg),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=speckle,color_precision=8,layer_difference=6,corner_threshold=65,length_threshold=3,max_iterations=10,splice_threshold=45,path_precision=2)
    root=ET.parse(svg).getroot()
    paths=[]
    for node in root:
        if node.tag.split('}')[-1]!='path' or not node.attrib.get('d','').strip():continue
        color=int(node.attrib['fill'].lstrip('#'),16)
        nums=re.findall(r'[-\d.]+',node.attrib.get('transform',''))
        paths.append([color,node.attrib['d'],*[float(n) for n in nums[:2]]])
    if name.endswith('-landscape'):
        # Keep large paper silhouettes and important small architecture; discard texture flecks.
        def score(p):
            nums=[float(n) for n in re.findall(r'-?\d+(?:\.\d+)?',p[1])]
            xs=nums[::2];ys=nums[1::2]
            area=(max(xs)-min(xs))*(max(ys)-min(ys)) if xs and ys else 0
            return area
        keep=set(sorted(range(len(paths)),key=lambda i:score(paths[i]),reverse=True)[:1800 if name.startswith('sea') else 2200])
        paths=[p for i,p in enumerate(paths) if i in keep]
    ops={'M':0,'L':1,'C':2,'Q':3,'Z':4}
    for p in paths:
        tokens=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',p[1]);packed=bytearray();last=[0,0];axis=0
        for token in tokens:
            if token in ops:packed.append(ops[token]);axis=0;continue
            value=round(float(token)*8);delta=value-last[axis];last[axis]=value;axis=1-axis
            n=delta*2 if delta>=0 else -delta*2-1
            while n>=128:packed.append((n&127)|128);n>>=7
            packed.append(n)
        p[1]=base64.b64encode(packed).decode('ascii')
    result={'width':im.width,'height':im.height,'encoding':'delta-v2','paths':paths}
    target=(ROOT/'public/art/chapters') if name.endswith('-landscape') else OUT
    target.mkdir(parents=True,exist_ok=True)
    (target/f'{name}.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
    print(name, im.size, 'paths',len(paths),'bytes', (target/f'{name}.json').stat().st_size)


def monsters(sheet, names):
    im=Image.open(ART/sheet).convert('RGBA')
    # Connected silhouette components keep fins/wings intact across nominal sheet cells.
    small=im.resize((768,512),Image.Resampling.LANCZOS)
    alpha=small.getchannel('A');mask=bytearray(1 if a>210 else 0 for a in alpha.get_flattened_data())
    w,h=small.size;components=[]
    for start in range(w*h):
        if not mask[start]:continue
        mask[start]=0;q=deque([start]);pixels=[]
        while q:
            idx=q.popleft();pixels.append(idx);x,y=idx%w,idx//w
            for nxt in ([idx-1] if x else [])+([idx+1] if x<w-1 else [])+([idx-w] if y else [])+([idx+w] if y<h-1 else []):
                if mask[nxt]:mask[nxt]=0;q.append(nxt)
        if len(pixels)>4:components.append(pixels)
    # Largest silhouettes define the three identities. Nearby detached ornaments follow.
    major=sorted(components,key=len,reverse=True)[:3]
    centers=sorted([(sum(v%w for v in p)/len(p),sum(v//w for v in p)/len(p)) for p in major])
    groups=[[] for _ in names]
    for pixels in components:
        cx=sum(v%w for v in pixels)/len(pixels);cy=sum(v//w for v in pixels)/len(pixels)
        i=min(range(3),key=lambda k:(cx-centers[k][0])**2+((cy-centers[k][1])*.3)**2)
        groups[i].extend(pixels)
    for name,pixels in zip(names,groups):
        if not pixels:raise ValueError(f'No silhouette: {name}')
        matte=Image.new('L',(w,h),0);mp=matte.load()
        for v in pixels:mp[v%w,v//w]=255
        matte=matte.filter(ImageFilter.MaxFilter(3))
        sprite=small.copy();sprite.putalpha(matte)
        box=matte.getbbox();sprite=sprite.crop(box)
        sprite.thumbnail((256,256),Image.Resampling.LANCZOS)
        trace(sprite,name,16,6)

if __name__=='__main__':
    for name in ['sea','palace']:
        im=Image.open(ART/f'{name}-user-reference.png').convert('RGB').resize((720,1280),Image.Resampling.LANCZOS)
        trace(im,f'{name}-landscape',48,4)
    if (ART/'sea-monsters-reference.png').exists():monsters('sea-monsters-reference.png',['sea-fish','sea-jelly','sea-crab'])
    if (ART/'palace-monsters-reference.png').exists():monsters('palace-monsters-reference.png',['star-ray','star-bell','star-kite'])
