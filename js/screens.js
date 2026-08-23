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
  scores(game, t, entryOpen) {
    SCENES.lake(t * 20, t);
    dimBackdrop(0.35);
    panel(CFG.W / 2 - 280, 60, 560, 420);
    text('🏆 Bestenliste', CFG.W / 2, 108, 26, COLORS.blue, 'center', 900);
    const online = hsRemote.online === true;
    const subtitle = hsRemote.loading && hsRemote.online === null
      ? 'Lade Online-Bestenliste …'
      : online ? 'Online — geräteübergreifende Top 10'
               : 'Offline — lokale Liste dieses Geräts';
    text(subtitle, CFG.W / 2, 132, 12, online ? COLORS.limeDark : COLORS.inkSoft, 'center', 700);
    const list = (online ? hsRemote.list : hsLoad()).slice(0, 10);
    if (list.length === 0) {
      text(hsRemote.loading ? '…' : 'Noch keine Einträge — sei die Nummer 1!', CFG.W / 2, 260, 16, COLORS.inkSoft, 'center', 700);
    } else {
      list.forEach((e, i) => {
        const y = 168 + i * 29;
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(0,159,227,.06)';
          rr(CFG.W / 2 - 256, y - 18, 512, 26, 8); ctx.fill();
        }
        const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
        text(medal, CFG.W / 2 - 238, y, 14, COLORS.blueDeep, 'left', 800);
        text(e.name, CFG.W / 2 - 190, y, 14, COLORS.ink, 'left', 800);
        text(`Level ${e.level || '?'}`, CFG.W / 2 + 60, y, 12, COLORS.inkSoft, 'center', 600);
        text(e.date || '', CFG.W / 2 + 140, y, 11, COLORS.inkSoft, 'center', 600);
        text(String(e.score), CFG.W / 2 + 244, y, 14, COLORS.blueDark, 'right', 900);
      });
    }
    if (!entryOpen) pressEnter(462, t, 'Enter — weiter');
  },

  title(game, t) {
    SCENES.lake(t * 30, t);
    dimBackdrop(0.12);
    panel(CFG.W / 2 - 300, 96, 600, 340);
    drawWordmark(CFG.W / 2, 190, 1);
    text('Der Botendienst-Sprint', CFG.W / 2, 252, 26, COLORS.limeDark, 'center', 900);
    text('Sammle Bestellungen in 4 Filialen und liefere sie in 4 Touren aus —', CFG.W / 2, 292, 15, COLORS.inkSoft, 'center', 600);
    text('8 Level rund um Friedrichshafen. Wer durchhält, wird belohnt!', CFG.W / 2, 314, 15, COLORS.inkSoft, 'center', 600);
    text(IS_TOUCH
      ? 'Springe auf Keime, um sie zu erledigen. Pillen geben Extrapunkte.'
      : 'Keime per Sprung erledigen · Pillen sammeln · H = Bestenliste', CFG.W / 2, 344, 13, COLORS.inkSoft, 'center', 600);
    if (START_LEVEL > 0) {
      ctx.fillStyle = 'rgba(197,207,35,.25)';
      rr(CFG.W / 2 - 150, 362, 300, 26, 13); ctx.fill();
      text(`Testmodus: Start in Level ${START_LEVEL + 1} — ${levelMeta(LEVELS[START_LEVEL]).short}`, CFG.W / 2, 379, 12, COLORS.blueDeep, 'center', 800);
    }
    pressEnter(408, t);
  },

  intro(game, t) {
    const def = LEVELS[game.levelIndex];
    const branch = levelMeta(def);
    SCENES[branch.scene](t * 20, t);
    dimBackdrop(0.25);
    panel(CFG.W / 2 - 280, 130, 560, 270);
    text(`Level ${game.levelIndex + 1} von ${LEVELS.length}`, CFG.W / 2, 172, 15, COLORS.limeDark, 'center', 800);
    text(branch.name, CFG.W / 2, 208, 27, COLORS.blue, 'center', 900);
    text(branch.street ? `${branch.street} · ${branch.city}` : branch.sub, CFG.W / 2, 238, 15, COLORS.inkSoft, 'center', 700);
    text(branch.claim, CFG.W / 2, 280, 16, COLORS.ink, 'center', 700);
    ctx.fillStyle = 'rgba(197,207,35,.18)';
    rr(CFG.W / 2 - 230, 302, 460, 34, 12); ctx.fill();
    text(`✚ ${branch.fact}`, CFG.W / 2, 324, 13, COLORS.blueDeep, 'center', 700);
    pressEnter(376, t, 'Enter drücken — los geht’s!');
  },

  cleared(game, t) {
    const def = LEVELS[game.levelIndex];
    const branch = levelMeta(def);
    const deliver = def.mode === 'deliver';
    dimBackdrop(0.45);
    panel(CFG.W / 2 - 270, 130, 540, 280);
    text(deliver ? 'Tour geschafft! 🚚' : 'Filiale versorgt! ✚', CFG.W / 2, 178, 26, COLORS.blue, 'center', 900);
    text(branch.name, CFG.W / 2, 210, 16, COLORS.limeDark, 'center', 800);
    text(`${deliver ? 'Pakete' : 'Bestellungen'}: ${game.level.ordersGot}/${game.level.ordersTotal}`, CFG.W / 2, 252, 16, COLORS.ink, 'center', 700);
    text(`Zeitbonus: +${game.lastTimeBonus}`, CFG.W / 2, 278, 16, COLORS.ink, 'center', 700);
    text(`Punkte: ${game.score}`, CFG.W / 2, 316, 22, COLORS.blueDark, 'center', 900);
    const last = game.levelIndex >= LEVELS.length - 1;
    pressEnter(376, t, last ? 'Enter — zum großen Finale' : 'Enter — weiter geht’s!');
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
    panel(CFG.W / 2 - 320, 48, 640, 444);
    text(`Alle ${LEVELS.length} Level geschafft! 🎉`, CFG.W / 2, 94, 25, COLORS.blue, 'center', 900);
    text(`Endstand: ${game.score} Punkte`, CFG.W / 2, 124, 17, COLORS.limeDark, 'center', 800);

    // --- Belohnung: Rabattcode ---
    ctx.save();
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 7]);
    ctx.fillStyle = 'rgba(197,207,35,.14)';
    rr(CFG.W / 2 - 250, 142, 500, 92, 14); ctx.fill();
    rr(CFG.W / 2 - 250, 142, 500, 92, 14); ctx.stroke();
    ctx.restore();
    text(`🎁 Deine Belohnung: ${REWARD.percent} % Rabatt mit dem Code`, CFG.W / 2, 172, 15, COLORS.ink, 'center', 800);
    const glow = 1 + Math.sin(t * 3) * 0.04;
    ctx.save();
    ctx.translate(CFG.W / 2, 205);
    ctx.scale(glow, glow);
    text(REWARD.code, 0, 8, 32, COLORS.blueDark, 'center', 900);
    ctx.restore();
    text(REWARD.hint, CFG.W / 2, 226, 11, COLORS.inkSoft, 'center', 600);

    text('Deine 4 Nestle-Apotheken in Friedrichshafen:', CFG.W / 2, 258, 13, COLORS.inkSoft, 'center', 700);
    BRANCHES.forEach((b, i) => {
      const y = 284 + i * 42;
      ctx.fillStyle = i % 2 ? 'rgba(0,159,227,.07)' : 'rgba(197,207,35,.12)';
      rr(CFG.W / 2 - 290, y - 17, 580, 36, 9); ctx.fill();
      text(b.name, CFG.W / 2 - 274, y, 14, COLORS.blueDark, 'left', 800);
      text(`${b.street}, ${b.city}`, CFG.W / 2 - 274, y + 14, 11, COLORS.inkSoft, 'left', 600);
      text(b.phone ? `☎ ${b.phone}` : b.mail, CFG.W / 2 + 274, y + 5, 11, COLORS.blueDeep, 'right', 700);
    });
    text('nestle-apotheke.de — online bestellen, per Botendienst liefern lassen', CFG.W / 2, 462, 12, COLORS.inkSoft, 'center', 600);
    pressEnter(482, t, 'Enter — von vorn spielen');
  },

  /* ---------- Abspann: die Packstube ---------- */
  outro(game, t) {
    const T = (performance.now() - game.outroStart) / 1000;   // Szenenzeit

    // Raum
    ctx.fillStyle = skyGradient('#e8f2f7', '#d3e4ec');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    ctx.fillStyle = '#c8b691';                                 // Boden
    ctx.fillRect(0, 452, CFG.W, CFG.H - 452);
    ctx.fillStyle = '#b3a17c';
    for (let i = 0; i < CFG.W; i += 72) ctx.fillRect(i, 452, 2, CFG.H - 452);

    // Regale mit Arznei-Fläschchen
    for (let r = 0; r < 3; r++) {
      const rx = 60 + r * 330;
      ctx.fillStyle = '#e9dfc8';
      rr(rx, 96, 220, 14, 3); ctx.fill();
      rr(rx, 156, 220, 14, 3); ctx.fill();
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = [COLORS.blue, COLORS.lime, '#e2483c', COLORS.blueSoft][(i + r) % 4];
        rr(rx + 12 + i * 34, 96 - 22, 16, 22, 3); ctx.fill();
        rr(rx + 12 + i * 34, 156 - 22, 16, 22, 3); ctx.fill();
      }
    }

    // Packtisch (Band)
    ctx.fillStyle = '#8c8f94';
    rr(120, 380, 620, 16, 6); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const wx = 140 + ((i * 82 + T * 60) % 590);
      ctx.beginPath(); ctx.arc(wx, 396, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#5d6165'; ctx.fill();
    }
    ctx.fillStyle = '#a9adb3';
    rr(120, 396, 620, 10, 4); ctx.fill();
    // Tischbeine
    ctx.fillStyle = '#7d8085';
    rr(150, 404, 10, 48, 3); ctx.fill();
    rr(700, 404, 10, 48, 3); ctx.fill();

    // Pakete wandern übers Band
    for (let i = 0; i < 4; i++) {
      const px = 130 + ((i * 170 + T * 60) % 600);
      ctx.fillStyle = '#fff';
      rr(px, 352, 30, 26, 4); ctx.fill();
      ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2;
      rr(px, 352, 30, 26, 4); ctx.stroke();
      text('A', px + 15, 371, 15, '#e2483c', 'center', 900);
    }

    // Drei fleißige Mitarbeitende hinterm Band
    drawPacker(220, 380, T, 0, '#fff', COLORS.hair);
    drawPacker(430, 380, T, 1.1, '#fff', '#7a4a2a');
    drawPacker(640, 380, T, 2.3, '#fff', '#b98a4a');

    // Der Chef auf dem Podest — überwacht alles
    drawBoss(830, 452, T);

    // Titel + Abspann-Text
    dimBackdrop(0.06);
    text('Derweil in der Packstube …', CFG.W / 2, 52, 24, COLORS.blueDark, 'center', 900);
    text('Die fleißigen Nestle-Helfer packen schon die nächsten Bestellungen —', CFG.W / 2, 500, 14, COLORS.blueDeep, 'center', 700);
    text('und der Chef behält natürlich den Überblick. 😉', CFG.W / 2, 522, 14, COLORS.blueDeep, 'center', 700);
    if (T > 2.2) pressEnter(CFG.H - 8, t, 'Enter — zur Belohnung');
  }
};

