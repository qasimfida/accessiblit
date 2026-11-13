import { spawnSync } from 'node:child_process';
/** Framework telemetry is disabled for every isolated build and server. */
export const exampleEnv = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
/** Each consumer runs its own installed binaries instead of repository aliases. */
export function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env: exampleEnv,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(' ')} failed (${result.status})`);
}
