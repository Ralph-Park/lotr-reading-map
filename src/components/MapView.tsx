import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { MapBase, MAP_H, MAP_W } from './MapBase'
import { displayName, locationById, locations, regionById, regions } from '../lib/data'
import { clusterTokens, type PlacedToken, type Snapshot } from '../lib/timeline'
import { smoothPath } from '../lib/geom'
import { FaceArt, shortLabel } from './Face'

interface Props {
  snapshot: Snapshot
  highlight: string[]
  selectedLocation: string | null
  onSelectLocation: (id: string | null) => void
  /** 바뀌면 챕터 무대로 자동 줌 */
  focusKey: string
}

// 인물별 경로가 겹치지 않게 살짝 어긋나게 그리기
const TRAIL_OFFSETS: [number, number][] = [
  [0, 0], [3, 2], [-3, -2], [2, -3], [-2, 3], [5, 0], [-5, 0], [0, 5], [0, -5], [4, 4], [-4, -4],
]

const MAX_SCALE = 6
/** 버튼·키보드 한 번에 확대/축소하는 비율 (작을수록 천천히) */
const ZOOM_FACTOR = 1.25
const ZOOM_MS = 450
/** 방향키 한 번에 움직이는 거리 (화면 픽셀) */
const PAN_STEP = 90

