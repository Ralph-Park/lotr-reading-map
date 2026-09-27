import { memo } from 'react'
import { samplePolyline, seeded, smoothPath, wobble, type Pt } from '../lib/geom'

/**
 * 오리지널 도식 지도.
 * 지명의 대략적인 위치 관계만 참고해 새로 그린 것으로, 원작/영화 지도를 따라 그리지 않았다.
 */
export const MAP_W = 1600
export const MAP_H = 1200

export const REGION_COLORS = {
  sea: '#bfe0ea',
  land: '#f6efdc',
  shire: '#cdeaa3',
  rivendell: '#bde2f5',
  moria: '#cbc0dd',
  lorien: '#f4d97c',
  rohan: '#f7eba8',
  gondor: '#e6ecf3',
  ithilien: '#d3e8c6',
  mordor: '#9a6a5b',
  mordorDeep: '#7c5145',
  marsh: '#bcc5a5',
  brown: '#e6d3ad',
  havens: '#e6e1f0',
  river: '#8ecbe0',
}

const LAND: Pt[] = [
  [140, -400], [2000, -400], [2000, 1600], [1300, 1600], [1260, 1220], [1170, 1178], [1110, 1200], [1010, 1160],
  [910, 1140], [810, 1118], [700, 1136], [600, 1104], [500, 1066], [420, 1004], [330, 934],
  [250, 852], [182, 760], [140, 650], [118, 540], [104, 440], [70, 372], [46, 318], [58, 262],
  [96, 200], [118, 100], [130, -100],
]

const REGIONS: { fill: string; pts: Pt[]; opacity?: number }[] = [
  { fill: REGION_COLORS.havens, pts: [[60, 240], [130, 250], [150, 320], [110, 370], [62, 340]] },
  { fill: REGION_COLORS.shire, pts: [[160, 262], [250, 238], [340, 252], [396, 286], [402, 346], [362, 388], [272, 398], [192, 372], [150, 322]] },
  { fill: REGION_COLORS.rivendell, pts: [[718, 318], [742, 292], [782, 288], [800, 318], [784, 352], [740, 356]] },
  { fill: REGION_COLORS.moria, pts: [[768, 470], [820, 452], [864, 470], [884, 520], [868, 556], [812, 552], [764, 532]] },
  { fill: REGION_COLORS.lorien, pts: [[884, 548], [920, 526], [968, 534], [996, 566], [984, 600], [938, 606], [896, 584]] },
  { fill: REGION_COLORS.brown, pts: [[1000, 630], [1050, 640], [1070, 700], [1040, 740], [1010, 720]], opacity: 0.8 },
  { fill: REGION_COLORS.rohan, pts: [[806, 850], [858, 796], [950, 758], [1040, 740], [1092, 796], [1092, 880], [1062, 942], [980, 958], [900, 952], [838, 932], [796, 892]] },
  { fill: REGION_COLORS.gondor, pts: [[800, 990], [900, 978], [1010, 972], [1110, 978], [1180, 976], [1198, 1060], [1172, 1142], [1100, 1172], [1000, 1144], [900, 1116], [820, 1084]] },
  { fill: REGION_COLORS.ithilien, pts: [[1178, 856], [1236, 850], [1246, 960], [1244, 1070], [1196, 1068], [1184, 960]] },
  { fill: REGION_COLORS.marsh, pts: [[1120, 800], [1170, 792], [1216, 812], [1200, 842], [1140, 846]] },
  { fill: REGION_COLORS.mordor, pts: [[1252, 820], [1420, 806], [1620, 800], [1620, 1160], [1450, 1150], [1300, 1130], [1256, 1060], [1246, 940]] },
  { fill: REGION_COLORS.mordorDeep, pts: [[1310, 860], [1480, 850], [1580, 870], [1590, 1040], [1440, 1090], [1330, 1060], [1300, 960]], opacity: 0.8 },
]

