//@ts-check

import { Vector } from "./vector";
import { Rectangle } from "./rectangle";
import { RigidBody } from "./rigid-body";

export class Physics {
  /** @type {RigidBody[]} */
  bodies = [];
  constructor() {
  }

  /**
   * @param {RigidBody} body
   */
  addRigidBody(body) {
    this.bodies.push(body);

  }


  /**
   * Steps the physics forward by `dt` seconds.
   * @param { number } dtS
   */
  physicsStep(dtS) {
    this.#initPhysics();
    const numSteps = 4;
    for (let i = 0; i < numSteps; i++) {
      this.#physicsStep(dtS / numSteps);
    }
  }

  static littleG = new Vector(0, -9.81);

  #initPhysics() {
    for (const body of this.bodies) {
      body.resetPhysics();
      if (body.canMove) {
        body.addForce(Physics.littleG);
        const v = body.netImpulseNS.clone();
        v.scale(1 / body.massKg);
        body.velocityMps.add(v);
        const a = body.netForceN.clone();
        a.scale(1 / body.massKg);
        body.accelerationMps2.set(a);
      }
    }
  }

  /**
   * Checks for collisions of all moving bodies vs. all other bodies.  Creates a map of the
   * moving body to the collision bounding box
   * TODO: Improve this with a quad tree of the static bodies.
   */
  #checkCollisions() {
    const collisionMap = new Map();
    for (const body of this.bodies) {
      if (!body.canMove) continue;
      for (const other of this.bodies) {
        if (body === other) continue;
        const intersection = body.rect.intersection(other.rect);
        if (intersection) {
          if (collisionMap.has(body)) {
            const existing = collisionMap.get(body);
            const sbb = existing.sbb(intersection);
            collisionMap.set(body, sbb);
          } else {
            collisionMap.set(body, intersection);
          }
        }
      }
    }
    return collisionMap;
  }


  /**
   * 
   * @param {number} dtS 
   */
  #physicsStep(dtS) {
    for (const body of this.bodies) {
      if (body.canMove) {
        body.velocityMps.addScaled(body.accelerationMps2, dtS);
        body.rect.addScaled(body.velocityMps, dtS);
      }
    }

    const collisionMap = this.#checkCollisions();

    for (const [body, rect] of collisionMap) {
      if (body.canMove) {
        // Ideally we want to use the smaller of the two
        // 1) the velocity applied in this step
        // 2) the minimum translation vector to move body.rect out of `rect`
        body.rect.addScaled(body.velocityMps, -dtS);
      }
    }
  }
}