import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('screenshots/review-2026-10-13');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto('http://127.0.0.1:5173/?lab=1&qa=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__LINGHU__ && window.__SLASH_PREVIEW__ && window.__CIRCLE_PREVIEW__ && window.__ARROW_PREVIEW__ && window.__THUNDER_PREVIEW__);
  await page.evaluate(() => window.__LINGHU__.app.ticker.stop());
  await page.locator('select').selectOption(String(Math.PI * 1.5));
  const scenes = [
    { key: 'line', label: '一字斩', level: 5, time: .56, api: '__SLASH_PREVIEW__' },
    { key: 'circle', label: '圆形护阵', level: 5, time: 3.2, api: '__CIRCLE_PREVIEW__' },
    { key: 'arrow', label: '箭头破甲 · 灵狐降灵', level: 4, time: 2.16, api: '__ARROW_PREVIEW__' },
    { key: 'thunder', label: '折线雷符 · 天狐雷劫', level: 4, time: 2.0, api: '__THUNDER_PREVIEW__' },
  ];
  const panels = [];
  for (const scene of scenes) {
    await page.evaluate(({ api, level, time }) => {
      window[api].frame(level, time);
      window.__LINGHU__.app.render();
    }, scene);
    const shot = await page.locator('#app').screenshot({ path: path.join(output, `${scene.key}.png`) });
    panels.push(await sharp(shot).resize(450, 800).png().toBuffer());
  }
  const width = 960, height = 1780, panelWidth = 450, panelHeight = 800;
  const margin = 20, header = 55, gap = 20;
  const title = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:'Microsoft YaHei',sans-serif;fill:#f5e4c4} .title{font-size:27px;font-weight:700} .label{font-size:22px;font-weight:600} .note{font-size:17px;fill:#d5bc92}</style><text x="20" y="36" class="title">灵狐绘卷 · 四技能当前效果预览</text>${scenes.map((scene, i) => { const x=margin+(i%2)*(panelWidth+gap), y=header+Math.floor(i/2)*(panelHeight+header+gap); return `<text x="${x}" y="${y+27}" class="label">${scene.label}  Lv${scene.level}</text><text x="${x}" y="${y+48}" class="note">演出 ${scene.time.toFixed(2)} 秒定格</text>`; }).join('')}</svg>`);
  await sharp({ create: { width, height, channels: 4, background: '#242127' } })
    .composite([
      ...panels.map((input, i) => ({ input, left: margin+(i%2)*(panelWidth+gap), top: header+Math.floor(i/2)*(panelHeight+header+gap)+55 })),
      { input: title, left: 0, top: 0 },
    ])
    .png().toFile(path.join(output, 'four-skills-review.png'));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Saved ${output}`);
} finally {
  await browser.close();
}
