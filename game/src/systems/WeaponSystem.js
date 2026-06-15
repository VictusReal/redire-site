import GameConfig from '../config/GameConfig.js';
import Projectile, { LightningStrike, HolyPulseEffect } from '../entities/Projectile.js';
import { angle, normalise, randFrom } from '../core/MathUtils.js';

// ---- Weapon instances ----

class ArcaneBolt {
  constructor(player) {
    this.id = 'arcane_bolt';
    this.name = 'Arcane Bolt';
    this.level = 1;
    this.maxLevel = 8;
    this._timer = 0;
    this.player = player;
    this.evolved = false;
  }

  get stats() {
    const base = GameConfig.WEAPONS.ARCANE_BOLT;
    const lv = this.level;
    return {
      damage:          base.damage + lv * 4,
      cooldown:        Math.max(0.25, base.cooldown - lv * 0.04) * (this.player.cooldownMulti),
      projectileSpeed: base.projectileSpeed + lv * 20,
      pierce:          base.pierce + Math.floor(lv / 3),
    };
  }

  update(dt, enemies, effects) {
    this._timer -= dt;
    if (this._timer > 0 || enemies.length === 0) return [];

    const st = this.stats;
    this._timer = st.cooldown / this.player.cooldownMulti;

    const count = this.evolved ? 3 : 1;
    const projectiles = [];

    // Find nearest enemy
    let nearest = null, nearDist = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < nearDist) { nearDist = d; nearest = e; }
    }
    if (!nearest) return [];

    const baseAngle = angle(this.player, nearest);
    const spread = this.evolved ? 0.35 : 0;

    for (let i = 0; i < count; i++) {
      const a = baseAngle + (i - Math.floor(count / 2)) * spread;
      const n = normalise(Math.cos(a), Math.sin(a));
      projectiles.push(new Projectile(
        this.player.x, this.player.y,
        n.x, n.y,
        st.projectileSpeed,
        st.damage * this.player.damageMulti,
        st.pierce,
        this.evolved ? '#ff88ff' : '#88aaff',
        this.evolved ? 10 : 8
      ));
    }
    return projectiles;
  }

  renderOwnEffects(ctx, cam) {}
}

class OrbitingBlade {
  constructor(player) {
    this.id = 'orbiting_blade';
    this.name = 'Orbiting Blade';
    this.level = 1;
    this.maxLevel = 8;
    this.player = player;
    this._angle = 0;
    this._hitCooldowns = new Map();
    this.evolved = false;
  }

  get stats() {
    const base = GameConfig.WEAPONS.ORBITING_BLADE;
    const lv = this.level;
    return {
      bladeCount:  base.bladeCount + Math.floor(lv / 2),
      damage:      base.damage + lv * 3,
      orbitSpeed:  base.orbitSpeed + lv * 0.12,
      orbitRadius: base.orbitRadius + lv * 8,
      size:        (this.evolved ? 20 : 14) + lv * 0.5,
    };
  }

  getBladePositions() {
    const st = this.stats;
    const positions = [];
    for (let i = 0; i < st.bladeCount; i++) {
      const a = this._angle + (i / st.bladeCount) * Math.PI * 2;
      positions.push({
        x: this.player.x + Math.cos(a) * st.orbitRadius,
        y: this.player.y + Math.sin(a) * st.orbitRadius,
      });
    }
    return positions;
  }

  update(dt, enemies) {
    const st = this.stats;
    this._angle += st.orbitSpeed * dt;

    const blades = this.getBladePositions();
    const hitEnemies = [];

    for (const enemy of enemies) {
      for (const blade of blades) {
        const d = Math.hypot(enemy.x - blade.x, enemy.y - blade.y);
        const hitKey = enemy.id;
        const lastHit = this._hitCooldowns.get(hitKey) || 0;
        if (d < st.size + enemy.radius && Date.now() - lastHit > 600) {
          this._hitCooldowns.set(hitKey, Date.now());
          hitEnemies.push({ enemy, dx: 0, dy: 0, dmg: st.damage * this.player.damageMulti });
          break;
        }
      }
    }

    // Prune old cooldowns
    if (this._hitCooldowns.size > 200) this._hitCooldowns.clear();

    return hitEnemies;
  }

