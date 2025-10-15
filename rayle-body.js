// @ts-check

import { Rectangle } from "./rectangle.js";
import { RigidBody } from "./rigid-body.js";
import { Vector } from "./vector.js";

export class RayleBody {

  /** @type {number} */
  scale;
  /** @type {number} */
  heightM = 1.0;
  /** @type {number} */
  width = 1.0;
  /** @type {number} */
  massKg = 1.0;
  /** @type {number} */
  topSpeedMps = 1.0;
  /** @type {number} */
  timeScale = 1.0;
  /** @type {number} */
  jumpVelocityMps = 1.0;
  /** @type {number} */
  flapVelocityMps = 1.0;
  /** @type {number} */
  terminalVelocity = 1.0;
  /** @type {number} */
  liftAccelerationMpss = 1.0;
  /** @type {Vector} */
  position = new Vector(0, 0);


  /**
   * 
   */
  constructor() {
    this.scale = 0.0;
    this.rect = new Rectangle(0, 0, 0, 0);
    this.body = new RigidBody(this.rect);
    this.body.setMovable(1.0);
    this.initialize();
    this.update();
  }


  /**
   * @param {Vector} position
   */
  setPosition(position) {
    this.position.set(position);
    this.update();
  }

  /**
   * 
   * @param {number} scale 
   */
  setScale(scale) {
    if (scale < -3) { scale = -3.0; }
    if (scale > 3) { scale = 3.0; }
    this.scale = scale;
    this.update();
  }

  initialize() {
  }

  update() {
    this.position.x = (this.body.rect.left + this.body.rect.right) / 2.0;
    this.position.y = this.body.rect.bottom;

    this.heightM = 1.0 * Math.pow(2.0, this.scale);
    this.massKg = 10.0 * Math.pow(10, this.scale);
    this.width = 8.0 / 11.0 * Math.pow(Math.sqrt(5.0), this.scale);
    const strength = this.width * this.width;
    const vacuumTopSpeedMps = 200.0 * strength / this.massKg;
    // const runningDrag = vacuumTopSpeedMps * vacuumTopSpeedMps * this.heightM * this.width / this.massKg;
    this.topSpeedMps = 4.0 * Math.pow(1.1, this.scale);
    this.timeScale = Math.sqrt(Math.pow(2.0, this.scale));
    this.jumpVelocityMps = 3.0 * Math.pow(0.8, this.scale);
    this.flapVelocityMps = 0.5 * Math.pow(0.5, this.scale);
    this.terminalVelocity = 1.0 * Math.sqrt(this.massKg / this.heightM / this.width);
    this.body.massKg = this.massKg;

    this.body.rect.left = this.position.x - this.width / 2.0;
    this.body.rect.right = this.position.x + this.width / 2.0;
    this.body.rect.top = this.position.y + this.heightM;
    this.body.rect.bottom = this.position.y;
  }
}