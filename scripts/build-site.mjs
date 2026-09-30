import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const site = new URL('_site/', root)

// Deploy only the reviewed public assets, never the repository or build inputs.
const assets = [
  'index.html',
  'navigation.mjs',
  'assets/brand.css',
  'assets/xweather-scalar.css',
  'weather-api.yaml',
  'weather-api-3.1.yaml',
  'LICENSE',
]

await rm(site, { recursive: true, force: true })
await mkdir(site, { recursive: true })
for (const name of assets) {
  const target = new URL(name, site)
  await mkdir(dirname(fileURLToPath(target)), { recursive: true })
  await copyFile(new URL(name, root), target)
}
await writeFile(new URL('.nojekyll', site), '')
console.log(`Prepared ${assets.length} public assets in _site/`)
