import { euclideanDistance, averageEmbeddings } from './facial';

describe('euclideanDistance', () => {
  it('returns 0 for identical vectors', () => {
    expect(euclideanDistance([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it('computes the euclidean distance between vectors', () => {
    // sqrt((3-0)^2 + (4-0)^2) = 5
    expect(euclideanDistance([3, 4], [0, 0])).toBeCloseTo(5, 5);
  });

  it('returns a large value when lengths differ (no match possible)', () => {
    expect(euclideanDistance([1, 2], [1, 2, 3])).toBeGreaterThan(1e6);
  });

  it('separates same-person from different-person scale', () => {
    // Same person (small distance) vs stranger (large distance)
    const same = euclideanDistance([0.1, 0.2, 0.3], [0.12, 0.19, 0.31]);
    const stranger = euclideanDistance([0.1, 0.2, 0.3], [0.9, 0.8, 0.7]);
    expect(same).toBeLessThan(0.6);
    expect(stranger).toBeGreaterThan(0.6);
  });
});

describe('averageEmbeddings', () => {
  it('averages element-wise', () => {
    expect(averageEmbeddings([[1, 3], [3, 5]])).toEqual([2, 4]);
  });

  it('returns an empty array for no inputs', () => {
    expect(averageEmbeddings([])).toEqual([]);
  });
});
