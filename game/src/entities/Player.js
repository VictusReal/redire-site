import GameConfig from '../config/GameConfig.js';
import { sprites } from '../assets/ProceduralSprites.js';
import { clamp } from '../core/MathUtils.js';

export default class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = GameConfig.PLAYER.RADIUS;

    this.maxHp = GameConfig.PLAYER.MAX_HP;
    this.hp    = this.maxHp;
    this.speed = GameConfig.PLAYER.SPEED;

    // Invincibility frames
    this.invincible = false;
    this.invincibleTimer = 0;
    this._flashState = false;

    // Damage feedback
    this.shakeRequest = 0;

    // Permanent upgrades applied externally
    this.damageMulti   = 1;
    this.speedMulti    = 1;
    this.cooldownMulti = 1;
    this.xpMulti       = 1;
    this.magnetRange   = GameConfig.MAGNET_RADIUS;

    // Facing direction for sprite
    this.facingRight = true;

    // Passive item map { id -> level }
    this.passives = {};

    // Weapon list
    this.weapons = [];

    // Coins collected this run
    this.coins = 0;

    // Preload sprite
    this._sprite = sprites.player();
  }

  takeDamage(amount) {
    if (this.invincible) return 0;
    const dr = this._getDamageReduction();
    const dmg = Math.max(1, Math.round(amount * (1 - dr)));
    this.hp = Math.max(0, this.hp - dmg);
    this.invincible = true;
    this.invincibleTimer = GameConfig.PLAYER.INVINCIBILITY_MS / 1000;
    this.shakeRequest = 5;
    return dmg;
  }

  heal(amount) {
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
  }

  _getDamageReduction() {
    // Iron Heart gives 5% DR per level (used elsewhere for HP, but DR from armour)
    return 0;
  }

  update(dt, input) {
    // Move
    const spd = this.speed * this.speedMulti;
    this.x += input.dx * spd * dt;
    this.y += input.dy * spd * dt;

    // Clamp inside world
    this.x = clamp(this.x, 0, GameConfig.WORLD_WIDTH);
    this.y = clamp(this.y, 0, GameConfig.WORLD_HEIGHT);

    if (input.dx !== 0) this.facingRight = input.dx > 0;

    // Invincibility countdown
    if (this.invincible) {
      this.invincibleTimer -= dt;
      this._flashState = Math.floor(this.invincibleTimer * 10) % 2 === 0;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this._flashState = false;
      }
    }
  }

  get isDead() { return this.hp <= 0; }

  render(ctx, screenX, screenY) {
    if (this.invincible && this._flashState) return;

    const size = GameConfig.SPRITE_SIZE * GameConfig.SPRITE_RENDER_SCALE;
    ctx.save();
    ctx.translate(screenX, screenY);
    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this._sprite, -size / 2, -size / 2, size, size);
    ctx.restore();

    // Low HP pulse
    if (this.hp < this.maxHp * 0.25) {
      const alpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.006);
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.radius + 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,0,0,${alpha})`;
      ctx.fill();
    }
  }
}