export function MapView({ snapshot, highlight, selectedLocation, onSelectLocation, focusKey }: Props) {
  const zoomRef = useRef<ReactZoomPanPinchRef>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.6 })
  const scale = view.scale
  // 지도를 끌다가 손을 뗀 것인지, 제자리에서 누른 것인지 구분 (팝업 닫기용)
  const downRef = useRef<{ x: number; y: number } | null>(null)
  // 지도 전체가 화면에 딱 들어가는 배율 = 축소 한계
  const [minScale, setMinScale] = useState(0.3)

  const fitScale = useCallback(() => {
    const el = wrapRef.current
    if (!el) return 0.5
    return Math.min(el.clientWidth / MAP_W, el.clientHeight / MAP_H)
  }, [])

  /** 배율 s에서 지도가 화면 밖으로 밀려나지 않도록 위치를 제한 (작으면 가운데 정렬) */
  const clampTransform = useCallback((x: number, y: number, s: number) => {
    const el = wrapRef.current!
    const w = el.clientWidth
    const h = el.clientHeight
    const cw = MAP_W * s
    const ch = MAP_H * s
    const cx = cw <= w ? (w - cw) / 2 : Math.min(0, Math.max(w - cw, x))
    const cy = ch <= h ? (h - ch) / 2 : Math.min(0, Math.max(h - ch, y))
    return [cx, cy, s] as const
  }, [])

  // 애니메이션 중에 버튼/키를 연달아 눌러도 목표 위치를 기준으로 누적되도록 기억해 둔다
  const targetRef = useRef<{ x: number; y: number; s: number; until: number } | null>(null)
  const currentTarget = useCallback(() => {
    const t = targetRef.current
    if (t && performance.now() < t.until) return { positionX: t.x, positionY: t.y, scale: t.s }
    return zoomRef.current!.instance.state
  }, [])

  const moveTo = useCallback(
    (x: number, y: number, s: number, ms: number) => {
      const api = zoomRef.current
      if (!api || !wrapRef.current) return
      const fit = fitScale()
      const [cx, cy, cs] = clampTransform(x, y, Math.min(MAX_SCALE, Math.max(fit, s)))
      targetRef.current = { x: cx, y: cy, s: cs, until: performance.now() + ms }
      api.setTransform(cx, cy, cs, ms, 'easeOutCubic')
    },
    [clampTransform, fitScale],
  )

  /** 화면 가운데를 기준으로 천천히 확대/축소 */
  const zoomBy = useCallback(
    (factor: number) => {
      const api = zoomRef.current
      const el = wrapRef.current
      if (!api || !el) return
      const { positionX: x, positionY: y, scale: s } = currentTarget()
      const fit = fitScale()
      const ns = Math.min(MAX_SCALE, Math.max(fit, s * factor))
      const cx = el.clientWidth / 2
      const cy = el.clientHeight / 2
      moveTo(cx - ((cx - x) * ns) / s, cy - ((cy - y) * ns) / s, ns, ZOOM_MS)
    },
    [fitScale, moveTo, currentTarget],
  )

  const focusOn = useCallback(
    (ids: string[], animate = 700) => {
      const el = wrapRef.current
      if (!el) return
      const pts = ids.map((id) => locationById.get(id)).filter(Boolean) as { x: number; y: number }[]
      const w = el.clientWidth
      const h = el.clientHeight
      const fit = fitScale()
      if (!pts.length) {
        moveTo(0, 0, fit, animate)
        return
      }
      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const pad = 160
      const bw = maxX - minX + pad * 2
      const bh = maxY - minY + pad * 2
      const s = Math.max(fit, Math.min(w / bw, h / bh, fit * 4, 2.2))
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      moveTo(w / 2 - cx * s, h / 2 - cy * s, s, animate)
    },
    [fitScale, moveTo],
  )

  // 챕터가 바뀌면 무대 + 등장인물 위치로 줌
  const focusIds = useMemo(() => {
    const cur = snapshot.tokens.filter((t) => t.status === 'current').map((t) => t.locationId)
    return [...new Set([...highlight, ...cur])]
  }, [highlight, snapshot])

  const focusIdsRef = useRef(focusIds)
  focusIdsRef.current = focusIds
  useEffect(() => {
    // 레이아웃이 잡힌 뒤 줌
    const id = requestAnimationFrame(() => focusOn(focusIdsRef.current))
    return () => cancelAnimationFrame(id)
  }, [focusKey, focusOn])

  // 화면 크기가 바뀌면 축소 한계를 다시 계산
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setMinScale(fitScale())
      focusOn(focusIdsRef.current, 0)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fitScale, focusOn])

  // 방향키: 지도 이동 / + −: 확대·축소
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, select, textarea') || e.altKey || e.metaKey || e.ctrlKey) return
      const api = zoomRef.current
      if (!api) return
      const { positionX: x, positionY: y, scale: s } = currentTarget()
      const step = e.shiftKey ? PAN_STEP * 3 : PAN_STEP
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      }
      if (moves[e.key]) {
        e.preventDefault()
        moveTo(x + moves[e.key][0], y + moves[e.key][1], s, 180)
      } else if (e.key === '+' || e.key === '=') {
        zoomBy(ZOOM_FACTOR)
      } else if (e.key === '-' || e.key === '_') {
        zoomBy(1 / ZOOM_FACTOR)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveTo, zoomBy, currentTarget])

  // 선택한 장소가 화면 밖이면 (패널에서 고른 경우 등) 그쪽으로 지도를 옮긴다
  useEffect(() => {
    const el = wrapRef.current
    const api = zoomRef.current
    const place = selectedLocation ? (locationById.get(selectedLocation) ?? regionById.get(selectedLocation)) : null
    if (!el || !api || !place) return
    const { positionX: x, positionY: y, scale: s } = currentTarget()
    const px = place.x * s + x
    const py = place.y * s + y
    const m = 60
    if (px < m || px > el.clientWidth - m || py < m || py > el.clientHeight - m) {
      moveTo(el.clientWidth / 2 - place.x * s, el.clientHeight / 2 - place.y * s, s, 500)
    }
  }, [selectedLocation, currentTarget, moveTo])

  // 확대할수록 토큰/라벨이 과하게 커지지 않도록 보정
  const k = 1.15 / Math.pow(scale, 0.8)
  const labelK = 1 / Math.pow(scale, 0.85)
  const clusters = useMemo(() => clusterTokens(snapshot.tokens), [snapshot])
  const highlightSet = useMemo(() => new Set(highlight), [highlight])
  const tokenLocs = useMemo(() => new Set(snapshot.tokens.map((t) => t.locationId)), [snapshot])

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-[#bfe0ea]">
      <TransformWrapper
        ref={zoomRef}
        minScale={minScale}
        maxScale={MAX_SCALE}
        limitToBounds
        centerZoomedOut
        disablePadding
        initialScale={0.5}
        doubleClick={{ mode: 'zoomIn', step: 0.4, animationTime: ZOOM_MS }}
        wheel={{ step: 0.0015 }}
        pinch={{ step: 3 }}
        onTransform={(_, st) => setView({ x: st.positionX, y: st.positionY, scale: st.scale })}
        onInit={() => focusOn(focusIdsRef.current, 0)}
      >
        {() => (
          <>
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: MAP_W, height: MAP_H }}>
              <svg
                width={MAP_W}
                height={MAP_H}
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="block select-none overflow-visible"
                onPointerDown={(e) => (downRef.current = { x: e.clientX, y: e.clientY })}
                onClick={(e) => {
                  const d = downRef.current
                  if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) onSelectLocation(null)
                }}
              >
                <MapBase />

                {/* 지역 이름 (클릭하면 설명) */}
                {regions.map((r) => (
                  <text
                    key={r.id}
                    x={r.x}
                    y={r.y}
                    fontSize={r.size}
                    fill={r.color}
                    textAnchor="middle"
                    className={`map-region-label cursor-pointer ${selectedLocation === r.id ? 'map-region-label-selected' : ''}`}
                    transform={r.rotate ? `rotate(${r.rotate} ${r.x} ${r.y})` : undefined}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectLocation(r.id)
                    }}
                  >
                    <title>{r.nameEn} — 눌러서 설명 보기</title>
                    {r.nameEn.replace(/ \(.*\)$/, '')}
                  </text>
                ))}

                {/* 챕터 무대 하이라이트 */}
                {highlight.map((id) => {
                  const loc = locationById.get(id)
                  if (!loc) return null
                  return (
                    <g key={`hl-${id}`} transform={`translate(${loc.x} ${loc.y})`}>
                      <circle r={30 * labelK} className="hl-pulse" fill="#fff6b0" stroke="#f0b93a" strokeWidth={3} vectorEffect="non-scaling-stroke" />
                    </g>
                  )
                })}

                {/* 이동 경로 */}
                <g>
                  {snapshot.trails.map((t, i) => {
                    const [dx, dy] = TRAIL_OFFSETS[i % TRAIL_OFFSETS.length]
                    return (
                      <path
                        key={t.character.id}
                        d={smoothPath(t.points.map((p) => [p.x + dx * labelK, p.y + dy * labelK]), false, 0.35)}
                        fill="none"
                        stroke={t.character.color === '#f2f2f0' ? '#a9a9b5' : t.character.color}
                        strokeWidth={3}
                        strokeDasharray="7 6"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        opacity={0.9}
                      />
                    )
                  })}
                </g>

                {/* 장소 점 & 이름 */}
                {locations.map((loc) => {
                  const hl = highlightSet.has(loc.id)
                  const showLabel = hl || loc.major || scale > 1.6 || tokenLocs.has(loc.id) || selectedLocation === loc.id
                  return (
                    <g
                      key={loc.id}
                      transform={`translate(${loc.x} ${loc.y})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectLocation(loc.id)
                      }}
                    >
                      <circle r={10 * labelK} fill="transparent" />
                      <circle
                        r={(hl ? 5.5 : 4) * labelK}
                        fill={hl ? '#f0b93a' : '#fffaf0'}
                        stroke={selectedLocation === loc.id ? '#d9534f' : '#6b5a48'}
                        strokeWidth={selectedLocation === loc.id ? 3 : 1.6}
                        vectorEffect="non-scaling-stroke"
                      />
                      {showLabel && (
                        <text
                          y={16 * labelK}
                          fontSize={(hl ? 14 : 11.5) * labelK}
                          textAnchor="middle"
                          className={hl ? 'map-label map-label-hl' : 'map-label'}
                        >
                          {loc.nameEn}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* 인물 토큰 */}
                {clusters.map((c) => {
                  const loc = locationById.get(c.locationId)
                  if (!loc) return null
                  return (
                    <g key={`cl-${c.locationId}`} transform={`translate(${loc.x} ${loc.y}) scale(${k})`} className="token-cluster">
                      <TokenCluster tokens={c.tokens} chapterIndex={snapshot.chapterIndex} />
                    </g>
                  )
                })}
              </svg>
            </TransformComponent>

            {selectedLocation && (
              <PlacePopup
                id={selectedLocation}
                view={view}
                wrap={wrapRef.current}
                highlighted={highlightSet.has(selectedLocation)}
                here={snapshot.tokens.filter((t) => t.locationId === selectedLocation)}
                chapterIndex={snapshot.chapterIndex}
                onClose={() => onSelectLocation(null)}
              />
            )}

            <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2">
              <MapButton label="확대" onClick={() => zoomBy(ZOOM_FACTOR)}>＋</MapButton>
              <MapButton label="축소" onClick={() => zoomBy(1 / ZOOM_FACTOR)}>－</MapButton>
              <MapButton label="챕터 무대로" onClick={() => focusOn(focusIdsRef.current)}>🎯</MapButton>
              <MapButton label="전체 지도" onClick={() => focusOn([])}>🗺️</MapButton>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}

const POPUP_W = 280

/** 클릭한 장소/지역 바로 위에 뜨는 설명 팝업. 지도를 움직이면 따라간다. */
function PlacePopup({
  id,
  view,
  wrap,
  highlighted,
  here,
  chapterIndex,
  onClose,
}: {
  id: string
  view: { x: number; y: number; scale: number }
  wrap: HTMLDivElement | null
  highlighted: boolean
  here: PlacedToken[]
  chapterIndex: number
  onClose: () => void
}) {
  const loc = locationById.get(id)
  const region = regionById.get(id)
  const place = loc ?? region
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  if (!place || !wrap) return null

  const w = wrap.clientWidth
  const px = place.x * view.scale + view.x
  const py = place.y * view.scale + view.y
  const width = Math.min(POPUP_W, w - 16)
  const left = Math.min(Math.max(8, px - width / 2), w - width - 8)
  // 위쪽 공간이 부족하면 아래로 띄운다
  const below = py < 220
  const style = below ? { left, top: py + 18, width } : { left, bottom: wrap.clientHeight - py + 18, width }
  const arrowLeft = Math.min(Math.max(16, px - left), width - 16)

  return (
    <div
      role="dialog"
      aria-label={place.nameEn}
      className="popup-in absolute z-20 rounded-2xl border-2 border-[#e0a84a] bg-[#fffaf0] p-3 text-[#4a3f33] shadow-xl"
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span
        className={`absolute h-3 w-3 rotate-45 border-[#e0a84a] bg-[#fffaf0] ${below ? '-top-[7px] border-l-2 border-t-2' : '-bottom-[7px] border-b-2 border-r-2'}`}
        style={{ left: arrowLeft - 6 }}
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg leading-tight">
          {region ? '🗺️' : '📍'} {place.nameEn}
        </h3>
        <button type="button" onClick={onClose} className="-mr-1 -mt-1 px-1 text-[#a08d6c]" aria-label="닫기">
          ✕
        </button>
      </div>
      {highlighted && <p className="mt-0.5 text-xs font-bold text-[#c07a1a]">✨ 이번 챕터의 무대</p>}
      <p className="mt-1 text-sm leading-relaxed">{place.description}</p>
      {here.length > 0 && (
        <p className="mt-2 text-xs text-[#7d6d55]">
          지금 여기:{' '}
          {here.map((t) => `${t.character.emoji} ${shortLabel(t.character, displayName(t.character, chapterIndex))}${t.status === 'current' ? '' : ' (흐림)'}`).join(', ')}
        </p>
      )}
      {loc?.confidence === 'low' && (
        <span className="mt-1.5 inline-block rounded-full bg-[#fde8c8] px-2 py-0.5 text-[11px] text-[#a0662a]">
          confidence: low · 검수 필요
        </span>
      )}
    </div>
  )
}

function MapButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#d9c7a6] bg-[#fffaf0]/95 text-lg text-[#6b5a48] shadow-md transition hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  )
}

const FACE_R = 13
const CELL_W = 48
const CELL_H = 48
const PER_ROW = 4

function TokenCluster({ tokens, chapterIndex }: { tokens: PlacedToken[]; chapterIndex: number }) {
  const n = tokens.length
  const cols = Math.min(n, PER_ROW)
  const rows = Math.ceil(n / PER_ROW)
  const width = cols * CELL_W
  const height = rows * CELL_H
  // 장소 점 바로 위에 말풍선처럼 띄운다
  const top = -height - 20
  const allFaded = tokens.every((t) => t.status !== 'current')
  return (
    <g>
      <path d={`M -6 ${-16} L 0 ${-8} L 6 ${-16} Z`} fill={allFaded ? '#ffffffaa' : '#ffffff'} stroke="#c7b08a" strokeWidth={1.2} />
      <rect
        x={-width / 2 - 4}
        y={top - 4}
        width={width + 8}
        height={height + 4}
        rx={16}
        fill={allFaded ? '#ffffff99' : '#ffffffee'}
        stroke={allFaded ? '#c7b08a88' : '#c7b08a'}
        strokeWidth={1.5}
        strokeDasharray={allFaded ? '4 3' : undefined}
      />
      {tokens.map((t, i) => {
        const row = Math.floor(i / PER_ROW)
        const inRow = row === rows - 1 ? n - row * PER_ROW : PER_ROW
        const x = -(inRow * CELL_W) / 2 + CELL_W / 2 + (i % PER_ROW) * CELL_W
        const y = top + row * CELL_H + 19
        return <Token key={t.character.id} t={t} x={x} y={y} chapterIndex={chapterIndex} />
      })}
    </g>
  )
}

function Token({ t, x, y, chapterIndex }: { t: PlacedToken; x: number; y: number; chapterIndex: number }) {
  const c = t.character
  const faded = t.status !== 'current'
  const opacity = t.status === 'current' ? 1 : t.status === 'concurrent' ? 0.6 : 0.45
  const name = shortLabel(c, displayName(c, chapterIndex))
  return (
    <g transform={`translate(${x} ${y})`}>
      <title>{displayName(c, chapterIndex)}</title>
      <g opacity={opacity}>
        <circle r={FACE_R} fill={c.color} fillOpacity={0.4} stroke={faded ? '#8d7c66' : c.color === '#f2f2f0' ? '#b9b9c4' : c.color} strokeWidth={2} strokeDasharray={faded ? '3 2' : undefined} />
        <FaceArt look={c.look} />
        <text y={FACE_R + 9.5} textAnchor="middle" fontSize={8.5} fontWeight={700} className="token-name">
          {name}
        </text>
      </g>
      {t.status === 'unknown' && (
        <g transform={`translate(${FACE_R - 1} ${-FACE_R + 2})`}>
          <circle r={6} fill="#6b5a48" stroke="#fff" strokeWidth={1.2} />
          <text y={3.2} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#fff">?</text>
        </g>
      )}
    </g>
  )
}
