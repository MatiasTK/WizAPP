// Builds latest.json (the updater feed) for a locally signed build, to upload by hand
// next to the installer in a GitHub release.
//
//   npm run build            (with TAURI_SIGNING_PRIVATE_KEY set)
//   node scripts/make-latest-json.mjs
//
// GitHub turns spaces in uploaded file names into dots, so the URL uses that form.
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version
const dir = path.join(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis')

const setup = fs.readdirSync(dir).find((f) => f.includes(`_${version}_`) && f.endsWith('-setup.exe'))
if (!setup) throw new Error(`No ${version} installer in ${dir}. Run the build first.`)
const sigPath = path.join(dir, `${setup}.sig`)
if (!fs.existsSync(sigPath)) {
  throw new Error(`${setup}.sig is missing: build with TAURI_SIGNING_PRIVATE_KEY set.`)
}

const asset = setup.replaceAll(' ', '.')
const feed = {
  version,
  notes: `WiZ APP ${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: fs.readFileSync(sigPath, 'utf8').trim(),
      url: `https://github.com/MatiasTK/WizAPP/releases/download/v${version}/${asset}`
    }
  }
}

const out = path.join(dir, 'latest.json')
fs.writeFileSync(out, JSON.stringify(feed, null, 2) + '\n')
console.log(`Wrote ${out}\nUpload these to the release v${version}:\n  ${setup}\n  latest.json`)
