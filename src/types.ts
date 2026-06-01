/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Slide {
  id: number;
  title: string;
  subtitle: string;
  blobType: 'clay' | 'chrome' | 'energy' | 'pearl';
  accentColor: string;
  buttonText: string;
}

export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  baseAlpha: number;
}
