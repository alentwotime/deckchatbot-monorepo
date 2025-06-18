const computeMovingAverage = require('../utils/movingAverage');

describe('computeMovingAverage', () => {
  test('computes average with window 2', () => {
    expect(computeMovingAverage([1, 2, 3, 4, 5], 2)).toEqual([1.5, 2.5, 3.5, 4.5]);
  });

  test('handles window equal to array length', () => {
    expect(computeMovingAverage([10, 20, 30], 3)).toEqual([20]);
  });

  test('throws on invalid input', () => {
    expect(() => computeMovingAverage([], 1)).toThrow(Error);
  });
});
