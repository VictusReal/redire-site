import { lerp } from './MathUtils.js';

export default class Camera {
  constructor(viewW, viewH) {
    this.x = 0;
    this.y = 0;
    this.viewW = viewW;
    this.viewH = viewH;
    this.shake = 0;
  }

  follow(target, dt) {
    const tx = target.x - this.viewW / 2;
    const ty = target.y - this.viewH / 2;
    this.x = lerp(this.x, tx, Math.min(1, dt * 8));
    this.y = lerp(this.y, ty, Math.min(1, dt * 8));
  }

  addShake(amount) {
    this.shake = Math.max(this.shake, amount);
  }

  applyShake() {
    if (this.shake <= 0) return { ox: 0, oy: 0 };
    const ox = (Math.random() - 0.5) * this.shake * 2;
    const oy = (Math.random() - 0.5) * this.shake * 2;
    this.shake *= 0.85;
    if (this.shake < 0.5) this.shake = 0;
    return { ox, oy };
  }

  // Transform world coord to screen coord
  toScreen(wx, wy, ox = 0, oy = 0) {
    return {
      x: wx - this.x + ox,
      y: wy - this.y + oy,
    };
  }

  isVisible(wx, wy, r = 40) {
    const sx = wx - this.x;
    const sy = wy - this.y;
    return sx + r > 0 && sx - r < this.viewW && sy + r > 0 && sy - r < this.viewH;
  }
}
