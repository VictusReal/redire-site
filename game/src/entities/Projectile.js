import GameConfig from '../config/GameConfig.js';

let _pid = 1;

export default class Projectile {
  constructor(x, y, dx, dy, speed, damage, pierce = 1, color = '#88aaff', radius = 8) {
    this.id = _pid++;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = speed;
    this.damage = damage;
    this.pierce = pierce;
    this.color = color;
    this.radius = radius;
    this.dead = false;
    this._hitIds = new Set();
    this._life = 3.5; // max travel seconds
  }

  update(dt) {
    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
    this._life -= dt;
    if (this._life <= 0) this.dead = true;
  }

  onHit(enemy) {
    if (this._hitIds.has(enemy.id)) return false;
    this._hitIds.add(enemy.id);
    this.pierce--;
    if (this.pierce <= 0) this.dead = true;
    return true;
  }

  render(ctx, screenX, screenY) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }
}

export class LightningStrike {
  constructor(tx, ty, damage) {
    this.tx = tx;
    this.ty = ty;
    this.damage = damage;
    this.duration = 0.22;
    this.timer = 0;
    this.dead = false;
    this.radius = 24;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.duration) this.dead = true;
  }

  render(ctx, screenX, screenY) {
    const alpha = 1 - this.timer / this.duration;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Flash circle
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius * (1 + this.timer), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,220,255,0.7)';
    ctx.shadowColor = '#aaf';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();
  }
}

export class HolyPulseEffect {
  constructor(x, y, radius, damage) {
    this.x = x;
    this.y = y;
    this.maxRadius = radius;
    this.radius = 0;
    this.damage = damage;
    this.dead = false;
    this._hitIds = new Set();
    this.duration = 0.35;
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
    this.radius = (this.timer / this.duration) * this.maxRadius;
    if (this.timer >= this.duration) this.dead = true;
  }

  onHit(enemy) {
    if (this._hitIds.has(enemy.id)) return false;
    this._hitIds.add(enemy.id);
    return true;
  }

  render(ctx, screenX, screenY) {
    const alpha = (1 - this.timer / this.duration) * 0.6;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffe080';
    ctx.shadowColor = '#ffe080';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
  }
}
