// @ts-check

/**
 * Renders a shader onto a canvas within a container element.
 */
export class ShaderRenderer {
  /**
   * @param {HTMLElement} containerDiv The element to contain the canvas.
   * @param {HTMLElement} textureDiv The element to use as a texture (not yet implemented).
   */
  constructor(containerDiv, textureDiv) {
    /** @type {HTMLElement} */
    this.containerDiv = containerDiv;
    /** @type {HTMLElement} */
    this.textureDiv = textureDiv;
    /** @type {HTMLCanvasElement} */
    this.canvas = document.createElement('canvas');
    this.containerDiv.appendChild(this.canvas);
    /** @type {WebGLRenderingContext | null} */
    this.gl = this.canvas.getContext('webgl');

    this.rayleSize = 0.0;
    this.x = 0.0;

    if (!this.gl) {
      console.error('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    /** @type {WebGLProgram | null} */
    this.program = null;
    /** @type {WebGLTexture | null} */
    this.texture = null;

    this.initialize();
  }

  async initialize() {
    this.initWebGL();
    await this.initTexture();
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

    const vsSource = `
            attribute highp vec4 aPosition;
            varying highp vec2 vTextureCoord;
            void main(void) {
                gl_Position = aPosition;
                vTextureCoord = (aPosition.xy + vec2(1.0, 0.0)) / 2.0 * vec2(1.0, -1.0);
            }
        `;

    const fsSource = `
            precision highp float;

            varying highp vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform vec2 uOffset;
            uniform float uScale;
            void main(void) {
                gl_FragColor = texture2D(uSampler, (uScale * vTextureCoord) + uOffset);
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

    // Set offset and scale uniforms
    const velocity = 0.0003 * Math.pow(1.5, -this.rayleSize);
    const dt = Math.pow(2, this.rayleSize);
    const scale = 0.05 * Math.pow(2.0, this.rayleSize);
    this.x += velocity * dt;

    const scaleLocation = this.gl.getUniformLocation(this.program, 'uScale');
    this.gl.uniform1f(scaleLocation, scale);

    const offsetLocation = this.gl.getUniformLocation(this.program, 'uOffset');
    this.gl.uniform2f(offsetLocation, this.x, 0.2);


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
