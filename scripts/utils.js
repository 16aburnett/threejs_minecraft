// THREE.js Minecraft - Useful utility functions
// By Amy Burnett
// =======================================================================
// Import

import * as THREE from 'three';

// =======================================================================

/**
 * Uses a simple linear conversion calculation to convert a value from
 * one range to another.
 * @param {*} value
 * @param {*} srcRangeStart
 * @param {*} srcRangeEnd
 * @param {*} destRangeStart
 * @param {*} destRangeEnd
 */
export function convertRange (
    value,
    srcRangeStart,
    srcRangeEnd,
    destRangeStart,
    destRangeEnd
)
{
    const srcRange = srcRangeEnd - srcRangeStart;
    const destRange = destRangeEnd - destRangeStart;
    const destValue = ((value - srcRangeStart) * destRange) / srcRange
        + destRangeStart;
    return destValue;
}

// =======================================================================

/**
 * Linearly interpolates between two given values by the given amount.
 * @param {Number} start - start point of the range to interpolate
 * @param {Number} end - end point of the range to interpolate
 * @param {Number} progress - the interpolation percent (between 0-1)
 * @returns The interpolated value
 */
export function lerp (start, end, progress)
{
    return Math.round ((end - start) * progress + start);
}

// =======================================================================

/**
 * Pythagorean theorem without the square root.
 * Square roots can be slow so this can be used where the
 * squared value is good enough, like checking if a point is within
 * a radius squared.
 * r^2 > (x2 - x1)^2 + (y2 - y1)^2
 * @param {*} x1 
 * @param {*} y1 
 * @param {*} x2 
 * @param {*} y2 
 * @returns 
 */
export function distanceSquared (x1, y1, x2, y2)
{
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

// =======================================================================

/**
 * Returns a random vector within a cone facing upwards
 * @param {*} coneAngleDegrees 
 * @returns 
 */
export function generateRandomVectorWithinCone (maxConeAngleDegrees)
{
    // Random angle to rotate around Y
    const angleY = Math.random () * 2 * Math.PI;

    // Random angle within the cone that deviates from straight up
    const angleZ = Math.random () * maxConeAngleDegrees;

    // Convert polar to cartesian
    const x = Math.sin (angleY) * Math.cos (angleZ);
    const y = Math.sin (angleY) * Math.sin (angleZ);
    const z = Math.cos (angleY);

    return new THREE.Vector3 (x, y, z);
}
