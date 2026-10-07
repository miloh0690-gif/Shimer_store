import { describe, expect, it } from 'vitest';
import { bobToCents, centsToBob, formatBob } from '../src/money.js';

describe('money', () => {
  it('convierte Bs. a cents enteros sin coma flotante', () => {
    expect(bobToCents(8.5)).toBe(850);
    expect(bobToCents(549)).toBe(54900);
    expect(bobToCents(24.5)).toBe(2450);
  });

  it('formatea con Bs., miles con coma y 2 decimales con punto', () => {
    expect(formatBob(54900)).toBe('Bs. 549.00');
    expect(formatBob(850)).toBe('Bs. 8.50');
    expect(formatBob(123456)).toBe('Bs. 1,234.56');
  });

  it('vuelve de cents a Bs.', () => {
    expect(centsToBob(54900)).toBe(549);
  });
});