const RIVERS: { pts: Pt[]; w: number }[] = [
  // Anduin
  { w: 7, pts: [[960, -10], [975, 200], [990, 380], [986, 500], [990, 590], [1006, 680], [1030, 758], [1040, 790], [1050, 836], [1080, 880], [1112, 912], [1150, 955], [1178, 995], [1176, 1060], [1142, 1128], [1112, 1205]] },
  // Silverlode
  { w: 3, pts: [[866, 537], [906, 560], [946, 580], [990, 592]] },
  // Brandywine
  { w: 5, pts: [[320, 150], [346, 240], [362, 298], [360, 326], [372, 420], [360, 560], [300, 720], [240, 846]] },
  // Withywindle
  { w: 2, pts: [[455, 330], [430, 348], [400, 356], [372, 380]] },
  // Hoarwell & Loudwater → Greyflood
  { w: 3, pts: [[650, 170], [668, 344], [684, 470]] },
  { w: 3, pts: [[806, 296], [770, 322], [738, 338], [702, 410], [684, 470]] },
  { w: 4, pts: [[684, 470], [700, 600], [640, 760], [560, 900], [500, 1066]] },
  // Isen
  { w: 3, pts: [[790, 800], [800, 856], [760, 920], [700, 1000], [650, 1120]] },
  // Entwash
  { w: 3, pts: [[880, 730], [930, 744], [1000, 800], [1050, 856], [1084, 884]] },
  // Anduin tributaries in Gondor
  { w: 2, pts: [[900, 1000], [940, 1060], [1000, 1110], [1060, 1150]] },
]

const ROADS: Pt[][] = [
  [[235, 298], [300, 302], [364, 296], [440, 330], [505, 360], [560, 352], [612, 346], [668, 344], [700, 336], [738, 338], [768, 320]],
  [[505, 360], [560, 520], [640, 700], [730, 820], [800, 856], [860, 890], [905, 915], [980, 950], [1045, 975], [1120, 1003]],
]

const MOUNTAIN_RANGES: { pts: Pt[]; spacing: number; size: number; dark?: boolean; seed: number }[] = [
  // Misty Mountains
  { seed: 1, spacing: 20, size: 1.15, pts: [[842, 40], [822, 180], [814, 300], [812, 420], [818, 500], [832, 560], [826, 650], [806, 780]] },
  // White Mountains
  { seed: 2, spacing: 22, size: 1, pts: [[760, 968], [840, 982], [910, 992], [980, 1006], [1050, 1016], [1100, 1022]] },
  // Blue Mountains (서쪽 끝)
  { seed: 3, spacing: 24, size: 0.9, pts: [[120, 60], [140, 170], [132, 226]] },
  { seed: 4, spacing: 24, size: 0.9, pts: [[128, 420], [138, 520], [150, 600]] },
  // Ephel Dúath
  { seed: 5, spacing: 18, size: 1, dark: true, pts: [[1256, 850], [1250, 930], [1252, 1010], [1262, 1090], [1320, 1122], [1420, 1134], [1560, 1112]] },
  // Ered Lithui
  { seed: 6, spacing: 20, size: 0.95, dark: true, pts: [[1280, 824], [1360, 832], [1450, 826], [1590, 812]] },
  // Morgai
  { seed: 7, spacing: 22, size: 0.6, dark: true, pts: [[1320, 1050], [1326, 980], [1334, 920]] },
  // Grey Mountains (북쪽 장식)
  { seed: 8, spacing: 26, size: 0.85, pts: [[900, 70], [1020, 60], [1160, 70], [1300, 60]] },
]

const HILLS: { pts: Pt[]; seed: number }[] = [
  { seed: 11, pts: [[1066, 780], [1092, 796], [1110, 818], [1080, 818]] }, // Emyn Muil
  { seed: 12, pts: [[440, 392], [470, 400], [488, 388]] }, // Barrow-downs
  { seed: 13, pts: [[600, 340], [612, 346]] }, // Weathertop
  { seed: 14, pts: [[690, 322], [712, 318]] }, // Trollshaws
  { seed: 15, pts: [[832, 866], [846, 858]] }, // Dol Baran
]

const FORESTS: { cx: number; cy: number; rx: number; ry: number; n: number; color: string; seed: number; round?: boolean }[] = [
  { cx: 418, cy: 346, rx: 34, ry: 18, n: 26, color: '#86b870', seed: 21 }, // Old Forest
  { cx: 300, cy: 350, rx: 16, ry: 8, n: 8, color: '#9ccf7a', seed: 22 }, // Woody End
  { cx: 880, cy: 726, rx: 48, ry: 34, n: 48, color: '#6fa266', seed: 23 }, // Fangorn
  { cx: 940, cy: 568, rx: 48, ry: 28, n: 34, color: '#e8bd45', seed: 24, round: true }, // Lórien
  { cx: 1130, cy: 300, rx: 70, ry: 170, n: 120, color: '#79a36b', seed: 25 }, // Mirkwood
  { cx: 1045, cy: 968, rx: 22, ry: 10, n: 10, color: '#7fb070', seed: 26 }, // Drúadan
  { cx: 1214, cy: 950, rx: 18, ry: 90, n: 34, color: '#9fce86', seed: 27, round: true }, // Ithilien
  { cx: 540, cy: 340, rx: 18, ry: 10, n: 8, color: '#8fbd76', seed: 28 }, // Chetwood
  { cx: 700, cy: 330, rx: 14, ry: 9, n: 6, color: '#8fbd76', seed: 29 }, // Trollshaws
]

