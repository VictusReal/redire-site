import GameConfig from '../config/GameConfig.js';
import Input from './Input.js';
import Camera from './Camera.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import XPGem, { Coin } from '../entities/XPGem.js';
import WeaponSystem from '../systems/WeaponSystem.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import Spawner from '../systems/Spawner.js';
import Renderer from '../systems/Renderer.js';
import UISystem, { DamageNumber } from '../systems/UISystem.js';
import { randInt, randFrom } from './MathUtils.js';

const STATES = { START: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3 };

// Upgrade pool definition
const UPGRADE_POOL = [
  { id: 'weapon_arcane_bolt',    type: 'weapon',  weaponId: 'arcane_bolt',    name: 'Arcane Bolt',    icon: '🔮', color: '#226',  description: 'Fires magic bolts at the nearest enemy.' },
  { id: 'weapon_orbiting_blade', type: 'weapon',  weaponId: 'orbiting_blade', name: 'Orbiting Blade', icon: '⚔️', color: '#442',  description: 'Blades orbit the player, damaging enemies.' },
  { id: 'weapon_holy_pulse',     type: 'weapon',  weaponId: 'holy_pulse',     name: 'Holy Pulse',     icon: '✨', color: '#542',  description: 'Emit a radial pulse of holy energy.' },
  { id: 'weapon_lightning_mark', type: 'weapon',  weaponId: 'lightning_mark', name: 'Lightning Mark', icon: '⚡', color: '#224',  description: 'Strikes random enemies with lightning.' },
  { id: 'passive_spellbook',     type: 'passive', passiveId: 'spellbook',     name: 'Spellbook',      icon: '📖', color: '#224',  description: 'Reduces all weapon cooldowns.' },
  { id: 'passive_power_stone',   type: 'passive', passiveId: 'power_stone',   name: 'Power Stone',    icon: '💎', color: '#422',  description: 'Increases all weapon damage.' },
  { id: 'passive_wind_boots',    type: 'passive', passiveId: 'wind_boots',    name: 'Wind Boots',     icon: '👟', color: '#242',  description: 'Increases movement speed.' },
  { id: 'passive_magnet_charm',  type: 'passive', passiveId: 'magnet_charm',  name: 'Magnet Charm',   icon: '🧲', color: '#242',  description: 'Attracts XP gems from farther away.' },
  { id: 'passive_iron_heart',    type: 'passive', passiveId: 'iron_heart',    name: 'Iron Heart',     icon: '❤️', color: '#422',  description: 'Increases maximum HP.' },
  { id: 'passive_clover_coin',   type: 'passive', passiveId: 'clover_coin',   name: 'Clover Coin',    icon: '🍀', color: '#242',  description: 'Improves chest rewards and luck.' },
];

