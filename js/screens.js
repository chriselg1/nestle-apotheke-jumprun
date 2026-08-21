/* screens.js — Titel, Filial-Intro, Level geschafft, Game Over, Abspann. */

'use strict';

function dimBackdrop(alpha) {
  ctx.fillStyle = `rgba(8, 42, 60, ${alpha})`;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
}

function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  rr(x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
  rr(x, y, w, h, 18); ctx.stroke();
}

/** Großes Wortmarken-Logo im Stil der Website (Blau + Lime-Blatt). */
function drawWordmark(cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath(); ctx.ellipse(-116, -34, 16, 8, -0.55, 0, Math.PI * 2); ctx.fill();
  text('Nestle-', 0, 0, 58, COLORS.blue, 'center', 900);
  ctx.font = '700 26px Mulish, sans-serif';
  ctx.fillStyle = COLORS.blue;
  ctx.textAlign = 'center';
  const sp = 'APOTHEKE'.split('').join('  ');
  ctx.fillText('A P O T H E K E', 0, 34);
  void sp;
  ctx.restore();
}

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

function pressEnter(y, t, label) {
  if (Math.floor(t * 1.6) % 2 !== 0) return;
  let msg = label || 'Enter drücken zum Starten';
  if (IS_TOUCH) msg = msg.replace('Enter drücken', 'Tippen').replace('Enter —', 'Tippen —');
  text(msg, CFG.W / 2, y, 16, COLORS.blueDeep, 'center', 800);
}

const Screens = {
  title(game, t) {
    SCENES.lake(t * 30, t);
    dimBackdrop(0.12);
    panel(CFG.W / 2 - 300, 96, 600, 340);
    drawWordmark(CFG.W / 2, 190, 1);
    text('Der Botendienst-Sprint', CFG.W / 2, 252, 26, COLORS.limeDark, 'center', 900);
    text('Sammle die Bestellungen ein und bring sie durch alle', CFG.W / 2, 292, 15, COLORS.inkSoft, 'center', 600);
    text('4 Filialen in Friedrichshafen — Keimen weichst du besser aus!', CFG.W / 2, 314, 15, COLORS.inkSoft, 'center', 600);
    text('Springe auf Keime, um sie zu erledigen. Pillen geben Extrapunkte.', CFG.W / 2, 344, 13, COLORS.inkSoft, 'center', 600);
    if (START_LEVEL > 0) {
      ctx.fillStyle = 'rgba(197,207,35,.25)';
      rr(CFG.W / 2 - 150, 362, 300, 26, 13); ctx.fill();
      text(`Testmodus: Start in Level ${START_LEVEL + 1} — ${BRANCHES[START_LEVEL].short}`, CFG.W / 2, 379, 12, COLORS.blueDeep, 'center', 800);
    }
    pressEnter(408, t);
  },

  intro(game, t) {
    const branch = BRANCHES[game.levelIndex];
    SCENES[branch.scene](t * 20, t);
    dimBackdrop(0.25);
    panel(CFG.W / 2 - 280, 130, 560, 270);
    text(`Level ${game.levelIndex + 1} von 4`, CFG.W / 2, 172, 15, COLORS.limeDark, 'center', 800);
    text(branch.name, CFG.W / 2, 208, 27, COLORS.blue, 'center', 900);
    text(`${branch.street} · ${branch.city}`, CFG.W / 2, 238, 15, COLORS.inkSoft, 'center', 700);
    text(branch.claim, CFG.W / 2, 280, 16, COLORS.ink, 'center', 700);
    ctx.fillStyle = 'rgba(197,207,35,.18)';
    rr(CFG.W / 2 - 230, 302, 460, 34, 12); ctx.fill();
    text(`✚ ${branch.fact}`, CFG.W / 2, 324, 13, COLORS.blueDeep, 'center', 700);
    pressEnter(376, t, 'Enter drücken — los geht’s!');
  },

  cleared(game, t) {
    const branch = BRANCHES[game.levelIndex];
    dimBackdrop(0.45);
    panel(CFG.W / 2 - 270, 130, 540, 280);
    text('Lieferung zugestellt! ✚', CFG.W / 2, 178, 26, COLORS.blue, 'center', 900);
    text(branch.name, CFG.W / 2, 210, 16, COLORS.limeDark, 'center', 800);
    text(`Bestellungen: ${game.level.ordersGot}/${game.level.ordersTotal}`, CFG.W / 2, 252, 16, COLORS.ink, 'center', 700);
    text(`Zeitbonus: +${game.lastTimeBonus}`, CFG.W / 2, 278, 16, COLORS.ink, 'center', 700);
    text(`Punkte: ${game.score}`, CFG.W / 2, 316, 22, COLORS.blueDark, 'center', 900);
    const last = game.levelIndex >= LEVELS.length - 1;
    pressEnter(376, t, last ? 'Enter — zum Abschluss' : 'Enter — zur nächsten Filiale');
  },

  gameover(game, t) {
    dimBackdrop(0.55);
    panel(CFG.W / 2 - 250, 150, 500, 240);
    text('Ohje — der Botendienst ist gestrandet!', CFG.W / 2, 208, 21, COLORS.warn, 'center', 900);
    text(`Erreichte Punkte: ${game.score}`, CFG.W / 2, 252, 17, COLORS.ink, 'center', 700);
    text('Zum Glück gibt es 4 Filialen — Nachschub kommt!', CFG.W / 2, 284, 14, COLORS.inkSoft, 'center', 600);
    pressEnter(348, t, 'Enter — noch einmal versuchen');
  },

  finale(game, t) {
    SCENES.lake(t * 24, t);
    dimBackdrop(0.3);
    panel(CFG.W / 2 - 320, 70, 640, 400);
    text('Alle Lieferungen zugestellt! 🎉', CFG.W / 2, 118, 25, COLORS.blue, 'center', 900);
    text(`Endstand: ${game.score} Punkte`, CFG.W / 2, 150, 18, COLORS.limeDark, 'center', 800);
    text('Die 4 Nestle-Apotheken in Friedrichshafen:', CFG.W / 2, 186, 14, COLORS.inkSoft, 'center', 700);
    BRANCHES.forEach((b, i) => {
      const y = 214 + i * 52;
      ctx.fillStyle = i % 2 ? 'rgba(0,159,227,.07)' : 'rgba(197,207,35,.12)';
      rr(CFG.W / 2 - 290, y - 20, 580, 44, 10); ctx.fill();
      text(b.name, CFG.W / 2 - 274, y, 15, COLORS.blueDark, 'left', 800);
      text(`${b.street}, ${b.city}`, CFG.W / 2 - 274, y + 17, 12, COLORS.inkSoft, 'left', 600);
      text(b.phone ? `☎ ${b.phone}` : b.mail, CFG.W / 2 + 274, y + 8, 12, COLORS.blueDeep, 'right', 700);
    });
    text('nestle-apotheke.de — online bestellen, per Botendienst liefern lassen', CFG.W / 2, 442, 12, COLORS.inkSoft, 'center', 600);
    pressEnter(462, t, 'Enter — von vorn spielen');
  }
};
