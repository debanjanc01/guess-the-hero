import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const heroes = JSON.parse(readFileSync(resolve(root, 'src/data/heroes.json')));
let files = 0;
let bytes = 0;
for (const id in heroes) {
  const hero = heroes[id];
  for (const field of ['image', 'audio', 'originalImage', 'originalSilhouette', 'archiveImage']) {
    if (!hero[field]) {
      if (field === 'image' || field === 'audio') throw Error(`Missing ${field}: ${id}`);
      continue;
    }
    const path = resolve(root, 'public', hero[field]);
    if (!existsSync(path) || statSync(path).size < 100) throw Error(`Missing / empty asset: ${path}`);
    const data = readFileSync(path);
    if (field !== 'audio' && data.toString('ascii', 8, 12) !== 'WEBP') throw Error(`Invalid WebP: ${path}`);
    if (field === 'audio' && !(data.toString('ascii', 0, 3) === 'ID3' || data[0] === 255)) throw Error(`Invalid MP3: ${path}`);
    files++; bytes += data.length;
  }
  if (hero.classic && !hero.historicalLineVerified) throw Error(`Unverified classic voice: ${id}`);
}
const ledger = JSON.parse(readFileSync(resolve(root, 'research/asset-checksums.json')));
for (const relativePath in ledger) {
  const data = readFileSync(resolve(root, 'public', relativePath));
  const actual = createHash('sha256').update(data).digest('hex');
  if (actual !== ledger[relativePath].sha256 || data.length !== ledger[relativePath].bytes) throw Error(`Checksum mismatch: ${relativePath}`);
}
console.log(`Verified ${Object.keys(heroes).length} heroes, ${files} referenced assets, ${(bytes / 1e6).toFixed(2)} MB; ${Object.keys(ledger).length} checksums matched.`);
console.log(`Roster SHA-256: ${createHash('sha256').update(readFileSync(resolve(root, 'src/data/heroes.json'))).digest('hex')}`);
