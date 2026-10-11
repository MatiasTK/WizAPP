import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '../../..')
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')

type Tree = { [key: string]: string | Tree }

const flatten = (tree: Tree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flatten(value, `${prefix}${key}.`)
  )

const en = flatten(JSON.parse(read('resources/locales/en/translation.json')))
const es = flatten(JSON.parse(read('resources/locales/es/translation.json')))

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'bindings' ? [] : sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) && !path.includes('/test/')
      ? [path]
      : []
  })

const source = [
  ...sourceFiles(join(ROOT, 'src/renderer/src')),
  ...sourceFiles(join(ROOT, 'src/renderer/utils'))
]
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

// Keys that only Rust uses (tray menu and the toasts it emits).
const RUST_KEYS = [
  /^tray\./,
  /^toast\.(discoveryFailed|updateAvailable|configImported|configReset|legacyInstallFound)$/,
  /^scenes\.names\./
]
// Keys built at runtime from a known prefix.
const DYNAMIC_PREFIXES = ['scenes.names.', 'information.columns.', 'toast.error.', 'scenes.tags.']

const base = (key: string) => key.replace(/_(one|other)$/, '')

describe('translations', () => {
  it('have exactly the same keys in English and Spanish', () => {
    expect([...es].sort()).toEqual([...en].sort())
  })

  it('define every key the code uses', () => {
    const used = new Set<string>()
    for (const match of source.matchAll(/['"`]([a-z]\w*(?:\.\w+)+)['"`]/g)) used.add(match[1])

    const defined = new Set(en.map(base))
    const namespaces = new Set(en.map((k) => k.split('.')[0]))
    const missing = [...used].filter(
      (key) =>
        namespaces.has(key.split('.')[0]) &&
        !defined.has(key) &&
        // `bulb.add` style references to objects, not leaf keys.
        !en.some((k) => k.startsWith(`${key}.`))
    )
    expect(missing).toEqual([])
  })

  it('have no key that nothing uses', () => {
    const unused = en.map(base).filter((key) => {
      if (RUST_KEYS.some((re) => re.test(key))) return false
      if (DYNAMIC_PREFIXES.some((p) => key.startsWith(p))) return false
      return (
        !source.includes(`'${key}'`) &&
        !source.includes(`"${key}"`) &&
        !source.includes(`\`${key}\``)
      )
    })
    expect([...new Set(unused)]).toEqual([])
  })

  it('does not use voseo or the word "foco" in Spanish', () => {
    const text = read('resources/locales/es/translation.json')
    expect(text).not.toMatch(/\bfoco(s)?\b/i)
    expect(text).not.toMatch(/\b(tenés|querés|podés|elegí|agregá|buscá|fijate|sos)\b/i)
  })
})
