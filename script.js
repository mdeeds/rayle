// @ts-check

import { RayleBody } from "./rayle-body.js";
import { ShaderRenderer } from "./shader-renderer.js";
import { Vector } from "./vector.js";

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shader-container');
  if (!container) {
    throw new Error('Shader container not found.');
  }
  const sr = new ShaderRenderer(container);
  const rayles = [];

  const p = new Vector(-5, 0);
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

  for (const rayle of rayles) {
    sr.addPill(rayle.body.rect);
  }

});