import { describe, expect, it } from 'vitest';
import {
  calculateScaledAplusSize,
  getAplusRiskMessage,
  getCharacterCount,
  moveItem,
  normalizeRating
} from './listingUtils';

describe('listing utilities', () => {
  it('moves uploaded images without mutating the original list', () => {
    const original = ['main', 'side', 'detail'];

    const moved = moveItem(original, 2, -1);

    expect(moved).toEqual(['main', 'detail', 'side']);
    expect(original).toEqual(['main', 'side', 'detail']);
  });

  it('keeps move requests inside list bounds', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });

  it('counts visible listing copy characters after trimming whitespace', () => {
    expect(getCharacterCount('  Powerful descaling  ')).toBe(18);
  });

  it('calculates mobile A+ display height from the original aspect ratio', () => {
    expect(calculateScaledAplusSize(1464, 600, 390)).toEqual({
      width: 390,
      height: 160
    });
  });

  it('flags 1464 by 600 A+ modules as small-copy review risks on mobile', () => {
    expect(getAplusRiskMessage(1464, 600, 390)).toBe('请检查图中文字是否过小');
  });

  it('normalizes star ratings into the supported Amazon-style range', () => {
    expect(normalizeRating('6.2')).toBe(5);
    expect(normalizeRating('-1')).toBe(0);
    expect(normalizeRating('4.56')).toBe(4.6);
  });
});
