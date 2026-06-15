import GameConfig from '../config/GameConfig.js';
import Enemy, { BossEnemy } from '../entities/Enemy.js';
import { rand, randFrom } from '../core/MathUtils.js';

export default class Spawner {
  constructor() {
    this._timer = 0;
    this._bossTimer = 0;
    this._interval = GameConfig.SPAWNER.BASE_INTERVAL;
    this.pendingBoss = false;
  }

  update(dt, gameTime, enemies, player) {
    if (enemies.length >= GameConfig.SPAWNER.MAX_ENEMIES) return [];

    this._timer -= dt;
    this._bossTimer += dt;
    const spawned = [];

    // Dynamically scale interval
    this._interval = Math.max(
      GameConfig.SPAWNER.MIN_INTERVAL,
      GameConfig.SPAWNER.BASE_INTERVAL - gameTime * 0.012
    );

    if (this._timer <= 0) {
      this._timer = this._interval;
      const count = this._spawnCount(gameTime);
      for (let i = 0; i < count; i++) {
        if (enemies.length < GameConfig.SPAWNER.MAX_ENEMIES) {
          spawned.push(this._spawnOne(gameTime, player));
        }
      }
    }

    // Boss every BOSS_SPAWN_INTERVAL seconds
    if (this._bossTimer >= GameConfig.BOSS.SPAWN_INTERVAL) {
      this._bossTimer -= GameConfig.BOSS.SPAWN_INTERVAL;
      const pos = this._edgePos(player);
      const scaleFactor = 1 + gameTime / 200;
      const boss = new BossEnemy(pos.x, pos.y, scaleFactor);
      spawned.push(boss);
    }

    return spawned;
  }

  _spawnCount(gameTime) {
    if (gameTime < 30)  return 1;
    if (gameTime < 90)  return 2;
    if (gameTime < 180) return 3;
    return Math.min(5, 3 + Math.floor((gameTime - 180) / 60));
  }

  _typeForTime(gameTime) {
    const r = Math.random();
    if (gameTime < 60) {
      return r < 0.8 ? 'SLIME' : 'BAT';
    }
    if (gameTime < 120) {
      if (r < 0.5) return 'SLIME';
      if (r < 0.8) return 'BAT';
      return 'CRAWLER';
    }
    if (gameTime < 240) {
      if (r < 0.3) return 'SLIME';
      if (r < 0.55) return 'BAT';
      if (r < 0.75) return 'CRAWLER';
      if (r < 0.92) return 'BRUTE';
      return 'ELITE';
    }
    // 4+ min: all types, more elites
    if (r < 0.2)  return 'SLIME';
    if (r < 0.4)  return 'BAT';
    if (r < 0.55) return 'CRAWLER';
    if (r < 0.72) return 'BRUTE';
    return 'ELITE';
  }

  _spawnOne(gameTime, player) {
    const pos = this._edgePos(player);
    const scale = 1 + gameTime / 180;
    const type = this._typeForTime(gameTime);
    return new Enemy(pos.x, pos.y, type, scale);
  }

  _edgePos(player) {
    const d = GameConfig.SPAWNER.SPAWN_DISTANCE;
    const a = Math.random() * Math.PI * 2;
    return {
      x: player.x + Math.cos(a) * d,
      y: player.y + Math.sin(a) * d,
    };
  }
}
