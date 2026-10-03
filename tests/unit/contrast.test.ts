import { describe, it, expect } from 'vitest';

// Helper functions for WCAG relative luminance and contrast ratio
function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  return [r, g, b];
}

function getLuminance([r, g, b]: [number, number, number]): number {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Design Tokens Contrast Verification (WCAG 2.2 AA)', () => {
  const TOKENS = {
    ivory: '#F6F2E9',
    paper: '#FBF8F1',
    ink: '#14201A',
    inkSoft: '#4A554E',
    sage: '#A9B8A3',
    sageInk: '#445942',
    coral: '#B84A35',
    coralDeep: '#9E3D2B',
  };

  it('ink on ivory meets WCAG AAA (> 7:1)', () => {
    const ratio = getContrastRatio(TOKENS.ink, TOKENS.ivory);
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });

  it('ink on paper meets WCAG AAA (> 7:1)', () => {
    const ratio = getContrastRatio(TOKENS.ink, TOKENS.paper);
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });

  it('ink-soft on ivory meets WCAG AA (> 4.5:1)', () => {
    const ratio = getContrastRatio(TOKENS.inkSoft, TOKENS.ivory);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('sage-ink on ivory meets WCAG AA (> 4.5:1)', () => {
    const ratio = getContrastRatio(TOKENS.sageInk, TOKENS.ivory);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('coral on ivory meets WCAG AA (> 4.5:1)', () => {
    const ratio = getContrastRatio(TOKENS.coral, TOKENS.ivory);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('ivory text on primary ink button meets WCAG AAA (> 7:1)', () => {
    const ratio = getContrastRatio(TOKENS.ivory, TOKENS.ink);
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });
});
