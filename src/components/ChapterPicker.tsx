import { useEffect, useMemo, useRef, useState } from 'react'
import { BOOK_NUMERALS, chapters, INTRO_INDEX } from '../lib/data'
import { searchChapters } from '../lib/search'

interface Props {
  chapterIndex: number
  onChange: (index: number) => void
}

export function ChapterPicker({ chapterIndex, onChange }: Props) {
  const isIntro = chapterIndex === INTRO_INDEX
  // 인물 소개는 Book I 앞의 "0권"으로 취급
  const currentBook = isIntro ? 0 : chapters[chapterIndex].book
  const books = useMemo(() => [...new Set(chapters.map((c) => c.book))], [])
  const inBook = useMemo(
    () => chapters.map((c, i) => ({ c, i })).filter(({ c }) => c.book === currentBook),
    [currentBook],
  )

  return (
    <div className="flex flex-wrap items-center gap-2 md:ml-auto">
      <ChapterSearch onPick={onChange} />
      <div className="flex min-w-0 flex-1 items-center gap-1.5 md:flex-none">
        <select
          aria-label="권 선택"
          className="picker-select"
          value={currentBook}
          onChange={(e) => {
            const b = Number(e.target.value)
            onChange(b === 0 ? INTRO_INDEX : chapters.findIndex((c) => c.book === b))
          }}
        >
          <option value={0}>인물 소개</option>
          {books.map((b) => (
            <option key={b} value={b}>
              Book {BOOK_NUMERALS[b - 1]}
            </option>
          ))}
        </select>
        <select
          aria-label="챕터 선택"
          className="picker-select min-w-0 flex-1 md:max-w-[16rem]"
          value={chapterIndex}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {isIntro && <option value={INTRO_INDEX}>📜 등장인물 소개</option>}
          {inBook.map(({ c, i }) => (
            <option key={c.id} value={i}>
              {c.number}. {c.titleEn}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function ChapterNav({ chapterIndex, onChange }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        className="nav-btn"
        disabled={chapterIndex === INTRO_INDEX}
        onClick={() => onChange(chapterIndex - 1)}
        aria-label="이전 챕터"
      >
        ◀ 이전
      </button>
      <button
        type="button"
        className="nav-btn"
        disabled={chapterIndex === chapters.length - 1}
        onClick={() => onChange(chapterIndex + 1)}
        aria-label="다음 챕터"
      >
        다음 ▶
      </button>
    </div>
  )
}

function ChapterSearch({ onPick }: { onPick: (i: number) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const results = useMemo(() => searchChapters(chapters, q).slice(0, 10), [q])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const pick = (id: string) => {
    onPick(chapters.findIndex((c) => c.id === id))
    setQ('')
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative w-full sm:w-64">
      <input
        type="search"
        value={q}
        placeholder="챕터 제목 검색 (예: council)"
        aria-label="챕터 제목 검색"
        className="w-full rounded-full border-2 border-[#d9c7a6] bg-white px-4 py-1.5 text-sm outline-none placeholder:text-[#b3a48a] focus:border-[#e0a84a]"
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter' && results[active]) {
            pick(results[active].id)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      />
      {open && q.trim() && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-2xl border-2 border-[#d9c7a6] bg-white py-1 shadow-xl">
          {results.length === 0 && <li className="px-4 py-2 text-sm text-[#9a8a70]">일치하는 챕터가 없어요</li>}
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`flex w-full items-baseline gap-2 px-4 py-1.5 text-left text-sm ${i === active ? 'bg-[#fff1cf]' : 'hover:bg-[#fff7e3]'}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(c.id)}
              >
                <span className="shrink-0 text-xs text-[#a08d6c]">
                  {BOOK_NUMERALS[c.book - 1]}-{c.number}
                </span>
                <span className="font-medium text-[#4a3f33]">{c.titleEn}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
