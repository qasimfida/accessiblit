import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { sampleContentFrames } from './frame-probe';

test('parser shells are empty until their first correctly scaled text frame', async ({
  page,
  baseURL,
}, info) => {
  const html = await readFile('site/dist/index.html', 'utf8');
  const cut = html.indexOf('A clear page');
  expect(cut).toBeGreaterThan(0);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const server = createServer(async (request, response) => {
    if (request.url === '/accessiblit/') {
      response.setHeader('Content-Type', 'text/html');
      response.write(html.slice(0, cut));
      await gate;
      response.end(html.slice(cut));
    } else {
      const upstream = await fetch(new URL(request.url!, baseURL));
      response.writeHead(upstream.status, {
        'Content-Type':
          upstream.headers.get('content-type') ?? 'application/octet-stream',
      });
      response.end(Buffer.from(await upstream.arrayBuffer()));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await page.addInitScript(() => {
      localStorage.setItem(
        'accessiblit:v1',
        JSON.stringify({ version: 1, state: { fontSize: 120 } }),
      );
    });
    await page.addInitScript(sampleContentFrames);
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing test server address');
    await page.goto(`http://127.0.0.1:${address.port}/accessiblit/`, {
      waitUntil: 'commit',
    });
    await page.waitForFunction(
      () => Reflect.get(window, 'siteEmptyFrames') >= 2,
    );
    const shell = await page
      .locator('.demo-copy p')
      .first()
      .evaluate((element) => ({
        text: element.textContent?.trim(),
        fontSize: parseFloat(getComputedStyle(element).fontSize),
        sampled: Reflect.get(window, 'siteFirstFrames') as number[],
      }));
    expect(shell).toEqual({ text: '', fontSize: 16, sampled: [] });
    release();
    await page.waitForFunction(
      () => Reflect.get(window, 'siteFirstFrames').length >= 5,
    );
    const frames = await page.evaluate(
      () => Reflect.get(window, 'siteFirstFrames') as number[],
    );
    for (const frame of frames) expect(frame).toBeCloseTo(19.2, 1);
    console.log(
      'SITE_STREAMED_FRAME',
      JSON.stringify({ project: info.project.name, shell, frames }),
    );
  } finally {
    release();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
