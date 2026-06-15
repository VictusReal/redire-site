import GameConfig from '../config/GameConfig.js';
import { sprites } from '../assets/ProceduralSprites.js';
import { angle } from '../core/MathUtils.js';

let _nextId = 1;

export default class Enemy {
  constructor(x, y, type = 'SLIME', scaleFactor = 1) {
    this.id = _nextId++;
    this.x = x;
    this.y = y;
    this.type = type;

    const cfg = GameConfig.ENEMIES[type];
    this.maxHp  = Math.round(cfg.hp  * scaleFactor);
    this.hp     = this.maxHp;
    this.speed  = cfg.speed * (0.9 + Math.random() * 0.2) * Math.pow(scaleFactor, 0.4);
    this.damage = cfg.damage;
    this.xpValue = cfg.xp;
    this.radius  = cfg.radius;
    this.color   = cfg.color;
    this.name    = cfg.name;

    this.dead = false;
    this.hitFlash = 0;

    this._vx = 0;
    this._vy = 0;
    this._sprite = this._loadSprite(type);
  }

  _loadSprite(type) {
    const map = {
      SLIME:   sprites.slime,
      BAT:     sprites.bat,
      BRUTE:   sprites.brute,
      CRAWLER: sprites.crawler,
      ELITE:   sprites.elite,
    };
    return map[type] ? map[type]() : sprites.slime();
  }

  takeDamage(amount, knockbackDx = 0, knockbackDy = 0) {
    this.hp -= amount;
    this.hitFlash = 0.15;
    if (knockbackDx || knockbackDy) {
      this._vx += knockbackDx * 120;
      this._vy += knockbackDy * 120;
    }
    if (this.hp <= 0) this.dead = true;
    return amount;
  }

  update(dt, player) {
    // Move toward player
    const a = angle(this, player);
    const tx = Math.cos(a) * this.speed;
    const ty = Math.sin(a) * this.speed;

    // Blend velocity toward target
    this._vx += (tx - this._vx) * Math.min(1, dt * 6);
    this._vy += (ty - this._vy) * Math.min(1, dt * 6);

    // Apply friction to knockback
    this._vx *= Math.max(0, 1 - dt * 5);
    this._vy *= Math.max(0, 1 - dt * 5);

    this.x += this._vx * dt;
    this.y += this._vy * dt;

    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  render(ctx, screenX, screenY) {
    const size = GameConfig.SPRITE_SIZE * GameConfig.SPRITE_RENDER_SCALE;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Face player direction
    if (this._vx < 0) ctx.scale(-1, 1);

    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + 0.5 * (this.hitFlash / 0.15);
      ctx.filter = 'brightness(3)';
    }

    ctx.drawImage(this._sprite, -size / 2, -size / 2, size, size);
    ctx.restore();

    // HP bar
    const barW = this.radius * 2.4;
    const barH = 4;
    const bx = screenX - barW / 2;
    const by = screenY - size / 2 - 8;
    ctx.fillStyle = '#300';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = this.hitFlash > 0 ? '#ff8' : '#4c4';
    ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
  }
}

export class BossEnemy extends Enemy {
  constructor(x, y, scaleFactor = 1) {
    // use a placeholder type, then override
    super(x, y, 'ELITE', scaleFactor);
    this.type = 'BOSS';
    this.name = 'Shadow Lord';
    this.maxHp  = Math.round(GameConfig.BOSS.BASE_HP * scaleFactor);
    this.hp     = this.maxHp;
    this.speed  = GameConfig.BOSS.SPEED;
    this.damage = GameConfig.BOSS.DAMAGE;
    this.radius = GameConfig.BOSS.RADIUS;
    this.xpValue = 40;
    this._sprite = sprites.boss();
    this.isBoss = true;
  }

  render(ctx, screenX, screenY) {
    // Aura
    const t = Date.now() * 0.002;
    const auraR = this.radius * 2.2 + Math.sin(t) * 8;
    const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, auraR);
    grad.addColorStop(0, 'rgba(150,0,255,0.2)');
    grad.addColorStop(1, 'rgba(150,0,255,0)');
    ctx.beginPath();
    ctx.arc(screenX, screenY, auraR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    const size = GameConfig.SPRITE_SIZE * GameConfig.SPRITE_RENDER_SCALE * 2.0;

    ctx.save();
    ctx.translate(screenX, screenY);
    if (this.hitFlash > 0) {
      ctx.filter = 'brightness(2) saturate(2)';
      ctx.globalAlpha = 0.7 + 0.3 * (this.hitFlash / 0.15);
    }
    ctx.drawImage(this._sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}
