import {
  readFile, readdir, mkdir, writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';

export const SITE = { org: 'matuma', repo: 'eds' };
export const CONTENT_ORIGIN = `https://content.da.live/${SITE.org}/${SITE.repo}`;
export const PREVIEW_ORIGIN = `https://main--${SITE.repo}--${SITE.org}.aem.page`;
export const ROOT = path.resolve(import.meta.dirname, '..');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.filter((entry) => !entry.name.startsWith('.'))
    .map((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(file) : [file];
    }));
  return groups.flat().sort();
}

export function parseContent(html) {
  return parseHTML(`<html><head></head><body><header></header><main>${html}</main><footer></footer></body></html>`).document;
}

export function toDA(html) {
  const document = parseContent(html);
  document.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src.startsWith('/media/')) img.setAttribute('src', `${CONTENT_ORIGIN}${src}`);
    else if (!/^https:\/\//.test(src)) throw new Error(`Image needs a public URL: ${src}`);
  });
  document.querySelectorAll('a[href^="/"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.startsWith('//')) throw new Error('Protocol-relative links are not supported.');
    a.setAttribute('href', `${PREVIEW_ORIGIN}${href}`);
  });
  // DA's preview generates its own responsive pictures.
  document.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    if (img) picture.replaceWith(img);
  });
  return document.body.outerHTML;
}

export async function collectContent(directory = path.join(ROOT, 'content')) {
  const files = await walk(directory);
  const documents = [];
  const media = [];
  for (const file of files) {
    const relative = path.relative(directory, file).split(path.sep).join('/');
    if (relative.endsWith('.plain.html')) {
      const html = await readFile(file, 'utf8');
      const document = parseContent(html);
      if (document.querySelector('script, style, [style], [onclick]')) {
        throw new Error(`${relative}: content cannot contain scripts or inline styles.`);
      }
      for (const block of document.querySelectorAll('main > div > div[class]')) {
        const [name] = block.classList;
        if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
          throw new Error(`${relative}: invalid block name.`);
        }
        if ([...block.children].some((row) => row.children.length > 4)) {
          throw new Error(`${relative}: more than four cells in a block row.`);
        }
        if (!['metadata', 'section-metadata'].includes(name)) {
          await readFile(path.join(ROOT, 'blocks', name, `${name}.js`));
        }
      }
      const remote = relative.replace(/\.plain\.html$/, '.html');
      documents.push({
        remote, mime: 'text/html', data: Buffer.from(toDA(html)), html,
      });
    } else if (relative.startsWith('media/')) {
      const types = {
        '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
      };
      const mime = types[path.extname(file)];
      if (!mime) throw new Error(`Unsupported media file: ${relative}`);
      const data = await readFile(file);
      const limit = mime === 'image/svg+xml' ? 40 * 1024 : 20 * 1024 * 1024;
      if (data.length > limit) throw new Error(`${relative}: exceeds the EDS media size limit.`);
      media.push({ remote: relative, mime, data });
    }
  }
  const available = new Set(media.map((file) => `/${file.remote}`));
  for (const doc of documents) {
    for (const img of parseContent(doc.html).querySelectorAll('img[src^="/media/"]')) {
      if (!available.has(img.getAttribute('src'))) throw new Error(`Missing image in ${doc.remote}: ${img.getAttribute('src')}`);
    }
  }
  // Upload assets first, then shared documents, then pages.
  documents.sort((a, b) => Number(!['nav.html', 'footer.html'].includes(a.remote))
    - Number(!['nav.html', 'footer.html'].includes(b.remote)) || a.remote.localeCompare(b.remote));
  return [...media, ...documents];
}

export function previewPath(remote) {
  return `/${remote.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')}`;
}

export async function exportContent(files, directory) {
  for (const file of files) {
    const target = path.join(directory, file.remote);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.data);
  }
}

export async function uploadContent(files, {
  token, replace = false, backupDirectory, request = fetch,
}) {
  const auth = { Authorization: `Bearer ${token}` };
  const base = `https://admin.da.live/source/${SITE.org}/${SITE.repo}/`;
  const pending = [];
  // Inspect every target before making any change. Never overwrite a new remote edit blindly.
  for (const file of files) {
    const response = await request(base + file.remote, { headers: auth });
    if (response.status !== 404 && !response.ok) throw new Error(`Read ${file.remote}: HTTP ${response.status}. Check your DA login.`);
    const existing = response.ok ? Buffer.from(await response.arrayBuffer()) : null;
    if (!existing?.equals(file.data)) {
      if (existing && !replace) throw new Error(`${file.remote} already exists. Use --replace to back it up and replace it.`);
      pending.push({ ...file, existing });
    }
  }
  // All backups must be written successfully before the first upload.
  for (const file of pending.filter((item) => item.existing)) {
    const target = path.join(backupDirectory, file.remote);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.existing);
  }
  for (const file of pending) {
    // Recheck the source after backup: authors may be editing concurrently.
    const current = await request(base + file.remote, { headers: auth });
    const unchanged = file.existing
      ? current.ok && Buffer.from(await current.arrayBuffer()).equals(file.existing)
      : current.status === 404;
    if (!unchanged) throw new Error(`${file.remote} changed during upload preparation. Rerun to review and back up the latest version.`);
    const body = new FormData();
    body.append('data', new Blob([file.data], { type: file.mime }), path.posix.basename(file.remote));
    const response = await request(base + file.remote, { method: 'PUT', headers: auth, body });
    if (!response.ok) throw new Error(`Upload ${file.remote}: HTTP ${response.status}. Some earlier files may have been uploaded.`);
    const verification = await request(base + file.remote, { headers: auth });
    if (!verification.ok || !Buffer.from(await verification.arrayBuffer()).equals(file.data)) {
      throw new Error(`Read-back verification failed for ${file.remote}. Stop and inspect it in DA.`);
    }
  }
  return pending.map((file) => file.remote);
}
