import assert from 'node:assert/strict';
import test from 'node:test';
import { regression, summarize } from '../../scripts/perf/statistics.mjs';

test('median and nearest-rank p95 preserve the original unsorted samples', () => {
  const samples = Array.from({ length: 30 }, (_, i) => 30 - i);
  const original = [...samples];
  assert.deepEqual(summarize(samples), { medianMs: 15.5, p95Ms: 29 });
  assert.deepEqual(samples, original);
});
test('rejects incomplete, extra, nonfinite and negative measurements', () => {
  for (const samples of [[], Array(29).fill(1), Array(31).fill(1)])
    assert.throws(() => summarize(samples));
  for (const invalid of [NaN, Infinity, -1])
    assert.throws(() => summarize([...Array(29).fill(1), invalid]));
});
test('50 percent is inclusive and any greater regression fails', () => {
  assert.deepEqual(regression(15, 10), { limitMs: 15, pass: true });
  assert.equal(regression(15.0001, 10).pass, false);
  for (const invalid of [0, -1, NaN, Infinity])
    assert.throws(() => regression(1, invalid));
});
