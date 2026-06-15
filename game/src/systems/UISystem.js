import GameConfig from '../config/GameConfig.js';

// Floating damage number
export class DamageNumber {
  constructor(x, y, value, color = '#fff') {
    this.x = x;
    this.y = y;
    this.vy = -60;
    this.value = value;
    this.color = color;
    this.life = 0.9;
    this.timer = 0;
    this.dead = false;
  }

  update(dt) {
    this.timer += dt;
    this.y += this.vy * dt;
    this.vy += 30 * dt;
    if (this.timer >= this.life) this.dead = true;
  }

  render(ctx, screenX, screenY) {
    const alpha = 1 - this.timer / this.life;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.font = `bold ${Math.round(14 + this.value * 0.04)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(this.value, screenX, screenY);
    ctx.restore();
  }
}

export default class UISystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.W = canvas.width;
    this.H = canvas.height;
    this._levelUpChoices = [];
    this._showLevelUp = false;
    this._selectedIndex = -1;
    this._chestReward = null;
    this._showChest = false;
    this._waveLabel = '';
    this._waveLabelTimer = 0;
    this._onLevelUpPick = null;
    this._onChestClose = null;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._bindTouch();
  }

  _bindTouch() {
    this.canvas.addEventListener('touchend', e => {
      const rect = this.canvas.getBoundingClientRect();
      const t = e.changedTouches[0];
      const x = (t.clientX - rect.left) * (this.canvas.width  / rect.width);
      const y = (t.clientY - rect.top)  * (this.canvas.height / rect.height);
      this._handleTap(x, y);
    });
    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width  / rect.width);
      const y = (e.clientY - rect.top)  * (this.canvas.height / rect.height);
      this._handleTap(x, y);
    });
  }

  _handleTap(x, y) {
    if (this._showLevelUp) {
      const picked = this._pickCard(x, y);
      if (picked !== -1 && this._onLevelUpPick) {
        this._onLevelUpPick(picked);
      }
    }
    if (this._showChest && this._onChestClose) {
      this._onChestClose();
    }
  }

  _pickCard(x, y) {
    const W = this.W, H = this.H;
    const count = this._levelUpChoices.length;
    const cardW = Math.min(W * 0.28, 200);
    const cardH = cardW * 1.5;
    const gap = 16;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (W - totalW) / 2;
    const cardY = H / 2 - cardH / 2;

    for (let i = 0; i < count; i++) {
      const cx = startX + i * (cardW + gap);
      if (x >= cx && x <= cx + cardW && y >= cardY && y <= cardY + cardH) {
        return i;
      }
    }
    return -1;
  }

  showLevelUpMenu(choices, onPick) {
    this._levelUpChoices = choices;
    this._showLevelUp = true;
    this._onLevelUpPick = (idx) => {
      this._showLevelUp = false;
      onPick(choices[idx]);
    };
  }

  hideLevelUp() {
    this._showLevelUp = false;
  }

  showChestReward(reward, onClose) {
    this._chestReward = reward;
    this._showChest = true;
    this._onChestClose = () => {
      this._showChest = false;
      onClose();
    };
  }

  showWaveLabel(text) {
    this._waveLabel = text;
    this._waveLabelTimer = 2.5;
  }

  update(dt) {
    if (this._waveLabelTimer > 0) this._waveLabelTimer -= dt;
  }

  get isPaused() {
    return this._showLevelUp || this._showChest;
  }

  renderHUD(ctx, player, xp, xpNeeded, level, gameTime, kills, coins, weapons, passives) {
    const W = this.W, H = this.H;
    ctx.save();

    // ---- XP Bar ----
    const barH = 10;
    const pct = Math.min(1, xp / xpNeeded);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, barH);
    const grad = ctx.createLinearGradient(0, 0, W * pct, 0);
    grad.addColorStop(0, '#4488ff');
    grad.addColorStop(1, '#88ccff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W * pct, barH);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, 0, W * pct, barH / 2);

    // ---- HP Bar ----
    const hpBarW = W * 0.55;
    const hpBarH = 16;
    const hpX = (W - hpBarW) / 2;
    const hpY = barH + 6;
    ctx.fillStyle = '#200';
    ctx.roundRect(hpX, hpY, hpBarW, hpBarH, 4);
    ctx.fill();
    const hpPct = player.hp / player.maxHp;
    const hpColor = hpPct > 0.5 ? '#4c4' : hpPct > 0.25 ? '#fa0' : '#f33';
    ctx.fillStyle = hpColor;
    ctx.roundRect(hpX, hpY, hpBarW * hpPct, hpBarH, 4);
    ctx.fill();
    // HP text
    ctx.fillStyle = '#fff';
    ctx.font = `bold 11px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, W / 2, hpY + hpBarH - 3);

