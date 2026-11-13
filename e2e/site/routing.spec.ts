import { expect, test } from '@playwright/test';

test('built routes and custom 404 work only beneath the project base', async ({
  page,
  request,
}) => {
  for (const route of ['', 'install/', 'options/', 'faq/', '404.html']) {
    const response = await page.goto(route || './');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(
      page.getByRole('button', {
        name: 'Open accessibility options',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator('[data-accessiblit-host]')).toHaveCount(1);
  }
  expect((await page.goto('missing/deep/'))?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('page');
  expect(
    (await request.get('/accessiblit/%2F..%2Fpackage.json')).status(),
  ).toBe(403);
  expect((await request.get('/package.json')).status()).toBe(404);
});
