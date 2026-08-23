/* game.js — Spielzustand, Game-Loop und Regeln. */

'use strict';

const STATE = Object.freeze({
  TITLE: 'title',
  INTRO: 'intro',
  PLAY: 'play',
  CLEARED: 'cleared',
  GAMEOVER: 'gameover',
  FINALE: 'finale',
  OUTRO: 'outro',
  ENTRY: 'entry',
  SCORES: 'scores'
});

// Direktstart eines Levels per URL, z. B. ?level=4 (praktisch zum Testen)
const LEVEL_PARAM = parseInt(new URLSearchParams(location.search).get('level'), 10);
const START_LEVEL = LEVEL_PARAM >= 1 && LEVEL_PARAM <= LEVELS.length ? LEVEL_PARAM - 1 : 0;

const game = {
  state: STATE.TITLE,
  levelIndex: 0,
  level: null,
  player: null,
  camera: null,
  score: 0,
  lives: CFG.START_LIVES,
  lastTimeBonus: 0,
  toast: null,
  afterScores: 'title'   // wohin nach der Bestenliste: 'title' | 'retry'
};

function showToast(msg) {
  game.toast = { msg, t: 1.6 };
}

function startLevel(index) {
  game.levelIndex = index;
  game.level = buildLevel(LEVELS[index]);
  game.player = new Player(60, CFG.GROUND_Y);
  game.camera = new Camera(game.level.def.width);
  game.toast = null;
  game.state = STATE.PLAY;
}

function resetRun() {
  game.score = 0;
  game.lives = CFG.START_LIVES;
  game.levelIndex = START_LEVEL;
}

function hurtPlayer() {
  const p = game.player;
  if (p.invuln > 0) return;
  game.lives -= 1;
  if (game.lives <= 0) {
    game.state = STATE.GAMEOVER;
    return;
  }
  p.invuln = CFG.INVULN_TIME;
  p.vy = -CFG.JUMP_VELOCITY * 0.55;
  p.vx = -p.facing * 180;
  showToast('Autsch! Ein Keim hat dich erwischt.');
}

function respawnFromFall() {
  game.lives -= 1;
  if (game.lives <= 0) {
    game.state = STATE.GAMEOVER;
    return;
  }
  const p = game.player;
  // zurück auf das letzte Bodensegment links der Absturzstelle
  let sx = 60;
  for (const s of game.level.solids) {
    if (s.kind === 'ground' && s.x <= p.x && s.x + 40 > sx) sx = s.x + 40;
  }
  p.x = sx;
  p.y = CFG.GROUND_Y - p.h - 4;
  p.vx = 0;
  p.vy = 0;
  p.invuln = CFG.INVULN_TIME;
  showToast('Platsch! Fast im Bodensee gelandet …');
}

function updatePlay(dt, t) {
  const lvl = game.level;
  const p = game.player;
  lvl.time += dt;

  updateMovers(lvl.solids, dt);
  p.update(dt, lvl.solids);
  p.x = clamp(p.x, 0, lvl.def.width - p.w);
  game.camera.follow(p);

  if (p.y > CFG.DEATH_Y) {
    respawnFromFall();
    return;
  }

  for (const g of lvl.germs) {
    g.update(dt);
    if (!g.alive || p.invuln > 0) continue;
    if (!aabb(p, g)) continue;
    const falling = p.vy > 120;
    const above = p.y + p.h - g.y < 18 + p.vy * dt;
    if (falling && above) {
      g.alive = false;
      p.vy = -CFG.STOMP_BOUNCE;
      game.score += POINTS.GERM;
      showToast(`Keim erledigt! +${POINTS.GERM}`);
    } else {
      hurtPlayer();
      if (game.state !== STATE.PLAY) return;
    }
  }

  for (const pk of lvl.pickups) {
    if (pk.taken || !aabb(p, pk)) continue;
    pk.taken = true;
    if (pk.type === 'pill') {
      game.score += POINTS.PILL;
    } else if (pk.type === 'delivery') {
      lvl.ordersGot += 1;
      game.score += POINTS.ORDER;
      showToast(`Paket zugestellt: ${pk.label}! +${POINTS.ORDER}`);
    } else {
      lvl.ordersGot += 1;
      game.score += POINTS.ORDER;
      showToast(`${pk.label} eingesammelt! +${POINTS.ORDER}`);
    }
  }

  // Ziel erreicht?
  if (aabb(p, lvl.goal)) {
    game.lastTimeBonus = Math.max(0, Math.round((lvl.def.par - lvl.time) * POINTS.TIME_BONUS_PER_S));
    game.score += POINTS.LEVEL_CLEAR + game.lastTimeBonus
      + (lvl.ordersGot === lvl.ordersTotal ? POINTS.ORDER : 0);
    game.state = STATE.CLEARED;
  }

  if (game.toast) game.toast.t -= dt;
  void t;
}

function renderPlay(t) {
  const lvl = game.level;
  const camX = game.camera.x;
  const meta = levelMeta(lvl.def);
  SCENES[meta.scene](camX, t);
  for (const s of lvl.solids) drawSolid(s, camX);
  drawGoal(lvl.goal, camX, t, meta.short, lvl.def.mode);
  for (const pk of lvl.pickups) drawPickup(pk, camX, t);
  for (const g of lvl.germs) drawGerm(g, camX);
  drawPlayer(game.player, camX, t);
  drawHUD(game);
  drawToast(game.toast);
}

