import { useEffect, useMemo, useState } from 'react'
import { ChapterNav, ChapterPicker } from './components/ChapterPicker'
import { IntroPage } from './components/IntroPage'
import { MapView } from './components/MapView'
import { SidePanel } from './components/SidePanel'
import { chapters, INTRO_INDEX } from './lib/data'
import { computeSnapshot } from './lib/timeline'

const STORAGE_KEY = 'lotr-map:chapter'

function loadChapter() {
  try {
    const id = localStorage.getItem(STORAGE_KEY)
    const i = chapters.findIndex((c) => c.id === id)
    // 처음 방문하면 인물 소개부터
    return i >= 0 ? i : INTRO_INDEX
  } catch {
    return INTRO_INDEX
  }
}

export default function App() {
  const [chapterIndex, setChapterIndex] = useState(loadChapter)
  const isIntro = chapterIndex === INTRO_INDEX

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isIntro ? 'intro' : chapters[chapterIndex].id)
    } catch {
      /* 저장 실패해도 동작에는 지장 없음 */
    }
  }, [chapterIndex, isIntro])

  // [ / ] 키로 이전·다음 챕터 (방향키는 지도 이동에 사용)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, select, textarea') || e.altKey || e.metaKey || e.ctrlKey) return
      if (e.key === '[') setChapterIndex((i) => Math.max(INTRO_INDEX, i - 1))
      if (e.key === ']') setChapterIndex((i) => Math.min(chapters.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-[#f6efdc] text-[#4a3f33]">
      <header className="z-30 flex flex-col gap-2 border-b-2 border-[#e6d6b8] bg-[#fffaf0] px-3 py-2 shadow-sm md:flex-row md:items-center md:gap-3 md:px-4">
        <div className="flex items-center justify-between gap-2 md:contents">
          <h1 className="font-display text-xl leading-none text-[#5b7d3a] md:text-2xl">
            🗺️ 중간계 독서 지도
            <span className="ml-2 hidden font-sans text-xs font-normal text-[#a08d6c] xl:inline">
              The Lord of the Rings 독서 동반자
            </span>
          </h1>
          <div className="md:order-last">
            <ChapterNav chapterIndex={chapterIndex} onChange={setChapterIndex} />
          </div>
        </div>
        <ChapterPicker chapterIndex={chapterIndex} onChange={setChapterIndex} />
      </header>

      <main className="relative flex min-h-0 flex-1">
        {isIntro ? <IntroPage onOpenChapter={setChapterIndex} /> : <Reader chapterIndex={chapterIndex} />}
      </main>
    </div>
  )
}

function Reader({ chapterIndex }: { chapterIndex: number }) {
  const [hideUnread, setHideUnread] = useState(true)
  const [filter, setFilter] = useState<Set<string> | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const chapter = chapters[chapterIndex]

  useEffect(() => setSelectedLocation(null), [chapter.id])

  const snapshot = useMemo(
    () => computeSnapshot(chapterIndex, { hideUnread, filter }),
    [chapterIndex, hideUnread, filter],
  )

  // 필터에 아직 등장하지 않은 인물이 남아 있으면 정리 (이전 챕터로 돌아간 경우)
  useEffect(() => {
    if (!filter) return
    const known = new Set(snapshot.knownCharacters.map((c) => c.id))
    const next = new Set([...filter].filter((id) => known.has(id)))
    if (next.size !== filter.size) setFilter(next.size ? next : null)
  }, [filter, snapshot.knownCharacters])

  // 장소 설명은 지도 위 팝업으로 보여 주므로, 모바일에서는 패널을 내려 팝업이 보이게 한다
  const selectLocation = (id: string | null) => {
    setSelectedLocation(id)
    if (id) setPanelOpen(false)
  }

  return (
    <>
      <div className="relative min-w-0 flex-1">
        <MapView
          snapshot={snapshot}
          highlight={chapter.locations}
          selectedLocation={selectedLocation}
          onSelectLocation={selectLocation}
          focusKey={chapter.id}
        />
        {filter && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-[#fffaf0]/95 px-3 py-1 text-xs shadow">
            🔍 인물 필터 적용 중
          </div>
        )}
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute bottom-4 right-4 rounded-full border-2 border-[#d9c7a6] bg-[#fffaf0] px-4 py-2 text-sm font-bold shadow-lg md:hidden"
        >
          📖 챕터 정보
        </button>
      </div>

      {/* 데스크톱: 오른쪽 패널 / 모바일: 아래에서 올라오는 시트 */}
      <aside
        className={`panel-scroll z-40 overflow-y-auto border-[#e6d6b8] bg-[#fbf5e6] transition-transform duration-300
          max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:h-[72dvh] max-md:rounded-t-3xl max-md:border-t-2 max-md:shadow-2xl
          md:w-[400px] md:shrink-0 md:border-l-2
          ${panelOpen ? 'max-md:translate-y-0' : 'max-md:translate-y-full'}`}
        aria-label="챕터 정보"
      >
        <div className="sticky top-0 z-10 flex justify-center bg-[#fbf5e6] pt-2 md:hidden">
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="flex flex-col items-center gap-1 px-6 pb-1 text-xs text-[#a08d6c]"
            aria-label="패널 닫기"
          >
            <span className="h-1.5 w-12 rounded-full bg-[#d9c7a6]" />
            닫기
          </button>
        </div>
        <SidePanel
          snapshot={snapshot}
          selectedLocation={selectedLocation}
          onSelectLocation={selectLocation}
          hideUnread={hideUnread}
          onHideUnreadChange={setHideUnread}
          filter={filter}
          onFilterChange={setFilter}
        />
      </aside>
      {panelOpen && (
        <div className="fixed inset-0 z-30 bg-black/10 md:hidden" onClick={() => setPanelOpen(false)} aria-hidden />
      )}
    </>
  )
}
