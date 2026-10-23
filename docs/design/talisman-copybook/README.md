# 符帖临摹 · 三版交互概念

使用内置 image_gen 生成，以本项目 screenshots/burning-sea/brush-cinnabar.png 作为画风和场景参考。每张展示四步交互；本轮交付设计图，没有改动游戏代码。

- A 战场描符：底部选符 → 狐狸周围显示虚线符形 → 逐笔描画 → 完成施法。适合快速战斗。
- B 符帖临摹：展开符帖 → 选择符页 → 悬浮符纸上描画 → 盖印释放。适合首次学符和收藏仪式感。
- C 落地成阵：选符 → 拖放落点 → 在选定位置描画 → 局部范围触发。适合控制区域，操作步骤最多。

通用约定：狐狸固定站位；描画时战斗减速；完整符形弱提示、当前笔金色、已完成笔朱砂；允许抬手续画；演示符形采用三笔简化虚构符号。图中的文字、符形和控件尺寸为概念示意，最终笔顺与判定需在原型中验证。

# 生成提示词

## A · a-battle-tracing.png

Use case: ui-mockup. Deliverable: ONE landscape 2x2 interaction storyboard with four equally sized large portrait mobile-game frames; 1536px wide or larger composition, generous margins on parchment. Reference image is this project's existing gameplay screenshot ONLY for art style, fixed white fox, dark arena, red sun and mountains, muted gold/charcoal interface. Create a polished practical UX concept board for tracing preset talisman glyphs like a handwriting copybook. This is VARIANT A, direct in-battle tracing around the fixed fox, no floating paper card or modal. Remove the screenshot's existing fire attack and developer test buttons. Title exactly "方案 A · 战场描符". Frame sequence labeled "01 选符", "02 起笔", "03 续画", "04 施法". Same red/charcoal/paper aesthetic in all four.
Use ONE consistent simple THREE-STROKE fictional '镇妖符' glyph in frames 2,3,4: stroke1 a top horizontal bar, stroke2 a connected inverted U enclosure open at bottom, stroke3 a central vertical line ending in a hook. Avoid dense unreadable traditional talisman scribbles. Three little marks 1/3 2/3 3/3 indicate stroke progress, visually easy to understand.
Frame1 combat at normal view, three small bottom talisman icons labeled "镇妖", "敕雷", "焚山", selected 镇妖 highlighted; an illustrated fingertip/touch halo clicks it, fox stays center.
Frame2 glyph ghost projected above and around fox directly on the arena; entire glyph faint grey-gold, only first stroke warm gold, a small glowing dot and arrow show start and direction; text "从亮点起笔". Enemies visible approaching, clock icon "战斗减速".
Frame3 first stroke completed in cinnabar, second stroke being drawn gold-red, third still faint. Show actual hand-drawn slightly imperfect path within a broad invisible tolerance guide, brush-tip and touch halo at CURRENT point, short dashed arrow only on current stroke; "抬手可续画" beneath. The completed stroke must remain when pen is lifted.
Frame4 completed glyph shrinks into a red-gold seal stamp, three enemy silhouettes visibly restrained by distinct ground binding rings. Caption "收笔 · 镇妖". Keep fox visible and readable, no player movement.
Use tiny external amber arrows between frames, subtle callout labels outside the game frames; prioritize interaction clarity and screen space. Elegant 2D papercut game art, real UI hierarchy, readable restrained Chinese labels. No browser window, no code, no promotional illustration, no giant explosion, no occult photorealism. Frame order clear left-to-right then next row.

## B · b-copybook-sheet.png

