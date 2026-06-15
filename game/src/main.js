import Game from './core/Game.js';

const canvas = document.getElementById('game-canvas');

function resize() {
  const aspect = 9 / 16;
  let w = window.innerWidth;
  let h = window.innerHeight;

  if (w / h > aspect) {
    w = Math.floor(h * aspect);
  } else {
    h = Math.floor(w / aspect);
  }

  // Internal resolution (portrait)
  canvas.width  = 450;
  canvas.height = 800;

  // CSS display size
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  canvas.style.left   = ((window.innerWidth  - w) / 2) + 'px';
  canvas.style.top    = ((window.innerHeight - h) / 2) + 'px';
}

resize();
window.addEventListener('resize', resize);

const game = new Game(canvas);
