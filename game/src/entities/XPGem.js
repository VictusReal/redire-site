import GameConfig from '../config/GameConfig.js';
import { dist, angle } from '../core/MathUtils.js';

export default class XPGem {
  constructor(x, y, type = 'SMALL') {
    this.x = x;
    this.y = y;
    const cfg = GameConfig.XP_GEMS[type];
    this.value  = cfg.value;
    this.color  = cfg.color;
    this.radius = cfg.radius;
    this.dead   = false;
    this._attracting = false;
    this._bobOffset = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    const d = dist(this, player);

    if (d < player.magnetRange) this._attracting = true;

    if (this._attracting) {
      const a = angle(this, player);
      const spd = Math.max(280, 500 - d * 0.5);
      this.x += Math.cos(a) * spd * dt;
      this.y += Math.sin(a) * spd * dt;
    }

    if (d < GameConfig.PICKUP_RADIUS + this.radius) {
      this.dead = true;
      return this.value;
    }
    return 0;
  }

  render(ctx, sx, sy) {
    const bob = Math.sin(Date.now() * 0.004 + this._bobOffset) * 2;
    ctx.save();
    ctx.translate(sx, sy + bob);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    const r = this.radius;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.6, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    // Shine
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, -r * 0.2, r * 0.2, r * 0.1, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Coin {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 10;
    this.dead = false;
    this._bobOffset = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    const d = dist(this, player);
    if (d < player.magnetRange * 0.5) {
      const a = angle(this, player);
      const spd = 300;
      this.x += Math.cos(a) * spd * dt;
      this.y += Math.sin(a) * spd * dt;
    }
    if (d < GameConfig.PICKUP_RADIUS + this.radius) {
      this.dead = true;
      return this.value;
    }
    return 0;
  }

  render(ctx, sx, sy) {
    const bob = Math.sin(Date.now() * 0.004 + this._bobOffset) * 2;
    ctx.save();
    ctx.translate(sx, sy + bob);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}