Use case: ui-mockup. Deliverable: ONE landscape 2x2 interaction storyboard with FOUR large portrait phone gameplay frames and a refined parchment background. Input image is STYLE/COMPOSITION REFERENCE for existing Chinese paper-cut mountain-and-sea mobile game, white fox fixed at center, charcoal ground, huge red sun, layered vermilion mountains, muted antique-gold UI. This is VARIANT B: a pull-out talisman-book drawer for selecting a preset, followed by tracing on a translucent floating paper talisman over the battle. Title exactly "方案 B · 符帖临摹". Frame labels "01 展开符帖", "02 选定符页", "03 按帖描画", "04 盖印释放". Remove original fire attacks and debug controls.
Keep the SAME compact THREE-STROKE talisman through selection, tracing and release: top horizontal, inverted-U outer enclosure, middle vertical with hook. Do not replace the glyph with arbitrary dense Chinese writing.
Frame1 combat with small bottom tab "符帖"; touch halo drags it upward; compact drawer occupies lower third, battle and fox still visible above.
Frame2 the drawer presents exactly three paper cards 镇妖符 / 敕雷符 / 焚山符 with recognizably different simple symbols, selected 镇妖符 has vermilion border, small preview "束缚周围敌人", button "描符"; selected card pulled toward central drawing area. Avoid long paragraphs.
Frame3 drawer closed, a narrow vertical pale translucent washi talisman floats in central arena, not full-screen; battle remains visible at left/right and fox visible below. Faint full-glyph copybook, completed stroke red, current stroke gold, future stroke grey; glowing brush tip with touch halo; caption "第 2 笔 / 共 3 笔". Small top-left "返回符帖", top-right "战斗减速". Drawn line imperfect and forgiving.
Frame4 paper talisman finishes with a small square vermilion seal mark, rolls into a beam toward enemies, bound targets indicated by low golden bands. Bottom drawer tab reappears; caption "成符 · 镇妖".
Illustrate UI state transitions using small arrows outside frame edges and concise annotations "选帖" "临摹" "释放". Handmade paper-cut screenprint look, restrained red/gold palette, calm readable interface; no realistic hand blocking screen, no literal text wall, no moving fox, no fake screenshots of code. Make it a usable mobile interaction proposal, not only beautiful splash art.

## C · c-ground-placement.png

Use case: ui-mockup. Deliverable: ONE landscape 2x2 interaction concept storyboard containing four LARGE portrait mobile-game screens on a parchment art-direction board. Screenshot is reference for this real game's papercut art: white fox fixed in place, dark ground, red sun and layered burgundy mountains, fine gold/charcoal HUD. This is VARIANT C: place a talisman copybook footprint at a chosen ground position, then trace it IN PLACE to create a local area seal. Title exactly "方案 C · 落地成阵". Frame labels "01 选择符阵", "02 拖到目标处", "03 原地描符", "04 成阵触发". Remove original red fire trail and developer skill-test panel. Same fixed fox position and same enemy group across frames.
Use a consistent THREE-STROKE simplified seal glyph inside a faint circular footprint (the circle is placement area indicator, NOT an extra stroke): top horizontal bar, inverted-U enclosure, central vertical hook. All symbols must remain the same through the four screens.
Frame1 select compact bottom "镇妖符" icon, touch halo at icon, small label "拖放符帖".
Frame2 player drags the ghost talisman footprint into an enemy group on the ground ABOVE-RIGHT of stationary fox; short clear drag arrow from icon toward ground. The translucent placement circle outlines ONLY local skill radius. Two eligible enemies inside highlighted softly; enemies outside not highlighted. Label "松手放置". Placement is distinct from tracing.
Frame3 footprint anchored in chosen location; arrow now gone; first stroke red, second gold under brush tip with touch halo, remaining stroke grey. Label "沿虚线描画" and tiny "第 2 笔 / 共 3 笔". Fox remains untouched lower-left, enemies continue slow motion. No full-screen paper modal.
Frame4 a red-gold seal flares in the exact placed area and binds ONLY the enemies inside the circle; outside enemies unchanged. One concise note "范围内生效". Bottom symbol returns to ready/cooldown state. Clear visual cause and effect.
External arrows between frames and small annotation "选位置 → 描符 → 触发". No added movement joystick, no character movement, no big opaque VFX covering enemies, no long text, no decorative fake calligraphy obscuring the action. High quality restrained 2D papercut mobile game UI design sheet showing a genuinely different interaction than centered tracing.
