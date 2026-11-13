import assert from 'node:assert/strict';
import test from 'node:test';
import { assertComparable } from '../../scripts/perf/baseline.mjs';

const reference = {
  mode: 'ci-trend',
  machine: {
    platform: 'darwin',
    architecture: 'arm64',
    model: 'virtual',
    logicalCpus: 3,
    node: 'v20.20.0',
  },
};
test('CI accepts its runner class and Node major across patch updates', () => {
  const current = globalThis.structuredClone(reference);
  current.machine.node = 'v20.21.0';
  assert.doesNotThrow(() => assertComparable(reference, current));
});
test('rejects Mac absolute baselines and different runner classes', () => {
  for (const key of [
    'platform',
    'architecture',
    'model',
    'logicalCpus',
    'node',
  ]) {
    const current = globalThis.structuredClone(reference);
    current.machine[key] = key === 'node' ? 'v22.0.0' : 'different';
    assert.throws(() => assertComparable(reference, current));
  }
  assert.throws(() =>
    assertComparable({ ...reference, mode: 'macos-reference' }, reference),
  );
});
