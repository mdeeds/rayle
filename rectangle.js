// @ts-check

import { Vector } from "./vector.js";

export class Rectangle {
  /** @type {number} */
  left;
  /** @type {number} */
  right;
  /** @type {number} */
  top;
  /** @type {number} */
  bottom;

  /**
   * @param {number} left
   * @param {number} right
   * @param {number} top
   * @param {number} bottom
   */
  constructor(left, right, top, bottom) {
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
  }

  /**
   * Finds the intersection with `other` and returns the intersecting
   * rectangle or null if there is no intersection.
   * @param {Rectangle} other The other rectangle to intersect with.
   * @returns {Rectangle | null}
   */
  intersection(other) {
    const left = Math.max(this.left, other.left);
    const right = Math.min(this.right, other.right);
    const top = Math.min(this.top, other.top);
    const bottom = Math.max(this.bottom, other.bottom);
    if (left < right && bottom < top) {
      return new Rectangle(left, right, top, bottom);
    }
    return null;
  }

  /**
   * Returns the smallest bounding box containing both `this` and `other`.
   * @param {Rectangle} other The other rectangle to include in the bounding box.
   * @returns {Rectangle}
   */
  sbb(other) {
    const left = Math.min(this.left, other.left);
    const right = Math.max(this.right, other.right);
    const top = Math.max(this.top, other.top);
    const bottom = Math.min(this.bottom, other.bottom);
    return new Rectangle(left, right, top, bottom);
  }

  /**
   * 
   * @param {Vector} displacement 
   */
  add(displacement) {
    this.left += displacement.x;
    this.right += displacement.x;
    this.top += displacement.y;
    this.bottom += displacement.y;
  }

  /**
   * 
   * @param {Vector} displacement 
   * @param {number} scale 
   */
  addScaled(displacement, scale) {
    this.left += displacement.x * scale;
    this.right += displacement.x * scale;
    this.top += displacement.y * scale;
    this.bottom += displacement.y * scale;
  }

  center() {
    return new Vector((this.left + this.right) / 2, (this.bottom + this.top) / 2);
  }

  /**
   * 
   * @param {Rectangle} other 
   */
  isBelow(other) {
    const d = other.center();
    d.sub(this.center());
    return (d.y < 0) && (Math.abs(d.y) > Math.abs(d.x));
  }
}