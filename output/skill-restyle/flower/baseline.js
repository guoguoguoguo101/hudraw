import { Container, Graphics, GraphicsContext } from "/node_modules/.vite/deps/pixi__js.js?v=e2fe67c4";
import { FLOWER_BRUSH } from "/src/gameplay/petal-brush.ts";
import { inkButterfly, inkPaperShard } from "/src/rendering/ink-butterfly-art.ts";
const LEAF_COLORS = [15951423, 14240813, 15439175, 15253884];
function mapleLeaf(g, color, alpha = 1) {
  g.poly([0, -12, 2, -6, 6, -9, 5, -3, 11, -4, 8, 1, 10, 3, 3, 5, 0, 8, -3, 5, -10, 3, -8, 1, -11, -4, -5, -3, -6, -9, -2, -6]).fill({ color, alpha });
  g.poly([0, -11, 0, 7, -3, 4, -7, 2, -4, -2, -4, -6, -1, -4]).fill({ color: 16760178, alpha: alpha * 0.24 });
  g.moveTo(0, 11).quadraticCurveTo(-1, 3, 0, -8).moveTo(0, 3).lineTo(7, -1).moveTo(0, 3).lineTo(-7, -1).moveTo(0, -1).lineTo(4, -5).moveTo(0, -1).lineTo(-4, -5).stroke({ color: 16767130, width: 0.65, alpha: alpha * 0.7 });
}
function mapleEmblem(g) {
  g.save().transform(1.65, 0.35, -0.35, 1.65, 0, -2);
  mapleLeaf(g, LEAF_COLORS[0]);
  g.restore();
  g.save().transform(0.68, -0.5, 0.5, 0.68, 22, 10);
  mapleLeaf(g, LEAF_COLORS[3]);
  g.restore();
  g.moveTo(-20, 17).quadraticCurveTo(-6, 24, 11, 19).stroke({ color: 12218436, width: 1, alpha: 0.5 });
}
const leafContexts = /* @__PURE__ */ new Map(), shardContexts = /* @__PURE__ */ new Map();
function sharedArt(cache, key, draw) {
  let context = cache.get(key);
  if (!context) {
    context = new GraphicsContext();
    const g = new Graphics(context);
    draw(g);
    g.destroy();
    cache.set(key, context);
  }
  return context;
}
class PetalBrushRenderer {
  root = new Container();
  ground = new Graphics();
  leaves = new Container();
  buds = new Container();
  blooms = new Container();
  wisps = new Graphics();
  leafPool = [];
  budPool = [];
  bloomPool = [];
  constructor() {
    this.root.eventMode = "none";
    this.root.addChild(this.ground, this.leaves, this.buds, this.blooms, this.wisps);
  }
  butterfly(parent) {
    const root = new Container(), art = new Graphics();
    root.addChild(art);
    parent.addChild(root);
    return { root, art, opening: NaN };
  }
  poseButterfly(rig, opening, alpha) {
    rig.art.visible = alpha > 0;
    if (alpha <= 0) return;
    if (rig.opening !== opening) {
      rig.art.clear();
      inkButterfly(rig.art, opening);
      rig.opening = opening;
    }
    rig.art.alpha = alpha;
  }
  update(model, enabled, low = false, enemies = []) {
    this.root.visible = enabled;
    if (!enabled) return;
    this.ground.clear();
    this.wisps.clear();
    for (const g of this.leafPool) g.visible = false;
    for (const rig of this.budPool) rig.root.visible = false;
    for (const rig of this.bloomPool) rig.root.visible = false;
    let leafIndex = 0;
    for (let i = 0; i < model.leaves.length; i++) {
      if (low && i % 2) continue;
      const p = model.leaves[i], fade = Math.max(0, Math.min(1, p.age / 0.1, (p.life - p.age) / 0.5)), scale = p.size / 10, flutter = 0.3 + 0.7 * Math.abs(Math.cos(p.phase + p.age * 3.2)), c = Math.cos(p.angle), s = Math.sin(p.angle);
      this.ground.ellipse(p.x + 5, p.y + 12, p.size * 0.4, p.size * 0.1).fill({ color: 1453099, alpha: fade * 0.08 });
      const color = LEAF_COLORS[p.tone], context = sharedArt(leafContexts, color, (g) => mapleLeaf(g, color));
      let leaf = this.leafPool[leafIndex++];
      if (!leaf) {
        leaf = new Graphics(context);
        this.leafPool.push(leaf);
        this.leaves.addChild(leaf);
      }
      if (leaf.context !== context) leaf.context = context;
      leaf.visible = true;
      leaf.position.set(p.x, p.y);
      leaf.rotation = p.angle;
      leaf.scale.set(scale * flutter, scale);
      leaf.alpha = fade * 0.95;
    }
    for (const [i, b] of model.buds.entries()) {
      const fade = Math.max(0, Math.min(1, b.age / 0.12)), ready = Math.max(0, (b.age / FLOWER_BRUSH.budLife - 0.6) / 0.4), scale = 0.8, tilt = b.angle * 0.28;
      this.ground.ellipse(b.x, b.y + 13, 18 + ready * 4, 5).fill({ color: 1056547, alpha: fade * 0.3 });
      const rig = this.budPool[i] ?? (this.budPool[i] = this.butterfly(this.buds));
      rig.root.visible = true;
      rig.root.position.set(b.x, b.y - ready * 4);
      rig.root.rotation = tilt;
      rig.root.scale.set(scale);
      this.poseButterfly(rig, 0.03 + ready * 0.28, fade);
    }
    for (const [bi, b] of model.blooms.entries()) {
      let rig = this.bloomPool[bi];
      if (!rig) {
        rig = { ...this.butterfly(this.blooms), shards: [] };
        this.bloomPool[bi] = rig;
      }
      rig.root.visible = true;
      rig.root.position.set(b.x, b.y);
      const u = b.age / FLOWER_BRUSH.bloomLife, opening = Math.min(1, b.age / FLOWER_BRUSH.bloomDelay), fade = Math.max(0, Math.min(1, (1 - u) / 0.4)), size = 0.8 + 0.18 * opening;
      this.ground.ellipse(b.x, b.y + 10, 30 * size, 8 * size).fill({ color: 1056547, alpha: fade * 0.22 });
      const intact = Math.max(0, 1 - Math.max(0, b.age - 0.28) / 0.24);
      rig.art.position.set(0, -5);
      rig.art.scale.set(size);
      this.poseButterfly(rig, 0.3 + 0.7 * opening, fade * intact);
      const burst = Math.max(0, (b.age - FLOWER_BRUSH.bloomDelay) / 0.55);
      if (burst > 0 && burst < 1) {
        const r = 25 + FLOWER_BRUSH.bloomRadius * burst, alpha = (1 - burst) * 0.65;
        for (let side = 0; side < 2; side++) {
          const start = b.angle + side * Math.PI - 0.55;
          for (let j = 0; j < 7; j++) {
            const a = start + j * 0.2, c = start + (j + 1) * 0.2;
            this.ground.moveTo(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r * 0.52).lineTo(b.x + Math.cos(c) * r, b.y + Math.sin(c) * r * 0.52).stroke({ color: side ? 13940875 : 11094840, width: (1 - j / 8) * 2.5, alpha: alpha * (1 - j / 9) });
          }
        }
      }
      const n2 = low ? 5 : 8;
      for (const shard of rig.shards) shard.visible = false;
      for (let i = 0; i < n2; i++) {
        const flight = Math.max(0, b.age - 0.22), a = i * Math.PI * 2 / n2 + b.angle, d = 12 + (1 - Math.pow(1 - Math.min(1, flight / 0.8), 2)) * 88, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d * 0.58 - flight * 18;
        const alpha = fade * Math.min(1, flight / 0.09) * 0.9, spin = a + flight * (i % 2 ? 2 : -2), scale = 0.55 + i % 3 * 0.15;
        let shard = rig.shards[i];
        if (!shard) {
          shard = new Graphics(sharedArt(shardContexts, i % 3, (g) => inkPaperShard(g, i)));
          rig.shards[i] = shard;
          rig.root.addChild(shard);
        }
        shard.visible = alpha > 0;
        shard.position.set(x - b.x, y - b.y);
        shard.rotation = spin;
        shard.scale.set(scale);
        shard.alpha = alpha;
      }
    }
    let n = 0;
    for (const e of enemies) if (e.hp > 0 && model.isSlowed(e.id) && n++ < 12) {
      const y = e.y + 20, pulse = 0.75 + 0.2 * Math.sin(model.clock * 6 + e.id);
      this.wisps.moveTo(e.x - 23, y).quadraticCurveTo(e.x, y + 10, e.x + 23, y).stroke({ color: 14272937, width: 1.2, alpha: pulse * 0.6 });
      for (const side of [-1, 1]) this.wisps.moveTo(e.x + side * 20, y).quadraticCurveTo(e.x + side * 27, y - 10, e.x + side * 14, y - 19).stroke({ color: side === 1 ? 12086096 : 14272937, width: 1.3, alpha: pulse * 0.65 });
    }
  }
}
export {
  PetalBrushRenderer,
  mapleEmblem,
  mapleLeaf
};
