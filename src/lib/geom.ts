export type Pt = [number, number]

/** Catmull-Rom → 3차 베지어로 부드러운 곡선 경로 만들기 */
export function smoothPath(points: Pt[], closed = false, tension = 0.5): string {
  if (points.length < 2) return ''
  const p = closed ? [points[points.length - 1], ...points, points[0], points[1]] : [points[0], ...points, points[points.length - 1]]
  let d = `M ${points[0][0]} ${points[0][1]}`
  const t = tension / 3 * 2
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1]
    const [x1, y1] = p[i]
    const [x2, y2] = p[i + 1]
    const [x3, y3] = p[i + 2]
    const c1x = x1 + ((x2 - x0) * t) / 2
    const c1y = y1 + ((y2 - y0) * t) / 2
    const c2x = x2 - ((x3 - x1) * t) / 2
    const c2y = y2 - ((y3 - y1) * t) / 2
    d += ` C ${r(c1x)} ${r(c1y)} ${r(c2x)} ${r(c2y)} ${r(x2)} ${r(y2)}`
  }
  return closed ? d + ' Z' : d
}

const r = (n: number) => Math.round(n * 10) / 10

/** 결정적 난수 (지도가 새로고침마다 바뀌지 않도록) */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** 폴리라인을 따라 일정 간격으로 점 찍기 */
export function samplePolyline(points: Pt[], spacing: number): Pt[] {
  const out: Pt[] = []
  let carry = 0
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[i + 1]
    const len = Math.hypot(bx - ax, by - ay)
    let d = carry
    while (d <= len) {
      out.push([ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len])
      d += spacing
    }
    carry = d - len
  }
  return out
}

/**
 * 폴리라인을 촘촘하게 나눈 뒤 수직 방향으로 살짝 흔들어 손그림 선처럼 만든다.
 * 결정적 난수를 쓰므로 매번 같은 모양이 나온다.
 */
export function wobble(points: Pt[], closed: boolean, seed: number, spacing: number, amp: number): Pt[] {
  const rnd = seeded(seed)
  const pts = closed ? [...points, points[0]] : points
  const out: Pt[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const len = Math.hypot(bx - ax, by - ay)
    const n = Math.max(1, Math.round(len / spacing))
    const nx = -(by - ay) / (len || 1)
    const ny = (bx - ax) / (len || 1)
    for (let k = 0; k < n; k++) {
      const t = k / n
      // 원래 꼭짓점은 그대로 두고 중간 점만 흔든다
      const o = k === 0 ? 0 : (rnd() - 0.5) * 2 * amp
      out.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o])
    }
  }
  if (!closed) out.push(pts[pts.length - 1])
  return out
}
