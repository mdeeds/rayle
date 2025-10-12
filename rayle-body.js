export class RayleBody {

  constructor() {
    this.scale = 0.0;
    this.update();
  }

  setScale(scale) {
    this.scale = scale;
    this.update();
  }

  update() {
    this.heightM = 1.0 * Math.pow(2.0, this.scale);
    this.massKg = 10.0 * Math.pow(10, this.scale);
    this.width = 8.0 / 11.0 * Math.pow(Math.sqrt(5.0), this.scale);
    const strength = this.width * this.width;
    const vacuumTopSpeedMps = 50.0 * strength / this.massKg;
    const runningDrag = vacuumTopSpeedMps * vacuumTopSpeedMps * this.heightM * this.width / this.massKg;
    this.topSpeedMps = vacuumTopSpeedMps - runningDrag;
    this.timeScale = Math.sqrt(Math.pow(2.0, this.scale));
    this.jumpHeightM = 0.5 * this.topSpeedMps * this.topSpeedMps / 9.8;
    this.terminalVelocity = 1.0 * Math.sqrt(this.massKg / this.heightM / this.width);
    const gravitationalForce = 9.8 * this.massKg;
    const flapForce = 90.0 * strength;
    this.liftAccelerationMpss = (flapForce - gravitationalForce) / this.massKg;
  }

  getPillNumbers(footX, footY) {
    if (this.width < this.height) {
      // Normal case, Rayle is taller than wide.
      const r = this.width / 2.0;
      const aY = r + footY;
      const bY = aY + this.heightM - 2.0 * r;
      const aX = footX;
      const bX = footX;
      return [aX, aY, bX, bY, r];
    } else {
      // Rayle is wider than tall.
      const t = this.getPillNumbers(footY, footX);
      return [t[1], t[0], t[3], t[2], t[4]];
    }
  }
}