# 关卡选择 · 矢量灵兽 v1

四章共 19 个独立关节部件，原生矢量绘制：鹿身／鬃毛／头／耳／角，鲸身／尾／头，鹤身／上翼／下翼／头，狐身／三层尾／头／双耳。所有 SVG 均为可编辑路径，没有嵌入位图。

当前为干净曲线 v2。运行时使用 `public/art/maps/guardian-clean-v2.json`，通过 Pixi 原生 Graphics 绘制；巨兽不依赖 PNG 纹理或浏览器 SVG 解析。山水背景保留纸张与水墨质感，使用独立静态 JPG。关卡按钮的位置与点击区域保持原有排列。

## 动作

- 鹿：胸腹呼吸、轻点头、鹿角跟随、耳朵轻颤、鬃毛缓摆。
- 鲸：轻微升沉、抬头、尾部缓摆。
- 鹤：双翼错相舒展、颈部转动、轻微升沉。
- 狐：三层尾错相摆动、头部轻转、双耳轻颤。
- 四章都有眨眼；点选关卡有一次小幅回应。没有游戏内偏好时，跟随系统“减少动态”；顶部“动态 开／关”可明确覆盖这个默认值，并保存到当前设备，刷新后仍生效。

## 可复现制作流程

`python scripts/build-map-guardian-vectors.py`

参考原插画的巨兽位置，手工编写大轮廓、少量大面积明暗和顺着身体走势的曲线。四章分别只有 16／14／17／22 个形状，不再自动描摹纸张纹理或生成碎小色岛。输出四个分层 SVG、共用的压缩路径数据和背景 JPG。各部位在关节处自然重叠；待机动作已增大到手机上容易察觉的幅度。

原生动作：`src/ui/mountain-map-guardian.ts`；页面装配：`src/ui/mountain-map-life.ts`。

## 参考图来源与最终提示词

早期使用内置 image_gen 生成两张制作参考；v2 的巨兽改为手工编写的干净曲线。背景补全图仍然用于静态山水，透明参考仅归档，运行时不会加载。

**background-source.png**（原插画的背景补全；内置 image_gen，非 CLI）：

> Use case: precise-object-edit. Edit target: the attached exact 1080x1440 game background atlas, a precise 2x2 grid, each quadrant 540x720. Produce a CLEAN BACKGROUND PLATE for animation. Remove ONLY all four giant animals in their respective quadrants: top left red antlered deer including antlers, flowing red fur and red body; top right dark teal whale including its head at upper left, belly and tail on right; bottom left the huge white/navy crane including feathers, head, neck and sweeping wings; bottom right white many-tailed fox including head ears and tails. Seamlessly reconstruct the mountains, fog, water/sky behind these creatures. Keep the exact 2x2 quadrant boundaries at x540 y720, original overall size/ratio, every existing mountain foreground silhouette, moon/sun, boat, temple, original colors and paper texture/composition. Each panel must still resemble the same existing level backdrop, just without creatures. No creatures, no lettering, no borders. Keep detail in side edges but center soft mist for game buttons.

**guardian-source.png**（原插画的透明轮廓参考；内置 image_gen，非 CLI）：

> Use case: background-extraction. Asset type: transparent animation atlas. Extract ONLY the FOUR giant spirit animals from the attached existing game background, preserving their appearance, original silhouettes, exact size and EXACT original coordinates. Canvas 1080x1440 portrait, a 2x2 grid with cells 540x720: top-left red deer including its huge black branching antlers, red head facing down-right at right edge, red flowing fur and red sweeping body; top-right dark teal whale with head upper-left, curved belly and tail on right; bottom-left the enormous white/navy crane with long neck on right, head upper-right, and sweeping white wings around the edges; bottom-right white many-tailed fox with face upper-right and sweeping white tails throughout. Remove ALL mountains, boats, temples, sun/moon, water, fog and beige/blue paper background; these should be true transparent empty space. The animals must remain in precisely the same locations and occupy same shapes as original for overlaying on clean background. Preserve painterly ink and textured fur, antler details. Soft edges can have alpha; no checkerboard pixels, no solid background, no UI, no text. Do not center or rearrange animals, do not add full bodies that were not visible.

## 验证与预览

- `node scripts/check-map-guardian-motion.mjs`：四章实际页面自动播放、独立关节、背景稳定、眨眼、点选回应、减少动态、无角色贴图、无页面或 WebGL 错误。
- `node scripts/check-mountain-map-design.mjs`：375／390／430 宽手机布局、关卡点击、首领入关、返回。
- `node scripts/build-map-guardian-preview.mjs`：生成实际渲染器的四章同屏动图 `screenshots/map-vector-motion/guardians-clean-motion.gif`，并确认全部 32 帧都有 150ms 播放时长。

微信包单独压缩静态背景和无损压缩矢量 JSON，保留矢量动作。
