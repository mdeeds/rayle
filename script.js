// @ts-check

import { RayleBody } from "./rayle-body.js";
import { Rectangle } from "./rectangle.js";
import { ShaderRenderer } from "./shader-renderer.js";
import { Vector } from "./vector.js";
import { Physics } from "./physics.js";
import { RigidBody } from "./rigid-body.js";

/**
 * 
 * @param {Rectangle} rect 
 * @param {ShaderRenderer} sr 
 * @param {Physics} physics 
 */
function addRectangle(rect, sr, physics) {
  const body = new RigidBody(rect);
  sr.addRectangle(rect);
  physics.addRigidBody(body);
}


document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shader-container');
  if (!container) {
    throw new Error('Shader container not found.');
  }
  const sr = new ShaderRenderer(container);
  /** @type {RayleBody} */
  const rayle = new RayleBody();
  rayle.setScale(0);
  rayle.setPosition(new Vector(0, -8));


  const physics = new Physics();

  sr.addPill(rayle.body.rect);
  physics.addRigidBody(rayle.body);

  addRectangle(new Rectangle(-50, 50, -9.5, -10), sr, physics);
  addRectangle(new Rectangle(-15, -14, 10, -10), sr, physics);

  const keysDown = new Set();

  document.addEventListener('keydown', (event) => {
    keysDown.add(event.code);
  });

  document.addEventListener('keyup', (event) => {
    keysDown.delete(event.code);
  });

  let nextFlap = 0;

  const renderLoop = () => {
    sr.render();
    const dt = 1 / 60 * rayle.timeScale;
    physics.physicsStep(dt);
    sr.time += dt;
    rayle.setScale(0.3 * rayle.body.rect.center().x);
    sr.screenCenterMeters.x = rayle.body.rect.center().x;
    sr.screenCenterMeters.y = rayle.body.rect.top;
    sr.screenWidthMeters = rayle.heightM * 15;

    if (rayle.body.grounded) {
      if (keysDown.has('KeyA')) {
        rayle.body.velocityMps.x = -rayle.topSpeedMps;
      } else if (keysDown.has('KeyD')) {
        rayle.body.velocityMps.x = rayle.topSpeedMps;
      } else {
        rayle.body.velocityMps.x = 0;
      }
    }
    if (keysDown.has('Space')) {
      if (sr.time > nextFlap) {
        nextFlap = sr.time + 0.5;
        rayle.body.velocityMps.y += rayle.flapVelocityMps;
      }
      if (rayle.body.grounded) {
        rayle.body.velocityMps.y = rayle.jumpVelocityMps;
      }
    }

    requestAnimationFrame(renderLoop);
  }

  renderLoop();
});