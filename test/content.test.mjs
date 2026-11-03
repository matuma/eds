import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  collectContent, parseContent, previewPath, toDA, uploadContent,
} from '../tools/da-content.mjs';

test('exported documents have valid assets, blocks and navigable local links', async () => {
  const files = await collectContent();
  assert.equal(files.filter((file) => file.mime === 'text/html').length, 8);
  const docs = new Map(files.filter((file) => file.html)
    .map((file) => [previewPath(file.remote), parseContent(file.html)]));
  for (const [route, document] of docs) {
    for (const link of document.querySelectorAll('a[href^="/"]')) {
      const url = new URL(link.getAttribute('href'), 'https://example.test');
      const target = docs.get(url.pathname);
      assert.ok(target, `${route}: broken page link ${url.pathname}`);
      if (url.hash) {
        const anchor = url.hash.slice(1);
        const anchors = [...target.querySelectorAll('.section-metadata > div')].filter((row) => row.firstElementChild?.textContent === 'Anchor').map((row) => row.lastElementChild?.textContent);
        assert.ok(anchors.includes(anchor), `Missing anchor: ${url.href}`);
      }
    }
  }
});

test('DA export wraps the body and converts image and link URLs without code', () => {
  const result = toDA('<div><p><a href="/work">Work</a></p><picture><img src="/media/test.svg" alt=""></picture></div>');
  assert.ok(result.startsWith('<body>'));
  assert.match(result, /src="https:\/\/content.da.live\/matuma\/eds\/media\/test.svg"/);
  assert.match(result, /href="https:\/\/main--eds--matuma.aem.page\/work"/);
  assert.doesNotMatch(result, /<picture|<head>|<script/);
  assert.throws(() => toDA('<div><img src="../secret.png"></div>'), /public URL/);
  assert.equal(previewPath('index.html'), '/');
  assert.equal(previewPath('work.html'), '/work');
});

test('existing content and auth failures abort before any writes', async () => {
  const methods = [];
  const files = [{ remote: 'index.html', mime: 'text/html', data: Buffer.from('new') }];
  await assert.rejects(uploadContent(files, {
    token: 'test',
    request: async (url, init) => {
      methods.push(init.method || 'GET');
      return new Response('old');
    },
  }), /already exists/);
  assert.deepEqual(methods, ['GET']);
  await assert.rejects(uploadContent(files, { token: 'test', request: async () => new Response(null, { status: 401 }) }), /HTTP 401/);
});

test('replacement backs up old bytes and verifies multipart upload', async () => {
  const backupDirectory = await mkdtemp(path.join(tmpdir(), 'eds-content-test-'));
  let remote = Buffer.from('old document');
  let putCount = 0;
  const files = [{ remote: 'index.html', mime: 'text/html', data: Buffer.from('new document') }];
  await uploadContent(files, {
    token: 'test',
    replace: true,
    backupDirectory,
    request: async (url, init) => {
      if (init.method === 'PUT') {
        assert.equal(await readFile(path.join(backupDirectory, 'index.html'), 'utf8'), 'old document');
        assert.equal(init.body.get('data').type, 'text/html');
        remote = Buffer.from(await init.body.get('data').arrayBuffer());
        putCount += 1;
        return new Response('{}', { status: 201 });
      }
      return new Response(remote);
    },
  });
  assert.equal(putCount, 1);
  assert.equal(remote.toString(), 'new document');
});

test('an author edit after preflight prevents overwrite', async () => {
  const backupDirectory = await mkdtemp(path.join(tmpdir(), 'eds-content-race-'));
  let requests = 0;
  await assert.rejects(uploadContent([{ remote: 'index.html', data: Buffer.from('ours') }], {
    token: 'test',
    replace: true,
    backupDirectory,
    request: async (url, init) => {
      assert.notEqual(init.method, 'PUT');
      requests += 1;
      return new Response(requests === 1 ? 'before' : 'edited by author');
    },
  }), /changed during/);
});
