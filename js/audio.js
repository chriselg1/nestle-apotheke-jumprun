/* audio.js — Chiptune-Hintergrundmusik im 8-Bit-Stil (Web Audio API).
   "Auf de schwäbsche Eisebahne" (traditionelles Volkslied, gemeinfrei —
   endet bekanntlich am Bodensee) als Polka mit Oom-Pah-Bass, Dampflok-
   Rhythmus und Zugpfeife; dazu ein eigenes Wellen-Zwischenspiel. */

'use strict';

const AudioFX = (() => {
  const STORAGE_KEY = 'nestle-jumprun-sound';
  const BPM = 132;
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
     Form: STROPHE - REFRAIN - WELLEN-ZWISCHENSPIEL - REFRAIN.
     Strophe/Refrain: "Auf de schwäbsche Eisebahne" (gemeinfrei). */
  const N = { B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76 };

  const VERSE_MELODY = [   // "Auf de schwäbsche Eisebahne gibts gar viele Haltstatione …"
    [N.C4, 2], [N.E4, 2], [N.G4, 2], [N.G4, 2], [N.G4, 2], [N.G4, 2], [N.A4, 2], [N.G4, 2],
    [N.F4, 2], [N.F4, 2], [N.F4, 2], [N.D4, 2], [N.E4, 2], [N.E4, 2], [N.C4, 2], [N.C4, 2],
    [N.D4, 2], [N.D4, 2], [N.D4, 2], [N.D4, 2], [N.F4, 2], [N.F4, 2], [N.D4, 2], [N.B3, 2],
    [N.E4, 2], [N.C4, 2], [N.D4, 2], [N.B3, 2], [N.C4, 6], [0, 2]
  ];
  const REFRAIN_MELODY = [ // "Trulla trulla trullala … Schtuegert, Ulm und Biberach …"
    [N.G4, 2], [N.G4, 2], [N.E4, 2], [N.E4, 2], [N.C4, 2], [N.C4, 2], [0, 4],
    [N.G4, 2], [N.G4, 2], [N.F4, 2], [N.F4, 2], [N.D4, 2], [N.D4, 2], [0, 4],
    [N.C4, 2], [N.E4, 2], [N.G4, 2], [N.G4, 2], [N.A4, 2], [N.A4, 2], [N.G4, 4],
    [N.G4, 2], [N.F4, 2], [N.E4, 2], [N.D4, 2], [N.C4, 4], [0, 2], [N.C5, 2]   // "… ha!"
  ];
  const WAVE_MELODY = [    // eigenes Bodensee-Zwischenspiel
    [N.E4, 2], [N.G4, 2], [N.C5, 2], [N.G4, 2], [N.E4, 2], [N.G4, 2], [N.C5, 4],
    [N.D5, 2], [N.C5, 2], [N.A4, 2], [N.C5, 2], [N.G4, 6], [0, 2],
    [N.F4, 2], [N.A4, 2], [N.D5, 2], [N.A4, 2], [N.F4, 2], [N.A4, 2], [N.D5, 4],
    [N.E5, 2], [N.D5, 2], [N.B4, 2], [N.D5, 2], [N.C5, 6], [0, 2]
  ];

  // Harmonie-Grundtöne je halben Takt (für Oom-Pah)
  const VERSE_BASS = [36, 36, 41, 36, 43, 43, 43, 36];
  const REFRAIN_BASS = [36, 36, 43, 43, 36, 41, 43, 36];
  const WAVE_BASS = [36, 43, 41, 43, 36, 43, 43, 36];

  function expand(melody, bass, kind) {
    const seq = [];
    let pos = 0;
    for (const [note, len] of melody) { if (note) seq.push({ pos, note, len }); pos += len; }
    return { seq, len: pos, bass, kind };
  }
  const VERSE = expand(VERSE_MELODY, VERSE_BASS, 'verse');
  const REFRAIN = expand(REFRAIN_MELODY, REFRAIN_BASS, 'refrain');
  const WAVE = expand(WAVE_MELODY, WAVE_BASS, 'wave');
  const FORM = [VERSE, REFRAIN, WAVE, REFRAIN];
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

  function trainWhistle(t0) { // zweitönige Dampfpfeife: "tü-tüüü"
    blip('square', f(81), t0, 0.16, 0.35, f(80));
    blip('square', f(76), t0, 0.16, 0.25, f(75));
    blip('square', f(81), t0 + 0.22, 0.5, 0.35, f(79));
    blip('square', f(76), t0 + 0.22, 0.5, 0.25, f(74));
  }

  function chuff(t0, vol) { // Dampflok-"tschuff": gefilterte Noise-Wolke
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.8;
    s.buffer = noiseBuf;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    s.connect(bp); bp.connect(g); g.connect(master);
    s.start(t0); s.stop(t0 + 0.1);
  }

  /* ---------- Sequencer ---------- */

  function partAt(step) {
    let s = step % FORM_LEN;
    for (let i = 0; i < FORM.length; i++) {
      const p = FORM[i];
      if (s < p.len) return { part: p, local: s, idx: i };
      s -= p.len;
    }
    return { part: VERSE, local: 0, idx: 0 };
  }

  function scheduleStep(step, t0) {
    const { part, local, idx } = partAt(step);
    // Melodie (Rechteck — der NES-Klang)
    for (const n of part.seq) {
      if (n.pos === local) blip('square', f(n.note), t0, n.len * STEP * 0.9, 0.55);
    }
    // Oom-Pah-Polka: Grundton auf die Zählzeit, Akkord-Stich dazwischen
    const root = part.bass[Math.floor(local / 8) % part.bass.length];
    if (local % 8 === 0) blip('triangle', f(root), t0, STEP * 3, 0.55);           // Oom
    if (local % 8 === 4) {                                                        // Pah
      blip('square', f(root + 28), t0, STEP * 1.4, 0.14);
      blip('square', f(root + 31), t0, STEP * 1.4, 0.14);
    }
    // Dampflok-Rhythmus: tschuff-tschuff auf jeder Viertel
    if (local % 4 === 0) chuff(t0, local % 8 === 0 ? 0.22 : 0.13);
    // Wellen-Arpeggio nur im Zwischenspiel (Dreieck wie Wellenschlag)
    if (part.kind === 'wave' && local % 2 === 0) {
      const wave = [N.C4, N.E4, N.G4, N.E4][(local / 2) % 4];
      blip('triangle', f(wave + 12), t0, STEP * 1.6, 0.16);
    }
    // Effekte: Zugpfeife vor jedem Refrain, Möwe im Zwischenspiel
    if (part.kind === 'refrain' && local === 0) trainWhistle(t0 - STEP * 2);
    if (part.kind === 'wave' && local === 16) seagull(t0);
  }

  function tick() {
    if (!running || !ctx) return;
    while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
      scheduleStep(nextStep, nextTime);
      nextStep += 1;
      nextTime += STEP;
    }
  }

  /* ---------- Sound-Effekte (laufen über denselben Master/Mute) ---------- */

  function sfxReady() {
    return ensureCtx() && ctx.state === 'running';
  }

  /** Pille eingesammelt: klassischer Münz-Pling. */
  function sfxPill() {
    if (!sfxReady()) return;
    const t0 = ctx.currentTime;
    blip('square', f(83), t0, 0.06, 0.4);          // B5
    blip('square', f(88), t0 + 0.06, 0.22, 0.4);   // E6, klingt aus
  }

  /** Keim erledigt: satter absteigender Stomp + Zisch. */
  function sfxStomp() {
    if (!sfxReady()) return;
    const t0 = ctx.currentTime;
    blip('square', 380, t0, 0.16, 0.5, 70);
    hat(t0, 0.35);
  }

  /** Bestellung abgeholt: schnelles Aufwärts-Arpeggio. */
  function sfxOrder() {
    if (!sfxReady()) return;
    const t0 = ctx.currentTime;
    [72, 76, 79, 84].forEach((m, i) => blip('square', f(m), t0 + i * 0.055, 0.09, 0.4));
  }

  /** Paket zugestellt: kleine Fanfare mit Schluss-Glitzer. */
  function sfxDelivered() {
    if (!sfxReady()) return;
    const t0 = ctx.currentTime;
    [67, 72, 76].forEach((m, i) => blip('square', f(m), t0 + i * 0.07, 0.1, 0.42));
    blip('square', f(79), t0 + 0.21, 0.3, 0.45);
    blip('triangle', f(91), t0 + 0.24, 0.25, 0.25);
  }

  /** Leben verloren: klassischer "Zonk" — wah, wah, wah, waaah ↓ */
  function sfxZonk() {
    if (!sfxReady()) return;
    const t0 = ctx.currentTime;
    [64, 62, 60].forEach((m, i) => blip('square', f(m), t0 + i * 0.13, 0.12, 0.42));
    blip('square', f(58), t0 + 0.39, 0.5, 0.45, f(52));   // letzter Ton sackt ab
    blip('triangle', f(46), t0 + 0.39, 0.5, 0.3, f(40));
  }

  /* ---------- API ---------- */

  return {
    get muted() { return muted; },
    get running() { return running; },
    sfxPill, sfxStomp, sfxOrder, sfxDelivered, sfxZonk,

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
