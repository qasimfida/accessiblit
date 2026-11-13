import { parseArgs } from 'node:util';
import { createSiteServer } from './site/serve.mjs';

const { values } = parseArgs({
  options: { port: { type: 'string', default: '4174' } },
});
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid preview port.');
const server = createSiteServer();
server.listen(port, '127.0.0.1', () =>
  console.log(`Site: http://127.0.0.1:${port}/accessiblit/`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => server.close());
