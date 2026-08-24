/* audio.js — Chiptune-Hintergrundmusik im 8-Bit-Stil (Web Audio API).
   Eigenkomposition "Bodensee-Sprint": Wellen-Arpeggios, Möwenrufe,
   Fährhorn — als Bridge ein Zitat der gemeinfreien "Schwäbischen
   Eisenbahn" (traditionelles Volkslied, endet am Bodensee). */

'use strict';

const AudioFX = (() => {
  const STORAGE_KEY = 'nestle-jumprun-sound';
  const BPM = 138;
  const STEP = 60 / BPM / 4;              // Sechzehntel
  const MASTER_VOL = 0.16;
  const LOOKAHEAD_S = 0.35;
  const TICK_MS = 90;

  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let timer = null;
  let nextStep = 0;
  let nextTime = 0;
  let running = false;
  let muted = false;
  try { muted = localStorage.getItem(STORAGE_KEY) === 'off'; } catch (_) { /* egal */ }

  const f = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- Komposition (Midi-Noten, Länge in Sechzehnteln, 0 = Pause) ----------
     Form: A A B A — A = eigene "Wellen"-Melodie, B = Eisenbahn-Zitat. */
  const N = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B3: 59, B4: 71, C5: 72, D5: 74, E5: 76 };
  const A_MELODY = [
    [N.E4, 2], [N.G4, 2], [N.C5, 2], [N.G4, 2], [N.E4, 2], [N.G4, 2], [N.C5, 4],
    [N.D5, 2], [N.C5, 2], [N.A4, 2], [N.C5, 2], [N.G4, 6], [0, 2],
    [N.F4, 2], [N.A4, 2], [N.D5, 2], [N.A4, 2], [N.F4, 2], [N.A4, 2], [N.D5, 4],
    [N.E5, 2], [N.D5, 2], [N.B4, 2], [N.D5, 2], [N.C5, 6], [0, 2]
  ];
  const B_MELODY = [   // "Auf de schwäbsche Eisebahne …" (gemeinfrei)
    [N.G4, 2], [N.G4, 2], [N.G4, 2], [N.E4, 2], [N.C4, 3], [N.E4, 1], [N.G4, 4],
    [N.G4, 2], [N.G4, 2], [N.G4, 2], [N.E4, 2], [N.C4, 8],
    [N.F4, 2], [N.F4, 2], [N.F4, 2], [N.D4, 2], [N.B3, 3], [N.D4, 1], [N.F4, 4],
    [N.G4, 2], [N.F4, 2], [N.E4, 2], [N.D4, 2], [N.C4, 8]
  ];
  const A_BASS = [36, 36, 43, 43, 41, 41, 43, 43, 36, 36, 43, 43, 41, 43, 36, 36];   // je halbe Note
  const B_BASS = [36, 36, 43, 43, 36, 36, 43, 36, 41, 41, 43, 43, 43, 43, 36, 36];

  function expand(melody) {
    const seq = [];
    let pos = 0;
    for (const [note, len] of melody) { if (note) seq.push({ pos, note, len }); pos += len; }
    return { seq, len: pos };
  }
  const A = expand(A_MELODY), B = expand(B_MELODY);
  const FORM = [A, A, B, A];
  const FORM_LEN = FORM.reduce((s, p) => s + p.len, 0);   // in Sechzehnteln

  /* ---------- Klangbausteine ---------- */

  function ensureCtx() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_VOL;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function blip(type, freq, t0, dur, vol, slideTo) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function hat(t0, vol) {
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 6000;
    s.buffer = noiseBuf;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
    s.connect(hp); hp.connect(g); g.connect(master);
    s.start(t0); s.stop(t0 + 0.06);
  }

  function seagull(t0) {   // absteigender Doppel-Chirp
    blip('square', 1900, t0, 0.14, 0.5, 1150);
    blip('square', 1750, t0 + 0.18, 0.18, 0.4, 950);
  }

  function ferryHorn(t0) { // tiefes Fährhorn, zweistimmig
    blip('sawtooth', f(38), t0, 0.9, 0.5);
    blip('sawtooth', f(45), t0, 0.9, 0.3);
  }

  /* ---------- Sequencer ---------- */

  function partAt(step) {
    let s = step % FORM_LEN;
    for (const p of FORM) { if (s < p.len) return { part: p, local: s }; s -= p.len; }
    return { part: A, local: 0 };
  }

  function scheduleStep(step, t0) {
    const { part, local } = partAt(step);
    // Melodie (Rechteck — der NES-Klang)
    for (const n of part.seq) {
      if (n.pos === local) blip('square', f(n.note), t0, n.len * STEP * 0.92, 0.55);
    }
    // Wellen-Arpeggio (leises Dreieck wie Wellenschlag)
    if (local % 2 === 0) {
      const wave = [N.C4, N.E4, N.G4, N.E4][(local / 2) % 4] + (part === B ? -12 : 0);
      blip('triangle', f(wave + 12), t0, STEP * 1.6, 0.16);
    }
    // Bass (halbe Noten)
    const bassLine = part === B ? B_BASS : A_BASS;
    if (local % 8 === 0) blip('triangle', f(bassLine[(local / 8) % bassLine.length]), t0, STEP * 7, 0.5);
    // Hi-Hat auf Achteln, betont auf der Zählzeit
    if (local % 4 === 0) hat(t0, local % 8 === 0 ? 0.25 : 0.12);
    // Bodensee-Färbung: Fährhorn am Formanfang, Möwen sparsam
    const abs = step % FORM_LEN;
    if (abs === 0) ferryHorn(t0);
    if (abs === A.len * 2 + 8) seagull(t0);          // Möwe über der Bridge
    if (abs === FORM_LEN - 16) seagull(t0 + STEP);
  }

  function tick() {
    if (!running || !ctx) return;
    while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
      scheduleStep(nextStep, nextTime);
      nextStep += 1;
      nextTime += STEP;
    }
  }

  /* ---------- API ---------- */

  return {
    get muted() { return muted; },
    get running() { return running; },

    /** Beim ersten User-Gesture aufrufen (Autoplay-Policy der Browser). */
    unlock() {
      if (!ensureCtx()) return;
      if (ctx.state === 'suspended') ctx.resume();
    },

    start() {
      if (!ensureCtx() || running) return;
      if (ctx.state === 'suspended') return;         // wartet auf unlock()
      running = true;
      nextStep = 0;
      nextTime = ctx.currentTime + 0.08;
      timer = setInterval(tick, TICK_MS);
    },

    stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
    },

    toggleMute() {
      muted = !muted;
      try { localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on'); } catch (_) { /* egal */ }
      if (master) master.gain.value = muted ? 0 : MASTER_VOL;
      return muted;
    }
  };
})();
