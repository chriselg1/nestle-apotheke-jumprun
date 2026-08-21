/* levels.js — Leveldaten für die vier Filialen.
   Koordinaten in Weltpixeln, y wächst nach unten. Boden-Oberkante: CFG.GROUND_Y. */

'use strict';

const PLATFORM_H = 20;

/** Bodensegment (der Rest ist Wasser bzw. Abgrund). */
function ground(x, w) {
  return { x, y: CFG.GROUND_Y, w, h: 140, kind: 'ground' };
}

/** Schwebende Plattform. */
function plat(x, y, w, kind) {
  return { x, y, w, h: PLATFORM_H, kind: kind || 'plat' };
}

/** Bewegliche Plattform: axis 'x' oder 'y', range in px, speed in px/s. */
function mover(x, y, w, axis, range, speed) {
  return { x, y, w, h: PLATFORM_H, kind: 'mover', axis, range, speed, t: 0, dx: 0, dy: 0 };
}

/** Reihe von Pillen (Punkte-Sammelobjekte). */
function pills(x, y, count, step) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ x: x + i * (step || 44), y });
  return out;
}

/** Bogen aus Pillen über einen Sprung hinweg. */
function pillArc(x, y, count, step, lift) {
  const out = [];
  const mid = (count - 1) / 2;
  for (let i = 0; i < count; i++) {
    const d = Math.abs(i - mid) / (mid || 1);
    out.push({ x: x + i * step, y: y - Math.round((1 - d * d) * lift) });
  }
  return out;
}

