import { readFile, mkdir, copyFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  ROOT, SITE, collectContent, exportContent, previewPath, uploadContent,
} from './da-content.mjs';

const [command = 'check', ...flags] = process.argv.slice(2);
const tokenPath = path.join(ROOT, '.local', 'da-token.json');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

async function getToken() {
  if (process.env.DA_TOKEN) return process.env.DA_TOKEN;
  const candidates = [tokenPath, path.join(ROOT, '.hlx', '.da-token.json'), path.join(homedir(), '.aem', 'da-token.json')];
  for (const file of candidates) {
    try {
      const cached = JSON.parse(await readFile(file, 'utf8'));
      if (cached.access_token && Number(cached.expires_at) > Date.now() + 60000) return cached.access_token;
    } catch { /* Try the next standard token cache. */ }
  }
  throw new Error('No valid DA token. Run npm run content:login and sign in to Adobe in the browser.');
}

async function main() {
  if (command === 'login') {
    // Clone into an isolated directory; keep the project's authored content untouched.
    const cwd = path.join(ROOT, '.local', 'da-sessions', stamp());
    await mkdir(cwd, { recursive: true });
    const cli = path.join(ROOT, 'node_modules', '@adobe', 'aem-cli', 'index.js');
    console.log('Sign in to Adobe in the browser. The existing DA content will be downloaded as a separate copy.');
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [cli, 'content', 'clone', '--org', SITE.org, '--site', SITE.repo, '--path', '/'], { cwd, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`Adobe CLI exited with ${code}`))));
    });
    await copyFile(path.join(cwd, '.hlx', '.da-token.json'), tokenPath);
    console.log('Login complete. Token cached locally; original content saved in', cwd);
    return;
  }
  if (!['check', 'export', 'upload', 'preview', 'publish'].includes(command)) throw new Error(`Unknown command: ${command}`);
  const branchFlag = flags.find((flag) => flag.startsWith('--branch='));
  const branch = branchFlag?.slice('--branch='.length) || 'main';
  if (!/^[a-z0-9][a-z0-9-]*$/.test(branch)) throw new Error('Branch must use lowercase letters, numbers and hyphens.');
  const onlyFlag = flags.find((flag) => flag.startsWith('--only='));
  const only = onlyFlag?.slice('--only='.length);
  const known = new Set(['--write', '--replace', branchFlag, onlyFlag]);
  if (flags.some((flag) => !known.has(flag))) throw new Error('Unknown option. Use --write, --replace, --branch=NAME or --only=PAGE.');
  let files = await collectContent();
  if (only) {
    files = files.filter((file) => file.remote === `${only}.html`);
    if (!files.length) throw new Error(`No document: ${only}`);
  }
  if (command === 'check') {
    console.log(`Valid content: ${files.filter((file) => file.mime === 'text/html').length} documents, ${files.filter((file) => file.mime !== 'text/html').length} assets.`);
    return;
  }
  if (command === 'export') {
    const directory = path.join(ROOT, '.local', 'da-export');
    await exportContent(files, directory);
    console.log('DA body fragments and media exported to', directory);
    return;
  }
  const selected = command === 'upload' ? files : files.filter((file) => file.mime === 'text/html');
  for (const file of selected) {
    console.log(command === 'upload'
      ? `PUT https://admin.da.live/source/${SITE.org}/${SITE.repo}/${file.remote}`
      : `POST https://admin.hlx.page/${command === 'publish' ? 'live' : 'preview'}/${SITE.org}/${SITE.repo}/${branch}${previewPath(file.remote)}`);
  }
  if (!flags.includes('--write')) {
    console.log('Plan only. No network calls or changes. Add --write to execute.');
    return;
  }
  const token = await getToken();
  if (command === 'upload') {
    const backupDirectory = path.join(ROOT, '.local', 'da-backups', stamp());
    const changed = await uploadContent(selected, { token, replace: flags.includes('--replace'), backupDirectory });
    console.log(`Uploaded and verified ${changed.length} files. Existing versions backed up under ${backupDirectory}`);
    console.log('Next: npm run content:preview -- --write');
  } else {
    for (const file of selected) {
      const url = `https://admin.hlx.page/${command === 'publish' ? 'live' : 'preview'}/${SITE.org}/${SITE.repo}/${branch}${previewPath(file.remote)}`;
      const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`${command} ${file.remote}: HTTP ${response.status}. Inspect this document in DA before retrying.`);
      console.log(`OK ${file.remote}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
