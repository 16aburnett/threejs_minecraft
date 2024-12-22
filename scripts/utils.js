// THREE.js Minecraft - Useful utility functions
// By Amy Burnett
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


