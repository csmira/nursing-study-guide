// Builds public/data/pharmacology.json (the combined "Pharmacology" bank) by merging every
// topic bank listed in public/data/categories.json whose id starts with "pharmacology-".
// Run after editing any topic bank: `npm run build:banks`
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const readJson = (p) => JSON.parse(readFileSync(join(publicDir, p), 'utf8'))

const { categories } = readJson('data/categories.json')
const combined = categories.find((c) => c.id === 'pharmacology')
if (!combined) throw new Error('No "pharmacology" category in categories.json')

const items = []
const seen = new Set()
for (const c of categories.filter((c) => c.id.startsWith('pharmacology-'))) {
  for (const item of readJson(c.bankUrl).items) {
    if (seen.has(item.id)) throw new Error(`Duplicate item id ${item.id} (in ${c.bankUrl})`)
    seen.add(item.id)
    items.push({ ...item, topic: item.topic ? `${c.name.replace(/^Pharmacology - /, '')}: ${item.topic}` : c.name })
  }
}

writeFileSync(join(publicDir, combined.bankUrl), JSON.stringify({ categoryId: 'pharmacology', items }, null, 2) + '\n')
const size = items.reduce((n, i) => n + (i.type === 'case-study' ? i.stages.length : 1), 0)
console.log(`Wrote ${combined.bankUrl}: ${items.length} items, ${size} questions`)
