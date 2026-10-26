"""Author the snow chapter using the existing chapter-vector pipeline.

The AI PNG is an offline reference. Only DOM-free contour JSON ships at runtime.
Does not rebuild or replace the approved sea/palace assets.
"""
from pathlib import Path
import importlib.util
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('chapter_vectors',ROOT/'scripts/build-chapter-vectors.py')
builder=importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
builder.ART=ROOT/'assets/concepts/snow-chapter-reference'
image=Image.open(builder.ART/'snow-user-reference.png').convert('RGB').resize((720,1280),Image.Resampling.LANCZOS)
builder.trace(image,'snow-landscape',48,4)
