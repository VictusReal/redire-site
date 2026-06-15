// Pre-renders sprites onto offscreen canvases for performance
const cache = {};

function make(key, size, drawFn) {
  if (cache[key]) return cache[key];
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  drawFn(c.getContext('2d'), size);
  cache[key] = c;
  return c;
}

export const sprites = {
  player() {
    return make('player', 182, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      // Robe/body
      ctx.fillStyle = '#4a6fa5';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 28, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#f5c8a0';
      ctx.beginPath();
      ctx.arc(cx, cy - 22, 22, 0, Math.PI * 2);
      ctx.fill();
      // Hood
      ctx.fillStyle = '#2a4070';
      ctx.beginPath();
      ctx.arc(cx, cy - 26, 26, Math.PI, 0);
      ctx.fill();
      // Eyes (glow)
      ctx.fillStyle = '#88ddff';
      ctx.beginPath(); ctx.arc(cx - 7, cy - 22, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 7, cy - 22, 4, 0, Math.PI * 2); ctx.fill();
      // Staff
      ctx.strokeStyle = '#b08040';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx + 32, cy + 50);
      ctx.lineTo(cx + 24, cy - 30);
      ctx.stroke();
      // Orb on staff
      ctx.fillStyle = '#8af';
      ctx.shadowColor = '#88ddff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx + 22, cy - 34, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  },

  slime() {
    return make('slime', 182, (ctx, s) => {
      const cx = s / 2, cy = s / 2 + 10;
      ctx.fillStyle = '#3ab';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 35, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy - 8, 12, 8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx - 10, cy - 6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 10, cy - 6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(cx - 8, cy - 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 12, cy - 6, 3, 0, Math.PI * 2); ctx.fill();
    });
  },

  bat() {
    return make('bat', 182, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      // Wings
      ctx.fillStyle = '#70408a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx - 50, cy - 20, cx - 65, cy + 10);
      ctx.quadraticCurveTo(cx - 40, cy + 5, cx, cy + 15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + 50, cy - 20, cx + 65, cy + 10);
      ctx.quadraticCurveTo(cx + 40, cy + 5, cx, cy + 15);
      ctx.fill();
      // Body
      ctx.fillStyle = '#5a305a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#f44';
      ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 5, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
    });
  },

  brute() {
    return make('brute', 182, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      // Body
      ctx.fillStyle = '#c05030';
      ctx.fillRect(cx - 32, cy - 30, 64, 70);
      // Head
      ctx.fillStyle = '#d06040';
      ctx.fillRect(cx - 24, cy - 56, 48, 44);
      // Horns
      ctx.fillStyle = '#400';
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 50);
      ctx.lineTo(cx - 28, cy - 78);
      ctx.lineTo(cx - 10, cy - 56);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 20, cy - 50);
      ctx.lineTo(cx + 28, cy - 78);
      ctx.lineTo(cx + 10, cy - 56);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#ff0';
      ctx.beginPath(); ctx.arc(cx - 10, cy - 38, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 10, cy - 38, 5, 0, Math.PI * 2); ctx.fill();
    });
  },

  crawler() {
    return make('crawler', 182, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      // Legs
      ctx.strokeStyle = '#5a8030';
      ctx.lineWidth = 4;
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        ctx.beginPath();
        ctx.moveTo(cx + i * 14, cy);
        ctx.lineTo(cx + i * 28, cy + 22);
        ctx.stroke();
      }
      // Body
      ctx.fillStyle = '#6a9040';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4, 26, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#8ab050';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 22, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#000';
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.arc(cx + i * 7, cy - 24, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },

  elite() {
    return make('elite', 182, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      // Armour body
      ctx.fillStyle = '#c08010';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 36, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#e0a020';
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 28, 0, Math.PI * 2);
      ctx.fill();
      // Crown
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy - 44);
      ctx.lineTo(cx - 20, cy - 66);
      ctx.lineTo(cx - 6,  cy - 50);
      ctx.lineTo(cx,      cy - 70);
      ctx.lineTo(cx + 6,  cy - 50);
      ctx.lineTo(cx + 20, cy - 66);
      ctx.lineTo(cx + 28, cy - 44);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#f80';
      ctx.shadowColor = '#fa0';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(cx - 10, cy - 32, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 10, cy - 32, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });
  },

  boss() {
    return make('boss', 182, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      // Dark aura
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 80);
      grad.addColorStop(0, 'rgba(80,0,160,0.6)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s, s);
      // Body
      ctx.fillStyle = '#4a0080';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 42, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#6000b0';
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 34, 0, Math.PI * 2);
      ctx.fill();
      // Multiple eyes
      ctx.fillStyle = '#fff';
      const eyePos = [[-14,-36],[14,-36],[-24,-26],[24,-26],[0,-24]];
      eyePos.forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.arc(cx + ex, cy + ey, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#f0f';
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 6;
      eyePos.forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.arc(cx + ex, cy + ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      // Tentacles
      ctx.strokeStyle = '#3a0060';
      ctx.lineWidth = 6;
      [[-38, 20], [38, 20], [-45, 0], [45, 0]].forEach(([tx, ty]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + 30);
        ctx.quadraticCurveTo(cx + tx * 0.6, cy + ty + 30, cx + tx, cy + ty + 50);
        ctx.stroke();
      });
    });
  },

  xpGem(color = '#48f') {
    const key = 'xpgem_' + color;
    return make(key, 32, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx, s - 2);
      ctx.lineTo(cx - 8, cy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  },

  coin() {
    return make('coin', 28, (ctx, s) => {
      const cx = s / 2, cy = s / 2;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb400';
      ctx.font = `bold ${Math.floor(s * 0.55)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', cx, cy + 1);
    });
  },

  arcaneBolt() {
    return make('arcane_bolt', 28, (ctx, s) => {
      ctx.fillStyle = '#88aaff';
      ctx.shadowColor = '#88aaff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  blade() {
    return make('blade', 36, (ctx, s) => {
      ctx.strokeStyle = '#e0c040';
      ctx.shadowColor = '#ffe060';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(s / 2 - 14, s / 2);
      ctx.lineTo(s / 2 + 14, s / 2);
      ctx.stroke();
    });
  },
};
