import chaptersJson from '../data/chapters.json'
import locationsJson from '../data/locations.json'
import charactersJson from '../data/characters.json'
import regionsJson from '../data/regions.json'
import type { Chapter, Character, Location, Region, StoryEvent } from '../types'

export const chapters = chaptersJson as Chapter[]
export const locations = locationsJson as Location[]
export const characters = charactersJson as Character[]
export const regions = regionsJson as Region[]

export const locationById = new Map(locations.map((l) => [l.id, l]))
export const regionById = new Map(regions.map((r) => [r.id, r]))
export const characterById = new Map(characters.map((c) => [c.id, c]))
export const chapterIndexById = new Map(chapters.map((c, i) => [c.id, i]))

export const BOOK_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const

/** 모든 사건을 (읽는 순서의 챕터 인덱스, 챕터 내 순번)과 함께 펼친 목록 */
export interface IndexedEvent extends StoryEvent {
  chapterIndex: number
  order: number
}

export const allEvents: IndexedEvent[] = chapters.flatMap((ch, chapterIndex) =>
  ch.events.map((e, i) => ({ ...e, chapterIndex, order: i })),
)

/** 작중 날짜 → 읽는 순서 → 챕터 내 순서로 정렬 */
export function compareEvents(a: IndexedEvent, b: IndexedEvent) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  if (a.chapterIndex !== b.chapterIndex) return a.chapterIndex - b.chapterIndex
  return a.order - b.order
}

/** 인물별 사건 목록 (시간순) */
export const eventsByCharacter = new Map<string, IndexedEvent[]>()
for (const e of [...allEvents].sort(compareEvents)) {
  for (const c of e.characters) {
    if (!eventsByCharacter.has(c)) eventsByCharacter.set(c, [])
    eventsByCharacter.get(c)!.push(e)
  }
}

/** 인물별 첫 등장 챕터 인덱스 (읽는 순서 기준) */
export const firstChapterIndex = new Map<string, number>()
for (const e of allEvents) {
  for (const c of e.characters) {
    const prev = firstChapterIndex.get(c)
    if (prev === undefined || e.chapterIndex < prev) firstChapterIndex.set(c, e.chapterIndex)
  }
}

/** 인물 소개 페이지를 가리키는 가상의 챕터 인덱스 */
export const INTRO_INDEX = -1

export function displayName(c: Character, chapterIndex: number) {
  if (c.altName) {
    const from = chapterIndexById.get(c.altName.fromChapter) ?? Infinity
    if (chapterIndex >= from) return c.altName.name
  }
  return c.nameEn
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export function formatDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return `S.R. ${y} · ${MONTHS[m - 1]} ${day}일`
}

export function formatRange(start: string, end: string) {
  if (start === end) return formatDate(start)
  const [ys] = start.split('-')
  const [ye] = end.split('-')
  const s = formatDate(start)
  const e = ys === ye ? formatDate(end).replace(/^S\.R\. \d+ · /, '') : formatDate(end)
  return `${s} – ${e}`
}

export function chapterLabel(ch: Chapter) {
  return `Book ${BOOK_NUMERALS[ch.book - 1]} · ${ch.number}. ${ch.titleEn}`
}
