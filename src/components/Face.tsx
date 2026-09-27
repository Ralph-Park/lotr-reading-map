import type { Character, Look } from '../types'

/**
 * 귀여운 얼굴 그림 (머리 반지름 10, 중심 0,0 기준 SVG 그룹).
 * 실제 외형을 옮긴 것이 아니라 머리색·모자·수염·귀 같은 특징만 살린 오리지널 도식이다.
 */
export function FaceArt({ look }: { look: Look }) {
  const hair = look.hair ?? '#6b4a30'
  const hat = look.hatColor ?? '#888'
  const beard = look.beardColor ?? hair
  const outline = '#00000026'

  return (
    <g>
      {/* 뒤쪽 레이어: 두건, 긴 머리 */}
      {look.hat === 'hood' && <circle cx={0} cy={-1} r={13} fill={hat} stroke={outline} />}
      {look.hairStyle === 'long' && (
        <path d="M -11 -2 Q -11.5 -13 0 -12.5 Q 11.5 -13 11 -2 L 11.5 11 Q 6 14 0 13 Q -6 14 -11.5 11 Z" fill={hair} stroke={outline} />
      )}

      {/* 귀 */}
      {look.ears === 'hobbit' && (
        <>
          <circle cx={-10} cy={1} r={3} fill={look.skin} stroke={outline} />
          <circle cx={10} cy={1} r={3} fill={look.skin} stroke={outline} />
        </>
      )}
      {look.ears === 'elf' && (
        <>
          <path d="M -9 -1 L -15.5 -6 L -10 4 Z" fill={look.skin} stroke={outline} strokeLinejoin="round" />
          <path d="M 9 -1 L 15.5 -6 L 10 4 Z" fill={look.skin} stroke={outline} strokeLinejoin="round" />
        </>
      )}

      {/* 얼굴 */}
      <circle cx={0} cy={0} r={10} fill={look.skin} stroke={outline} />

      {/* 앞머리 */}
      {look.hairStyle === 'curly' &&
        [-9, -6.5, -3.2, 0, 3.2, 6.5, 9].map((x, i) => (
          <circle key={i} cx={x} cy={-7 + Math.abs(x) * 0.28 - (i % 2) * 1.2} r={3.6} fill={hair} />
        ))}
      {(look.hairStyle === 'short' || look.hairStyle === 'long') && look.hat !== 'hood' && (
        <path d="M -10.2 0 Q -11 -11 0 -11 Q 11 -11 10.2 0 Q 8 -6 2 -6.5 Q -1 -4 -4 -6.5 Q -9 -5 -10.2 0 Z" fill={hair} />
      )}
      {look.hairStyle === 'long' && look.hat === 'hood' && (
        <path d="M -9 -1 Q -8 -8.5 0 -8.5 Q 8 -8.5 9 -1 Q 5 -5 0 -5 Q -5 -5 -9 -1 Z" fill={hair} />
      )}
      {look.hairStyle === 'wisps' && (
        <path d="M -3 -9.5 q -1 -4 -3 -5 M 0 -10 q 0 -4 1 -6 M 3 -9.5 q 2 -3 4 -4" fill="none" stroke={hair} strokeWidth={1} strokeLinecap="round" />
      )}

      {/* 수염 */}
      {look.beard === 'long' && (
        <path d="M -8.5 2 Q -9.5 16 0 19.5 Q 9.5 16 8.5 2 Q 5 7 0 7 Q -5 7 -8.5 2 Z" fill={beard} stroke={outline} />
      )}
      {look.beard === 'short' && (
        <path d="M -8.5 2 Q -7.5 11 0 12.5 Q 7.5 11 8.5 2 Q 5 7 0 7 Q -5 7 -8.5 2 Z" fill={beard} stroke={outline} />
      )}
      {look.beard === 'stubble' && (
        <path d="M -7.5 3.5 Q -6 10 0 10.5 Q 6 10 7.5 3.5 Q 4 7.5 0 7.5 Q -4 7.5 -7.5 3.5 Z" fill={beard} opacity={0.45} />
      )}

      {/* 눈 */}
      {look.eyes === 'big' ? (
        <>
          <circle cx={-3.8} cy={0} r={3} fill="#ffffff" stroke="#8a8f7a" strokeWidth={0.6} />
          <circle cx={3.8} cy={0} r={3} fill="#ffffff" stroke="#8a8f7a" strokeWidth={0.6} />
          <circle cx={-3.5} cy={0.4} r={1.6} fill="#5a8a9a" />
          <circle cx={4.1} cy={0.4} r={1.6} fill="#5a8a9a" />
        </>
      ) : look.eyes === 'narrow' ? (
        <>
          <path d="M -5 1 L -2 1" stroke="#3a2e28" strokeWidth={1.3} strokeLinecap="round" />
          <path d="M 2 1 L 5 1" stroke="#3a2e28" strokeWidth={1.3} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={-3.5} cy={0.5} r={1.4} fill="#3a2e28" />
          <circle cx={3.5} cy={0.5} r={1.4} fill="#3a2e28" />
          <circle cx={-3.1} cy={0} r={0.45} fill="#ffffff" />
          <circle cx={3.9} cy={0} r={0.45} fill="#ffffff" />
        </>
      )}

      {/* 볼터치 & 입 */}
      <ellipse cx={-6.3} cy={3.8} rx={2} ry={1.2} fill="#ff8f8f" opacity={0.45} />
      <ellipse cx={6.3} cy={3.8} rx={2} ry={1.2} fill="#ff8f8f" opacity={0.45} />
      {look.beard === 'mustache' && (
        <path d="M -5.5 4.8 Q -2.5 3 0 4.2 Q 2.5 3 5.5 4.8 Q 3 7 0 5.6 Q -3 7 -5.5 4.8 Z" fill={beard} />
      )}
      {look.beard !== 'long' && (
        <path d="M -1.8 5.6 Q 0 7.4 1.8 5.6" fill="none" stroke="#8a4a3a" strokeWidth={0.9} strokeLinecap="round" />
      )}

      {/* 모자·장식 */}
      {look.hat === 'wizard' && (
        <>
          <path d="M -8 -6 L 1 -25 Q 3 -23 4 -21 L 8.5 -6 Z" fill={hat} stroke={outline} strokeLinejoin="round" />
          <path d="M -14 -5.5 Q 0 -10 14 -5.5 Q 12 -2.8 0 -5.2 Q -12 -2.8 -14 -5.5 Z" fill={hat} stroke={outline} />
        </>
      )}
      {look.hat === 'crown' && (
        <path d="M -7 -8 L -7.5 -14.5 L -3.5 -10.5 L 0 -15.5 L 3.5 -10.5 L 7.5 -14.5 L 7 -8 Z" fill={hat} stroke="#b08a2a" strokeWidth={0.8} strokeLinejoin="round" />
      )}
      {look.hat === 'helmet' && (
        <>
          <path d="M -11 -1 Q -11.5 -13.5 0 -13.5 Q 11.5 -13.5 11 -1 Q 6 -4.5 0 -4.5 Q -6 -4.5 -11 -1 Z" fill={hat} stroke={outline} />
          <path d="M 0 -13.5 L 0 -4.5" stroke="#00000030" strokeWidth={1} />
        </>
      )}
      {look.hat === 'hood' && (
        <path d="M -12 3 Q -12.5 -13.5 0 -13.5 Q 12.5 -13.5 12 3 Q 10 -8.5 0 -9 Q -10 -8.5 -12 3 Z" fill={hat} stroke={outline} />
      )}
      {look.hat === 'circlet' && (
        <>
          <path d="M -9.5 -4 Q 0 -9.5 9.5 -4" fill="none" stroke={hat} strokeWidth={1.4} strokeLinecap="round" />
          <circle cx={0} cy={-6.8} r={1.4} fill="#ffffff" stroke={hat} strokeWidth={0.6} />
        </>
      )}
      {look.hat === 'feather' && (
        <>
          <path d="M -8 -7 Q -8 -15 0 -15 Q 8 -15 8 -7 Z" fill={hat} stroke={outline} />
          <ellipse cx={0} cy={-7} rx={13} ry={2.6} fill={hat} stroke={outline} />
          <path d="M 5 -12 Q 12 -20 15 -24 Q 11 -16 7 -11 Z" fill="#f4f1e6" stroke="#b9b39c" strokeWidth={0.6} />
        </>
      )}
      {look.accessory === 'flower' && (
        <g transform="translate(7.5 -7.5)">
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 2} cy={Math.sin((a * Math.PI) / 180) * 2} r={1.6} fill="#ffb3c7" />
          ))}
          <circle r={1.2} fill="#ffe27a" />
        </g>
      )}
    </g>
  )
}

/** 지도 밖(HTML)에서 쓰는 얼굴 아이콘 */
export function FaceIcon({ c, size = 44 }: { c: Character; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-17 -20 34 36" aria-hidden className="shrink-0 overflow-visible">
      <circle cx={0} cy={0} r={15} fill={c.color} opacity={0.35} />
      <FaceArt look={c.look} />
    </svg>
  )
}

/** 토큰 이름표용 짧은 이름 */
export function shortLabel(c: Character, name: string) {
  return c.label ?? name.replace(/\s*\(.*\)$/, '')
}
