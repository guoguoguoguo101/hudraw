# 雪眠巨兽章节背景

由 OpenAI imagegen 根据已选中的「雪眠巨兽」概念生成，2026-10-24。

- `snow-user-reference.png`：AI 生成的无 UI、无角色背景原稿，仅用于制作参考。
- `snow-landscape.svg`：原稿转换后的剪纸矢量轮廓。
- `../../../../public/art/chapters/snow-landscape.json`：运行时使用的紧凑矢量数据（实际位置为项目根目录下 `public/art/chapters`）。
- 重建：项目根目录执行 `python scripts/build-snow-chapter.py`，需 Pillow、vtracer。
- 运行时不请求参考 PNG；落雪、呼吸雾、月轮、巨兽睁眼和纸妖均由游戏独立绘制。

## 原始生成提示词

Use case: stylized-concept. Input image is a reference for the approved Snow Sleeping Colossus chapter composition and layered Chinese papercut art style. Create a CLEAN GAME ENVIRONMENT BACKGROUND from this reference, portrait exactly 9:16 if possible, intended for vector contour tracing into Pixi game art. Remove ALL text, title plates, labels, fox/player, creatures standing in the foreground, interfaces and UI. Keep the same snowy white mountain-beast scene: giant ancient white antlered beast sleeping in the upper/right mountains, closed eye visible, antlers rising near top, neck/back become snow-covered stone ridges, tiny black pines on its back, flowing thin ancient gold rock seams. A calm paper-colored sky and distant pale snow peaks, layered deep blue-gray exposed rock, white rounded snowcaps, sparse red berries only at extreme corners. The giant head should fill the upper right region, nose facing right at approximately 87% image width and 25% height; eye around 73% width and 22% height, antlers near 70% width and 6% height. Maintain the giant beast as part of landscape, not a cartoon pet portrait. IMPORTANT battlefield layout: the entire lower 48% image is a spacious, level, uncluttered deep charcoal gray stone arena, ellipse rear edge at 53% image height, subtle fine ancient gold paving/inlay, mostly dark flat middle so real enemies and player can be placed separately by code. Keep snow piled mainly at left/right/bottom edges, foreground frames narrow, never block the central combat area. No temple, shrine, city, pagoda, statue or human architecture. Flat simplified layered cut-paper shapes, moderate detail, clear silhouettes and large color regions, restrained paper texture, limited palette of ivory white, pearl gray, charcoal blue and sparse antique gold. Do not draw snowflakes in this still image (they will be animated separately), no glow effects or fog obscuring the beast's face. No characters, no fox, no title or writing whatsoever. Beautiful and consistent with the approved reference, suitable for direct conversion into vector game scene shapes.
