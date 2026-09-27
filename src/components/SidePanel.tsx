import type { Character } from '../types'
import { isLight } from '../lib/color'
import {
  chapters,
  characterById,
  displayName,
  formatDate,
  formatRange,
  locationById,
  BOOK_NUMERALS,
} from '../lib/data'
import type { Snapshot } from '../lib/timeline'

interface Props {
  snapshot: Snapshot
  selectedLocation: string | null
  onSelectLocation: (id: string | null) => void
  hideUnread: boolean
  onHideUnreadChange: (v: boolean) => void
  filter: Set<string> | null
  onFilterChange: (f: Set<string> | null) => void
}

export function SidePanel({
  snapshot,
  selectedLocation,
  onSelectLocation,
  hideUnread,
  onHideUnreadChange,
  filter,
  onFilterChange,
}: Props) {
  const C = snapshot.chapterIndex
  const ch = chapters[C]
  const others = snapshot.tokens.filter((t) => t.status !== 'current')
  const chapterLowConfidence = ch.confidence === 'low' || ch.events.some((e) => e.confidence === 'low')

  const toggleChar = (id: string) => {
    const next = new Set(filter ?? [])
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onFilterChange(next.size ? next : null)
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-10 text-[#4a3f33]">
      <header>
        <p className="text-xs font-semibold tracking-wide text-[#a08d6c]">
          Book {BOOK_NUMERALS[ch.book - 1]} · Chapter {ch.number}
        </p>
        <h2 className="font-display text-2xl leading-tight text-[#3d3228]">{ch.titleEn}</h2>
        <p className="mt-1 text-sm text-[#7d6d55]">📅 {formatRange(ch.inStoryDate.start, ch.inStoryDate.end)}</p>
        {chapterLowConfidence && (
          <p className="mt-2 inline-block rounded-full bg-[#fde8c8] px-2.5 py-0.5 text-xs text-[#a0662a]">
            ⚠️ 검수가 필요한 항목이 포함되어 있어요
          </p>
        )}
      </header>

      <section>
        <SectionTitle>🏞️ 이 챕터의 무대</SectionTitle>
        <div className="flex flex-col gap-2">
          {ch.locations.map((id) => {
            const loc = locationById.get(id)
            if (!loc) return null
            return (
              <button
                type="button"
                key={id}
                onClick={() => onSelectLocation(id)}
                className={`rounded-2xl border-2 bg-white/80 p-3 text-left transition hover:border-[#e0a84a] ${
                  selectedLocation === id ? 'border-[#e0a84a]' : 'border-[#eadcc0]'
                }`}
              >
                <h3 className="font-display text-lg">{loc.nameEn}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-[#5b4e3e]">{loc.description}</p>
                <p className="mt-1 text-xs text-[#a0662a]">📍 지도에서 보기</p>
                {loc.confidence === 'low' && <LowBadge />}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <SectionTitle>📜 무슨 일이 있었나</SectionTitle>
        <ol className="flex flex-col gap-2.5">
          {ch.events.map((e, i) => {
            const loc = locationById.get(e.locationId)
            return (
              <li key={i} className="rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-[#eadcc0]">
                <div className="mb-1.5 flex flex-wrap items-center gap-1">
                  {e.characters.map((id) => {
                    const c = characterById.get(id)
                    return c ? <Chip key={id} c={c} chapterIndex={C} /> : null
                  })}
                </div>
                <p className="text-sm leading-relaxed">{e.summary}</p>
                <p className="mt-1.5 text-xs text-[#a08d6c]">
                  📍 {loc?.nameEn ?? e.locationId} · {formatDate(e.date)}
                </p>
                {e.confidence === 'low' && <LowBadge />}
              </li>
            )
          })}
        </ol>
      </section>

      {others.length > 0 && !filter && (
        <section>
          <SectionTitle>🕰️ 같은 시각, 다른 일행은</SectionTitle>
          <p className="-mt-1 mb-2 text-xs text-[#9a8a70]">
            {formatDate(snapshot.date)} 기준. 지도에서 흐린 토큰으로 표시돼요.
          </p>
          <ul className="flex flex-col gap-2">
            {others.map((t) => {
              const loc = locationById.get(t.locationId)
              return (
                <li key={t.character.id} className="rounded-2xl border border-dashed border-[#d9c7a6] bg-white/50 p-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip c={t.character} chapterIndex={C} faded />
                    <span className="text-sm">
                      {t.status === 'unknown' ? '❓ 현재 위치 모름' : `📍 ${loc?.nameEn}`}
                    </span>
                  </div>
                  {t.status === 'concurrent' && t.event && (
                    <p className="mt-1 text-xs leading-relaxed text-[#6d5f4b]">
                      마지막으로 읽은 모습: {t.event.summary}{' '}
                      <span className="text-[#a08d6c]">
                        ({BOOK_NUMERALS[chapters[t.event.chapterIndex].book - 1]}-{chapters[t.event.chapterIndex].number})
                      </span>
                    </p>
                  )}
                  {t.status === 'unknown' && (
                    <p className="mt-1 text-xs text-[#6d5f4b]">
                      이 시각의 행적은 아직 읽지 않은 장에서 나와요. 마지막으로 알려진 곳({loc?.nameEn})에 ?로 표시했어요.
                    </p>
                  )}
                  {t.status === 'revealed' && (
                    <p className="mt-1 text-xs text-[#6d5f4b]">아직 읽지 않은 장에 나오는 위치예요. 무슨 일이 있었는지는 숨겨 두었어요.</p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="rounded-2xl bg-[#fff5dd] p-3">
        <SectionTitle>⚙️ 보기 설정</SectionTitle>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-[#e0a84a]"
            checked={hideUnread}
            onChange={(e) => onHideUnreadChange(e.target.checked)}
          />
          <span>
            <b>안 읽은 장면 숨기기</b>
            <br />
            <span className="text-xs text-[#7d6d55]">
              다른 일행의 같은 시각 위치가 아직 안 읽은 장에서만 드러나면 위치를 숨기고 ?로 표시해요.
            </span>
          </span>
        </label>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-bold">인물 필터</span>
            {filter && (
              <button type="button" className="text-xs text-[#a0662a] underline" onClick={() => onFilterChange(null)}>
                전체 보기
              </button>
            )}
          </div>
          <p className="mb-2 text-xs text-[#7d6d55]">인물을 고르면 그 인물의 토큰과 지금까지의 여정만 보여요.</p>
          <div className="flex flex-wrap gap-1.5">
            {snapshot.knownCharacters.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleChar(c.id)}
                className={`rounded-full transition ${filter && !filter.has(c.id) ? 'opacity-40' : ''} ${
                  filter?.has(c.id) ? 'ring-2 ring-[#e0a84a] ring-offset-1' : ''
                }`}
              >
                <Chip c={c} chapterIndex={C} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="text-xs text-[#8d7c66]">
        <SectionTitle>🔎 범례</SectionTitle>
        <ul className="flex flex-col gap-1">
          <li>● 진한 토큰: 이번 챕터에 등장</li>
          <li>◌ 흐린 토큰: 같은 시각 다른 곳에 있는 인물</li>
          <li>❓ 배지: 이 시각의 위치가 아직 안 읽은 장에 있음</li>
          <li>┄ 점선: 지금까지 읽은 이동 경로 (인물별 색)</li>
        </ul>
      </section>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 font-display text-lg text-[#6b5a48]">{children}</h3>
}

function LowBadge() {
  return (
    <span className="mt-1.5 inline-block rounded-full bg-[#fde8c8] px-2 py-0.5 text-[11px] text-[#a0662a]">
      confidence: low · 검수 필요
    </span>
  )
}

export function Chip({ c, chapterIndex, faded }: { c: Character; chapterIndex: number; faded?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 text-xs font-medium ${
        faded ? 'border-dashed border-[#c7b08a] bg-white/60' : 'border-[#e6d6b8] bg-white'
      }`}
    >
      <span
        className="grid h-5 min-w-5 place-items-center rounded-full px-0.5 text-[10px] font-bold"
        style={{
          background: c.color,
          color: isLight(c.color) ? '#3d3a35' : '#fff',
          boxShadow: c.id === 'gandalf' ? 'inset 0 0 0 1px #b9b9c4' : undefined,
          opacity: faded ? 0.6 : 1,
        }}
      >
        {c.initial}
      </span>
      <span>{c.emoji}</span>
      {displayName(c, chapterIndex)}
    </span>
  )
}
