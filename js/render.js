/* render.js — Zeichnen: Parallax-Szenen je Filiale, Figuren, HUD. */

'use strict';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

/* ---------- kleine Zeichen-Helfer ---------- */

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px Mulish, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.fillText(str, x, y);
}

/* ---------- Hintergrund je Szene ---------- */

function skyGradient(top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

function drawClouds(camX, t) {
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 7; i++) {
    const x = ((i * 331 - camX * 0.25 + t * 12) % (CFG.W + 300)) - 150;
    const y = 46 + (i % 3) * 44;
    ctx.beginPath();
    ctx.ellipse(x, y, 52, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 34, y - 10, 34, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 32, y - 6, 28, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawZeppelin(camX, t) {
  const x = ((t * 26 - camX * 0.18) % (CFG.W + 480)) - 240;
  const y = 78;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e9f3f8';
  ctx.strokeStyle = COLORS.blueDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 74, 20, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.moveTo(-74, 0); ctx.lineTo(-96, -14); ctx.lineTo(-96, 14); ctx.closePath();
  ctx.fill();
  rr(-18, 16, 38, 10, 4); ctx.fillStyle = COLORS.blueDark; ctx.fill();
  text('N', 6, 6, 18, COLORS.blue, 'center', 900);
  ctx.restore();
}

function drawWater(camX, t, yTop) {
  const g = ctx.createLinearGradient(0, yTop, 0, CFG.H);
  g.addColorStop(0, '#57bfe9');
  g.addColorStop(1, '#1a7fb0');
  ctx.fillStyle = g;
  ctx.fillRect(0, yTop, CFG.W, CFG.H - yTop);
  ctx.strokeStyle = 'rgba(255,255,255,.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const x = ((i * 173 - camX * 0.5 + t * 30) % (CFG.W + 80)) - 40;
    const y = yTop + 14 + (i % 4) * 18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y);
    ctx.stroke();
  }
}

function drawHillsFar(camX, color, amp, base) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, CFG.H);
  for (let x = 0; x <= CFG.W; x += 16) {
    const wx = x + camX * 0.3;
    ctx.lineTo(x, base - Math.sin(wx * 0.004) * amp - Math.sin(wx * 0.011) * amp * 0.4);
  }
  ctx.lineTo(CFG.W, CFG.H);
  ctx.closePath();
  ctx.fill();
}

function drawTreeline(camX, factor, base, hue) {
  ctx.fillStyle = hue;
  for (let i = 0; i < 26; i++) {
    const x = ((i * 149 - camX * factor) % (CFG.W + 160)) - 80;
    const s = 18 + (i * 37 % 22);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.arc(x, base - s, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 3, base - s * 0.4, 6, s * 0.4 + 4);
  }
}

function drawSail(x, y, s) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, y - 34 * s); ctx.lineTo(x + 22 * s, y - 6 * s); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.blueDeep;
  rr(x - 16 * s, y, 34 * s, 7 * s, 3);
  ctx.fill();
}

function drawReeds(camX, factor, base) {
  ctx.strokeStyle = '#7c9a4a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 30; i++) {
    const x = ((i * 127 - camX * factor) % (CFG.W + 60)) - 30;
    const h = 22 + (i * 29 % 16);
    ctx.beginPath();
    ctx.moveTo(x, base + 10);
    ctx.quadraticCurveTo(x + 4, base - h / 2, x + 7, base - h);
    ctx.stroke();
    ctx.fillStyle = '#8a6a3f';
    rr(x + 4, base - h - 8, 5, 11, 3); ctx.fill();
  }
}

function drawBirds(camX, t) {
  ctx.strokeStyle = 'rgba(70,90,100,.8)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = ((i * 400 + t * 34 - camX * 0.2) % (CFG.W + 260)) - 130;
    const y = 70 + i * 34;
    const f = Math.sin(t * 6 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 4 + f); ctx.quadraticCurveTo(x, y + 3, x + 11, y - 4 + f);
    ctx.stroke();
  }
}

/* --- Friedrichshafener Wahrzeichen für die Bodensee-Szene --- */

