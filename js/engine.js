/* engine.js — Input, Kamera, AABB-Kollision und kleine Helfer. */

'use strict';

/* ---------- Input ---------- */

const Input = (() => {
  const state = { left: false, right: false, jump: false };
  let jumpPressed = false;   // Flanke: wurde Sprung in diesem Frame neu gedrückt?
  let confirmPressed = false;
  let restartPressed = false;

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'jump', ArrowUp: 'jump', KeyW: 'jump'
  };

  function onKey(e, isDown) {
    const action = KEYMAP[e.code];
    if (action) {
      if (isDown && action === 'jump' && !state.jump) jumpPressed = true;
      state[action] = isDown;
      e.preventDefault();
    }
    if (isDown && (e.code === 'Enter' || e.code === 'Space')) confirmPressed = true;
    if (isDown && e.code === 'KeyR') restartPressed = true;
  }

  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  // Touch-Pads
  document.querySelectorAll('#touch .pad').forEach((btn) => {
    const key = btn.dataset.key;
    const set = (down) => (e) => {
      e.preventDefault();
      if (down && key === 'jump' && !state.jump) { jumpPressed = true; confirmPressed = true; }
      state[key] = down;
    };
    btn.addEventListener('pointerdown', set(true));
    btn.addEventListener('pointerup', set(false));
    btn.addEventListener('pointercancel', set(false));
    btn.addEventListener('pointerleave', set(false));
  });

  return {
    state,
    consumeJump() { const v = jumpPressed; jumpPressed = false; return v; },
    consumeConfirm() { const v = confirmPressed; confirmPressed = false; return v; },
    consumeRestart() { const v = restartPressed; restartPressed = false; return v; }
  };
})();

/* ---------- Helfer ---------- */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ---------- Kamera ---------- */

class Camera {
  constructor(levelWidth) {
    this.x = 0;
    this.levelWidth = levelWidth;
  }
  follow(target) {
    const desired = clamp(target.x + target.w / 2 - CFG.W * 0.42, 0, this.levelWidth - CFG.W);
    this.x = lerp(this.x, desired, CFG.CAMERA_LERP);
  }
}

/* ---------- Physik: Spieler vs. Solids ---------- */

/**
 * Bewegt eine Entity mit (vx, vy) gegen die Solids und liefert Kollisionflags.
 * Bewegliche Plattformen tragen dx/dy des aktuellen Frames.
 */
function moveAndCollide(ent, solids, dt) {
  const flags = { onGround: false, hitHead: false, carrier: null };

  // X-Achse
  ent.x += ent.vx * dt;
  for (const s of solids) {
    if (!aabb(ent, s)) continue;
    if (ent.vx > 0) ent.x = s.x - ent.w;
    else if (ent.vx < 0) ent.x = s.x + s.w;
    ent.vx = 0;
  }

  // Y-Achse
  ent.y += ent.vy * dt;
  for (const s of solids) {
    if (!aabb(ent, s)) continue;
    if (ent.vy > 0) {
      ent.y = s.y - ent.h;
      ent.vy = 0;
      flags.onGround = true;
      if (s.kind === 'mover') flags.carrier = s;
    } else if (ent.vy < 0) {
      ent.y = s.y + s.h;
      ent.vy = 0;
      flags.hitHead = true;
    }
  }

  return flags;
}

/** Bewegliche Plattformen fortschreiben (setzt s.dx/s.dy für Mitfahrer). */
function updateMovers(solids, dt) {
  for (const s of solids) {
    if (s.kind !== 'mover') continue;
    s.t += dt;
    const phase = Math.sin((s.t * s.speed * Math.PI) / s.range);
    if (s.baseX === undefined) { s.baseX = s.x; s.baseY = s.y; }
    const nx = s.axis === 'x' ? s.baseX + phase * s.range * 0.5 : s.baseX;
    const ny = s.axis === 'y' ? s.baseY + phase * s.range * 0.5 : s.baseY;
    s.dx = nx - s.x;
    s.dy = ny - s.y;
    s.x = nx;
    s.y = ny;
  }
}
