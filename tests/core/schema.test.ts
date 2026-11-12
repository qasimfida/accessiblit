import { describe, expect, it } from 'vitest';
import {
  createState,
  DEFAULT_STATE,
  FEATURE_IDS,
  isFeatureId,
  isFeatureValue,
  isRecord,
} from '../../src/core/schema';

describe('feature schema', () => {
  it('has 18 valid independent defaults', () => {
    expect(FEATURE_IDS).toHaveLength(18);
    for (const id of FEATURE_IDS) {
      expect(isFeatureId(id)).toBe(true);
      expect(isFeatureValue(id, DEFAULT_STATE[id])).toBe(true);
    }
    expect(createState()).not.toBe(createState());
    expect(createState({ fontSize: 120, darkMode: true })).toMatchObject({
      fontSize: 120,
      darkMode: true,
    });
    expect(createState({ fontSize: 400 })).toEqual(DEFAULT_STATE);
  });
  it.each([null, 1, '__proto__', 'constructor', 'missing'])(
    'rejects unknown id %s',
    (value) => {
      expect(isFeatureId(value)).toBe(false);
    },
  );
  it.each(['fontSize', 'contentScale'] as const)(
    'validates bounded steps for %s',
    (id) => {
      for (const invalid of ['100', null, NaN, Infinity, 0, 210, 105])
        expect(isFeatureValue(id, invalid)).toBe(false);
      expect(isFeatureValue(id, 200)).toBe(true);
      expect(isFeatureValue(id, 80)).toBe(id === 'fontSize');
    },
  );
  it('rejects invalid discrete and boolean values', () => {
    expect(isFeatureValue('textAlign', 'justify')).toBe(false);
    expect(isFeatureValue('darkMode', 1)).toBe(false);
  });
  it('accepts only plain records', () => {
    for (const input of [null, [], new Date(), 0, ''])
      expect(isRecord(input)).toBe(false);
    expect(isRecord({})).toBe(true);
    expect(isRecord(Object.create(null))).toBe(true);
  });
});

it('retains boolean cursor preferences while adding the second size', () => {
  for (const value of [false, true, 2])
    expect(isFeatureValue('bigCursor', value)).toBe(true);
  for (const value of [0, 1, 3, '2'])
    expect(isFeatureValue('bigCursor', value)).toBe(false);
  expect(createState({ bigCursor: true }).bigCursor).toBe(true);
  expect(createState({ bigCursor: 2 }).bigCursor).toBe(2);
});
