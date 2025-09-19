// @ts-check

import { ShaderRenderer } from "./shader-renderer.js";

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shader-container');
  const textureSource = document.getElementById('texture-source');

  if (container && textureSource) {
    new ShaderRenderer(container, textureSource);
  }
});