/* ---------- Zustandsübergänge ---------- */

function handleConfirm() {
  switch (game.state) {
    case STATE.TITLE:
      resetRun();
      game.state = STATE.INTRO;
      break;
    case STATE.INTRO:
      startLevel(game.levelIndex);
      break;
    case STATE.CLEARED:
      if (game.levelIndex >= LEVELS.length - 1) {
        game.outroStart = performance.now();
        game.state = STATE.OUTRO;
      } else {
        game.levelIndex += 1;
        game.state = STATE.INTRO;
      }
      break;
    case STATE.GAMEOVER:
      enterScores('retry');
      break;
    case STATE.OUTRO:
      if (performance.now() - game.outroStart > 2000) game.state = STATE.FINALE;
      break;
    case STATE.FINALE:
      enterScores('title');
      break;
    case STATE.SCORES:
      if (game.afterScores === 'retry') {
        resetRun();
        game.state = STATE.INTRO;
      } else {
        game.state = STATE.TITLE;
      }
      break;
    default:
      break;
  }
}

/* ---------- Bestenliste ---------- */

function enterScores(after) {
  game.afterScores = after;
  hsSync();
  if (game.score > 0) {
    game.state = STATE.ENTRY;
    hsShowEntry(game.score);
  } else {
    game.state = STATE.SCORES;
  }
}

function submitEntry(save) {
  if (game.state !== STATE.ENTRY) return;
  if (save) {
    const entry = hsAdd(hsInput.value, game.score, game.levelIndex + 1);
    hsSubmitRemote(entry);   // asynchron; Anzeige aktualisiert sich selbst
  }
  hsHideEntry();
  game.state = STATE.SCORES;
}

document.getElementById('hs-save').addEventListener('click', () => submitEntry(true));
document.getElementById('hs-skip').addEventListener('click', () => submitEntry(false));
hsInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') submitEntry(true);
});

const hsBtn = document.getElementById('hs-btn');
hsBtn.addEventListener('click', () => {
  if (game.state === STATE.TITLE) { game.afterScores = 'title'; hsSync(); game.state = STATE.SCORES; }
});

/* ---------- Vollbild ---------- */

const fsBtn = document.getElementById('fs-btn');
const fsHint = document.getElementById('fs-hint');
const IS_STANDALONE = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
  || window.navigator.standalone === true;

function canFullscreen() {
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

fsBtn.addEventListener('click', async () => {
  const el = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else fsHint.classList.add('show');
  } catch (_) {
    fsHint.classList.add('show');   // z. B. iPhone-Safari ohne Fullscreen-API
  }
});

document.getElementById('fs-hint-ok').addEventListener('click', () => fsHint.classList.remove('show'));

const shopBtn = document.getElementById('shop-btn');

/* ---------- Loop ---------- */

let lastTime = performance.now();
let elapsed = 0;

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  elapsed += dt;

  if (Input.consumeRestart() && game.state === STATE.PLAY) {
    game.lives = Math.max(1, game.lives);   // Neustart des Levels kostet kein Leben
    startLevel(game.levelIndex);
  }

  if (Input.consumeScores() && game.state === STATE.TITLE) {
    game.afterScores = 'title';
    hsSync();
    game.state = STATE.SCORES;
  }
  hsBtn.classList.toggle('show', game.state === STATE.TITLE);
  fsBtn.classList.toggle('show', game.state === STATE.TITLE && !IS_STANDALONE);
  shopBtn.classList.toggle('show', game.state === STATE.GAMEOVER);

  if (game.state === STATE.PLAY) {
    Input.consumeConfirm();                 // Leertaste im Spiel nicht als "Weiter" werten
    updatePlay(dt, elapsed);
  } else if (game.state === STATE.ENTRY) {
    Input.consumeConfirm();                 // Eingabe läuft über das Overlay
  } else if (Input.consumeConfirm()) {
    handleConfirm();
  }

  ctx.clearRect(0, 0, CFG.W, CFG.H);
  switch (game.state) {
    case STATE.TITLE: Screens.title(game, elapsed); break;
    case STATE.INTRO: Screens.intro(game, elapsed); break;
    case STATE.PLAY: renderPlay(elapsed); break;
    case STATE.CLEARED: renderPlay(elapsed); Screens.cleared(game, elapsed); break;
    case STATE.GAMEOVER: Screens.gameover(game, elapsed); break;
    case STATE.OUTRO: Screens.outro(game, elapsed); break;
    case STATE.FINALE: Screens.finale(game, elapsed); break;
    case STATE.ENTRY: Screens.scores(game, elapsed, true); break;
    case STATE.SCORES: Screens.scores(game, elapsed, false); break;
    default: break;
  }

  scheduleNextFrame();
}

/* rAF pausiert in unsichtbaren Tabs — Timer-Fallback hält das Spiel am Laufen. */
function scheduleNextFrame() {
  if (document.hidden) setTimeout(() => frame(performance.now()), 33);
  else requestAnimationFrame(frame);
}

scheduleNextFrame();
