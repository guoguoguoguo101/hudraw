"""Trace the approved face directly into editable vector color regions.

Only the facial source layers are traced; no generated approximation or embedded raster.
Coordinates retain the source's cheek contour, tilted oval eyes and small asymmetric smile.
"""
from pathlib import Path
import json
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/characters/fox-reference'
image = cv2.imread(str(DEST / 'approved-reference.png'))
assert image is not None
image = cv2.bilateralFilter(image, 9, 22, 18)
H, W = image.shape[:2]
shape_specs = {}

def bezier(points, count=18):
    a,b,c,d = map(np.array,points)
    return [(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d for t in np.linspace(0,1,count)]

def mask_shape(start, segments):
    points=[np.array(start)]
    for segment in segments:
        if len(segment)==2: points.append(np.array(segment))
        else: points.extend(bezier([points[-1],*segment],24)[1:])
    mask=np.zeros((H,W),np.uint8)
    cv2.fillPoly(mask,[np.rint(points).astype(np.int32)],255)
    shape_specs[id(mask)] = (start, segments)
    return mask

def shape_path(mask,origin):
    start,segments=shape_specs[id(mask)]
    coord=lambda p:f'{(p[0]-origin[0])*.31:.2f} {(p[1]-origin[1])*.31:.2f}'
    path='M'+coord(start)
    for segment in segments:
        path+=('L'+coord(segment)) if len(segment)==2 else ('C'+' '.join(coord(p) for p in segment))
    return path+'Z'

def outline(mask,origin):
    return f'<path d="{shape_path(mask,origin)}" fill="none" stroke="#40392f" stroke-width="1.25" stroke-linejoin="round"/>'

# Source-space boundaries follow the existing ink line, including the cheek tufts.
head=mask_shape((580,300),[
    [(631,293),(694,307),(744,342)],[(781,367),(800,428),(802,517)],
    (828,528),[(822,539),(813,544),(805,548)],(832,570),
    [(822,578),(805,584),(788,588)],(804,607),
    [(791,617),(780,619),(771,618)],[(718,640),(648,645),(584,628)],
    [(542,621),(506,606),(475,590)],[(433,578),(397,570),(379,550)],
    (404,534),(369,516),(404,500),(374,485),(405,470),(381,458),
    [(402,456),(418,451),(430,441)],[(471,391),(526,325),(580,300)]
])
left=mask_shape((430,153),[
    [(485,171),(545,229),(581,301)],(590,338),(432,452),
    [(399,396),(381,328),(386,261)],[(391,216),(413,171),(430,153)]
])
right=mask_shape((705,174),[
    [(754,220),(794,305),(798,371)],[(801,395),(795,421),(790,443)],
    (757,411),(629,323),[(649,260),(679,202),(705,174)]
])

gray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
eye_masks=[]
for x0,y0,x1,y1 in [(548,460,596,526),(706,487,752,551)]:
    region=np.zeros((H,W),np.uint8);region[y0:y1,x0:x1]=255
    dark=((gray<102)&(region>0)).astype(np.uint8)*255
    contours,_=cv2.findContours(dark,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    mask=np.zeros((H,W),np.uint8);cv2.drawContours(mask,[max(contours,key=cv2.contourArea)],-1,255,-1)
    eye_masks.append(mask)
eyes=cv2.bitwise_or(*eye_masks)

def solid(mask,origin,color):
    contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    result=[]
    for contour in contours:
        if cv2.contourArea(contour)<3:continue
        pts=cv2.approxPolyDP(contour,.55,True).reshape(-1,2).astype(float)
        pts=(pts-np.array(origin))*.31
        path=f'M{pts[0,0]:.2f} {pts[0,1]:.2f}'
        for i in range(len(pts)):
            p0,p1,p2,p3=[pts[k%len(pts)] for k in [i-1,i,i+1,i+2]]
            c1=p1+(p2-p0)/6;c2=p2-(p3-p1)/6
            path+=f'C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}'
        path+='Z'
        result.append(f'<path d="{path}" fill="{color}"/>')
    return ''.join(result)

origin=(600,470)
highlight=(((image.min(axis=2)>215)&(eyes>0)).astype(np.uint8))*255
B,G,R=[image[:,:,i].astype(float) for i in range(3)]
red=((R>G*1.3)&(R>B*1.4)&(R>90)).astype(np.uint8)*255
deep=((R>G*1.5)&(R<185)&(G<112)&(R>75)).astype(np.uint8)*255
red=cv2.medianBlur(red,3);deep=cv2.medianBlur(deep,3)

def roi(mask,box):
    x0,y0,x1,y1=box;out=np.zeros_like(mask);out[y0:y1,x0:x1]=mask[y0:y1,x0:x1];return out

def stroke_source(path,origin,color,width):
    # Source-space design paths are transformed without changing their shape.
    return f'<path d="{path}" transform="scale(.31) translate({-origin[0]} {-origin[1]})" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'

defs='<defs><radialGradient id="reference-fur" cx=".42" cy=".36" r=".8"><stop stop-color="#fff8e8"/><stop offset=".72" stop-color="#fbefda"/><stop offset="1" stop-color="#efdfbf"/></radialGradient><linearGradient id="reference-red" x2=".85" y2="1"><stop stop-color="#cf6548"/><stop offset="1" stop-color="#b14735"/></linearGradient></defs>'
head_path=shape_path(head,origin)
head_svg=defs+f'<defs><clipPath id="reference-face-clip"><path d="{head_path}"/></clipPath></defs><path d="{head_path}" fill="url(#reference-fur)"/>'
head_svg+='<g clip-path="url(#reference-face-clip)"><path d="M456 557C515 607 648 640 748 604L725 618L749 620C691 640 628 644 584 628L548 612L523 597L490 590L504 589C480 575 467 566 456 557Z" transform="scale(.31) translate(-600 -470)" fill="#e7d5b5" opacity=".68"/></g>'
head_svg+=solid(roi(red,(641,389,692,448)),origin,'url(#reference-red)')
blush=((R>G*1.14)&(R>B*1.3)&(R>215)&(G>160)).astype(np.uint8)*255
head_svg+=solid(roi(blush,(449,487,520,528)),origin,'#efceae')+solid(roi(blush,(734,533,795,570)),origin,'#efceae')
nose=roi(((gray<110).astype(np.uint8)*255),(641,530,692,569))
head_svg+=solid(nose,origin,'#322f25')
head_svg+=stroke_source('M627 580Q640 590 657 582',origin,'#ecdcc0',2.2)
# The forehead crosses behind the ears; do not add a new dark ring around it.
head_svg+=stroke_source('M580 300Q606 297 630 303',origin,'#40392f',4)
head_svg+=stroke_source('M430 441Q417 455 381 458Q388 474 404 481L369 501Q385 520 404 526L379 550Q413 576 475 588C542 625 648 664 771 618Q791 619 804 607L788 588Q815 582 832 570L805 548Q822 540 828 528L802 517C799 455 795 415 780 386',origin,'#40392f',4)
head_svg+=stroke_source('M430 441Q478 374 517 348',origin,'#e3cfaa',2)

def ear_svg(mask,anchor):
    path=shape_path(mask,anchor)
    return defs+f'<path d="{path}" fill="url(#reference-fur)"/>'+solid(cv2.bitwise_and(red,mask),anchor,'url(#reference-red)')+solid(cv2.bitwise_and(deep,mask),anchor,'#943e30')+outline(mask,anchor)

def fitted_ovals(mask,color):
    contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    parts=[]
    for c in contours:
        if len(c)<5 or cv2.contourArea(c)<3:continue
        (cx,cy),(w,h),angle=cv2.fitEllipse(c)
        x=(cx-origin[0])*.31;y=(cy-origin[1])*.31
        parts.append(f'<ellipse cx="{x:.3f}" cy="{y:.3f}" rx="{w*.155:.3f}" ry="{h*.155:.3f}" transform="rotate({angle:.3f} {x:.3f} {y:.3f})" fill="{color}"/>')
    return ''.join(parts)

parts={'fox_head':head_svg,'fox_ear':ear_svg(left,(480,380)),'fox_ear_right':ear_svg(right,(720,400)),
       'fox_eyes':fitted_ovals(eyes,'#2e2c23'),'fox_pupils':fitted_ovals(highlight,'#fffdf5')}
(DEST / 'face-parts.json').write_text(json.dumps(parts,ensure_ascii=False,indent=2),encoding='utf8')
for name,content in parts.items():
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="-160 -160 320 320">{content}</svg>'
    (DEST / f'{name}.svg').write_text(svg,encoding='utf8')
alpha=cv2.bitwise_or(head,cv2.bitwise_or(left,right))
cutout=cv2.cvtColor(image,cv2.COLOR_BGR2BGRA);cutout[:,:,3]=alpha
cv2.imwrite(str(DEST / 'reference-face-cutout.png'),cutout[131:679,326:874])
print('Traced approved contours and facial features into',len(parts),'vector layers.')