const EVOLUTIONS = [
  { weapon: 'arcane_bolt',    passive: 'spellbook',     name: 'Arcane Storm',      desc: 'Fires 3 projectiles in a burst.' },
  { weapon: 'orbiting_blade', passive: 'power_stone',   name: 'Celestial Blades',  desc: 'More blades, more damage.' },
  { weapon: 'holy_pulse',     passive: 'iron_heart',    name: 'Divine Nova',       desc: 'Huge pulse that heals you.' },
  { weapon: 'lightning_mark', passive: 'clover_coin',   name: 'Thunder Crown',     desc: 'Chains to nearby enemies.' },
];

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.state = STATES.START;

    this.input    = new Input(canvas);
    this.camera   = new Camera(canvas.width, canvas.height);
    this.ui       = new UISystem(canvas);
    this.renderer = null; // created after first update

    this._startBtnBounds  = null;
    this._restartBtnBounds = null;

    this._bindStartAndRestart();

    this._lastTime = performance.now();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _bindStartAndRestart() {
    const handle = (x, y) => {
      if (this.state === STATES.START && this._startBtnBounds) {
        const b = this._startBtnBounds;
        if (x >= b.btnX && x <= b.btnX + b.btnW && y >= b.btnY && y <= b.btnY + b.btnH) {
          this._startRun();
        }
      }
      if (this.state === STATES.GAME_OVER && this._restartBtnBounds) {
        const b = this._restartBtnBounds;
        if (x >= b.btnX && x <= b.btnX + b.btnW && y >= b.btnY && y <= b.btnY + b.btnH) {
          this.state = STATES.START;
        }
      }
    };

    const fromTouch = e => {
      const rect = this.canvas.getBoundingClientRect();
      const t = e.changedTouches[0];
      handle(
        (t.clientX - rect.left) * (this.canvas.width  / rect.width),
        (t.clientY - rect.top)  * (this.canvas.height / rect.height)
      );
    };

    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      handle(
        (e.clientX - rect.left) * (this.canvas.width  / rect.width),
        (e.clientY - rect.top)  * (this.canvas.height / rect.height)
      );
    });
    this.canvas.addEventListener('touchend', fromTouch);
  }

  _startRun() {
    const cx = GameConfig.WORLD_WIDTH  / 2;
    const cy = GameConfig.WORLD_HEIGHT / 2;

    this.player  = new Player(cx, cy);
    this.enemies = [];
    this.gems    = [];
    this.coins   = [];
    this.damageNums = [];

    this.weaponSystem = new WeaponSystem(this.player);
    this.player.weapons = this.weaponSystem.weapons;
    this.collision = new CollisionSystem();
    this.spawner   = new Spawner();
    this.renderer  = new Renderer(this.ctx, GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);

    this.camera.x = cx - this.canvas.width  / 2;
    this.camera.y = cy - this.canvas.height / 2;

    this.xp      = 0;
    this.level   = 1;
    this.kills   = 0;
    this.runCoins = 0;
    this.gameTime = 0;
    this._bossOnScreen = null;
    this._passiveLevels = {};

    // Apply permanent upgrades from localStorage
    this._applyPermaUpgrades();

    this.state = STATES.PLAYING;
    this._prevWaveMinute = -1;
  }

  _applyPermaUpgrades() {
    const saved = JSON.parse(localStorage.getItem('shadowRealm_perma') || '{}');
    if (saved.hp)        this.player.maxHp   += (saved.hp   || 0) * 5;
    if (saved.damage)    this.player.damageMulti   *= 1 + (saved.damage  || 0) * 0.05;
    if (saved.speed)     this.player.speedMulti    *= 1 + (saved.speed   || 0) * 0.03;
    if (saved.xpGain)    this.player.xpMulti       *= 1 + (saved.xpGain || 0) * 0.05;
    if (saved.magnetRange) this.player.magnetRange += (saved.magnetRange || 0) * 20;
    this.player.hp = this.player.maxHp;
  }

  _loop(now) {
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;
    this._update(dt);
    this._render();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    this.input.update();

    if (this.state === STATES.START || this.state === STATES.GAME_OVER) return;
    // Keyboard shortcuts work even while paused (for level-up menu)
    if (this.ui._showLevelUp) {
      [1,2,3].forEach(n => {
        if (this.input.isKey(`Digit${n}`) || this.input.isKey(`Numpad${n}`)) {
          const idx = n - 1;
          if (idx < this.ui._levelUpChoices.length && this.ui._onLevelUpPick) {
            this.ui._onLevelUpPick(idx);
          }
        }
      });
    }

    if (this.ui.isPaused) {
      this.ui.update(dt);
      return;
    }
    if (this.state !== STATES.PLAYING) return;

    this.gameTime += dt;
    this.ui.update(dt);

    // Player
    this.player.update(dt, this.input);
    this.camera.follow(this.player, dt);

    // Enemy shake request
    if (this.player.shakeRequest > 0) {
      this.camera.addShake(this.player.shakeRequest);
      this.player.shakeRequest = 0;
    }

    // Spawner
    const newEnemies = this.spawner.update(dt, this.gameTime, this.enemies, this.player);
    this.enemies.push(...newEnemies);

    // Wave label
    const curMinute = Math.floor(this.gameTime / 60);
    if (curMinute > this._prevWaveMinute) {
      this._prevWaveMinute = curMinute;
      const labels = ['The hunt begins...','The dark grows...','Beware the shadows...','Evil rises!','Chaos unleashed!'];
      if (curMinute < labels.length) this.ui.showWaveLabel(labels[curMinute]);
      else this.ui.showWaveLabel(`Minute ${curMinute} — Endless Horror!`);
    }

    // Update enemies
    for (const e of this.enemies) e.update(dt, this.player);

    // Weapon hits
    const weaponHits = this.weaponSystem.update(dt, this.enemies);
    for (const { enemy, dx, dy, dmg } of weaponHits) {
      if (enemy.dead) continue;
      enemy.takeDamage(dmg, dx, dy);
      const sc = this.camera.toScreen(enemy.x, enemy.y);
      this.damageNums.push(new DamageNumber(sc.x, sc.y - 20, Math.round(dmg), '#ffe060'));
    }

    // Process dead enemies
    const deadEnemies = this.enemies.filter(e => e.dead);
    for (const e of deadEnemies) {
      this.kills++;
      this._dropXpGem(e);
      if (Math.random() < 0.12) {
        this.coins.push(new Coin(e.x + (Math.random()-0.5)*20, e.y + (Math.random()-0.5)*20, 1));
      }
      if (e.isBoss) {
        this._bossOnScreen = null;
        this.camera.addShake(12);
        this._openChest(e.x, e.y);
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // Track boss on screen
    this._bossOnScreen = this.enemies.find(e => e.isBoss) || null;

    // Player-enemy collision
    const touching = this.collision.checkPlayerEnemyCollisions(this.player, this.enemies);
    for (const e of touching) {
      const dmg = this.player.takeDamage(e.damage);
      if (dmg > 0) {
        const sc = this.camera.toScreen(this.player.x, this.player.y);
        this.damageNums.push(new DamageNumber(sc.x, sc.y - 30, dmg, '#f44'));
      }
    }

    // XP gems & coins
    for (const g of this.gems) {
      const gained = g.update(dt, this.player);
      if (gained > 0) this.xp += gained * this.player.xpMulti;
    }
    this.gems = this.gems.filter(g => !g.dead);

    for (const c of this.coins) {
      const gained = c.update(dt, this.player);
      if (gained > 0) this.runCoins += gained;
    }
    this.coins = this.coins.filter(c => !c.dead);

    // Damage numbers
    for (const dn of this.damageNums) dn.update(dt);
    this.damageNums = this.damageNums.filter(d => !d.dead);

    // Levelling up
    const needed = GameConfig.XP_PER_LEVEL(this.level);
    if (this.xp >= needed) {
      this.xp -= needed;
      this.level++;
      this._doLevelUp();
    }

    // Restart key
    if (this.player.isDead) {
      this._onDeath();
    }
  }

  _dropXpGem(enemy) {
    const r = Math.random();
    const type = r < 0.6 ? 'SMALL' : r < 0.88 ? 'MED' : 'LARGE';
    // Elites/boss drop more
    const count = enemy.isBoss ? 8 : enemy.type === 'ELITE' ? 3 : 1;
    for (let i = 0; i < count; i++) {
      this.gems.push(new XPGem(
        enemy.x + (Math.random()-0.5)*30,
        enemy.y + (Math.random()-0.5)*30,
        type
      ));
    }
  }

  _doLevelUp() {
    const choices = this._generateUpgradeChoices(3);
    this.ui.showLevelUpMenu(choices, (choice) => {
      this._applyUpgradeChoice(choice);
    });
  }

  _generateUpgradeChoices(count) {
    const available = [];

    for (const up of UPGRADE_POOL) {
      if (up.type === 'weapon') {
        const owned = this.weaponSystem.weapons.find(w => w.id === up.weaponId);
        if (!owned) {
          available.push({ ...up, isNew: true, currentLevel: 0 });
        } else if (owned.level < owned.maxLevel) {
          available.push({ ...up, isNew: false, currentLevel: owned.level });
        }
      } else if (up.type === 'passive') {
        const lvl = this._passiveLevels[up.passiveId] || 0;
        const maxLvl = GameConfig.PASSIVES[up.passiveId.toUpperCase().replace(/-/g,'_')]?.maxLevel || 5;
        if (lvl < maxLvl) {
          available.push({ ...up, isNew: lvl === 0, currentLevel: lvl });
        }
      }
    }

    // Shuffle & pick
    const shuffled = available.sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, count);

    // Fallback: heal if nothing available
    while (picks.length < count) {
      picks.push({
        id: 'heal',
        type: 'heal',
        name: 'Life Surge',
        icon: '💚',
        color: '#242',
        description: 'Restore 30 HP.',
        isNew: false,
        currentLevel: 0,
      });
    }

    return picks;
  }

  _applyUpgradeChoice(choice) {
    if (choice.type === 'weapon') {
      if (choice.isNew) {
        this.weaponSystem.addWeapon(choice.weaponId);
        this.player.weapons = this.weaponSystem.weapons;
      } else {
        this.weaponSystem.upgradeWeapon(choice.weaponId);
      }
    } else if (choice.type === 'passive') {
      const pid = choice.passiveId;
      this._passiveLevels[pid] = (this._passiveLevels[pid] || 0) + 1;
      this._applyPassive(pid, this._passiveLevels[pid]);
    } else if (choice.type === 'heal') {
      this.player.heal(30);
    }
  }

  _applyPassive(id, level) {
    switch (id) {
      case 'spellbook':    this.player.cooldownMulti = Math.max(0.4, 1 - level * 0.1); break;
      case 'power_stone':  this.player.damageMulti   = 1 + level * 0.12; break;
      case 'wind_boots':   this.player.speedMulti    = 1 + level * 0.08; break;
      case 'magnet_charm': this.player.magnetRange   = GameConfig.MAGNET_RADIUS + level * 40; break;
      case 'iron_heart':
        this.player.maxHp += 20;
        this.player.heal(20);
        break;
      case 'clover_coin':
        // Increases chest luck - used when opening chest
        break;
    }
  }

  _openChest(wx, wy) {
    this.camera.addShake(8);
    // Check for weapon evolutions first
    const possible = EVOLUTIONS.filter(ev => {
      const weapon = this.weaponSystem.weapons.find(w => w.id === ev.weapon && w.level >= w.maxLevel && !w.evolved);
      const hasPassive = (this._passiveLevels[ev.passive] || 0) > 0;
      return weapon && hasPassive;
    });

    if (possible.length > 0) {
      const ev = possible[Math.floor(Math.random() * possible.length)];
      this.weaponSystem.evolveWeapon(ev.weapon);
      this.player.weapons = this.weaponSystem.weapons;
      this.camera.addShake(18);
      this.ui.showChestReward({ text: `${ev.name} — ${ev.desc}`, evolved: true }, () => {});
      return;
    }

    // Regular chest reward
    const luck = this._passiveLevels['clover_coin'] || 0;
    const rewards = [
      { text: 'Weapon upgraded!',  fn: () => { const w = this.weaponSystem.weapons.filter(w2 => w2.level < w2.maxLevel); if (w.length) { const pick = w[Math.floor(Math.random()*w.length)]; pick.level++; } } },
      { text: '+25 HP restored!',  fn: () => this.player.heal(25 + luck * 5) },
      { text: `+${15 + luck * 5} coins!`, fn: () => { this.runCoins += 15 + luck * 5; } },
      { text: 'Passive upgraded!', fn: () => { const ids = Object.keys(this._passiveLevels); if (ids.length) { const pid = randFrom(ids); this._passiveLevels[pid]++; this._applyPassive(pid, this._passiveLevels[pid]); } else this.player.heal(20); } },
    ];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    reward.fn();
    this.ui.showChestReward({ text: reward.text, evolved: false }, () => {});
  }

  _onDeath() {
    // Save coins
    const saved = JSON.parse(localStorage.getItem('shadowRealm_coins') || '0');
    localStorage.setItem('shadowRealm_coins', JSON.stringify(saved + this.runCoins));
    this.state = STATES.GAME_OVER;
  }

  _render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (this.state === STATES.START) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      this._startBtnBounds = this.ui.renderStartScreen(ctx);
      return;
    }

    if (this.state === STATES.GAME_OVER) {
      if (this.renderer) {
        this.renderer.renderBackground(this.camera);
      }
      const mins = Math.floor(this.gameTime / 60);
      const secs = Math.floor(this.gameTime % 60).toString().padStart(2, '0');
      this._restartBtnBounds = this.ui.renderGameOver(ctx, {
        time: `${mins}:${secs}`,
        kills: this.kills,
        level: this.level,
        coins: this.runCoins,
      });
      return;
    }

    if (!this.renderer) return;

    // Camera shake
    const { ox, oy } = this.camera.applyShake();
    ctx.save();
    ctx.translate(ox, oy);

    // Background
    this.renderer.renderBackground(this.camera);
    this.renderer.renderDecorations(this.camera);

    // XP Gems & coins
    for (const g of this.gems) {
      if (!this.camera.isVisible(g.x, g.y, g.radius + 4)) continue;
      const sc = this.camera.toScreen(g.x, g.y);
      g.render(ctx, sc.x, sc.y);
    }
    for (const c of this.coins) {
      const sc = this.camera.toScreen(c.x, c.y);
      c.render(ctx, sc.x, sc.y);
    }

    // Enemies
    for (const e of this.enemies) {
      if (!this.camera.isVisible(e.x, e.y, e.radius + 40)) continue;
      const sc = this.camera.toScreen(e.x, e.y);
      e.render(ctx, sc.x, sc.y);
    }

    // Player
    const psc = this.camera.toScreen(this.player.x, this.player.y);
    this.player.render(ctx, psc.x, psc.y);

    // Weapons (orbits, projectiles, effects)
    this.weaponSystem.render(ctx, this.camera);

    // Damage numbers (screen-space)
    for (const dn of this.damageNums) {
      dn.render(ctx, dn.x, dn.y);
    }

    ctx.restore();

    // HUD (no shake)
    this.ui.renderHUD(ctx,
      this.player,
      this.xp,
      GameConfig.XP_PER_LEVEL(this.level),
      this.level,
      this.gameTime,
      this.kills,
      this.runCoins,
      this.weaponSystem.weapons,
      Object.entries(this._passiveLevels || {}).map(([id, lv]) => {
        const key = id.toUpperCase().replace(/-/g, '_');
        const cfg = GameConfig.PASSIVES[key];
        return { name: cfg ? cfg.name : id, level: lv };
      })
    );

    // Boss bar
    if (this._bossOnScreen) {
      this.ui.renderBossBar(ctx, this._bossOnScreen);
    }

    // Wave label
    this.ui.renderWaveLabel(ctx);

    // Joystick
    this.input.render(ctx);

    // Level up / chest overlays
    this.ui.renderLevelUpMenu(ctx);
    this.ui.renderChestReward(ctx);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
  }
}
