/* engine.js — Input, Kamera, AABB-Kollision und kleine Helfer. */

'use strict';

/* ---------- Input ---------- */

const Input = (() => {
  const state = { left: false, right: false, jump: false };
  let jumpPressed = false;   // Flanke: wurde Sprung in diesem Frame neu gedrückt?
  let confirmPressed = false;
  let restartPressed = false;
  let scoresPressed = false;
  let pausePressed = false;

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'jump', ArrowUp: 'jump', KeyW: 'jump'
  };

  function onKey(e, isDown) {
    // Tippen im Namensfeld darf das Spiel nicht steuern — aber nur das
    // DRÜCKEN ignorieren: ein verschlucktes Loslassen würde die Taste
    // dauerhaft "gedrückt" lassen (Figur läuft von selbst los).
    const inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (isDown && inField) return;
    if (isDown && e.code === 'KeyH') scoresPressed = true;
    if (isDown && e.code === 'KeyP') pausePressed = true;
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

  // Touch-Pads: Pointer-Capture, damit ein leicht verrutschter Finger
  // den Button nicht verliert; Multi-Touch (laufen + springen) inklusive.
  document.querySelectorAll('#touch .pad').forEach((btn) => {
    const key = btn.dataset.key;
    const press = (down) => {
      if (down && key === 'jump' && !state.jump) { jumpPressed = true; confirmPressed = true; }
      state[key] = down;
      btn.classList.toggle('active', down);
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (_) { /* Capture optional */ }
      press(true);
    });
    const release = (e) => { e.preventDefault(); press(false); };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', () => press(false));
    // Kontextmenü / Doppeltipp-Zoom unterbinden
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // --- iOS-Zoom-Schutz ---------------------------------------------
  // Safari auf dem iPhone ignoriert user-scalable=no: zwei gleichzeitige
  // Daumen werden als Pinch gewertet und zoomen die Seite dauerhaft.
  // Safari-eigene Gesture-Events und Multi-Touch-Moves aktiv abfangen:
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  });
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  // Doppeltipp-Zoom: schnellen zweiten Tap schlucken — außer im
  // Bestenlisten-Overlay, dort braucht der Browser die Click-Synthese.
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    if (e.target && e.target.closest && e.target.closest('#hs-entry')) return;
    const now = Date.now();
    if (now - lastTouchEnd < 350 && e.cancelable) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener('dblclick', (e) => {
    if (e.target && e.target.closest && e.target.closest('#hs-entry')) return;
    e.preventDefault();
  }, { passive: false });

  // Fokusverlust (Tab-/Fensterwechsel, Overlay): keyup kommt dann nie an
  window.addEventListener('blur', () => Input.reset());
  document.addEventListener('visibilitychange', () => { if (document.hidden) Input.reset(); });

  // Tap aufs Spielfeld = "Weiter" in Menüs (im Spiel ohne Wirkung)
  const stage = document.getElementById('stage');
  if (stage) {
    stage.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      confirmPressed = true;
    });
  }

  return {
    state,
    consumeJump() { const v = jumpPressed; jumpPressed = false; return v; },
    consumeConfirm() { const v = confirmPressed; confirmPressed = false; return v; },
    consumeRestart() { const v = restartPressed; restartPressed = false; return v; },
    consumeScores() { const v = scoresPressed; scoresPressed = false; return v; },
    consumePause() { const v = pausePressed; pausePressed = false; return v; },
    /** Alles loslassen — gegen "Stuck Keys" bei Fokusverlust/Levelstart. */
    reset() {
      state.left = state.right = state.jump = false;
      jumpPressed = confirmPressed = restartPressed = false;
      document.querySelectorAll('#touch .pad').forEach((b) => b.classList.remove('active'));
    }
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
    else if (s.dx) ent.x = s.dx > 0 ? s.x + s.w : s.x - ent.w; // Mover schiebt uns seitlich
    ent.vx = 0;
  }

  // Y-Achse — merken, ob die Füße vorher ÜBER der Fläche waren:
  // nur dann ist "oben landen" korrekt. Sonst hat uns eine fahrende
  // Plattform erfasst und wir gehören unter sie (kein Hochteleportieren).
  const prevFeet = ent.y + ent.h;
  ent.y += ent.vy * dt;
  for (const s of solids) {
    if (!aabb(ent, s)) continue;
    const wasAbove = prevFeet <= s.y + Math.max(0, s.dy || 0) + 0.5;
    if (ent.vy > 0 && wasAbove) {
      ent.y = s.y - ent.h;
      ent.vy = 0;
      flags.onGround = true;
      if (s.kind === 'mover') flags.carrier = s;
    } else if (ent.vy < 0) {
      ent.y = s.y + s.h;
      ent.vy = 0;
      flags.hitHead = true;
    } else {
      // fallend, aber nicht von oben gekommen -> unter die Plattform drücken
      ent.y = s.y + s.h;
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
