# 画灵四章最终 Boss · AI 设计原稿

当前运行采用 **v03**：简洁剪纸、成年比例、沉稳威严。v01 较复杂阴暗，v02 偏可爱，均保留为历史备选。v03 的完整生成提示词见 `prompts-v03.json`；四张原稿为 `{valley,sea,palace,snow}-boss-reference-v03.png`。使用内置 OpenAI imagegen，以 v02 为编辑参考。

AI 原稿经离线轮廓转换生成矢量路径；运行时绘制矢量并缓存绘制结果，不加载设计 PNG。本体目前整体呼吸、摆动、位移，未拆分头尾四肢骨骼。v03 路径数 292／239／306／326，总计 197060 字节；微信无损压缩约 111 KB。

2026-10-25，使用内置 OpenAI imagegen 分别生成四张独立透明背景设计图。原稿保留在本目录，游戏采用对应 SVG／紧凑矢量轮廓，并绘制独立的蓄势、攻击、破招和虚弱特效。

| 章节 | Boss | 原稿 |
| --- | --- | --- |
| 落日妖谷 | 衔日狐王 | valley-boss-reference-v01.png |
| 鲸梦浮海 | 镇潮蜃君 | sea-boss-reference-v01.png |
| 星河天宫 | 司辰傀帝 | palace-boss-reference-v01.png |
| 雪眠巨兽 | 缚梦霜魇 | snow-boss-reference-v01.png |

重建：项目根目录执行 `python scripts/build-chapter-bosses.py`（Pillow、vtracer）。矢量化时忽略半透明外发光，保留清晰纸片轮廓；游戏加载 `public/art/bosses/*-boss.json`，不请求设计原稿 PNG。

## 完整生成提示词

### 衔日狐王

Use case: stylized-concept. Asset type: one full-body boss character concept for a Chinese cut-paper drawing combat game. Flat layered papercut illustration, elegant large silhouettes, restrained paper grain, dark ink cutouts, thin antique gold inlays, no 3D, no photorealism. FULL BODY completely inside canvas, generous transparent margins, isolated on TRUE TRANSPARENT background. Single character ONLY, no scene, no UI, no text, no captions, no character sheet. Front or shallow three-quarter view, threatening majestic, readable at 220px game scale, clear anatomy and limited colors. Design should be suitable for vector contour tracing. A nine-tailed black ink fox king with a cracked antique gold mask, sharp long fox muzzle, red-orange eyes, ivory chest, graceful animal body with four paws, enormous fan of NINE curved flame-like tails with cinnabar tips. Holds a small orange sunset orb at its mouth. Color charcoal, dark wine red, ivory and antique gold. A clearly FOX animal, not humanoid. Tail fan frames head and body. Majestic final boss of an autumn sunset valley.

### 镇潮蜃君

Use case: stylized-concept. Asset type: one full-body boss character concept for a Chinese cut-paper drawing combat game. Flat layered papercut illustration, elegant large silhouettes, restrained paper grain, dark ink cutouts, thin antique gold inlays, no 3D, no photorealism. FULL BODY completely inside canvas, generous transparent margins, isolated on TRUE TRANSPARENT background. Single character ONLY, no scene, no UI, no text, no captions, no character sheet. Front or shallow three-quarter view, threatening majestic, readable at 220px game scale, clear anatomy and limited colors. Design should be suitable for vector contour tracing. A huge mythical giant clam sovereign, two enormous open layered scalloped shells in turquoise, deep teal, ivory and gold wave inlays. ONE large golden eye glows in the dark inner cavity, surrounded by long ivory wave-shaped mantle tendrils. Small Chinese pavilion rooftops rise from the back shell like mirage architecture. Lower shell is grounded, upper shell towers above. A living sea monster, not a human or crab. A pearl below the eye. Final boss of a dream ocean carried by a whale.

### 司辰傀帝

Use case: stylized-concept. Asset type: one full-body boss character concept for a Chinese cut-paper drawing combat game. Flat layered papercut illustration, elegant large silhouettes, restrained paper grain, dark ink cutouts, thin antique gold inlays, no 3D, no photorealism. FULL BODY completely inside canvas, generous transparent margins, isolated on TRUE TRANSPARENT background. Single character ONLY, no scene, no UI, no text, no captions, no character sheet. Front or shallow three-quarter view, threatening majestic, readable at 220px game scale, clear anatomy and limited colors. Design should be suitable for vector contour tracing. A floating hollow Chinese celestial emperor PUPPET in angular layered indigo paper armor, long ivory and plum sleeves, a cracked tall gold ceremonial crown, an empty black mask with narrow gold eyes. Four clearly articulated hanging limbs attached with visible fine gold puppet threads to a HUGE circular gold astrolabe behind the figure, with three concentric orbital rings and star nodes. Angular folded-paper robes rather than natural cloth. Indigo, charcoal, ivory, muted plum and antique gold. Grand mechanical celestial boss, full body.

### 缚梦霜魇

Use case: stylized-concept. Asset type: one full-body boss character concept for a Chinese cut-paper drawing combat game. Flat layered papercut illustration, elegant large silhouettes, restrained paper grain, dark ink cutouts, thin antique gold inlays, no 3D, no photorealism. FULL BODY completely inside canvas, generous transparent margins, isolated on TRUE TRANSPARENT background. Single character ONLY, no scene, no UI, no text, no captions, no character sheet. Front or shallow three-quarter view, threatening majestic, readable at 220px game scale, clear anatomy and limited colors. Design should be suitable for vector contour tracing. A sinister black-ice DEER spirit emerging from a snow giant's nightmare. Slender four-legged animal deer body, long neck, angular charcoal and deep navy fractured icy armor, ivory snow shards, ONE broken branching antler and one whole antler, a suspended pale ice disk between the antlers. A bright antique gold knotted dream seal visible inside its cracked chest. Frost-chain ribbons wrap body, trailing broken black paper snow fragments. Cold pale blue, charcoal, silver-white, tiny gold highlights. Elegant ominous, not cute, not a humanoid. Full body.

