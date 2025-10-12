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
    this.time = 0.0;

    /** @type {number} */
    this.rayleSize = 0.0;
    /** @type {number} */
    this.x = 0.0;

    /** @type {number} */
    this.uDistanceToScreenMeters = 10.0;
    /** @type {number} */
    this.uDistanceToBackgroundMeters = 30.0;
    /** @type {number} */
    this.uBackgroundWidthMeters = 100.0;

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

    const vsSource = `#version 300 es
        precision mediump float;
        in vec4 aPosition;
        uniform vec2 uResolutionPixels;
        uniform vec2 uScreenSizeMeters;
        uniform vec2 uScreenCenterMeters;

        out vec2 v_worldPositionMeters;
        void main(void) {
            gl_Position = aPosition;
            v_worldPositionMeters = aPosition.xy * 0.5 * uScreenSizeMeters + uScreenCenterMeters;
        }
    `;

    const fsSource = `#version 300 es

#define SOFT_ALIAS_METERS 0.01

precision mediump float;

in vec2 v_worldPositionMeters;
out vec4 outColor;

uniform float uTimeSeconds;
uniform float uPixelsPerMeter;
uniform float uDistanceToScreenMeters;
uniform float uDistanceToBackgroundMeters;
uniform float uBackgroundWidthMeters;
uniform sampler2D uSampler;

////////////////// START NOISE ////////////////

vec3 s(in vec3 x) {
  return vec3(sin(3.0 * x.x), sin(3.0 * x.y), sin(3.0 * x.z));
}

vec3 h_mul(in vec3 x, in float h) {
  return s(x * h);
}

vec3 h_add(in vec3 x, in vec3 h) {
  return s(x + h);
}

vec3 op(in vec3 carrier, in vec3 osc, in float level) {
  return h_add(carrier, level * osc);
}

mat2 rotate2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    // The matrix constructor is column-major:
    // mat2(column0_x, column0_y, column1_x, column1_y)
    return mat2(
        c,   s,  // First column
        -s,  c   // Second column
    );
}

vec3 blah_rot(in vec3 a, in vec3 b) {
  vec2 xy = rotate2d(b.x) * vec2(a.yz);
  vec2 yz = rotate2d(b.y) * vec2(a.zx);
  vec2 zx = rotate2d(b.z) * vec2(a.xy);

  return vec3(xy.x + yz.y, yz.x + zx.y, zx.x + xy.y);
}
 
vec3 csc(in vec3 a) {
   return 1.414 * vec3(length(vec2(a.y, a.x)), 
        length(vec2(a.z, a.y)), 
        length(vec2(a.x, a.z))) - 0.707;
}

vec3 tri(in vec2 pos) {
  mat2 r30 = rotate2d(3.14 / 3.0);
  vec2 a = r30 * pos;
  vec2 b = r30 * a;
  vec3 t = vec3(pos.x, a.x, b.x);
  return t;
}

////////////////// END NOISE ////////////////

/// START GEOMETRY ///

// Returns a value > 0 if p is on one side of the line ab, < 0 if on the other.
float side(vec2 p, vec2 a, vec2 b) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

float triangle(vec2 p, vec2 a, vec2 b, vec2 c) {
  float s1 = side(p, a, b);
  float s2 = side(p, b, c);
  float s3 = side(p, c, a);
  // The point is inside if the signs of all three side checks are the same.
  // (s1 > 0. && s2 > 0. && s3 > 0.) || (s1 < 0. && s2 < 0. && s3 < 0.)
  // We can check this by seeing if the minimum is positive or the maximum is negative.
  return min(s1, min(s2, s3));
}

float softTriangle(vec2 p, vec2 a, vec2 b, vec2 c) {
  float aliasing = SOFT_ALIAS_METERS; // Meters
  return smoothstep(-aliasing, aliasing, triangle(p, a, b, c));
}

float hardTriangle(vec2 p, vec2 a, vec2 b, vec2 c) {
  float aliasing = 2.0 / uPixelsPerMeter;
  return smoothstep(-aliasing, aliasing, triangle(p, a, b, c));
}

float pill(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  // Project p onto the line of ab, but clamp the projection to the segment ab
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  // Calculate the distance from p to the closest point on the segment
  float d = length(pa - ba * h);
  // Return a positive value if the distance is less than the radius
  return r - d;
}

float softPill(vec2 p, vec2 a, vec2 b, float r) {
  float aliasing = SOFT_ALIAS_METERS; // Meters
  return smoothstep(-aliasing, aliasing, pill(p, a, b, r));
}

float hardPill(vec2 p, vec2 a, vec2 b, float r) {
  float aliasing = 1.0 / uPixelsPerMeter;
  return smoothstep(-aliasing, aliasing, pill(p, a, b, r));
}

vec2 getDistortedPosition(vec2 pos) {
  vec3 t = tri(pos.xy * 0.01 - vec2(0.0, uTimeSeconds * 0.03));
  vec3 a = blah_rot(h_mul(t, 2.51), h_mul(t, 3.1));
  vec3 b = blah_rot(h_mul(t, 2.7), h_mul(t, 0.23));
  t = op(a, b, 0.1);
  t = csc(t);
  t = op(b, t, 0.2);
  t = csc(t);
  t = op(a, t, 1.1);
  t = csc(t);
  return pos + t.xy * 0.5 * SOFT_ALIAS_METERS;
}

/// END GEOMETRY ///

/// START TEXTURES ///

vec3 tex(vec2 pos) {
  vec3 t = tri(pos.xy);
  vec3 a = blah_rot(h_mul(t, 2.51), h_mul(t, 3.1));
  vec3 b = blah_rot(h_mul(t, 2.7), h_mul(t, 0.23));
  t = op(a, b, 0.1);
  t = csc(t);
  t = op(b, t, 0.2);
  t = csc(t);
  t = op(a, t, 1.1);
  t = csc(t);
  return t;
}

vec3 stone(vec2 pos) {
  vec3 result = vec3(0.0);

  vec3 t = tri(pos.xy);
  result += tex(t.xy * 0.64) / 11.0;
  result += tex(t.xy * 0.32) / 9.0;
  result += tex(t.xy * 0.16) / 7.0;
  result += tex(pos * 0.08) / 5.0;
  result += tex(pos * 0.04) / 3.0;
  result += tex(pos * 0.02);
  return 0.8 + (result + length(result)) * 0.04;
}

/// END TEXTURES ///

float embers(vec2 pos) {
  float ce = 0.0;
  ce = max(ce, softPill(pos, vec2(0.0, 0.5), vec2(0.0, 1.0), 0.5));
  ce = max(ce, softTriangle(pos, vec2(5.0, 0.0), vec2(-5.0, 0.0), vec2(0.0, -2.0)));
  return ce * 0.7;
}

void main(void) {
  // Calculate background color with parallax
  // This simulates the background being further away than the screen plane.
  // As the camera moves (represented by uScreenCenterMeters), the background
  // will appear to move slower than the foreground.
  float parallaxFactor = uDistanceToScreenMeters / uDistanceToBackgroundMeters;
  float backgroundHeightMeters = uBackgroundWidthMeters;
  
  // Calculate the texture coordinates for the background
  vec2 background_uv = v_worldPositionMeters * parallaxFactor;
  background_uv.x /= uBackgroundWidthMeters;
  background_uv.y /= backgroundHeightMeters;
  vec4 backgroundColor = texture(uSampler, background_uv);

  vec2 po = v_worldPositionMeters;
  vec2 pe = getDistortedPosition(v_worldPositionMeters);

  float co = hardPill(po, vec2(0.0, 0.5), vec2(0.0, 1.0), 0.5);
  co = max(co, hardTriangle(po, vec2(5.0, 0.0), vec2(-5.0, 0.0), vec2(0.0, -2.0)));
  float ce = embers(pe);

  vec4 stoneColor = vec4(stone(v_worldPositionMeters), 1.0);
  vec4 emberColor = vec4(1.0, 0.8, 0.0, 1.0);
  outColor = backgroundColor;
  outColor = mix(outColor, emberColor, ce);
  outColor = mix(outColor, stoneColor, co);
  
  // outColor = mix(emberColor, stoneColor, co);
  // outColor = vec4(stoneColor);
  // outColor = vec4(emberColor);
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
      const sourceWithLines = source.split('\n').map((line, index) => {
        return `${index + 1}: ${line}`;
      }).join('\n');
      console.error(sourceWithLines);
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

    const uTimeSecondsLocation = this.gl.getUniformLocation(this.program, 'uTimeSeconds');
    this.gl.uniform1f(uTimeSecondsLocation, this.time);

    // Calculate screen height in meters to maintain aspect ratio
    const screenWidthMeters = 10.0;
    const aspect = this.canvas.height / this.canvas.width;
    const screenHeightMeters = screenWidthMeters * aspect;

    const uScreenSizeMetersLocation = this.gl.getUniformLocation(this.program, 'uScreenSizeMeters');
    this.gl.uniform2f(uScreenSizeMetersLocation, screenWidthMeters, screenHeightMeters);

    const uPixelsPerMeterLocation = this.gl.getUniformLocation(this.program, 'uPixelsPerMeter');
    this.gl.uniform1f(uPixelsPerMeterLocation, this.canvas.width / screenWidthMeters);

    const uDistanceToScreenMetersLocation = this.gl.getUniformLocation(this.program, 'uDistanceToScreenMeters');
    this.gl.uniform1f(uDistanceToScreenMetersLocation, this.uDistanceToScreenMeters);

    const uDistanceToBackgroundMetersLocation = this.gl.getUniformLocation(this.program, 'uDistanceToBackgroundMeters');
    this.gl.uniform1f(uDistanceToBackgroundMetersLocation, this.uDistanceToBackgroundMeters);

    const uBackgroundWidthMetersLocation = this.gl.getUniformLocation(this.program, 'uBackgroundWidthMeters');
    this.gl.uniform1f(uBackgroundWidthMetersLocation, this.uBackgroundWidthMeters);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.time += 0.01;  // TODO: Make this smarter.

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
