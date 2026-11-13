/** Compare trends only within a runner class; the Mac absolute gate has separate evidence. */
export function assertComparable(baseline, current) {
  if (baseline.mode !== 'ci-trend' || current.mode !== 'ci-trend')
    throw new Error('CI needs a CI baseline, not an absolute Mac reference.');
  for (const key of ['platform', 'architecture', 'model', 'logicalCpus'])
    if (baseline.machine[key] !== current.machine[key])
      throw new Error(`Baseline runner mismatch: ${key}`);
  if (
    baseline.machine.node.split('.')[0] !== current.machine.node.split('.')[0]
  )
    throw new Error('Baseline Node major differs.');
}