    // ---- Level & timer ----
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, hpY + hpBarH + 4, W, 22);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LV ${level}`, 8, hpY + hpBarH + 18);

    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60).toString().padStart(2, '0');
    ctx.fillStyle = '#adf';
    ctx.textAlign = 'center';
    ctx.fillText(`${mins}:${secs}`, W / 2, hpY + hpBarH + 18);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`x${kills}`, W - 8, hpY + hpBarH + 18);

    // ---- Weapon/Passive list (compact) ----
    const listX = W - 10;
    let listY = H - 14;
    ctx.font = '10px sans-serif';
    for (const p of passives) {
      ctx.fillStyle = '#b8e';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.name} Lv${p.level}`, listX, listY);
      listY -= 14;
    }
    for (const w of weapons) {
      ctx.fillStyle = w.evolved ? '#ffa040' : '#8af';
      ctx.textAlign = 'right';
      ctx.fillText(`${w.name}${w.evolved ? '★' : ''} Lv${w.level}`, listX, listY);
      listY -= 14;
    }

    // ---- Coins ----
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🪙 ${coins}`, 8, H - 10);

    ctx.restore();
  }

  renderBossBar(ctx, boss) {
    const W = this.W;
    const barW = W * 0.7;
    const barH = 18;
    const bx = (W - barW) / 2;
    const by = this.H * 0.88;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.roundRect(bx - 4, by - 22, barW + 8, barH + 26, 6);
    ctx.fill();

    ctx.fillStyle = '#600';
    ctx.roundRect(bx, by, barW, barH, 4);
    ctx.fill();

    const pct = boss.hp / boss.maxHp;
    const bossGrad = ctx.createLinearGradient(bx, 0, bx + barW * pct, 0);
    bossGrad.addColorStop(0, '#8000ff');
    bossGrad.addColorStop(1, '#ff00cc');
    ctx.fillStyle = bossGrad;
    ctx.roundRect(bx, by, barW * pct, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name.toUpperCase(), W / 2, by - 6);
    ctx.restore();
  }

  renderLevelUpMenu(ctx) {
    if (!this._showLevelUp) return;
    const W = this.W, H = this.H;
    ctx.save();

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.round(H * 0.03)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', W / 2, H * 0.28);
    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.round(H * 0.018)}px sans-serif`;
    ctx.fillText('Choose an upgrade', W / 2, H * 0.32);

    const count = this._levelUpChoices.length;
    const cardW = Math.min(W * 0.28, 200);
    const cardH = cardW * 1.55;
    const gap = 14;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (W - totalW) / 2;
    const cardY = H / 2 - cardH / 2;

    for (let i = 0; i < count; i++) {
      const choice = this._levelUpChoices[i];
      const cx = startX + i * (cardW + gap);

      // Card bg
      ctx.fillStyle = 'rgba(20,20,50,0.95)';
      ctx.strokeStyle = choice.isNew ? '#ffd700' : '#446';
      ctx.lineWidth = 2;
      ctx.roundRect(cx, cardY, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      // Icon area
      const iconY = cardY + 18;
      ctx.fillStyle = choice.color || '#446';
      ctx.roundRect(cx + cardW * 0.2, iconY, cardW * 0.6, cardW * 0.6, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(cardW * 0.32)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(choice.icon || '⚡', cx + cardW / 2, iconY + cardW * 0.44);

      // Name
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(cardW * 0.11)}px sans-serif`;
      ctx.fillText(choice.name, cx + cardW / 2, cardY + cardW * 0.78);

      // Level indicator
      if (choice.isNew) {
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${Math.round(cardW * 0.09)}px sans-serif`;
        ctx.fillText('NEW!', cx + cardW / 2, cardY + cardW * 0.92);
      } else {
        ctx.fillStyle = '#8af';
        ctx.font = `${Math.round(cardW * 0.09)}px sans-serif`;
        ctx.fillText(`Level ${choice.currentLevel} → ${choice.currentLevel + 1}`, cx + cardW / 2, cardY + cardW * 0.92);
      }

      // Description
      ctx.fillStyle = '#bbb';
      ctx.font = `${Math.round(cardW * 0.085)}px sans-serif`;
      this._wrapText(ctx, choice.description, cx + 8, cardY + cardW * 1.05, cardW - 16, Math.round(cardW * 0.1) + 4);

      // Touch hint
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${Math.round(cardW * 0.08)}px sans-serif`;
      ctx.fillText(`[${i + 1}]`, cx + cardW / 2, cardY + cardH - 10);
    }

    ctx.restore();
  }

  renderChestReward(ctx) {
    if (!this._showChest || !this._chestReward) return;
    const W = this.W, H = this.H;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, W, H);

    const boxW = W * 0.7;
    const boxH = H * 0.36;
    const bx = (W - boxW) / 2;
    const by = H / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(30,20,10,0.97)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.roundRect(bx, by, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.round(H * 0.028)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✦ TREASURE CHEST ✦', W / 2, by + boxH * 0.22);

    if (this._chestReward.evolved) {
      ctx.fillStyle = '#ff88ff';
      ctx.font = `bold ${Math.round(H * 0.024)}px sans-serif`;
      ctx.fillText('⚡ WEAPON EVOLVED! ⚡', W / 2, by + boxH * 0.44);
    }

    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(H * 0.022)}px sans-serif`;
    ctx.fillText(this._chestReward.text, W / 2, by + boxH * 0.62);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(H * 0.016)}px sans-serif`;
    ctx.fillText('Tap anywhere to continue', W / 2, by + boxH * 0.85);
    ctx.restore();
  }

  renderWaveLabel(ctx) {
    if (this._waveLabelTimer <= 0) return;
    const alpha = Math.min(1, this._waveLabelTimer * 2);
    const W = this.W;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffa040';
    ctx.font = `bold ${Math.round(W * 0.04)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffa040';
    ctx.shadowBlur = 20;
    ctx.fillText(this._waveLabel, W / 2, this.H * 0.68);
    ctx.restore();
  }

  renderGameOver(ctx, stats) {
    const W = this.W, H = this.H;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#f44';
    ctx.font = `bold ${Math.round(H * 0.055)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', W / 2, H * 0.24);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    const fs = Math.round(H * 0.024);
    ctx.font = `${fs}px sans-serif`;
    const lines = [
      `Survived: ${stats.time}`,
      `Enemies killed: ${stats.kills}`,
      `Level: ${stats.level}`,
      `Coins earned: ${stats.coins}`,
    ];
    lines.forEach((l, i) => {
      ctx.fillText(l, W / 2, H * 0.38 + i * (fs + 10));
    });

    // Restart button
    const btnW = W * 0.5, btnH = H * 0.07;
    const btnX = (W - btnW) / 2, btnY = H * 0.68;
    ctx.fillStyle = '#4466aa';
    ctx.roundRect(btnX, btnY, btnW, btnH, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(H * 0.028)}px sans-serif`;
    ctx.fillText('PLAY AGAIN', W / 2, btnY + btnH * 0.65);

    ctx.restore();

    return { btnX, btnY, btnW, btnH };
  }

  renderStartScreen(ctx) {
    const W = this.W, H = this.H;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,10,0.92)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.round(H * 0.06)}px serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 25;
    ctx.fillText('SHADOW REALM', W / 2, H * 0.28);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#888';
    ctx.font = `${Math.round(H * 0.022)}px sans-serif`;
    ctx.fillText('Horde Survival', W / 2, H * 0.37);

    const btnW = W * 0.55, btnH = H * 0.075;
    const btnX = (W - btnW) / 2, btnY = H * 0.55;
    const grad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    grad.addColorStop(0, '#4466aa');
    grad.addColorStop(1, '#6644aa');
    ctx.fillStyle = grad;
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 1.5;
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(H * 0.032)}px sans-serif`;
    ctx.fillText('START GAME', W / 2, btnY + btnH * 0.65);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = `${Math.round(H * 0.018)}px sans-serif`;
    ctx.fillText('Use joystick • Survive as long as possible', W / 2, H * 0.72);

    ctx.restore();
    return { btnX, btnY, btnW, btnH };
  }

  _wrapText(ctx, text, x, y, maxWidth, lineH) {
    const words = text.split(' ');
    let line = '';
    let ly = y;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x + maxWidth / 2, ly);
        line = word;
        ly += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x + maxWidth / 2, ly);
  }
}
