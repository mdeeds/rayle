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
  /** @type {RayleBody[]} */
  const rayles = [];

  const minX = -10;
  const p = new Vector(minX, 0);
  let previousWidth = 0.0;
  for (let i = -3; i <= 3; i++) {
    const rayle = new RayleBody();
    rayle.setScale(i);
    p.add(new Vector(previousWidth, 0));
    rayle.setPosition(p);
    rayles.push(rayle);
    p.add(new Vector(rayle.width, 0));
    previousWidth = rayle.width;
  }



  const physics = new Physics();

  for (const rayle of rayles) {
    sr.addPill(rayle.body.rect);
    physics.addRigidBody(rayle.body);
  }

  const floorRect = new Rectangle(minX - 1.0, p.x + 1.0, -9.7, -10);
  const floorBody = new RigidBody(floorRect);
  sr.addRectangle(floorRect);
  physics.addRigidBody(floorBody);

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      for (const rayle of rayles) {
        if (rayle.body.grounded) {
          rayle.body.velocityMps.y = rayle.jumpVelocityMps;
        }
      }
    }
  });

  const renderLoop = () => {
    sr.render();
    const dt = 1 / 60;
    physics.physicsStep(dt);
    sr.time += dt;
    requestAnimationFrame(renderLoop);
  }

  renderLoop();
});