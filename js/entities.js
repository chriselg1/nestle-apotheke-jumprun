/* entities.js — Spieler (Botin Hannelore), Keime, Sammelobjekte. */

'use strict';

class Player {
  constructor(x, y) {
    this.w = 30;
    this.h = 44;
    this.x = x;
    this.y = y - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.invuln = 0;
    this.runPhase = 0;
    this.dead = false;
  }

  update(dt, solids) {
    const inp = Input.state;

    // Horizontal: Beschleunigen / Bremsen
    const control = this.onGround ? 1 : CFG.AIR_CONTROL;
    const target = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (target !== 0) {
      this.vx += target * CFG.ACCEL * control * dt;
      this.vx = clamp(this.vx, -CFG.MOVE_SPEED, CFG.MOVE_SPEED);
      this.facing = target;
    } else if (this.onGround) {
      const drop = CFG.FRICTION * dt;
      this.vx = Math.abs(this.vx) <= drop ? 0 : this.vx - Math.sign(this.vx) * drop;
    }

    // Sprung mit Coyote-Time und Buffer
    this.coyote = this.onGround ? CFG.COYOTE_TIME : Math.max(0, this.coyote - dt);
    this.jumpBuffer = Input.consumeJump() ? CFG.JUMP_BUFFER : Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = -CFG.JUMP_VELOCITY;
      this.coyote = 0;
      this.jumpBuffer = 0;
    }
    // Kurzer Sprung beim Loslassen
    if (!inp.jump && this.vy < 0) this.vy *= 1 - (1 - CFG.JUMP_CUT) * 12 * dt;

    this.vy = Math.min(this.vy + CFG.GRAVITY * dt, CFG.MAX_FALL);

    const flags = moveAndCollide(this, solids, dt);
    this.onGround = flags.onGround;
    if (flags.carrier) { this.x += flags.carrier.dx; this.y += flags.carrier.dy; }

    if (this.invuln > 0) this.invuln -= dt;
    this.runPhase += Math.abs(this.vx) * dt * 0.05;
  }
}

/** Keim — patrouilliert auf dem Boden hin und her; per Sprung besiegbar. */
class Germ {
  constructor(x, range) {
    this.w = 34;
    this.h = 28;
    this.x = x;
    this.y = CFG.GROUND_Y - this.h;
    this.x0 = x;
    this.range = range;
    this.dir = 1;
    this.speed = 78 + Math.random() * 40;
    this.wob = Math.random() * Math.PI * 2;
    this.alive = true;
    this.squashT = 0;
  }

  update(dt) {
    if (!this.alive) { this.squashT += dt; return; }
    this.x += this.dir * this.speed * dt;
    if (this.x > this.x0 + this.range) { this.x = this.x0 + this.range; this.dir = -1; }
    if (this.x < this.x0 - this.range) { this.x = this.x0 - this.range; this.dir = 1; }
    this.wob += dt * 7;
  }
}

class Pickup {
  constructor(x, y, type, label) {
    this.type = type;           // 'pill' | 'order'
    this.w = type === 'order' ? 30 : 20;
    this.h = type === 'order' ? 26 : 20;
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;
    this.label = label || '';
    this.taken = false;
    this.bob = Math.random() * Math.PI * 2;
  }
}

/** Levelzustand aus den Daten in levels.js aufbauen. */
function buildLevel(def) {
  const solids = def.solids.map((s) => ({ ...s }));
  const germs = def.germs.map((g) => new Germ(g.x, g.range));
  const pickups = [];
  def.pills.forEach((p) => pickups.push(new Pickup(p.x, p.y, 'pill')));
  def.orders.forEach((o, i) =>
    pickups.push(new Pickup(o.x, o.y, 'order', ORDERS[(def.branch * 3 + i) % ORDERS.length])));
  return {
    def,
    solids,
    germs,
    pickups,
    goal: { x: def.goal.x, y: def.goal.y - 96, w: 74, h: 96 },
    ordersTotal: def.orders.length,
    ordersGot: 0,
    time: 0
  };
}