// 손그림 느낌: SVG 필터 대신 도형 자체를 살짝 흔들어 둔다 (확대해도 사라지지 않도록)
const LAND_D = smoothPath(wobble(LAND, true, 101, 26, 4), true)
const REGION_DS = REGIONS.map((r, i) => smoothPath(wobble(r.pts, true, 200 + i, 18, 3), true))
const RIVER_DS = RIVERS.map((r, i) => smoothPath(wobble(r.pts, false, 300 + i, 16, 2.2)))

function Mountain({ x, y, s, dark, flip }: { x: number; y: number; s: number; dark?: boolean; flip?: boolean }) {
  const body = dark ? '#5b3a33' : '#cdb9a5'
  const stroke = dark ? '#3e2621' : '#8c7461'
  const cap = dark ? '#8a5f53' : '#ffffff'
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M -15 9 Q -8 -12 0 -17 Q 6 -13 15 9 Q 0 12 -15 9 Z" fill={body} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M -6 -8 Q -2 -15 0 -17 Q 3 -15 6 -8 Q 3 -10 1 -7 Q -2 -10 -6 -8 Z" fill={cap} />
      <path d="M 3 -10 Q 7 -2 9 7" fill="none" stroke={stroke} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
    </g>
  )
}

function Tree({ x, y, s, color, round }: { x: number; y: number; s: number; color: string; round?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-1.2} y={2} width={2.4} height={5} rx={1} fill="#8a6a4f" />
      {round ? (
        <circle cx={0} cy={-1} r={6} fill={color} stroke="#00000022" strokeWidth={1} />
      ) : (
        <path d="M 0 -9 Q 6 -2 6 3 Q 0 6 -6 3 Q -6 -2 0 -9 Z" fill={color} stroke="#00000022" strokeWidth={1} />
      )}
    </g>
  )
}

