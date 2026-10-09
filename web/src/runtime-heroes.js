// Keep the complete provenance ledger in heroes.json, but do not ship research
// URLs and historical response scripts to every player's browser.
const runtimeFields = ['name', 'aliases', 'image', 'audio', 'quote', 'classic', 'originalImage', 'originalSilhouette', 'archiveImage', 'historicalLineVerified'];
export function runtimeHeroes(heroes) {
  const runtime = {};
  for (const id in heroes) {
    runtime[id] = {};
    for (const field of runtimeFields) {
      if (Object.hasOwn(heroes[id], field)) runtime[id][field] = heroes[id][field];
    }
  }
  return runtime;
}
