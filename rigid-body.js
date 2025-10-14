
// @ts-check

import { Vector } from "./vector.js";
import { Rectangle } from "./rectangle.js";

export class RigidBody {
  /** @type {Rectangle} */
  rect;
  /** @type {boolean} */
  canMove;
  /** @type {number} */
  massKg;
  /** @type {boolean} */
  grounded;

  /**
   * 
   * @param {Rectangle} rect 
   */
  constructor(rect) {
    this.rect = rect;
    this.canMove = false;
    this.massKg = 1e7;
    this.grounded = false;

    // These are used by the physics engine
    this.velocityMps = new Vector(0, 0);
    this.accelerationMps2 = new Vector(0, 0);
  }

  /**
   * 
   * @param {number} massKg 
   */
  setMovable(massKg) {
    this.canMove = true;
    this.massKg = massKg;
  }
}