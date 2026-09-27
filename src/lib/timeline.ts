import type { Character } from '../types'
import {
  chapters,
  characterById,
  characters,
  eventsByCharacter,
  locationById,
  type IndexedEvent,
} from './data'

/**
 * current   : 이번 챕터에 직접 등장
 * concurrent: 이번 챕터에는 없지만, 이미 읽은 장을 근거로 같은 시각의 위치를 알 수 있음
 * unknown   : 같은 시각의 위치가 아직 안 읽은 장에서만 드러남 → 마지막으로 알려진 위치에 "?"로 표시
 * revealed  : (스포일러 숨김 옵션 OFF일 때) 안 읽은 장의 위치를 흐리게 표시. 사건 내용은 숨김
 */
export type TokenStatus = 'current' | 'concurrent' | 'unknown' | 'revealed'

export interface PlacedToken {
  character: Character
  status: TokenStatus
  locationId: string
  /** 근거가 된 사건 (revealed/unknown이면 요약을 보여주지 않는다) */
  event?: IndexedEvent
}

export interface Trail {
  character: Character
  points: { x: number; y: number }[]
}

export interface Snapshot {
  chapterIndex: number
  date: string
  tokens: PlacedToken[]
  trails: Trail[]
  /** 현재 챕터까지 등장한 적 있는 인물 (필터 목록용) */
  knownCharacters: Character[]
}

export interface SnapshotOptions {
  hideUnread: boolean
  /** null이면 전체 표시 */
  filter: Set<string> | null
}

/** 독자가 챕터 C까지 읽은 시점에서, 작중 날짜 D까지 인물 c에 대해 알고 있는 사건들 */
function readEventsFor(id: string, C: number, D: string) {
  return (eventsByCharacter.get(id) ?? []).filter((e) => e.chapterIndex <= C && e.date <= D)
}

export function computeSnapshot(C: number, opts: SnapshotOptions): Snapshot {
  const ch = chapters[C]
  const D = ch.inStoryDate.end
  const tokens: PlacedToken[] = []
  const present = new Set<string>()

  // 1) 이번 챕터 등장 인물: 챕터 내 마지막 사건 위치
  const chapterEvents = ch.events.map((e, order) => ({
    ...e,
    chapterIndex: C,
    order,
  }))
  const lastInChapter = new Map<string, IndexedEvent>()
  for (const e of [...chapterEvents].sort((a, b) =>
    a.date === b.date ? a.order - b.order : a.date < b.date ? -1 : 1,
  )) {
    for (const id of e.characters) lastInChapter.set(id, e)
  }
  for (const [id, e] of lastInChapter) {
    const character = characterById.get(id)
    if (!character) continue
    present.add(id)
    tokens.push({ character, status: 'current', locationId: e.locationId, event: e })
  }

  // 2) 추적 대상 인물의 같은 시각 위치
  for (const character of characters) {
    if (!character.tracked || present.has(character.id)) continue
    const read = readEventsFor(character.id, C, D)
    const lastRead = read.at(-1)
    if (!lastRead) continue // 아직 등장하지 않음
    if (lastRead.exits?.includes(character.id)) continue // 독자가 아는 한 퇴장
    const lastAny = (eventsByCharacter.get(character.id) ?? []).filter((e) => e.date <= D).at(-1)!
    if (lastAny.chapterIndex > C) {
      if (opts.hideUnread) {
        tokens.push({ character, status: 'unknown', locationId: lastRead.locationId, event: lastRead })
      } else {
        tokens.push({ character, status: 'revealed', locationId: lastAny.locationId })
      }
    } else {
      tokens.push({ character, status: 'concurrent', locationId: lastRead.locationId, event: lastRead })
    }
  }

  // 3) 이동 경로 (이미 읽은 사건만)
  const trailIds = opts.filter
    ? [...opts.filter]
    : tokens.filter((t) => t.character.tracked).map((t) => t.character.id)
  const trails: Trail[] = []
  for (const id of trailIds) {
    const character = characterById.get(id)
    if (!character) continue
    const pts: { x: number; y: number }[] = []
    let lastLoc = ''
    for (const e of readEventsFor(id, C, D)) {
      if (e.locationId === lastLoc) continue
      const loc = locationById.get(e.locationId)
      if (!loc) continue
      pts.push({ x: loc.x, y: loc.y })
      lastLoc = e.locationId
    }
    if (pts.length > 1) trails.push({ character, points: pts })
  }

  const knownCharacters = characters.filter((c) =>
    (eventsByCharacter.get(c.id) ?? []).some((e) => e.chapterIndex <= C),
  )

  const visibleTokens = opts.filter ? tokens.filter((t) => opts.filter!.has(t.character.id)) : tokens

  return { chapterIndex: C, date: D, tokens: visibleTokens, trails, knownCharacters }
}

/** 같은 장소에 있는 토큰끼리 묶기 */
export function clusterTokens(tokens: PlacedToken[]) {
  const map = new Map<string, PlacedToken[]>()
  for (const t of tokens) {
    if (!map.has(t.locationId)) map.set(t.locationId, [])
    map.get(t.locationId)!.push(t)
  }
  const order: Record<TokenStatus, number> = { current: 0, concurrent: 1, revealed: 2, unknown: 3 }
  return [...map.entries()].map(([locationId, ts]) => ({
    locationId,
    tokens: ts.sort((a, b) => order[a.status] - order[b.status]),
  }))
}
