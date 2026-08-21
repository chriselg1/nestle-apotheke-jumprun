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
  return cut.indexOf(entry);
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
