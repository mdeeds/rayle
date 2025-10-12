// @ts-check

/**
 * Renders a shader onto a canvas within a container element.
 */
export class ShaderRenderer {
  /**
   * @param {HTMLElement} containerDiv The element to contain the canvas.
   */
  constructor(containerDiv) {
    /** @type {HTMLElement} */
    this.containerDiv = containerDiv;
    /** @type {HTMLCanvasElement} */
    this.canvas = document.createElement('canvas');
    this.containerDiv.appendChild(this.canvas);
    /** @type {WebGLRenderingContext | null} */
    this.gl = this.canvas.getContext('webgl2');
    if (!this.gl) {
      console.error('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    /** @type {number} */
    this.rayleSize = 0.0;
    /** @type {number} */
    this.x = 0.0;

    /** @type {WebGLProgram | null} */
    this.program = null;
    /** @type {WebGLTexture | null} */
    this.texture = null;

    this.initialize();
  }

  async initialize() {
    this.initWebGL();
    // await this.initTexture();
    this.resizeCanvas();
    this.render();
    this.initKeyboard();
  }

  initKeyboard() {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case '1':
          this.rayleSize = -2.0;
          break;
        case '2':
          this.rayleSize = -1.0;
          break;
        case '3':
          this.rayleSize = 0.0;
          break;
        case '4':
          this.rayleSize = 1.0;
          break;
        case '5':
          this.rayleSize = 2.0;
          break;
      }
    });
  }

  /**
   * Initializes the WebGL context, shaders, and program.
   */
  initWebGL() {
    if (!this.gl) return;

    const vsSource = `#version 300 es
        precision mediump float;
        in vec4 aPosition;
        uniform vec2 uResolutionPixels;
        uniform vec2 uScreenSizeMeters;
        uniform vec2 uScreenCenterMeters;

        out highp vec2 v_worldPositionMeters;
        void main(void) {
            gl_Position = aPosition;
            v_worldPositionMeters = aPosition.xy * uScreenSizeMeters + uScreenCenterMeters;
        }
    `;

    const fsSource = `#version 300 es
        precision mediump float;

        in highp vec2 v_worldPositionMeters;
        out vec4 outColor;

        void main(void) {
          float c = length(v_worldPositionMeters);
          outColor = vec4(vec3(c, 0.0, 1.0), 1.0);
        }
        `;

    const shaderProgram = this.initShaderProgram(vsSource, fsSource);
    if (!shaderProgram) {
      throw new Error('Unable to initialize the shader program.');
    }
    this.program = shaderProgram;

    this.gl.useProgram(this.program);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
      1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      -1.0, -1.0,
    ];

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    const aPosition = this.gl.getAttribLocation(this.program, 'aPosition');
    this.gl.vertexAttribPointer(aPosition, 2, this.gl.
      FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(aPosition);
  }

  /**
   * Initialize a shader program, so WebGL knows how to draw our data
   * @param {string} vsSource
   * @param {string} fsSource
   * @returns {WebGLProgram | null}
   */
  initShaderProgram(vsSource, fsSource) {
    if (!this.gl) return null;

    const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    // Create the shader program
    const shaderProgram = this.gl.createProgram();
    if (!shaderProgram) {
      return null;
    }
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    this.gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  /**
   * Creates a shader of the given type, uploads the source and compiles it.
   * @param {number} type
   * @param {string} source
   * @returns {WebGLShader | null}
   */
  loadShader(type, source) {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) {
      return null;
    }

    // Send the source to the shader object
    this.gl.shaderSource(shader, source);

    // Compile the shader program
    this.gl.compileShader(shader);

    // See if it compiled successfully
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  resizeCanvas() {
    if (!this.gl) return;
    this.canvas.width = this.containerDiv.clientWidth;
    this.canvas.height = this.containerDiv.clientHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    if (!this.gl || !this.program) return;

    // Set uniforms
    const uResolutionPixelsLocation = this.gl.getUniformLocation(this.program, 'uResolutionPixels');
    this.gl.uniform2f(uResolutionPixelsLocation, this.canvas.width, this.canvas.height);

    const uScreenCenterMetersLocation = this.gl.getUniformLocation(this.program, 'uScreenCenterMeters');
    this.gl.uniform2f(uScreenCenterMetersLocation, 0.0, 0.0);

    // Calculate screen height in meters to maintain aspect ratio
    const screenWidthMeters = 10.0;
    const aspect = this.canvas.height / this.canvas.width;
    const screenHeightMeters = screenWidthMeters * aspect;

    const uScreenSizeMetersLocation = this.gl.getUniformLocation(this.program, 'uScreenSizeMeters');
    this.gl.uniform2f(uScreenSizeMetersLocation, screenWidthMeters, screenHeightMeters);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(this.render.bind(this));
  }

  /**
   * Creates a checkerboard pattern on a canvas and loads it as a WebGL texture.
   */
  async initTexture() {
    if (!this.gl || !this.program) {
      throw new Error('WebGL context or program not initialized.');
    }

    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    // Fill the texture with a 1x1 blue pixel while waiting for the image to load
    const level = 0;
    const internalFormat = this.gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const loadImage = (/** @type {string} */ src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const image = await loadImage('background.png');

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    const uSampler = this.gl.getUniformLocation(this.program, 'uSampler');
    this.gl.uniform1i(uSampler, 0);
  }
}
