// @ts-check

import { ShaderRenderer } from "./shader-renderer.js";

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shader-container');
  if (container) {
    new ShaderRenderer(container);
  }
});