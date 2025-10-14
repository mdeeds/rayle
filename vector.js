//@ts-check

export class Vector {
  /** @type {number} */
  x;
  /** @type {number} */
  y;

  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  /**
   * 
   * @param {Vector} other 
   */
  set(other) {
    this.x = other.x;
    this.y = other.y;
  }

  /**
   * Calculates the magnitude (length) of the vector.
   * @returns {number}
   */
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Calculates the squared magnitude of the vector.
   * @returns {number}
   */
  norm2() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Modifies the vector to be a unit vector (length 1).
   */
  normalize() {
    const norm = this.norm();
    if (norm === 0) {
      return;
    }
    this.x /= norm;
    this.y /= norm;
  }

  /**
   * Adds another vector to this vector.
   * @param {Vector} other The vector to add.
   */
  add(other) {
    this.x += other.x;
    this.y += other.y;
  }

  /**
   * 
   * @param {Vector} other 
   * @param {number} scale 
   */
  addScaled(other, scale) {
    this.x += other.x * scale;
    this.y += other.y * scale;
  }

  /**
   * Subtracts another vector from this vector.
   * @param {Vector} other The vector to subtract.
   */
  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
  }

  /**
   * Scales this vector by a scalar value.
   * @param {number} scalar The value to scale by.
   */
  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
  }

  /**
   * Calculates the dot product of this vector and another.
   * @param {Vector} other The other vector.
   * @returns {number}
   */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Returns the 2D cross product (magnitude of the 3D cross product's Z component).
   * @param {Vector} other The other vector.
   * @returns {number}
   */
  cross(other) {
    return this.x * other.y - this.y * other.x;
  }
}