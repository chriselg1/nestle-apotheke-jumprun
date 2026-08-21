/* highscores.js — lokale Bestenliste (localStorage, Top 10).
   Bewusst nur auf dem Gerät gespeichert — kein Server, keine Datenweitergabe. */

'use strict';

const HS_KEY = 'nestle-jumprun-highscores';
const HS_NAME_KEY = 'nestle-jumprun-name';
const HS_MAX = 10;
const HS_NAME_LEN = 12;

function hsLoad() {
  try {
    const raw = JSON.parse(localStorage.getItem(HS_KEY));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((e) => e && typeof e.score === 'number' && typeof e.name === 'string')
      .slice(0, HS_MAX);
  } catch (_) {
    return [];
  }
}

function hsStore(list) {
  try { localStorage.setItem(HS_KEY, JSON.stringify(list)); } catch (_) { /* voll/gesperrt */ }
}

function hsQualifies(score) {
  if (score <= 0) return false;
  const list = hsLoad();
  return list.length < HS_MAX || score > list[list.length - 1].score;
}

/** Eintrag hinzufügen; liefert den Rang (0-basiert) oder -1. */
function hsAdd(name, score, levelReached) {
  const clean = (name || '').trim().slice(0, HS_NAME_LEN) || 'Anonym';
  const entry = { name: clean, score, level: levelReached, date: new Date().toISOString().slice(0, 10) };
  const list = hsLoad();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const cut = list.slice(0, HS_MAX);
  hsStore(cut);
  try { localStorage.setItem(HS_NAME_KEY, clean); } catch (_) { /* egal */ }
  return entry;
}

/* --- Eingabe-Overlay --- */

const hsOverlay = document.getElementById('hs-entry');
const hsInput = document.getElementById('hs-name');

function hsShowEntry(score) {
  document.getElementById('hs-score').textContent = `${score} Punkte — das schafft es in die Top ${HS_MAX}!`;
  try { hsInput.value = localStorage.getItem(HS_NAME_KEY) || ''; } catch (_) { hsInput.value = ''; }
  hsOverlay.classList.add('show');
  setTimeout(() => hsInput.focus(), 50);
}

function hsHideEntry() {
  hsOverlay.classList.remove('show');
  hsInput.blur();
}

/* --- Online-Bestenliste (geräteübergreifend) ---
   Anonymer JSON-Speicher (npoint.io) — kein Account, dafür öffentlich:
   Einträge (Name + Punkte) sind für jeden sichtbar, der die URL kennt. */

const HS_REMOTE_URL = 'https://api.npoint.io/c5ad50e0846368955e91';
const HS_REMOTE_MAX = 25;
const HS_FETCH_TIMEOUT_MS = 6000;

/** Status für die Anzeige: online === null -> noch unbekannt/lädt. */
const hsRemote = { loading: false, online: null, list: [] };

function hsClean(list) {
  return list
    .filter((e) => e && typeof e.name === 'string' && typeof e.score === 'number'
      && isFinite(e.score) && e.score >= 0 && e.score < 10000000)
    .map((e) => ({
      name: String(e.name).trim().slice(0, HS_NAME_LEN) || 'Anonym',
      score: Math.round(e.score),
      level: Math.min(4, Math.max(1, e.level | 0)),
      date: typeof e.date === 'string' ? e.date.slice(0, 10) : ''
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, HS_REMOTE_MAX);
}

async function hsFetchRemote() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HS_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(HS_REMOTE_URL, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return hsClean(Array.isArray(data && data.scores) ? data.scores : []);
  } finally {
    clearTimeout(timer);
  }
}

/** Liste im Hintergrund aktualisieren (Anzeige liest hsRemote). */
function hsSync() {
  if (hsRemote.loading) return;
  hsRemote.loading = true;
  hsFetchRemote()
    .then((list) => { hsRemote.list = list; hsRemote.online = true; })
    .catch(() => { hsRemote.online = false; })
    .finally(() => { hsRemote.loading = false; });
}

/** Eintrag online speichern: lesen, mischen, zurückschreiben. */
async function hsSubmitRemote(entry) {
  try {
    const current = await hsFetchRemote().catch(() => hsRemote.list || []);
    const merged = hsClean(current.concat([entry]));
    const res = await fetch(HS_REMOTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: merged })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    hsRemote.list = merged;
    hsRemote.online = true;
  } catch (_) {
    hsRemote.online = false;   // lokal ist der Eintrag trotzdem gesichert
  }
}
