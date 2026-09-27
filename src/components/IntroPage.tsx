import { useMemo, useState } from 'react'
import { BOOK_NUMERALS, chapters, characters, displayName, firstChapterIndex, INTRO_INDEX } from '../lib/data'
import { FaceIcon } from './Face'
import type { Character } from '../types'

interface Props {
  onOpenChapter: (index: number) => void
}

/** Book I 앞에 오는 등장인물 소개. 첫 등장 권별로 묶고, Book II 이후 인물은 기본으로 접어 둔다. */
export function IntroPage({ onOpenChapter }: Props) {
  const [showLater, setShowLater] = useState(false)

  const byBook = useMemo(() => {
    const groups = new Map<number, { c: Character; first: number }[]>()
    for (const c of characters) {
      const first = firstChapterIndex.get(c.id)
      if (first === undefined) continue
      const book = chapters[first].book
      if (!groups.has(book)) groups.set(book, [])
      groups.get(book)!.push({ c, first })
    }
    for (const list of groups.values()) list.sort((a, b) => a.first - b.first)
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [])

  const bookOne = byBook.filter(([b]) => b === 1)
  const later = byBook.filter(([b]) => b > 1)
  const laterCount = later.reduce((n, [, l]) => n + l.length, 0)

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 md:px-8">
        <header className="mb-6 text-center">
          <p className="text-sm text-[#a08d6c]">The Lord of the Rings 독서 동반자</p>
          <h2 className="font-display text-4xl text-[#5b7d3a]">📜 등장인물 소개</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#7d6d55]">
            각 인물이 <b>처음 등장할 때</b> 알 수 있는 정도로만 소개했어요. 지도에서는 아래 얼굴 그림과 이름표로 표시됩니다.
          </p>
          <button
            type="button"
            onClick={() => onOpenChapter(0)}
            className="mt-4 rounded-full border-2 border-[#d9c7a6] bg-[#ffe8b0] px-5 py-2 font-bold text-[#6b5a48] shadow transition hover:scale-105"
          >
            Book I · 1장부터 읽기 ▶
          </button>
        </header>

        {bookOne.map(([book, list]) => (
          <BookGroup key={book} book={book} list={list} onOpenChapter={onOpenChapter} />
        ))}

        <div className="mt-8 rounded-3xl border-2 border-dashed border-[#e0a84a] bg-[#fff8e6] p-4 text-center">
          <p className="text-sm text-[#7d6d55]">
            ⚠️ 아래는 <b>Book II 이후에 처음 등장하는 인물 {laterCount}명</b>이에요. 누가 나오는지만으로도 스포일러가 될 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => setShowLater((v) => !v)}
            className="mt-2 rounded-full border-2 border-[#d9c7a6] bg-white px-4 py-1.5 text-sm font-bold text-[#6b5a48]"
          >
            {showLater ? '다시 접기' : '펼쳐 보기'}
          </button>
        </div>

        {showLater &&
          later.map(([book, list]) => <BookGroup key={book} book={book} list={list} onOpenChapter={onOpenChapter} />)}
      </div>
    </div>
  )
}

function BookGroup({
  book,
  list,
  onOpenChapter,
}: {
  book: number
  list: { c: Character; first: number }[]
  onOpenChapter: (i: number) => void
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 font-display text-2xl text-[#6b5a48]">Book {BOOK_NUMERALS[book - 1]}에서 처음 등장</h3>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ c, first }) => {
          const ch = chapters[first]
          return (
            <li key={c.id} className="flex gap-3 rounded-2xl bg-white/85 p-3 shadow-sm ring-1 ring-[#eadcc0]">
              <FaceIcon c={c} size={52} />
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight text-[#3d3228]">
                  {c.emoji} {displayName(c, INTRO_INDEX)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#5b4e3e]">{c.intro}</p>
                <button
                  type="button"
                  onClick={() => onOpenChapter(first)}
                  className="mt-1.5 text-xs text-[#a0662a] underline decoration-dotted"
                >
                  첫 등장: {BOOK_NUMERALS[ch.book - 1]}-{ch.number}. {ch.titleEn}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
