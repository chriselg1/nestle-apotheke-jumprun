/* config.js — Konstanten, Markenfarben und Filialdaten.
   Quelle der Filial- und Produktangaben: https://www.nestle-apotheke.de (Stand 21.08.2026) */

'use strict';

const CFG = Object.freeze({
  W: 960,
  H: 540,

  GROUND_Y: 452,          // Oberkante Boden
  GRAVITY: 2100,
  MOVE_SPEED: 290,
  ACCEL: 2200,
  FRICTION: 2400,
  AIR_CONTROL: 0.55,
  JUMP_VELOCITY: 720,
  JUMP_CUT: 0.42,         // Faktor beim Loslassen der Sprungtaste
  MAX_FALL: 940,
  COYOTE_TIME: 0.10,
  JUMP_BUFFER: 0.12,

  START_LIVES: 3,
  INVULN_TIME: 1.4,
  STOMP_BOUNCE: 430,

  CAMERA_LERP: 0.12,
  DEATH_Y: 620
});

const COLORS = Object.freeze({
  blue: '#009fe3',
  blueDark: '#0079ad',
  blueDeep: '#00587f',
  blueSoft: '#7fd0f3',
  lime: '#c5cf23',
  limeDark: '#9aa317',
  white: '#ffffff',
  paper: '#f4f9fc',
  ink: '#1d2a33',
  inkSoft: '#4a6270',
  warn: '#e2483c',
  skin: '#f2c69b',
  hair: '#4a3527'
});

/* Die vier Filialen der Nestle-Apotheken in Friedrichshafen. */
const BRANCHES = Object.freeze([
  {
    name: 'Nestle-Apotheke am See',
    short: 'am See',
    street: 'Friedrichstr. 53',
    city: '88045 Friedrichshafen',
    phone: '07541 3989020',
    mail: 'see@nestle-apotheke.de',
    scene: 'lake',
    claim: 'Zwischen Uferpromenade und Zeppelin-Himmel.',
    fact: 'Online bestellen – vor Ort abholen.'
  },
  {
    name: 'Nestle-Apotheke Bodensee',
    short: 'Bodensee',
    street: 'Ehlersstr. 17',
    city: '88045 Friedrichshafen',
    phone: '07541 9530712',
    mail: 'bodensee@nestle-apotheke.de',
    scene: 'harbour',
    claim: 'Kurs auf den Hafen – Botendienst an Bord.',
    fact: 'Lieferung per Botendienst bis an die Haustür.'
  },
  {
    name: 'Nestle-Apotheke Hofen',
    short: 'Hofen',
    street: 'Werastr. 48',
    city: '88046 Friedrichshafen',
    phone: null,
    mail: 'hofen@nestle-apotheke.de',
    scene: 'hills',
    claim: 'Über die Obstwiesen bis nach Hofen.',
    fact: 'Kompetente Beratung aus der Apotheke.'
  },
  {
    name: 'Nestle-Apotheke Linden',
    short: 'Linden',
    street: 'Länderöschstr. 30',
    city: '88045 Friedrichshafen',
    phone: '07541 34227',
    mail: 'linden@nestle-apotheke.de',
    scene: 'avenue',
    claim: 'Die Lindenallee runter – Zielgerade!',
    fact: 'Abholung zum Wunschzeitpunkt.'
  }
]);

/* Bestellungen, die eingesammelt werden müssen — Produkte aus dem Onlineshop. */
const ORDERS = Object.freeze([
  'SINUPRET extract',
  'PROSPAN Hustensaft',
  'LEFAX Kautabletten',
  'FENISTIL Gel',
  'BEPANTHEN Salbe',
  'E-Rezept',
  'Blutzucker-Set',
  'Vitamin-D Tropfen'
]);

const POINTS = Object.freeze({
  PILL: 50,
  ORDER: 250,
  GERM: 150,
  LEVEL_CLEAR: 1000,
  TIME_BONUS_PER_S: 5
});
