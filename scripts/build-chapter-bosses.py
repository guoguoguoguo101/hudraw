"""Convert AI boss concept references to compact native paper contours for the game."""
from pathlib import Path
import importlib.util
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('chapter_vectors',ROOT/'scripts/build-chapter-vectors.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
builder.ART=ROOT/'assets/concepts/chapter-bosses'
builder.OUT=ROOT/'public/art/bosses';builder.OUT.mkdir(parents=True,exist_ok=True)
for name in ['valley','sea','palace','snow']:
 image=Image.open(builder.ART/f'{name}-boss-reference-v03.png').convert('RGBA')
 # Contour tracing has binary coverage: low-opacity outer glow is not part of the paper silhouette.
 alpha=image.getchannel('A');image.putalpha(alpha.point(lambda a:255 if a>=200 else 0))
 bbox=image.getchannel('A').getbbox();image=image.crop(bbox)
 image.thumbnail((352,352),Image.Resampling.LANCZOS)
 builder.trace(image,f'{name}-boss',24,20)