  renderOwnEffects(ctx, cam) {
    const st = this.stats;
    const blades = this.getBladePositions();

    for (const blade of blades) {
      const sc = cam.toScreen(blade.x, blade.y);
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(this._angle * 3);
      ctx.fillStyle = this.evolved ? '#ffa040' : '#e0c040';
      ctx.shadowColor = this.evolved ? '#ffa040' : '#ffe060';
      ctx.shadowBlur = 12;
      const sz = st.size;
      ctx.fillRect(-sz, -sz * 0.3, sz * 2, sz * 0.6);
      ctx.restore();
    }
  }
}

class HolyPulse {
  constructor(player) {
    this.id = 'holy_pulse';
    this.name = 'Holy Pulse';
    this.level = 1;
    this.maxLevel = 8;
    this.player = player;
    this._timer = 0;
    this.evolved = false;
  }

  get stats() {
    const base = GameConfig.WEAPONS.HOLY_PULSE;
    const lv = this.level;
    return {
      damage:   base.damage + lv * 5,
      radius:   base.radius + lv * 18,
      cooldown: Math.max(0.8, base.cooldown - lv * 0.1) * (this.player.cooldownMulti),
    };
  }

  update(dt, enemies) {
    this._timer -= dt;
    if (this._timer > 0) return [];
    const st = this.stats;
    this._timer = st.cooldown / this.player.cooldownMulti;

    const effect = new HolyPulseEffect(
      this.player.x, this.player.y,
      st.radius * (this.evolved ? 1.8 : 1),
      st.damage * this.player.damageMulti
    );

    // Heal when evolved
    if (this.evolved) {
      const hitCount = enemies.filter(e =>
        Math.hypot(e.x - this.player.x, e.y - this.player.y) < st.radius * 1.8
      ).length;
      if (hitCount > 0) {
        this.player.heal(hitCount * 0.5);
      }
    }

    return [effect];
  }

  renderOwnEffects() {}
}

class LightningMark {
  constructor(player) {
    this.id = 'lightning_mark';
    this.name = 'Lightning Mark';
    this.level = 1;
    this.maxLevel = 8;
    this.player = player;
    this._timer = 0;
    this.evolved = false;
  }

  get stats() {
    const base = GameConfig.WEAPONS.LIGHTNING_MARK;
    const lv = this.level;
    return {
      damage:   base.damage + lv * 6,
      strikes:  base.strikes + Math.floor(lv / 2),
      cooldown: Math.max(0.4, base.cooldown - lv * 0.08) * (this.player.cooldownMulti),
    };
  }

  update(dt, enemies) {
    this._timer -= dt;
    if (this._timer > 0 || enemies.length === 0) return [];
    const st = this.stats;
    this._timer = st.cooldown / this.player.cooldownMulti;

    const targets = [...enemies].sort(() => Math.random() - 0.5).slice(0, st.strikes);
    const strikes = targets.map(e => new LightningStrike(e.x, e.y, st.damage * this.player.damageMulti));

    // Chain if evolved
    if (this.evolved) {
      for (const t of targets) {
        const nearby = enemies.filter(e =>
          e !== t && Math.hypot(e.x - t.x, e.y - t.y) < 120
        ).slice(0, 2);
        for (const nb of nearby) {
          strikes.push(new LightningStrike(nb.x, nb.y, st.damage * 0.5 * this.player.damageMulti));
        }
      }
    }

    return strikes;
  }

  renderOwnEffects() {}
}

// ---- Weapon registry & factory ----

const WEAPON_CLASSES = {
  arcane_bolt:    ArcaneBolt,
  orbiting_blade: OrbitingBlade,
  holy_pulse:     HolyPulse,
  lightning_mark: LightningMark,
};