function MapBaseInner() {
  const mountains = MOUNTAIN_RANGES.flatMap((range) => {
    const rnd = seeded(range.seed)
    return samplePolyline(range.pts, range.spacing).map(([x, y], i) => ({
      key: `m${range.seed}-${i}`,
      x: x + (rnd() - 0.5) * 10,
      y: y + (rnd() - 0.5) * 10,
      s: range.size * (0.8 + rnd() * 0.45),
      dark: range.dark,
      flip: rnd() > 0.5,
    }))
  }).sort((a, b) => a.y - b.y)

  const hills = HILLS.flatMap((h) => {
    const rnd = seeded(h.seed)
    return h.pts.map(([x, y], i) => ({ key: `h${h.seed}-${i}`, x, y, s: 0.5 + rnd() * 0.2 }))
  })

  const trees = FORESTS.flatMap((f) => {
    const rnd = seeded(f.seed)
    const out = []
    for (let i = 0; i < f.n; i++) {
      const a = rnd() * Math.PI * 2
      const d = Math.sqrt(rnd())
      out.push({
        key: `t${f.seed}-${i}`,
        x: f.cx + Math.cos(a) * d * f.rx,
        y: f.cy + Math.sin(a) * d * f.ry,
        s: 0.8 + rnd() * 0.5,
        color: f.color,
        round: f.round,
      })
    }
    return out
  }).sort((a, b) => a.y - b.y)

  return (
    <g>
      <defs>
        <pattern id="waves" width="46" height="22" patternUnits="userSpaceOnUse">
          <path d="M 4 12 q 5 -6 10 0 q 5 6 10 0" fill="none" stroke="#9fcfdf" strokeWidth="1.6" strokeLinecap="round" />
        </pattern>
        <radialGradient id="doomGlow">
          <stop offset="0%" stopColor="#ff9a5a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff9a5a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 바다 */}
      <rect x={-400} y={-400} width={MAP_W + 800} height={MAP_H + 800} fill={REGION_COLORS.sea} />
      <rect x={-400} y={-400} width={MAP_W + 800} height={MAP_H + 800} fill="url(#waves)" opacity={0.7} />

      {/* 땅 */}
      <path d={LAND_D} fill={REGION_COLORS.land} stroke="#b9a684" strokeWidth={3} />

      {/* 지역 색 */}
      <g>
        {REGIONS.map((r, i) => (
          <path key={i} d={REGION_DS[i]} fill={r.fill} opacity={r.opacity ?? 0.95} stroke="#00000014" strokeWidth={2} />
        ))}
        {/* 아이센가드의 둥근 성벽 */}
        <circle cx={792} cy={815} r={16} fill="#d9d4cf" stroke="#6d6660" strokeWidth={3} />
      </g>

      {/* 길 */}
      {ROADS.map((pts, i) => (
        <path key={i} d={smoothPath(pts)} fill="none" stroke="#c8ae88" strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" />
      ))}

      {/* 강 */}
      <g>
        {RIVERS.map((r, i) => (
          <path key={i} d={RIVER_DS[i]} fill="none" stroke={REGION_COLORS.river} strokeWidth={r.w} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>

      {/* 언덕 */}
      {hills.map((h) => (
        <g key={h.key} transform={`translate(${h.x} ${h.y}) scale(${h.s})`}>
          <path d="M -16 6 Q 0 -14 16 6 Z" fill="#dcc9a8" stroke="#a88f6c" strokeWidth={2} strokeLinejoin="round" />
        </g>
      ))}

      {/* 숲 */}
      {trees.map((t) => (
        <Tree key={t.key} x={t.x} y={t.y} s={t.s} color={t.color} round={t.round} />
      ))}

      {/* 산 */}
      {mountains.map((m) => (
        <Mountain key={m.key} x={m.x} y={m.y} s={m.s} dark={m.dark} flip={m.flip} />
      ))}

      {/* 운명의 산 */}
      <circle cx={1432} cy={944} r={40} fill="url(#doomGlow)" />
      <g transform="translate(1432 958)">
        <path d="M -26 14 Q -12 -10 -6 -22 L 6 -22 Q 12 -10 26 14 Q 0 18 -26 14 Z" fill="#4a2c26" stroke="#2e1a16" strokeWidth={2} strokeLinejoin="round" />
        <path d="M -6 -22 Q 0 -16 6 -22 Q 3 -12 0 -4 Q -3 -12 -6 -22 Z" fill="#ff8a3d" />
        <path d="M 0 -26 q -8 -10 0 -18 q 8 -8 2 -18" fill="none" stroke="#8b7b76" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      </g>

      {/* 검은 탑 */}
      <g transform="translate(1520 900)">
        <path d="M -9 12 L -6 -26 L -2 -32 L 2 -32 L 6 -26 L 9 12 Z" fill="#2f201d" stroke="#1b1110" strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx={0} cy={-26} r={2.4} fill="#ff7a2e" />
      </g>

      {/* 오르상크 */}
      <path d="M 788 822 L 789 798 L 792 792 L 795 798 L 796 822 Z" fill="#2f2c2b" />

      {/* 미나스 티리스 층 */}
      <g transform="translate(1120 1006)">
        <ellipse cx={0} cy={2} rx={16} ry={6} fill="#ffffff" stroke="#9fb0c4" strokeWidth={1.5} />
        <ellipse cx={0} cy={-2} rx={11} ry={4.5} fill="#ffffff" stroke="#9fb0c4" strokeWidth={1.5} />
        <ellipse cx={0} cy={-6} rx={6} ry={3} fill="#ffffff" stroke="#9fb0c4" strokeWidth={1.5} />
        <rect x={-1.2} y={-17} width={2.4} height={11} fill="#ffffff" stroke="#9fb0c4" strokeWidth={1} />
      </g>

      {/* 나침반 */}
      <g transform="translate(1520 150)" opacity={0.75}>
        <circle r={34} fill="#fffaf0" stroke="#c8ae88" strokeWidth={2} />
        <path d="M 0 -28 L 7 0 L 0 28 L -7 0 Z" fill="#e9a8a0" stroke="#b07a72" strokeWidth={1.2} />
        <path d="M -28 0 L 0 -6 L 28 0 L 0 6 Z" fill="#b8d8e8" stroke="#7aa4b8" strokeWidth={1.2} />
        <text y={-38} textAnchor="middle" fontSize={14} fill="#8c7461" className="map-region-label">N</text>
      </g>
    </g>
  )
}

export const MapBase = memo(MapBaseInner)