const LEVELS = [
  /* ---------- 1 — am See ---------- */
  {
    branch: 0,
    width: 3680,
    par: 55,
    solids: [
      ground(0, 780), ground(880, 520), ground(1500, 660), ground(2260, 600), ground(2960, 720),
      plat(560, 356, 120), plat(1000, 330, 130), plat(1270, 268, 110),
      plat(1740, 352, 130), plat(2020, 288, 120),
      plat(2420, 344, 140), plat(2740, 282, 110),
      plat(3160, 340, 130)
    ],
    orders: [{ x: 600, y: 310 }, { x: 1310, y: 222 }, { x: 2470, y: 298 }],
    pills: [].concat(
      pills(180, 400, 5), pillArc(790, 396, 5, 46, 90),
      pills(1030, 284, 3), pills(1420, 400, 4),
      pillArc(2180, 396, 5, 46, 96), pills(2770, 236, 3), pills(3200, 294, 3)
    ),
    germs: [{ x: 420, range: 200 }, { x: 1180, range: 220 }, { x: 1860, range: 190 },
            { x: 2560, range: 210 }, { x: 3120, range: 230 }],
    goal: { x: 3460, y: CFG.GROUND_Y }
  },

  /* ---------- 2 — Bodensee ---------- */
  {
    branch: 1,
    width: 3960,
    par: 70,
    solids: [
      ground(0, 620), ground(760, 380), ground(1420, 300), ground(1900, 460),
      ground(2560, 420), ground(3160, 800),
      plat(430, 350, 110),
      mover(1180, 330, 120, 'x', 150, 62),
      plat(1620, 330, 110), plat(1780, 220, 90),
      mover(2140, 320, 120, 'y', 120, 52),
      plat(2420, 268, 110),
      mover(2980, 340, 130, 'x', 130, 70),
      plat(3320, 300, 120), plat(3560, 236, 110)
    ],
    orders: [{ x: 1820, y: 174 }, { x: 2460, y: 222 }, { x: 3600, y: 190 }],
    pills: [].concat(
      pills(140, 400, 4), pills(460, 306, 3),
      pillArc(640, 396, 5, 44, 100), pills(1450, 400, 3),
      pillArc(1240, 286, 4, 42, 60), pills(2000, 400, 4),
      pillArc(2320, 396, 5, 44, 110), pills(2620, 400, 3), pills(3380, 256, 3)
    ),
    germs: [{ x: 300, range: 200 }, { x: 900, range: 160 }, { x: 2000, range: 220 },
            { x: 2660, range: 190 }, { x: 3260, range: 240 }, { x: 3700, range: 200 }],
    goal: { x: 3830, y: CFG.GROUND_Y }
  },

  /* ---------- 3 — Hofen ---------- */
  {
    branch: 2,
    width: 4180,
    par: 80,
    solids: [
      ground(0, 560), ground(700, 260), ground(1120, 240), ground(1520, 520),
      ground(2200, 240), ground(2600, 300), ground(3040, 380), ground(3560, 620),
      plat(380, 348, 100), plat(980, 335, 100),
      plat(1300, 280, 100), plat(1420, 190, 90),
      mover(1760, 300, 120, 'y', 140, 58),
      plat(2060, 236, 100), plat(2380, 335, 110), plat(2480, 230, 90),
      mover(2860, 340, 120, 'x', 140, 74),
      plat(3300, 264, 110), plat(3440, 178, 90),
      plat(3800, 350, 120)
    ],
    orders: [{ x: 1460, y: 144 }, { x: 2520, y: 168 }, { x: 3480, y: 132 }],
    pills: [].concat(
      pills(160, 400, 4), pills(400, 298, 3),
      pillArc(580, 396, 5, 42, 104), pillArc(950, 396, 5, 42, 96),
      pills(2090, 190, 3), pillArc(1960, 396, 5, 42, 110),
      pills(2680, 400, 3), pillArc(2900, 260, 4, 42, 56),
      pills(3330, 218, 3), pills(3840, 254, 3)
    ),
    germs: [{ x: 260, range: 190 }, { x: 800, range: 140 }, { x: 1620, range: 240 },
            { x: 2260, range: 130 }, { x: 2680, range: 160 }, { x: 3120, range: 200 },
            { x: 3660, range: 240 }],
    goal: { x: 4050, y: CFG.GROUND_Y }
  },

  /* ---------- 4 — Linden ---------- */
  {
    branch: 3,
    width: 4600,
    par: 95,
    solids: [
      ground(0, 520), ground(660, 220), ground(1020, 200), ground(1380, 460),
      ground(2000, 200), ground(2360, 220), ground(2720, 420), ground(3320, 240),
      ground(3700, 260), ground(4100, 620),
      plat(340, 340, 100),
      mover(880, 320, 110, 'y', 130, 62),
      plat(1240, 330, 100),
      plat(1620, 345, 110), plat(1760, 240, 90),
      mover(2140, 340, 110, 'x', 150, 82),
      plat(2560, 258, 100),
      plat(2900, 340, 110), plat(3040, 226, 90),
      mover(3480, 290, 110, 'y', 150, 66),
      plat(3900, 340, 110), plat(4020, 240, 90),
      plat(4340, 350, 120)
    ],
    orders: [{ x: 1800, y: 160 }, { x: 3080, y: 180 }, { x: 4060, y: 128 }],
    pills: [].concat(
      pills(140, 400, 4), pills(360, 290, 3),
      pillArc(540, 396, 5, 42, 108), pillArc(940, 396, 5, 42, 100),
      pills(1270, 218, 3), pillArc(1900, 396, 5, 42, 112),
      pills(2580, 208, 3), pillArc(2620, 396, 4, 44, 96),
      pills(3360, 400, 3), pillArc(3620, 396, 5, 42, 116),
      pills(3930, 218, 3), pills(4380, 254, 3)
    ),
    germs: [{ x: 240, range: 180 }, { x: 740, range: 120 }, { x: 1480, range: 240 },
            { x: 2060, range: 110 }, { x: 2420, range: 130 }, { x: 2800, range: 200 },
            { x: 3380, range: 130 }, { x: 3760, range: 160 }, { x: 4200, range: 240 },
            { x: 4400, range: 150 }],
    goal: { x: 4480, y: CFG.GROUND_Y }
  }
];
