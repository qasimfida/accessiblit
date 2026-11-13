/** Preserve API/source evidence without visual observers competing with timed renderer work. */
export const PERFORMANCE_TRACE = {
  mode: 'on',
  screenshots: false,
  snapshots: false,
  sources: true,
} as const;
