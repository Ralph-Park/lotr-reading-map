// 데이터 정합성 검사: npm run validate
import { readFileSync } from 'node:fs'

const load = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
const chapters = load('chapters.json')
const locations = load('locations.json')
const characters = load('characters.json')
const regions = load('regions.json')

const locIds = new Set(locations.map((l) => l.id))
const charIds = new Set(characters.map((c) => c.id))
const errors = []
const warn = []
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|30)$/

const expected = { 1: 12, 2: 10, 3: 11, 4: 10, 5: 10, 6: 9 }
for (const [b, n] of Object.entries(expected)) {
  const got = chapters.filter((c) => c.book === Number(b)).length
  if (got !== n) errors.push(`Book ${b}: 챕터 ${got}개 (예상 ${n}개)`)
}
if (chapters.length !== 62) errors.push(`전체 챕터 ${chapters.length}개 (예상 62개)`)

const seen = new Set()
for (const ch of chapters) {
  if (seen.has(ch.id)) errors.push(`${ch.id}: id 중복`)
  seen.add(ch.id)
  const { start, end } = ch.inStoryDate
  if (!DATE.test(start) || !DATE.test(end)) errors.push(`${ch.id}: 날짜 형식 오류`)
  if (start > end) errors.push(`${ch.id}: start > end`)
  for (const l of ch.locations) if (!locIds.has(l)) errors.push(`${ch.id}: 알 수 없는 장소 ${l}`)
  if (!ch.events.length) errors.push(`${ch.id}: 사건 없음`)
  ch.events.forEach((e, i) => {
    const tag = `${ch.id} 사건#${i + 1}`
    if (!locIds.has(e.locationId)) errors.push(`${tag}: 알 수 없는 장소 ${e.locationId}`)
    for (const c of [...e.characters, ...(e.exits ?? [])]) if (!charIds.has(c)) errors.push(`${tag}: 알 수 없는 인물 ${c}`)
    for (const c of e.exits ?? []) if (!e.characters.includes(c)) errors.push(`${tag}: exits의 ${c}가 characters에 없음`)
    if (!DATE.test(e.date)) errors.push(`${tag}: 날짜 형식 오류 ${e.date}`)
    // 회상 장면은 챕터 기간보다 이를 수 있지만, 챕터 끝보다 늦으면 안 된다
    if (e.date > end) errors.push(`${tag}: 사건 날짜 ${e.date}가 챕터 끝(${end})보다 늦음`)
    if (e.date < start && !e.summary.includes('회상')) warn.push(`${tag}: 챕터 시작 전 날짜(${e.date})인데 '회상' 표시 없음`)
    if (!e.summary?.trim()) errors.push(`${tag}: 요약 없음`)
  })
}
for (const l of locations) {
  if (l.x < 0 || l.x > 1600 || l.y < 0 || l.y > 1200) errors.push(`장소 ${l.id}: 좌표가 지도 밖`)
}
for (const c of characters) if (!c.intro?.trim()) errors.push(`인물 ${c.id}: intro(소개 문구) 없음`)
for (const r of regions) if (!r.description?.trim()) errors.push(`지역 ${r.id}: 설명 없음`)
const used = new Set(chapters.flatMap((c) => c.events.map((e) => e.locationId)))
for (const l of locations) if (!used.has(l.id)) warn.push(`장소 ${l.id}: 어떤 사건에도 쓰이지 않음`)

const low = chapters.flatMap((c) => [
  ...(c.confidence === 'low' ? [`${c.id} (챕터 전체)`] : []),
  ...c.events.flatMap((e, i) => (e.confidence === 'low' ? [`${c.id} 사건#${i + 1}: ${e.summary.slice(0, 40)}…`] : [])),
])
const lowLocs = locations.filter((l) => l.confidence === 'low').map((l) => `장소 ${l.id}`)

console.log(`챕터 ${chapters.length}개, 사건 ${chapters.reduce((n, c) => n + c.events.length, 0)}개, 장소 ${locations.length}곳, 인물 ${characters.length}명`)
if (warn.length) console.log('\n⚠️  경고\n' + warn.map((w) => '  - ' + w).join('\n'))
console.log(`\n🔍 검수 필요 (confidence: low) ${low.length + lowLocs.length}건\n` + [...low, ...lowLocs].map((w) => '  - ' + w).join('\n'))
if (errors.length) {
  console.error('\n❌ 오류\n' + errors.map((e) => '  - ' + e).join('\n'))
  process.exit(1)
}
console.log('\n✅ 데이터 검사 통과')
