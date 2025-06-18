/**
 * Compute the moving average of an array of numbers using a sliding window.
 * @param {number[]} arr - The input array of numbers.
 * @param {number} window - The size of the moving window.
 * @returns {number[]} Array of averaged values.
 * @throws {Error} If `arr` is not an array of numbers or `window` is invalid.
 */
function computeMovingAverage(arr, window) {
  if (!Array.isArray(arr) || arr.some(n => typeof n !== 'number' || Number.isNaN(n))) {
    throw new Error('arr must be an array of numbers');
  }
  if (!Number.isInteger(window) || window <= 0 || window > arr.length) {
    throw new Error('window must be a positive integer less than or equal to arr.length');
  }

  const result = [];
  let sum = 0;
  for (let i = 0; i < window; i++) {
    sum += arr[i];
  }
  result.push(sum / window);

  for (let i = window; i < arr.length; i++) {
    sum += arr[i] - arr[i - window];
    result.push(sum / window);
  }

  return result;
}

module.exports = computeMovingAverage;
