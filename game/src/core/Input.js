import GameConfig from '../config/GameConfig.js';

// Handles both touch (virtual joystick) and keyboard input
export default class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.dx = 0;
    this.dy = 0;

    // Keyboard state
    this._keys = {};

    // Joystick touch state
    this._joyActive = false;
    this._joyId = null;
    this._joyBase = { x: 0, y: 0 };
    this._joyKnob = { x: 0, y: 0 };

    this._bindKeyboard();
    this._bindTouch();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', e => { this._keys[e.code] = true; });
    window.addEventListener('keyup',   e => { this._keys[e.code] = false; });
  }

  _bindTouch() {
    const cfg = GameConfig.JOYSTICK;
    const canvas = this.canvas;

    const toCanvas = (touch) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top)  * scaleY,
      };
    };

    const isJoystickArea = (pt) => {
      const base = this._getJoyBasePos();
      return Math.hypot(pt.x - base.x, pt.y - base.y) < cfg.BASE_RADIUS * 2.5;
    };

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (!this._joyActive) {
          const pt = toCanvas(t);
          const base = this._getJoyBasePos();
          if (Math.hypot(pt.x - base.x, pt.y - base.y) < cfg.BASE_RADIUS * 2.5) {
            this._joyActive = true;
            this._joyId = t.identifier;
            this._joyBase = { ...base };
            this._joyKnob = { ...base };
          }
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this._joyId) {
          const pt = toCanvas(t);
          const dx = pt.x - this._joyBase.x;
          const dy = pt.y - this._joyBase.y;
          const len = Math.hypot(dx, dy);
          const maxR = GameConfig.JOYSTICK.BASE_RADIUS - GameConfig.JOYSTICK.KNOB_RADIUS;
          const clamped = Math.min(len, maxR);
          if (len > 0) {
            this._joyKnob.x = this._joyBase.x + (dx / len) * clamped;
            this._joyKnob.y = this._joyBase.y + (dy / len) * clamped;
            this.dx = dx / len;
            this.dy = dy / len;
          }
        }
      }
    }, { passive: false });

    const endTouch = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._joyId) {
          this._joyActive = false;
          this._joyId = null;
          this.dx = 0;
          this.dy = 0;
          const base = this._getJoyBasePos();
          this._joyKnob = { ...base };
        }
      }
    };

    canvas.addEventListener('touchend',    endTouch, { passive: false });
    canvas.addEventListener('touchcancel', endTouch, { passive: false });
  }

  _getJoyBasePos() {
    const cfg = GameConfig.JOYSTICK;
    return {
      x: cfg.MARGIN_X,
      y: this.canvas.height - cfg.MARGIN_Y,
    };
  }

  update() {
    // Keyboard overrides touch if used
    let kx = 0, ky = 0;
    if (this._keys['ArrowLeft']  || this._keys['KeyA']) kx -= 1;
    if (this._keys['ArrowRight'] || this._keys['KeyD']) kx += 1;
    if (this._keys['ArrowUp']    || this._keys['KeyW']) ky -= 1;
    if (this._keys['ArrowDown']  || this._keys['KeyS']) ky += 1;

    if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky);
      this.dx = kx / len;
      this.dy = ky / len;
    } else if (!this._joyActive) {
      this.dx = 0;
      this.dy = 0;
    }
  }

  // Render the virtual joystick
  render(ctx) {
    const cfg = GameConfig.JOYSTICK;
    const base = this._getJoyBasePos();
    const knob = this._joyActive ? this._joyKnob : base;

    ctx.save();
    ctx.globalAlpha = cfg.ALPHA;

    // Base circle
    ctx.beginPath();
    ctx.arc(base.x, base.y, cfg.BASE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();

    // Knob
    ctx.beginPath();
    ctx.arc(knob.x, knob.y, cfg.KNOB_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();

    ctx.restore();
  }

  isKey(code) {
    return !!this._keys[code];
  }
}
