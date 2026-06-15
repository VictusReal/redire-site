const GameConfig = {
  // Internal world coordinates (large scrollable world)
  WORLD_WIDTH: 4000,
  WORLD_HEIGHT: 4000,

  // Sprite source size
  SPRITE_SIZE: 182,

  // Render scale: sprites drawn smaller than source
  SPRITE_RENDER_SCALE: 0.22,

  PLAYER: {
    SPEED: 220,
    MAX_HP: 100,
    INVINCIBILITY_MS: 800,
    RADIUS: 18,
  },

  WEAPONS: {
    ARCANE_BOLT: {
      id: 'arcane_bolt',
      name: 'Arcane Bolt',
      damage: 18,
      cooldown: 0.65,
      projectileSpeed: 520,
      pierce: 1,
      maxLevel: 8,
    },
    ORBITING_BLADE: {
      id: 'orbiting_blade',
      name: 'Orbiting Blade',
      damage: 12,
      bladeCount: 1,
      orbitSpeed: 2.2,
      orbitRadius: 70,
      maxLevel: 8,
    },
    HOLY_PULSE: {
      id: 'holy_pulse',
      name: 'Holy Pulse',
      damage: 22,
      radius: 110,
      cooldown: 1.8,
      maxLevel: 8,
    },
    LIGHTNING_MARK: {
      id: 'lightning_mark',
      name: 'Lightning Mark',
      damage: 28,
      strikes: 1,
      cooldown: 1.4,
      maxLevel: 8,
    },
  },

  PASSIVES: {
    SPELLBOOK:    { id: 'spellbook',    name: 'Spellbook',    maxLevel: 5 },
    POWER_STONE:  { id: 'power_stone',  name: 'Power Stone',  maxLevel: 5 },
    WIND_BOOTS:   { id: 'wind_boots',   name: 'Wind Boots',   maxLevel: 5 },
    MAGNET_CHARM: { id: 'magnet_charm', name: 'Magnet Charm', maxLevel: 5 },
    IRON_HEART:   { id: 'iron_heart',   name: 'Iron Heart',   maxLevel: 5 },
    CLOVER_COIN:  { id: 'clover_coin',  name: 'Clover Coin',  maxLevel: 5 },
  },

  ENEMIES: {
    SLIME:   { name: 'Slime',   hp: 30,  speed: 65,  damage: 8,  xp: 1,  radius: 14, color: '#4ae' },
    BAT:     { name: 'Bat',     hp: 18,  speed: 115, damage: 6,  xp: 1,  radius: 12, color: '#a5e' },
    BRUTE:   { name: 'Brute',   hp: 120, speed: 48,  damage: 18, xp: 5,  radius: 22, color: '#e64' },
    CRAWLER: { name: 'Crawler', hp: 50,  speed: 80,  damage: 10, xp: 2,  radius: 15, color: '#8c4' },
    ELITE:   { name: 'Elite',   hp: 200, speed: 55,  damage: 22, xp: 10, radius: 26, color: '#fa0' },
  },

  BOSS: {
    BASE_HP: 800,
    SPEED: 42,
    DAMAGE: 30,
    RADIUS: 42,
    SPAWN_INTERVAL: 120, // seconds
  },

  XP_GEMS: {
    SMALL: { value: 1,  color: '#48f', radius: 7 },
    MED:   { value: 5,  color: '#4f4', radius: 9 },
    LARGE: { value: 10, color: '#f44', radius: 11 },
  },

  MAGNET_RADIUS: 130,
  PICKUP_RADIUS: 28,

  SPAWNER: {
    BASE_INTERVAL: 1.2,
    MIN_INTERVAL: 0.25,
    MAX_ENEMIES: 120,
    SPAWN_DISTANCE: 520,
  },

  XP_PER_LEVEL: (lvl) => Math.floor(10 + lvl * 12 + lvl * lvl * 2),

  // Joystick UI
  JOYSTICK: {
    BASE_RADIUS: 60,
    KNOB_RADIUS: 26,
    ALPHA: 0.55,
    MARGIN_X: 90,
    MARGIN_Y: 110,
  },
};

export default GameConfig;
