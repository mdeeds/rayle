
// @ts-check

import { Vector } from "./vector";
import { Rectangle } from "./rectangle";

export class RigidBody {
  /** @type {Rectangle} */
  rect;
  /** @type {boolean} */
  canMove;
  /** @type {number} */
  massKg;

  /**
   * 
   * @param {Rectangle} rect 
   */
  constructor(rect) {
    this.rect = rect;
    this.canMove = false;
    this.massKg = 1e7;

    // These are used by the physics engine
    this.velocityMps = new Vector(0, 0);
    this.accelerationMps2 = new Vector(0, 0);
    this.netForceN = new Vector(0, 0);
    this.netImpulseNS = new Vector(0, 0);
  }

  /**
   * 
   * @param {number} massKg 
   */
  setMovable(massKg) {
    this.canMove = true;
    this.massKg = massKg;
  }

  resetPhysics() {
    this.netForceN.x = 0;
    this.netForceN.y = 0;
    this.netImpulseNS.x = 0;
    this.netImpulseNS.y = 0;
  }

  /**
   * @param {Vector} impulseNS The impulse to add, in Newton-seconds.
   */
  addImpulse(impulseNS) {
    if (!this.canMove) return;
    this.netImpulseNS.add(impulseNS);
  }

  /**
   * 
   * @param {Vector} forceN 
   */
  addForce(forceN) {
    if (!this.canMove) return;
    this.netForceN.add(forceN);
  }
}