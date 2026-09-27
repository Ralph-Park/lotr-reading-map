import type { Chapter } from '../types'

const ARTICLES = new Set(['the', 'a', 'an'])

/** 소문자화, 악센트 제거(dûm→dum), 구두점 제거, 관사(the/a/an) 제거 */
export function normalizeTitle(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !ARTICLES.has(w))
    .join(' ')
}

export function searchChapters(chapters: Chapter[], query: string) {
  const q = normalizeTitle(query)
  if (!q) return []
  const scored: { ch: Chapter; score: number }[] = []
  for (const ch of chapters) {
    const t = normalizeTitle(ch.titleEn)
    const idx = t.indexOf(q)
    if (idx === -1) continue
    // 정확히 일치 > 앞부분 일치 > 단어 시작 일치 > 중간 일치
    const score = t === q ? 0 : idx === 0 ? 1 : t[idx - 1] === ' ' ? 2 : 3
    scored.push({ ch, score })
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.ch)
}
