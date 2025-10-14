// @ts-check

import { RayleBody } from "./rayle-body.js";
import { Rectangle } from "./rectangle.js";
import { ShaderRenderer } from "./shader-renderer.js";
import { Vector } from "./vector.js";
import { Physics } from "./physics.js";
import { RigidBody } from "./rigid-body.js";

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shader-container');
  if (!container) {
    throw new Error('Shader container not found.');
  }
  const sr = new ShaderRenderer(container);
  /** @type {RayleBody} */
  const rayle = new RayleBody();
  rayle.setScale(0);
  rayle.setPosition(new Vector(0, 0));


  const physics = new Physics();

  sr.addPill(rayle.body.rect);
  physics.addRigidBody(rayle.body);

  const floorRect = new Rectangle(-15, 15, -9.5, -10);
  const floorBody = new RigidBody(floorRect);
  sr.addRectangle(floorRect);
  physics.addRigidBody(floorBody);

  document.addEventListener('keydown', (event) => {
    // Handle all instances of Rayle identically.
    if (event.code === 'Space') {
      if (rayle.body.grounded) {
        rayle.body.velocityMps.y = rayle.jumpVelocityMps;
      }
      rayle.body.velocityMps.y += rayle.flapVelocityMps;
    } else if (event.code === 'KeyA') {
      if (rayle.body.grounded) {
        rayle.body.velocityMps.x = -rayle.topSpeedMps;
      }
    } else if (event.code === 'KeyD') {
      if (rayle.body.grounded) {
        rayle.body.velocityMps.x = rayle.topSpeedMps;
      }
    }
  });

  document.addEventListener('keyup', (event) => {
    if (rayle && (event.code === 'KeyA' || event.code === 'KeyD')) {
      rayle.body.velocityMps.x = 0;
    }
  })

  const renderLoop = () => {
    sr.render();
    const dt = 1 / 60 * rayle.timeScale;
    physics.physicsStep(dt);
    sr.time += dt;
    rayle.setScale(0.3 * rayle.body.rect.center().x);
    sr.screenWidthMeters = rayle.heightM * 15;
    requestAnimationFrame(renderLoop);
  }

  renderLoop();
});