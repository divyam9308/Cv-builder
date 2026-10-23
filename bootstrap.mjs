/**
 * One-time local unpacker for the tested Folio source package.
 * This fallback works even when GitHub Actions is disabled.
 * No network calls, third-party packages, account setup or API key.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const expectedHash = '28560e13e28c05bcbe39821d0b38a546b9285a06f24a74a880ecc02c612db9f6';
const entry = path.join(root, 'server', 'index.js');
if (!fs.existsSync(entry)) {
  const dir = path.join(root, 'payload');
  const parts = fs.readdirSync(dir).filter(x => /^part-\d{3}\.txt$/.test(x)).sort();
  if (parts.length !== 8) throw new Error('Incomplete Folio source package: expected eight verified parts.');
  const encoded = parts.map(x => fs.readFileSync(path.join(dir,x), 'utf8')).join('');
  const archiveBytes = Buffer.from(encoded, 'base64');
  const actualHash = crypto.createHash('sha256').update(archiveBytes).digest('hex');
  if (actualHash !== expectedHash) throw new Error('Source package verification failed. No files were extracted.');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'folio-unpack-'));
  try {
    const archive = path.join(tmp, 'source.tar.xz');
    fs.writeFileSync(archive, archiveBytes);
    const untar = spawnSync('tar', ['-xJf', archive, '-C', root], {stdio:'inherit'});
    if (untar.error || untar.status !== 0) throw new Error('Could not unpack source. Ensure tar with xz support is installed.');
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
  for (const file of ['public/app.js','public/styles.css','server/index.js','server/gemini.js']) { const override=path.join(root,'overrides',file); if (fs.existsSync(override)) fs.copyFileSync(override,path.join(root,file)); }\n  console.log('Folio source integrity verified and unpacked locally.');
}
if (!process.argv.includes('--prepare')) {
  const child = spawnSync(process.execPath, [entry], {cwd:root,stdio:'inherit',env:process.env});
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
}
