const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const pages = ['/', '/services', '/work', '/about', '/insights', '/contact'];

async function ready(page, path = '/') {
  await page.goto(path);
  await page.locator('footer .footer[data-block-status="loaded"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [375, 768, 1440]) {
  test(`homepage layout and accessibility at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    await page.locator('img').evaluateAll(async (images) => {
      images.forEach((img) => { img.loading = 'eager'; });
      await Promise.all(images.map((img) => img.decode().catch(() => {})));
    });
    await expect(page.locator('h1')).toHaveText('AEM Solution Architect');
    await expect(page.locator('main .block')).toHaveCount(9);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((img) => !img.naturalWidth).map((img) => img.src));
    expect(brokenImages).toEqual([]);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `.local/home-${width}.png`, fullPage: true });
  });
}

test('mobile navigation opens, closes on Escape, returns focus and resets at desktop', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  const toggle = page.getByRole('button', { name: /navigation/ });
  const links = page.locator('.nav-links');
  await expect(links).toBeHidden();
  await toggle.click();
  await expect(links).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(links).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(links).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(links).toBeHidden();
  await toggle.click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator('h1')).toHaveText('How can I help?');
});

test('all overview pages load, have metadata, no overflow and no broken internal targets', async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of pages) {
    await ready(page, path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    const links = await page.locator('a').evaluateAll((anchors) => [...new Set(anchors.map((anchor) => anchor.getAttribute('href')).filter((href) => href?.startsWith('/')))]);
    for (const href of links) {
      const response = await request.get(href.split('#')[0]);
      expect(response.ok(), href).toBeTruthy();
    }
  }
  expect(errors).toEqual([]);
});

test('authored anchors land on the correct overview section', async ({ page }) => {
  await ready(page, '/services#performance-cdn-caching');
  await expect(page.locator('#performance-cdn-caching')).toBeVisible();
  const top = await page.locator('#performance-cdn-caching').evaluate((element) => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
  await ready(page, '/insights#structured-data-aem');
  await expect(page.locator('#structured-data-aem h2')).toContainText('Structured data');
});

test('blocks tolerate omitted cells, empty rows and additional content', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  const result = await page.evaluate(async () => {
    const names = ['hero', 'stats', 'section-intro', 'services', 'selected-work', 'profile', 'insights', 'contact'];
    const retained = [];
    for (const name of names) {
      const { default: decorate } = await import(`/blocks/${name}/${name}.js`);
      const empty = document.createElement('div');
      empty.className = `${name} intro`;
      await decorate(empty);
      const block = document.createElement('div');
      block.className = `${name} intro`;
      block.innerHTML = '<div><div><h2>Only a heading</h2></div></div><div></div><div><div></div><div><p>Additional author content</p></div></div>';
      await decorate(block);
      retained.push(block.textContent.includes('Additional author content'));
    }
    return retained;
  });
  expect(result.every(Boolean)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('DA export survives Adobe conversion and renders the authored homepage', async ({ page }) => {
  const { collectContent, ROOT, CONTENT_ORIGIN } = await import('../tools/da-content.mjs');
  // The CLI is pinned: use its real html2md + EDS pipeline to check the content handoff.
  const { renderContentHtml } = await import('@adobe/aem-cli/src/content/content-html-pipeline.js');
  const files = await collectContent();
  const headHtml = await readFile(join(ROOT, 'head.html'), 'utf8');
  for (const [remote, urlPath] of [['index.html', '/'], ['nav.html', '/nav.plain.html'], ['footer.html', '/footer.plain.html']]) {
    const file = files.find((entry) => entry.remote === remote);
    const body = await renderContentHtml(file.data.toString(), {
      path: urlPath, org: 'matuma', site: 'eds', headHtml,
    });
    expect(body).toBeTruthy();
    await page.route(`http://localhost:3000${urlPath}`, (route) => route.fulfill({ contentType: 'text/html', body }));
  }
  // Assets are not uploaded during tests. Serve the exact export bytes at their future DA URLs.
  await page.route(`${CONTENT_ORIGIN}/media/**`, async (route) => {
    const remote = route.request().url().slice(CONTENT_ORIGIN.length + 1).split('?')[0];
    const file = files.find((entry) => entry.remote === remote);
    expect(file, remote).toBeTruthy();
    await route.fulfill({ contentType: file.mime, body: file.data });
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await expect(page).toHaveTitle('AEM Solution Architect | Maciej Matuszewski');
  await expect(page.locator('main .block')).toHaveCount(9);
  await expect(page.locator('#work')).toHaveClass(/dark/);
  await expect(page.locator('#home .hero')).toHaveClass(/intro/);
  await expect(page.locator('.nav-links a')).toHaveCount(6);
  await expect(page.locator('.insights article')).toHaveCount(5);
  await page.locator('img').evaluateAll(async (images) => {
    images.forEach((img) => { img.loading = 'eager'; });
    await Promise.all(images.map((img) => img.decode()));
  });
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: '.local/home-pipeline.png', fullPage: true });
});
