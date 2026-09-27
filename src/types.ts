/**
 * 데이터 스키마
 *
 * 날짜는 모두 Appendix B "The Tale of Years" 기준 샤이어력(S.R.) 문자열 "YYYY-MM-DD".
 *   - 제3시대 3018년 = S.R. 1418, 3019년 = S.R. 1419
 *   - Tale of Years는 모든 달을 30일로 셈하므로 "1419-02-30" 같은 날짜도 유효하다.
 *   - 문자열 비교로 시간순 정렬이 가능하다.
 */

export type Confidence = 'low'

export type RegionId =
  | 'shire'
  | 'eriador'
  | 'rivendell'
  | 'moria'
  | 'lorien'
  | 'anduin'
  | 'rohan'
  | 'fangorn'
  | 'isengard'
  | 'gondor'
  | 'ithilien'
  | 'mordor'
  | 'havens'

export interface Location {
  id: string
  nameEn: string
  x: number
  y: number
  region: RegionId
  /** 장소 모습 묘사 (한국어, 2~3문장, 직접 쓴 요약) */
  description: string
  /** 줌아웃 상태에서도 이름표를 보여줄 주요 지명 */
  major?: boolean
  confidence?: Confidence
}

export interface Character {
  id: string
  nameEn: string
  /** 토큰 색 */
  color: string
  /** 토큰 안에 쓰는 이니셜 (1~2자) */
  initial: string
  emoji: string
  group: 'hobbit' | 'fellowship' | 'rohan' | 'gondor' | 'elf' | 'wizard' | 'other'
  /**
   * true면 챕터에 등장하지 않아도 "같은 시각 위치"를 흐린 토큰으로 추적하고 이동 경로를 그린다.
   * false면 해당 챕터에 등장할 때만 지도에 표시한다.
   */
  tracked: boolean
  /** 정체/본명이 밝혀진 뒤부터 쓸 이름 (스포일러 방지용). fromChapter 챕터부터 적용 */
  altName?: { name: string; fromChapter: string }
  /** 인물 소개 페이지용 설명 (첫 등장 시점 기준, 스포일러 없이) */
  intro: string
  /** 지도 토큰 아래 이름표에 쓸 짧은 이름 (없으면 nameEn) */
  label?: string
  /** 귀여운 얼굴 그림용 특징 (실제 외형을 옮기지 않은 오리지널 도식) */
  look: Look
}

export interface Look {
  skin: string
  hair?: string
  hairStyle: 'curly' | 'short' | 'long' | 'wisps' | 'none'
  ears?: 'hobbit' | 'elf'
  beard?: 'long' | 'short' | 'stubble' | 'mustache'
  beardColor?: string
  hat?: 'wizard' | 'crown' | 'helmet' | 'hood' | 'circlet' | 'feather'
  hatColor?: string
  eyes?: 'big' | 'narrow'
  accessory?: 'flower'
}

/** 지도 위 큰 지역 이름표 (클릭하면 설명 표시) */
export interface Region {
  id: string
  nameEn: string
  x: number
  y: number
  size: number
  rotate?: number
  color: string
  description: string
}

export interface StoryEvent {
  characters: string[]
  locationId: string
  /** 사건 날짜 (S.R.). 회상 장면은 실제 일어난 날짜를 쓴다. */
  date: string
  /** 한국어 요약 (직접 작성, 원문 인용 없음) */
  summary: string
  /**
   * 이 사건 이후 (독자가 아는 한) 이야기에서 퇴장하는 인물.
   * 죽음·추락·작별 등. 이후 읽은 챕터에서 다시 등장하면 자동으로 복귀한다.
   */
  exits?: string[]
  confidence?: Confidence
}

export interface Chapter {
  /** 예: "I-01" */
  id: string
  /** 1~6 */
  book: number
  number: number
  titleEn: string
  inStoryDate: {
    start: string
    end: string
  }
  /** 챕터의 주 무대 (하이라이트 & 자동 줌 대상) */
  locations: string[]
  events: StoryEvent[]
  confidence?: Confidence
}
