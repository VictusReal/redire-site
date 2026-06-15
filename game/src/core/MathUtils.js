export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const rand = (min, max) => min + Math.random() * (max - min);

export const randInt = (min, max) => Math.floor(rand(min, max + 1));

export const randFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const circlesOverlap = (ax, ay, ar, bx, by, br) =>
  Math.hypot(bx - ax, by - ay) < ar + br;

export const normalise = (dx, dy) => {
  const len = Math.hypot(dx, dy);
  return len === 0 ? { x: 0, y: 0 } : { x: dx / len, y: dy / len };
};
