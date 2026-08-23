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

const SCENES = {
  lake(camX, t) {
    ctx.fillStyle = skyGradient('#bfe9fb', '#e8f7ff');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawZeppelin(camX, t);
    drawHillsFar(camX, '#a5d3a7', 40, 330);
    drawWater(camX, t, 356);
    drawSail(((640 - camX * 0.45 + t * 8) % (CFG.W + 200)) - 100, 392, 1);
    drawSail(((190 - camX * 0.45 + t * 5) % (CFG.W + 200)) - 100, 410, 0.7);
  },
  harbour(camX, t) {
    ctx.fillStyle = skyGradient('#a8ddf5', '#fdf3d8');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawHillsFar(camX, '#8fbfd8', 46, 320);
    drawWater(camX, t, 348);
    // Kräne an der Kaimauer
    ctx.strokeStyle = COLORS.blueDeep;
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      const x = ((i * 420 - camX * 0.4) % (CFG.W + 300)) - 150;
      ctx.beginPath();
      ctx.moveTo(x, 348); ctx.lineTo(x, 210); ctx.lineTo(x + 90, 232);
      ctx.moveTo(x + 62, 226); ctx.lineTo(x + 62, 262);
      ctx.stroke();
    }
    drawSail(((430 - camX * 0.5 + t * 10) % (CFG.W + 200)) - 100, 396, 1.15);
  },
  hills(camX, t) {
    ctx.fillStyle = skyGradient('#b8e6f7', '#f2fbe8');
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    drawClouds(camX, t);
    drawHillsFar(camX, '#b9d98a', 60, 340);
    drawHillsFar(camX * 1.6, '#9cc86c', 42, 384);
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
