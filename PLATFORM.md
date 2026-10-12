# 微信 / 抖音小游戏适配与验收

当前交付为已经运行检查的 H5 版本。平台接口已预留；微信、抖音原生小游戏未实现适配器，未验证发布。

## 适配步骤

1. 实现 `PlatformAdapter`：原生 canvas 挂载、touchstart/move/end/cancel、资产路径、存储、音频、前后台切换和像素比。输入统一转换为 720×1280 逻辑坐标，一次只接受一个触点。
2. 配置 PixiJS 的原生 canvas 环境与 DOMAdapter，替换浏览器事件绑定和资源加载方式，接入 `wx.createCanvas / tt.createCanvas`，不得假设 document 或 HTMLCanvasElement 存在。
3. 部署构建时生成的 PNG 与图集；运行时不依赖 SVG 解析器。保留透明纹理，检查最大纹理尺寸与设备 GPU 限制。
4. 替换 WebAudio 合成器：可用构建时烘焙音效 + InnerAudioContext。音效开关和交互解锁语义保持一致。
5. 检查文字与中文字体：浏览器当前使用系统楷体；小游戏需可用的授权字体或预烘焙文字图集。
6. 对刘海屏、底部手势区、长屏和旧机型提供安全区域与轻盈画质。切到后台立即暂停，回来保持暂停，用户点击继续。
7. 接入目标平台开发者工具并做真机测试，再生成发布包。H5 的 Vite bundle 本身不是原生小游戏发布包。

## 可执行检查

```powershell
npm run check:platform
npm test
npm run art
npm run build
```

源码检查验证核心模型、手势识别、时间轴无 DOM 依赖，资产存在且名称唯一；不能替代目标平台真机验收。

## 真机验收清单

- [ ] 核心逻辑 + input/timeline 检查通过。
- [ ] 所有图集和中文文字加载，透明背景正确，无空白角色。
- [ ] 三种符文、短误触、乱画、Pointer/Touch 取消正确。
- [ ] 3 点生命、无敌、得分、60 秒胜利、失败、重开完整。
- [ ] 前后台生命周期、暂停时计时/角色/粒子均冻结。
- [ ] 刘海、底部安全区、375×667 / 390×844 / 430×932 比例无裁剪。
- [ ] 音效在首次交互后可用，静音与音量正确。
- [ ] 精致与轻盈画质能切换；实际设备记录 FPS 与内存。
- [ ] 十次重开后对象池/内存稳定，没有持续资源增长。
- [ ] 包体、分包、路径、域名与平台发布规则检查通过。


## 本次战斗改造

CombatClock、SpellChargeSystem、GestureRecognizer、EnemyAI/BossController、SpawnDirector、SkillTargetResolver、SpellFactory与Modifier均保持DOM无关。移动端需要使用 coordinates.worldPoint 等价换算触点，并分别传入真实时间和战斗时间；不能在平台层重复缩放，否则符境会错误变成4%速度。30组测试包括30/60/120FPS及375/390/430画幅坐标。正式版无DEV复现入口。仍需分别在目标小游戏平台接入纹理、声音、生命周期与存储并真机验证。