export function createWeapon(id, player) {
  const Cls = WEAPON_CLASSES[id];
  if (!Cls) throw new Error('Unknown weapon: ' + id);
  return new Cls(player);
}

export default class WeaponSystem {
  constructor(player) {
    this.player = player;
    this.weapons = [];
    this.projectiles = [];
    this.effects = [];   // HolyPulseEffect, LightningStrike
    this._damageNumbers = [];

    // Give starting weapon
    this.addWeapon('arcane_bolt');
  }

  addWeapon(id) {
    if (this.weapons.find(w => w.id === id)) return false;
    this.weapons.push(createWeapon(id, this.player));
    return true;
  }

  upgradeWeapon(id) {
    const w = this.weapons.find(w => w.id === id);
    if (!w || w.level >= w.maxLevel) return false;
    w.level++;
    return true;
  }

  evolveWeapon(id) {
    const w = this.weapons.find(w => w.id === id);
    if (!w) return false;
    w.evolved = true;
    w.level = w.maxLevel;
    return true;
  }

  update(dt, enemies) {
    const hits = [];

    for (const w of this.weapons) {
      if (w.id === 'arcane_bolt' || w.id === 'lightning_mark' || w.id === 'holy_pulse') {
        const result = w.update(dt, enemies, this.effects);
        if (result && result.length) {
          // arcane_bolt returns Projectile[], lightning returns LightningStrike[], holy returns HolyPulseEffect[]
          for (const item of result) {
            if (item instanceof Projectile) this.projectiles.push(item);
            else this.effects.push(item);
          }
        }
      }
      if (w.id === 'orbiting_blade') {
        const bladeHits = w.update(dt, enemies);
        hits.push(...bladeHits);
      }
    }

    // Update projectiles
    for (const p of this.projectiles) {
      p.update(dt);
      for (const e of enemies) {
        if (p.dead) break;
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
          if (p.onHit(e)) {
            const n = normalise(e.x - this.player.x, e.y - this.player.y);
            hits.push({ enemy: e, dx: n.x, dy: n.y, dmg: p.damage });
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);

    // Update pulse/lightning effects
    for (const ef of this.effects) {
      ef.update(dt);
      if (ef instanceof HolyPulseEffect) {
        for (const e of enemies) {
          if (Math.hypot(e.x - ef.x, e.y - ef.y) < ef.radius + e.radius) {
            if (ef.onHit(e)) {
              hits.push({ enemy: e, dx: 0, dy: 0, dmg: ef.damage });
            }
          }
        }
      } else if (ef instanceof LightningStrike) {
        if (ef.timer < 0.05) { // only first frame
          for (const e of enemies) {
            if (Math.hypot(e.x - ef.tx, e.y - ef.ty) < e.radius + ef.radius) {
              hits.push({ enemy: e, dx: 0, dy: 0, dmg: ef.damage });
            }
          }
        }
      }
    }
    this.effects = this.effects.filter(ef => !ef.dead);

    return hits;
  }

  render(ctx, cam) {
    // Blade orbits
    for (const w of this.weapons) {
      if (w.id === 'orbiting_blade') w.renderOwnEffects(ctx, cam);
    }

    // Projectiles
    for (const p of this.projectiles) {
      if (!cam.isVisible(p.x, p.y, p.radius)) continue;
      const sc = cam.toScreen(p.x, p.y);
      p.render(ctx, sc.x, sc.y);
    }

    // Effects
    for (const ef of this.effects) {
      if (ef instanceof HolyPulseEffect) {
        const sc = cam.toScreen(ef.x, ef.y);
        ef.render(ctx, sc.x, sc.y);
      } else if (ef instanceof LightningStrike) {
        const sc = cam.toScreen(ef.tx, ef.ty);
        ef.render(ctx, sc.x, sc.y);
      }
    }
  }
}