/** Mitarbeiter:in am Packtisch — Arme packen im Loop. */
function drawPacker(x, yBase, T, phase, coat, hair) {
  const pack = Math.sin(T * 4 + phase);                    // Packbewegung
  const bounce = Math.max(0, Math.sin(T * 4 + phase)) * 2;
  ctx.save();
  ctx.translate(x, yBase - bounce);
  // Körper (Kittel)
  ctx.fillStyle = coat;
  rr(-14, -58, 28, 34, 7); ctx.fill();
  ctx.strokeStyle = '#d8e4ea'; ctx.lineWidth = 1.5;
  rr(-14, -58, 28, 34, 7); ctx.stroke();
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath(); ctx.ellipse(4, -48, 5, 3, -0.6, 0, Math.PI * 2); ctx.fill();
  // Arme: greifen zum Band und heben Paket
  ctx.strokeStyle = COLORS.skin; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, -48); ctx.lineTo(-22, -34 - pack * 8);
  ctx.moveTo(11, -48); ctx.lineTo(22, -34 + pack * 8);
  ctx.stroke();
  // Kopf + Haube
  ctx.fillStyle = COLORS.skin;
  ctx.beginPath(); ctx.arc(0, -68, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(-1, -71, 9.4, Math.PI * 0.85, Math.PI * 2.05); ctx.fill();
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath(); ctx.arc(0, -73, 9, Math.PI, 0); ctx.fill();
  // Gesicht
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath(); ctx.arc(-3, -67, 1.5, 0, Math.PI * 2); ctx.arc(4, -67, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(1, -63, 3.4, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
}

/** Der Chef: Podest, Klemmbrett, Kaffee — und ein wachsames Auge. */
function drawBoss(x, yBase, T) {
  const look = Math.sin(T * 0.9) > 0 ? 1 : -1;             // schaut hin und her
  const nodT = Math.max(0, Math.sin(T * 2.2)) * 2;         // zufriedenes Nicken
  ctx.save();
  ctx.translate(x, yBase);
  // Podest
  ctx.fillStyle = COLORS.blueDark;
  rr(-46, -26, 92, 26, 5); ctx.fill();
  ctx.fillStyle = COLORS.lime;
  ctx.fillRect(-46, -26, 92, 5);
  // Beine + Anzug
  ctx.strokeStyle = '#2a2f35'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-7, -46); ctx.lineTo(-7, -28); ctx.moveTo(8, -46); ctx.lineTo(8, -28); ctx.stroke();
  ctx.fillStyle = '#3d4a57';
  rr(-15, -84, 30, 40, 7); ctx.fill();
  // Krawatte in Markenfarbe
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(4, -70); ctx.lineTo(0, -56); ctx.lineTo(-4, -70); ctx.closePath(); ctx.fill();
  // Arme: Klemmbrett + Kaffeetasse
  ctx.strokeStyle = COLORS.skin; ctx.lineWidth = 5.5;
  ctx.beginPath(); ctx.moveTo(-12, -74); ctx.lineTo(-26, -64); ctx.moveTo(12, -74); ctx.lineTo(24, -66); ctx.stroke();
  ctx.fillStyle = '#e9dfc8';
  rr(-38, -74, 16, 20, 2); ctx.fill();
  ctx.strokeStyle = '#b3a17c'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-35, -68 + i * 5); ctx.lineTo(-25, -68 + i * 5); ctx.stroke(); }
  ctx.fillStyle = '#fff';
  rr(22, -72, 12, 10, 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(36, -67, 4, -1.2, 1.2); ctx.stroke();
  // Kaffeedampf
  ctx.strokeStyle = 'rgba(120,130,140,.6)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, -76); ctx.quadraticCurveTo(31 + Math.sin(T * 3) * 3, -84, 28, -92);
  ctx.stroke();
  // Kopf mit Brille, Blickrichtung wechselt
  ctx.save();
  ctx.translate(0, -92 + nodT);
  ctx.fillStyle = COLORS.skin;
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9aa2a8';
  ctx.beginPath(); ctx.arc(-1, -4, 10.4, Math.PI * 0.9, Math.PI * 2.02); ctx.fill();
  ctx.strokeStyle = '#2a2f35'; ctx.lineWidth = 1.8;
  ctx.strokeRect(-8 + look * 2, -3, 7, 6);
  ctx.strokeRect(2 + look * 2, -3, 7, 6);
  ctx.beginPath(); ctx.moveTo(-1 + look * 2, 0); ctx.lineTo(2 + look * 2, 0); ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(-4 + look * 2.5, 0, 1.6, 0, Math.PI * 2);
  ctx.arc(5 + look * 2.5, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Sprechblase im Wechsel
  const saying = Math.floor(T / 3) % 3;
  const msgs = ['Weiter so, Team! 💪', 'Tempo, Tempo! 📦', 'Qualität prüfen! ✅'];
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  rr(-150, -152, 158, 30, 12); ctx.fill();
  ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 1.5;
  rr(-150, -152, 158, 30, 12); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-24, -122); ctx.lineTo(-10, -108); ctx.lineTo(-38, -122); ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fill();
  text(msgs[saying], -71, -132, 12, COLORS.blueDark, 'center', 800);
  ctx.restore();
}
