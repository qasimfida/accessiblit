import { Worker } from 'node:worker_threads';
import { setTimeout, clearTimeout } from 'node:timers';
/** A renderer sandbox cannot leave its browser scheduler's MessagePorts in the CLI process. */
export function reactCompatibility(folder) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./compat-worker.mjs', import.meta.url), {
      workerData: { folder },
      execArgv: [],
    });
    let finished = false;
    const timeout = setTimeout(() => {
      finished = true;
      void worker.terminate();
      reject(new Error('React compatibility checks exceeded two minutes'));
    }, 120000);
    worker.once('message', async (rows) => {
      finished = true;
      clearTimeout(timeout);
      await worker.terminate();
      resolve(rows);
    });
    worker.once('error', (error) => {
      finished = true;
      clearTimeout(timeout);
      reject(error);
    });
    worker.once('exit', (code) => {
      if (!finished) {
        clearTimeout(timeout);
        reject(
          new Error(`Compatibility worker exited without results (${code})`),
        );
      }
    });
  });
}
