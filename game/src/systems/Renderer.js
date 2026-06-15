// Background tile renderer with dark fantasy tiles
export default class Renderer {
  constructor(ctx, worldW, worldH) {
    this.ctx = ctx;
    this.worldW = worldW;
    this.worldH = worldH;
    this._bgCanvas = this._generateBg();
    this._decorations = this._generateDecorations();
  }

  _generateBg() {
    const TILE = 96;
    const cols = Math.ceil(800 / TILE) + 2;
    const rows = Math.ceil(600 / TILE) + 2;

    const c = document.createElement('canvas');
    c.width  = TILE * cols;
    c.height = TILE * rows;
    const ctx = c.getContext('2d');

    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const shade = 0.95 + (Math.random() * 0.1 - 0.05);
        const base  = Math.floor(24 * shade);
        ctx.fillStyle = `rgb(${base},${Math.floor(20 * shade)},${Math.floor(30 * shade)})`;
        ctx.fillRect(col * TILE, r * TILE, TILE, TILE);

        // Grid lines
        ctx.strokeStyle = 'rgba(80,60,100,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * TILE + 0.5, r * TILE + 0.5, TILE - 1, TILE - 1);

        // Occasional texture marks
        if (Math.random() < 0.15) {
          ctx.fillStyle = 'rgba(60,50,80,0.4)';
          const mx = col * TILE + Math.random() * (TILE - 20);
          const my = r * TILE + Math.random() * (TILE - 10);
          ctx.fillRect(mx, my, 6 + Math.random() * 14, 3 + Math.random() * 6);
        }
      }
    }
    return c;
  }

  _generateDecorations() {
    const decos = [];
    const count = 600;
    for (let i = 0; i < count; i++) {
      const type = Math.random();
      decos.push({
        x: Math.random() * this.worldW,
        y: Math.random() * this.worldH,
        type: type < 0.4 ? 'rock' : type < 0.7 ? 'bone' : type < 0.85 ? 'candle' : 'ruin',
        size: 6 + Math.random() * 12,
        angle: Math.random() * Math.PI * 2,
      });
    }
    return decos;
  }

  renderBackground(cam) {
    const ctx = this.ctx;
    const TW = this._bgCanvas.width;
    const TH = this._bgCanvas.height;

    const ox = -(cam.x % TW);
    const oy = -(cam.y % TH);

    for (let x = ox - TW; x < ctx.canvas.width + TW; x += TW) {
      for (let y = oy - TH; y < ctx.canvas.height + TH; y += TH) {
        ctx.drawImage(this._bgCanvas, x, y);
      }
    }
  }

  renderDecorations(cam) {
    const ctx = this.ctx;
    for (const d of this._decorations) {
      if (!cam.isVisible(d.x, d.y, d.size + 10)) continue;
      const sc = cam.toScreen(d.x, d.y);
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(d.angle);

      if (d.type === 'rock') {
        ctx.fillStyle = '#443355';
        ctx.beginPath();
        ctx.ellipse(0, 0, d.size, d.size * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.ellipse(-d.size * 0.2, -d.size * 0.2, d.size * 0.3, d.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'bone') {
        ctx.strokeStyle = 'rgba(200,190,160,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-d.size, 0);
        ctx.lineTo(d.size, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,190,160,0.45)';
        [[-d.size, 0], [d.size, 0]].forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (d.type === 'candle') {
        ctx.fillStyle = '#665544';
        ctx.fillRect(-2, -d.size * 0.5, 4, d.size);
        // Flame
        const flicker = 0.8 + Math.sin(Date.now() * 0.01 + d.x) * 0.2;
        ctx.fillStyle = `rgba(255,${Math.floor(140 * flicker)},0,0.8)`;
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, -d.size * 0.6, 3, 5 * flicker, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Ruin
        ctx.strokeStyle = 'rgba(80,70,100,0.5)';
        ctx.lineWidth = 3;
        ctx.strokeRect(-d.size, -d.size * 0.8, d.size * 2, d.size * 1.4);
      }

      ctx.restore();
    }
  }
}