/** Ferne Alpenkette am Schweizer Ufer. */
function drawAlps(camX) {
  ctx.fillStyle = 'rgba(150,175,200,.45)';
  ctx.beginPath();
  ctx.moveTo(0, 348);
  for (let x = 0; x <= CFG.W; x += 10) {
    const wx = x + camX * 0.12;
    const y = 320 - Math.abs(Math.sin(wx * 0.008)) * 34 - Math.abs(Math.sin(wx * 0.021 + 2)) * 14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(CFG.W, 348);
  ctx.closePath();
  ctx.fill();
}

/** Uferlinie mit Schlosskirche (Zwiebeltürme), Häusern und Bäumen. */
function drawFnSkyline(camX) {
  const SPAN = 1600;
  for (let k = -1; k < 2; k++) {
    const x0 = ((-camX * 0.35) % SPAN) + k * SPAN + 260;
    // Häuserzeile
    for (let i = 0; i < 4; i++) {
      const hx = x0 - 190 + i * 52;
      ctx.fillStyle = i % 2 ? '#f0e6d2' : '#e8dcc4';
      ctx.fillRect(hx, 322, 40, 28);
      ctx.fillStyle = '#c0674f';
      ctx.beginPath();
      ctx.moveTo(hx - 3, 324); ctx.lineTo(hx + 20, 310); ctx.lineTo(hx + 43, 324);
      ctx.closePath(); ctx.fill();
    }
    // Schlosskirche: zwei Türme mit Zwiebelhauben, Schiff dazwischen
    ctx.fillStyle = '#e7b96a';
    ctx.fillRect(x0 + 24, 322, 44, 28);                       // Kirchenschiff
    ctx.fillStyle = '#b45a45';
    ctx.beginPath();
    ctx.moveTo(x0 + 20, 324); ctx.lineTo(x0 + 46, 312); ctx.lineTo(x0 + 72, 324);
    ctx.closePath(); ctx.fill();
    for (const tx of [x0, x0 + 66]) {
      ctx.fillStyle = '#f5ecda';
      ctx.fillRect(tx, 268, 26, 82);                          // Turm
      ctx.fillStyle = '#d9cbae';
      ctx.fillRect(tx, 296, 26, 4);                           // Gesims
      ctx.fillStyle = '#8a94a0';
      ctx.fillRect(tx + 8, 276, 10, 14);                      // Schallfenster
      ctx.fillStyle = '#3c5b58';                              // Zwiebelhaube (Kupfer-Patina)
      ctx.beginPath();
      ctx.moveTo(tx - 3, 268);
      ctx.bezierCurveTo(tx - 6, 250, tx + 8, 248, tx + 13, 236);
      ctx.bezierCurveTo(tx + 18, 248, tx + 32, 250, tx + 29, 268);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3c5b58';                            // Turmspitze + Kugel
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx + 13, 236); ctx.lineTo(tx + 13, 226); ctx.stroke();
      ctx.beginPath(); ctx.arc(tx + 13, 224, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // Bäume am Ufer
    ctx.fillStyle = '#7fae55';
    for (const dx of [-230, 108, 150]) {
      ctx.beginPath(); ctx.arc(x0 + dx, 336, 15, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/** Die große Fontäne im See — das Wahrzeichen der Uferpromenade. */
function drawFountain(camX, t) {
  const SPAN = 2100;
  const fx = ((760 - camX * 0.65) % SPAN + SPAN) % SPAN - 200;
  if (fx < -80 || fx > CFG.W + 80) return;
  const top = 250 + Math.sin(t * 2.2) * 6;
  const base = 402;
  // Wassersäule
  const g = ctx.createLinearGradient(0, top, 0, base);
  g.addColorStop(0, 'rgba(255,255,255,.9)');
  g.addColorStop(1, 'rgba(255,255,255,.25)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(fx - 2, base);
  ctx.quadraticCurveTo(fx - 4, (top + base) / 2, fx - 1, top);
  ctx.lineTo(fx + 1, top);
  ctx.quadraticCurveTo(fx + 4, (top + base) / 2, fx + 2, base);
  ctx.closePath(); ctx.fill();
  // Gischt oben: fallende Bögen zu beiden Seiten
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const sw = 8 + i * 7 + Math.sin(t * 3 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(fx, top);
    ctx.quadraticCurveTo(fx - sw, top + 6, fx - sw - 3, top + 26 + i * 8);
    ctx.moveTo(fx, top);
    ctx.quadraticCurveTo(fx + sw, top + 6, fx + sw + 3, top + 26 + i * 8);
    ctx.stroke();
  }
  // Ringe am Fuß
  ctx.strokeStyle = 'rgba(255,255,255,.5)';
  ctx.beginPath(); ctx.ellipse(fx, base, 22 + Math.sin(t * 2) * 4, 5, 0, 0, Math.PI * 2); ctx.stroke();
}

/** Mastenwald des Yachthafens an der Wasserlinie. */
function drawMasts(camX) {
  const SPAN = 1600;
  for (let k = -1; k < 2; k++) {
    const x0 = ((-camX * 0.45) % SPAN) + k * SPAN + 1050;
    ctx.strokeStyle = '#6d7f8a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const mx = x0 + i * 13 + (i % 3) * 4;
      const h = 30 + (i * 31 % 26);
      ctx.beginPath();
      ctx.moveTo(mx, 352); ctx.lineTo(mx, 352 - h);
      ctx.stroke();
      if (i % 2 === 0) {                                       // Wimpel
        ctx.fillStyle = i % 4 ? '#e2483c' : COLORS.lime;
        ctx.beginPath();
        ctx.moveTo(mx, 352 - h); ctx.lineTo(mx + 7, 352 - h + 3); ctx.lineTo(mx, 352 - h + 6);
        ctx.closePath(); ctx.fill();
      }
    }
  }
}

/** Uferpromenade Level 1: Hafenbahnhof mit Uhrenturm, Stadtbahnhof,
    rote Kreisel-Skulptur — nach Fotos aus Friedrichshafen. */
function drawLakefront(camX) {
  const SPAN = 1900;
  for (let k = -1; k < 2; k++) {
    const x0 = ((-camX * 0.32) % SPAN) + k * SPAN + 180;

    // Hafenbahnhof / Zeppelin-Museum: weißer Bauhaus-Riegel mit Uhrenturm
    ctx.fillStyle = '#f6f4ee';
    ctx.fillRect(x0, 322, 180, 36);
    ctx.fillStyle = '#9fb3bd';                                 // Fensterbänder
    ctx.fillRect(x0 + 6, 330, 168, 5);
    ctx.fillRect(x0 + 6, 342, 168, 5);
    ctx.fillStyle = '#f6f4ee';                                 // Uhrenturm
    ctx.fillRect(x0 - 26, 272, 28, 86);
    ctx.fillStyle = '#8a98a2';
    ctx.fillRect(x0 - 22, 320, 20, 30);                        // Turm-Fensterband
    ctx.strokeStyle = '#4a5a64'; ctx.lineWidth = 1.6;          // Uhr
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x0 - 12, 292, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 - 12, 292); ctx.lineTo(x0 - 12, 287);
    ctx.moveTo(x0 - 12, 292); ctx.lineTo(x0 - 8, 293);
    ctx.stroke();
    ctx.beginPath();                                           // Fahnenmast
    ctx.moveTo(x0 - 12, 272); ctx.lineTo(x0 - 12, 260); ctx.stroke();

    // Stadtbahnhof: gelbes Bahnhofsgebäude mit Walmdach
    const bx = x0 + 260;
    ctx.fillStyle = '#f2dfa0';
    ctx.fillRect(bx, 322, 120, 36);
    ctx.fillStyle = '#f7ecc4';                                 // Mittelrisalit
    ctx.fillRect(bx + 42, 312, 36, 46);
    ctx.fillStyle = '#a8766a';                                 // Dächer
    ctx.beginPath();
    ctx.moveTo(bx - 5, 324); ctx.lineTo(bx + 18, 310); ctx.lineTo(bx + 44, 318);
    ctx.lineTo(bx + 60, 302) ; ctx.lineTo(bx + 76, 318); ctx.lineTo(bx + 102, 310);
    ctx.lineTo(bx + 125, 324); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';                                    // Fensterchen
    for (let i = 0; i < 7; i++) ctx.fillRect(bx + 8 + i * 16, 330, 7, 10);
    for (let i = 0; i < 7; i++) ctx.fillRect(bx + 8 + i * 16, 346, 7, 8);

    // Rote Kreisel-Skulptur (die geschwungene "Nadel")
    const sx = x0 + 470;
    ctx.strokeStyle = '#d0392e';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, 356);
    ctx.bezierCurveTo(sx - 4, 322, sx + 2, 300, sx + 16, 288);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + 16, 288); ctx.lineTo(sx + 24, 296);
    ctx.stroke();

    // Bäume dazwischen
    ctx.fillStyle = '#7fae55';
    for (const dx of [-60, 218, 415, 520]) {
      ctx.beginPath(); ctx.arc(x0 + dx, 344, 14, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/** Weißes Bodensee-Fahrgastschiff, zieht langsam übers Wasser. */
function drawShip(camX, t) {
  const x = ((t * 12 - camX * 0.5) % (CFG.W + 500)) - 250;
  const y = 388 + Math.sin(t * 1.4) * 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fff';                                      // Rumpf
  ctx.beginPath();
  ctx.moveTo(-58, 0); ctx.lineTo(58, 0); ctx.lineTo(48, 14); ctx.lineTo(-52, 14);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = COLORS.blueDeep;                             // Wasserlinie
  ctx.fillRect(-52, 11, 100, 3);
  ctx.fillStyle = '#f4f8fa';                                   // Oberdeck
  rr(-42, -12, 76, 12, 3); ctx.fill();
  rr(-28, -22, 42, 10, 3); ctx.fill();
  ctx.fillStyle = '#8fb4c4';                                   // Fensterreihen
  for (let i = 0; i < 8; i++) ctx.fillRect(-38 + i * 9, -9, 5, 5);
  for (let i = 0; i < 4; i++) ctx.fillRect(-24 + i * 9, -19, 5, 4);
  ctx.strokeStyle = '#5d7a8a'; ctx.lineWidth = 2;              // Mast
  ctx.beginPath(); ctx.moveTo(20, -22); ctx.lineTo(20, -34); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)';                    // Kielwasser
  ctx.beginPath(); ctx.moveTo(-52, 15); ctx.quadraticCurveTo(-70, 17, -84, 14); ctx.stroke();
  ctx.restore();
}

/** Hofen (Level 3): Steinkapelle, Schulmuseum-Villa und
    St.-Elisabeth-Realschule — nach Fotos aus Friedrichshafen. */
function drawHofen(camX) {
  const SPAN = 1700;
  for (let k = -1; k < 2; k++) {
    const x0 = ((-camX * 0.38) % SPAN) + k * SPAN + 150;

    // Steinkapelle mit Spitzturm und Glocke
    ctx.fillStyle = '#b9b4a6';                                 // Bruchstein-Fassade
    ctx.fillRect(x0, 366, 48, 52);
    ctx.beginPath();                                           // Giebel
    ctx.moveTo(x0 - 4, 368); ctx.lineTo(x0 + 24, 340); ctx.lineTo(x0 + 52, 368);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a49f91';                                 // Turm
    ctx.fillRect(x0 + 17, 312, 14, 34);
    ctx.fillStyle = '#2f2b26';                                 // Glockenöffnung
    ctx.fillRect(x0 + 21, 318, 6, 9);
    ctx.fillStyle = '#4c7a68';                                 // grüner Spitzhelm
    ctx.beginPath();
    ctx.moveTo(x0 + 14, 314); ctx.lineTo(x0 + 24, 284); ctx.lineTo(x0 + 34, 314);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8d887b'; ctx.lineWidth = 1.6;          // Rosette
    ctx.fillStyle = '#e8e4d8';
    ctx.beginPath(); ctx.arc(x0 + 24, 378, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5c4632';                                 // Spitzbogen-Portal
    ctx.beginPath();
    ctx.moveTo(x0 + 18, 418); ctx.lineTo(x0 + 18, 402);
    ctx.quadraticCurveTo(x0 + 24, 392, x0 + 30, 402);
    ctx.lineTo(x0 + 30, 418); ctx.closePath(); ctx.fill();

    // Schulmuseum: apricotfarbene Villa mit Walmdach, Gauben und Fahnen
    const vx = x0 + 330;
    ctx.fillStyle = '#c9cdd1';                                 // Sockelgeschoss
    ctx.fillRect(vx, 400, 92, 18);
    ctx.fillStyle = '#f2c491';                                 // Fassade
    ctx.fillRect(vx, 362, 92, 40);
    ctx.fillStyle = '#7a5643';                                 // Walmdach
    ctx.beginPath();
    ctx.moveTo(vx - 6, 364); ctx.lineTo(vx + 22, 336); ctx.lineTo(vx + 70, 336);
    ctx.lineTo(vx + 98, 364); ctx.closePath(); ctx.fill();
    for (const dx of [26, 54]) {                               // Gauben
      ctx.fillStyle = '#f6e2c8';
      ctx.fillRect(vx + dx, 342, 10, 10);
      ctx.fillStyle = '#5c4030';
      ctx.beginPath();
      ctx.moveTo(vx + dx - 2, 344); ctx.lineTo(vx + dx + 5, 338); ctx.lineTo(vx + dx + 12, 344);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#fff';                                    // Fenster
    for (let i = 0; i < 4; i++) ctx.fillRect(vx + 10 + i * 21, 370, 9, 13);
    for (const [i, farbe] of [['#f3c614', 0], ['#d0392e', 1], ['#f4f4f4', 2]].map((c, i) => [i, c[0]])) {
      const fxp = vx - 18 + i * 9;                             // Fahnen davor
      ctx.strokeStyle = '#8a949c'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(fxp, 418); ctx.lineTo(fxp, 356); ctx.stroke();
      ctx.fillStyle = farbe;
      ctx.fillRect(fxp, 356, 6, 14);
    }

    // St.-Elisabeth-Realschule: modernes Schulhaus mit Schild
    const sx = x0 + 760;
    ctx.fillStyle = '#e9e6df';
    ctx.fillRect(sx, 372, 130, 46);
    ctx.fillStyle = '#98b8c8';                                 // Fensterband
    ctx.fillRect(sx + 8, 382, 114, 12);
    ctx.fillStyle = '#5c7a68';                                 // Eingang
    ctx.fillRect(sx + 56, 400, 18, 18);
    ctx.fillStyle = '#4a4a4a';                                 // Schild
    rr(sx + 22, 356, 86, 14, 3); ctx.fill();
    text('St. Elisabeth', sx + 65, 366, 9, '#fff', 'center', 800);
    ctx.fillStyle = COLORS.lime;                               // grünes Blatt-Logo
    ctx.beginPath(); ctx.ellipse(sx + 102, 360, 4, 2.4, -0.5, 0, Math.PI * 2); ctx.fill();
  }
}

const SCENES = {
  lake(camX, t) {
    ctx.fillStyle = skyGradient('#bfe9fb', '#e8f7ff');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawZeppelin(camX, t);
    drawBirds(camX, t);
    drawAlps(camX);
    drawHillsFar(camX, '#a5d3a7', 40, 336);
    drawLakefront(camX);
    drawWater(camX, t, 356);
    drawShip(camX, t);
    drawSail(((640 - camX * 0.45 + t * 8) % (CFG.W + 200)) - 100, 392, 1);
    drawSail(((190 - camX * 0.45 + t * 5) % (CFG.W + 200)) - 100, 410, 0.7);
  },
  harbour(camX, t) {
    ctx.fillStyle = skyGradient('#a8ddf5', '#fdf3d8');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawAlps(camX);
    drawFnSkyline(camX);
    drawWater(camX, t, 348);
    drawFountain(camX, t);
    drawMasts(camX);
    drawSail(((430 - camX * 0.5 + t * 10) % (CFG.W + 200)) - 100, 396, 1.15);
  },
  hills(camX, t) {
    ctx.fillStyle = skyGradient('#b8e6f7', '#f2fbe8');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawHillsFar(camX, '#b9d98a', 60, 340);
    drawHillsFar(camX * 1.6, '#9cc86c', 42, 384);
    drawHofen(camX);
    drawTreeline(camX, 0.55, 420, '#6fae4e');
  },
  shore(camX, t) {
    ctx.fillStyle = skyGradient('#ffe0b0', '#c9ecf9');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    ctx.fillStyle = '#ffd27a';                                   // Morgensonne
    ctx.beginPath(); ctx.arc(210, 120, 42, 0, Math.PI * 2); ctx.fill();
    drawClouds(camX, t);
    drawHillsFar(camX, '#a9cfe0', 42, 326);
    drawWater(camX, t, 352);
    drawSail(((520 - camX * 0.5 + t * 9) % (CFG.W + 200)) - 100, 396, 1.05);
    // Strandkörbe / Badehäuschen am Ufer
    for (let i = 0; i < 4; i++) {
      const x = ((i * 470 - camX * 0.55) % (CFG.W + 240)) - 120;
      ctx.fillStyle = i % 2 ? '#f7f0dd' : '#ffe9e0';
      rr(x, 320, 34, 32, 4); ctx.fill();
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath(); ctx.moveTo(x - 4, 322); ctx.lineTo(x + 17, 306); ctx.lineTo(x + 38, 322); ctx.closePath(); ctx.fill();
    }
    drawReeds(camX, 0.7, 356);
  },
  village(camX, t) {
    ctx.fillStyle = skyGradient('#bde7f7', '#f6f4e0');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawHillsFar(camX, '#b9d98a', 52, 336);
    // Dorf-Silhouette mit Kirchturm
    for (let i = 0; i < 6; i++) {
      const x = ((i * 340 - camX * 0.4) % (CFG.W + 260)) - 130;
      ctx.fillStyle = '#e8ddc8';
      rr(x, 348, 52, 60, 3); ctx.fill();
      ctx.fillStyle = '#c0674f';
      ctx.beginPath(); ctx.moveTo(x - 5, 350); ctx.lineTo(x + 26, 328); ctx.lineTo(x + 57, 350); ctx.closePath(); ctx.fill();
      if (i % 3 === 0) {                                          // Kirchturm
        ctx.fillStyle = '#f1e9d6'; rr(x + 70, 300, 26, 108, 3); ctx.fill();
        ctx.fillStyle = '#8a9aa5';
        ctx.beginPath(); ctx.moveTo(x + 66, 302); ctx.lineTo(x + 83, 268); ctx.lineTo(x + 100, 302); ctx.closePath(); ctx.fill();
      }
    }
    drawTreeline(camX, 0.6, 424, '#7fae55');
  },
  ried(camX, t) {
    ctx.fillStyle = skyGradient('#cfeef3', '#eef7dc');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawBirds(camX, t);
    drawHillsFar(camX, '#a8cf9a', 34, 330);
    drawWater(camX, t, 368);
    drawReeds(camX, 0.5, 372);
    drawReeds(camX, 0.85, 396);
  },
  orchard(camX, t) {
    ctx.fillStyle = skyGradient('#ffe9c4', '#d9f2e2');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    ctx.fillStyle = '#ffca66';
    ctx.beginPath(); ctx.arc(760, 110, 44, 0, Math.PI * 2); ctx.fill();
    drawClouds(camX, t);
    drawHillsFar(camX, '#c2dd96', 56, 340);
    drawHillsFar(camX * 1.5, '#a3cc74', 40, 388);
    // Apfelbäume mit roten Punkten
    for (let i = 0; i < 22; i++) {
      const x = ((i * 175 - camX * 0.55) % (CFG.W + 160)) - 80;
      const s = 20 + (i * 41 % 18);
      ctx.fillStyle = '#6fae4e';
      ctx.beginPath(); ctx.arc(x, 420 - s, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a35'; ctx.fillRect(x - 3, 420 - s * 0.4, 6, s * 0.4 + 6);
      ctx.fillStyle = '#e2483c';
      for (let a = 0; a < 3; a++) {
        ctx.beginPath();
        ctx.arc(x - s * 0.5 + a * s * 0.5, 420 - s - 4 + (a % 2) * 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  avenue(camX, t) {
    ctx.fillStyle = skyGradient('#ffd9a0', '#c9ecf9');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    // Abendsonne
    ctx.fillStyle = '#ffca66';
    ctx.beginPath(); ctx.arc(720, 130, 46, 0, Math.PI * 2); ctx.fill();
    drawClouds(camX, t);
    drawHillsFar(camX, '#c9a3c4', 44, 330);
    drawTreeline(camX, 0.4, 400, '#7fa653');
    drawTreeline(camX, 0.75, 428, '#5d8b3c');
  }
};

/* ---------- Weltobjekte ---------- */

function drawSolid(s, camX) {
  const x = s.x - camX;
  if (s.kind === 'ground') {
    ctx.fillStyle = '#e7d9b8';                       // Uferweg
    ctx.fillRect(x, s.y, s.w, s.h);
    ctx.fillStyle = COLORS.lime;                     // Grasnarbe
    ctx.fillRect(x, s.y, s.w, 8);
    ctx.fillStyle = '#d7c9a4';
    for (let i = 12; i < s.w - 16; i += 56) ctx.fillRect(x + i, s.y + 34, 26, 10);
  } else {
    ctx.fillStyle = s.kind === 'mover' ? COLORS.blueDark : COLORS.blue;
    rr(x, s.y, s.w, s.h, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    rr(x + 4, s.y + 3, s.w - 8, 5, 3); ctx.fill();
    if (s.kind === 'mover') {
      ctx.fillStyle = COLORS.lime;
      ctx.beginPath(); ctx.arc(x + 10, s.y + s.h / 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + s.w - 10, s.y + s.h / 2, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/** Ziel: Apotheken-Fassade (Sammel-Level) oder Botendienst-Van (Touren). */
function drawGoal(goal, camX, t, branchShort, mode) {
  if (mode === 'deliver') { drawGoalVan(goal, camX, t, branchShort); return; }
  const x = goal.x - camX;
  const y = goal.y;
  ctx.fillStyle = COLORS.paper;
  rr(x, y + 22, goal.w, goal.h - 22, 6); ctx.fill();
  ctx.strokeStyle = COLORS.blueDark; ctx.lineWidth = 2;
  rr(x, y + 22, goal.w, goal.h - 22, 6); ctx.stroke();
  // Markise
  ctx.fillStyle = COLORS.blue;
  rr(x - 6, y + 12, goal.w + 12, 16, 5); ctx.fill();
  ctx.fillStyle = COLORS.lime;
  for (let i = 4; i < goal.w + 6; i += 16) ctx.fillRect(x - 6 + i, y + 12, 8, 16);
  // Tür + Fenster
  ctx.fillStyle = COLORS.blueSoft;
  rr(x + goal.w / 2 - 11, y + goal.h - 34, 22, 34, 3); ctx.fill();
  rr(x + 8, y + 40, 16, 16, 2); ctx.fill();
  rr(x + goal.w - 24, y + 40, 16, 16, 2); ctx.fill();
  // Apotheken-A
  const pulse = 1 + Math.sin(t * 4) * 0.06;
  ctx.save();
  ctx.translate(x + goal.w / 2, y - 2);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#e2483c';
  rr(-15, -15, 30, 30, 6); ctx.fill();
  text('A', 0, 8, 21, '#fff', 'center', 900);
  ctx.restore();
  text(branchShort, x + goal.w / 2, y + goal.h + 16, 12, COLORS.blueDeep, 'center', 800);
}

/** Botendienst-Van als Tour-Ziel. */
function drawGoalVan(goal, camX, t, label) {
  const x = goal.x - camX;
  const yB = goal.y + goal.h;                 // Bodenlinie
  const bounce = Math.sin(t * 5) * 1.5;
  ctx.save();
  ctx.translate(x - 10, yB + bounce - 2);
  // Karosserie
  ctx.fillStyle = '#fff';
  rr(0, -52, 94, 40, 7); ctx.fill();
  ctx.strokeStyle = COLORS.blueDark; ctx.lineWidth = 2;
  rr(0, -52, 94, 40, 7); ctx.stroke();
  // Fahrerkabine
  ctx.fillStyle = COLORS.blue;
  rr(66, -44, 28, 32, 6); ctx.fill();
  ctx.fillStyle = COLORS.blueSoft;
  rr(72, -40, 16, 12, 3); ctx.fill();
  // Streifen + Logo-Blatt
  ctx.fillStyle = COLORS.lime;
  ctx.fillRect(0, -26, 66, 6);
  ctx.beginPath(); ctx.ellipse(24, -38, 10, 5.5, -0.55, 0, Math.PI * 2); ctx.fill();
  text('Botendienst', 32, -30, 9, COLORS.blueDark, 'center', 800);
  // Räder
  ctx.fillStyle = '#2a2f35';
  ctx.beginPath(); ctx.arc(20, -8, 9, 0, Math.PI * 2); ctx.arc(72, -8, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cfd8dd';
  ctx.beginPath(); ctx.arc(20, -8, 4, 0, Math.PI * 2); ctx.arc(72, -8, 4, 0, Math.PI * 2); ctx.fill();
  // pulsierende Fahne
  const pulse = 1 + Math.sin(t * 4) * 0.06;
  ctx.translate(47, -66); ctx.scale(pulse, pulse);
  ctx.fillStyle = '#e2483c';
  rr(-13, -13, 26, 26, 6); ctx.fill();
  text('A', 0, 7, 18, '#fff', 'center', 900);
  ctx.restore();
  text(label, x + 37, yB + 16, 12, COLORS.blueDeep, 'center', 800);
}

function drawPlayer(p, camX, t) {
  if (p.invuln > 0 && Math.floor(t * 14) % 2 === 0) return;  // Blinken
  const x = p.x - camX;
  const y = p.y;
  const run = p.onGround && Math.abs(p.vx) > 20 ? Math.sin(p.runPhase * 6) : 0;
  ctx.save();
  ctx.translate(x + p.w / 2, y + p.h);
  ctx.scale(p.facing, 1);

  // Beine
  ctx.strokeStyle = '#2a4a5c'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -16); ctx.lineTo(-5 + run * 6, -2);
  ctx.moveTo(6, -16); ctx.lineTo(6 - run * 6, -2);
  ctx.stroke();
  // Kittel
  ctx.fillStyle = '#fff';
  rr(-11, -36, 22, 22, 5); ctx.fill();
  ctx.strokeStyle = '#d8e4ea'; ctx.lineWidth = 1.5;
  rr(-11, -36, 22, 22, 5); ctx.stroke();
  // Logo-Blatt auf dem Kittel
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath(); ctx.ellipse(3, -28, 4.5, 2.6, -0.6, 0, Math.PI * 2); ctx.fill();
  // Botentasche
  ctx.fillStyle = COLORS.blue;
  rr(-16, -26, 10, 12, 3); ctx.fill();
  ctx.strokeStyle = COLORS.blueDark; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-11, -34); ctx.lineTo(-14, -26); ctx.stroke();
  // Kopf
  ctx.fillStyle = COLORS.skin;
  ctx.beginPath(); ctx.arc(2, -44, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.hair;
  ctx.beginPath(); ctx.arc(0, -47, 8.4, Math.PI * 0.85, Math.PI * 1.95); ctx.fill();
  rr(-9, -50, 8, 12, 3); ctx.fill();
  // Käppi in Brand-Blau
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath(); ctx.arc(2, -49, 8.5, Math.PI, 0); ctx.fill();
  rr(2, -51, 12, 4, 2); ctx.fill();
  // Auge
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath(); ctx.arc(6, -44, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGerm(g, camX) {
  const x = g.x - camX;
  if (!g.alive) {
    if (g.squashT > 0.4) return;
    ctx.fillStyle = 'rgba(150,90,170,.6)';
    ctx.beginPath();
    ctx.ellipse(x + g.w / 2, CFG.GROUND_Y - 5, g.w * 0.7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const y = g.y + Math.sin(g.wob) * 2;
  ctx.fillStyle = '#9a5fb5';
  ctx.beginPath();
  ctx.ellipse(x + g.w / 2, y + g.h / 2, g.w / 2, g.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stacheln
  ctx.strokeStyle = '#7c4396'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + g.wob * 0.25;
    const cx = x + g.w / 2 + Math.cos(a) * g.w * 0.5;
    const cy = y + g.h / 2 + Math.sin(a) * g.h * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
    ctx.stroke();
  }
  // grimmige Augen
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + g.w / 2 - 6, y + g.h / 2 - 2, 4, 0, Math.PI * 2);
  ctx.arc(x + g.w / 2 + 6, y + g.h / 2 - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(x + g.w / 2 - 6 + g.dir * 1.5, y + g.h / 2 - 2, 1.8, 0, Math.PI * 2);
  ctx.arc(x + g.w / 2 + 6 + g.dir * 1.5, y + g.h / 2 - 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

/** Wartender Kunde: winkt; nach der Zustellung glücklich mit Paket. */
function drawCustomer(pk, camX, t) {
  const x = pk.x - camX + pk.w / 2;
  const yB = pk.y + pk.h;
  const happy = pk.taken;
  ctx.save();
  ctx.translate(x, yB);
  // Beine + Körper
  ctx.strokeStyle = '#5c5148'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(-4, -2); ctx.moveTo(5, -14); ctx.lineTo(5, -2); ctx.stroke();
  ctx.fillStyle = happy ? '#7fb069' : '#e0964f';
  rr(-10, -34, 20, 21, 5); ctx.fill();
  // Kopf
  ctx.fillStyle = COLORS.skin;
  ctx.beginPath(); ctx.arc(0, -41, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8d8d8d';
  ctx.beginPath(); ctx.arc(-1, -44, 7.5, Math.PI * 0.9, Math.PI * 1.9); ctx.fill();
  // Mund: wartend neutral, danach lachend
  ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (happy) ctx.arc(1, -39, 3.4, 0.15, Math.PI - 0.15);
  else ctx.moveTo(-1, -37), ctx.lineTo(4, -37);
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath(); ctx.arc(3, -43, 1.4, 0, Math.PI * 2); ctx.fill();
  if (happy) {
    // Paket im Arm + Herzchen
    ctx.fillStyle = '#fff'; rr(6, -30, 14, 12, 2); ctx.fill();
    ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 1.5; rr(6, -30, 14, 12, 2); ctx.stroke();
    text('♥', 14, -50 + Math.sin(t * 3 + pk.bob) * 3, 12, '#e2483c', 'center', 900);
  } else {
    // winkender Arm + Sprechblase "Hier!"
    const wave = Math.sin(t * 5 + pk.bob) * 0.5;
    ctx.strokeStyle = '#c97f3e'; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(8, -30); ctx.lineTo(15, -40 + wave * 6); ctx.stroke();
    const bob = Math.sin(t * 3 + pk.bob) * 3;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    rr(-26, -76 + bob, 52, 20, 9); ctx.fill();
    ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 1.5;
    rr(-26, -76 + bob, 52, 20, 9); ctx.stroke();
    text('Hierher!', 0, -62 + bob, 10, COLORS.blueDark, 'center', 800);
  }
  ctx.restore();
}

function drawPickup(pk, camX, t) {
  if (pk.type === 'delivery') { drawCustomer(pk, camX, t); return; }
  if (pk.taken) return;
  const bob = Math.sin(t * 3 + pk.bob) * 4;
  const x = pk.x - camX;
  const y = pk.y + bob;
  if (pk.type === 'pill') {
    ctx.save();
    ctx.translate(x + pk.w / 2, y + pk.h / 2);
    ctx.rotate(-0.5);
    ctx.fillStyle = COLORS.blue;
    rr(-10, -6, 10, 12, 6); ctx.fill();
    ctx.fillStyle = COLORS.lime;
    rr(0, -6, 10, 12, 6); ctx.fill();
    ctx.restore();
  } else {
    // Bestellpaket mit Apotheken-A
    ctx.fillStyle = '#fff';
    rr(x, y, pk.w, pk.h, 4); ctx.fill();
    ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2;
    rr(x, y, pk.w, pk.h, 4); ctx.stroke();
    ctx.fillStyle = '#e2483c';
    text('A', x + pk.w / 2, y + pk.h / 2 + 6, 16, '#e2483c', 'center', 900);
    // Glitzer
    ctx.fillStyle = COLORS.lime;
    ctx.beginPath();
    ctx.arc(x + pk.w + 4, y - 2 + Math.sin(t * 5 + pk.bob) * 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------- HUD ---------- */

function drawHUD(game) {
  const lvl = game.level;
  const branch = levelMeta(lvl.def);

  ctx.fillStyle = 'rgba(255,255,255,.88)';
  rr(14, 12, 380, 42, 12); ctx.fill();
  // Mini-Logo: Blatt + Name
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath(); ctx.ellipse(38, 26, 9, 5, -0.6, 0, Math.PI * 2); ctx.fill();
  text('Nestle-Apotheke', 52, 32, 15, COLORS.blue, 'left', 900);
  text(branch.short, 52, 47, 12, COLORS.limeDark, 'left', 800);
  text(`Level ${game.levelIndex + 1}/${LEVELS.length}`, 205, 39, 14, COLORS.inkSoft, 'left', 700);
  text(`★ ${game.score}`, 300, 39, 15, COLORS.blueDark, 'left', 900);

  // Leben (Kreuze)
  for (let i = 0; i < CFG.START_LIVES; i++) {
    const x = CFG.W - 100 - i * 30;
    ctx.fillStyle = i < game.lives ? '#e2483c' : 'rgba(0,0,0,.12)';
    rr(x - 3, 18 - 10, 8, 22, 2); ctx.fill();
    rr(x - 10, 18 - 3, 22, 8, 2); ctx.fill();
  }

  // Bestellungen
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  rr(CFG.W - 250, 40, 128, 30, 10); ctx.fill();
  const cntLabel = lvl.def.mode === 'deliver' ? 'Pakete' : 'Bestellungen';
  text(`${cntLabel} ${lvl.ordersGot}/${lvl.ordersTotal}`, CFG.W - 186, 60, 12, COLORS.blueDeep, 'center', 800);
}

/** Kurzer Einblend-Toast (z. B. Produktname beim Einsammeln). */
function drawToast(toast) {
  if (!toast || toast.t <= 0) return;
  const a = Math.min(1, toast.t / 0.4);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,88,127,.92)';
  const w = ctx.measureText(toast.msg).width + 160;
  rr(CFG.W / 2 - w / 2, 84, w, 34, 17); ctx.fill();
  text(toast.msg, CFG.W / 2, 106, 15, '#fff', 'center', 800);
  ctx.globalAlpha = 1;
}
