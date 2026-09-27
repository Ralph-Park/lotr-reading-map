# 🗺️ 중간계 독서 지도

『The Lord of the Rings』(Houghton Mifflin one-volume edition, 영어 원서)를 읽으면서 쓰는 독서 동반자 웹앱입니다.
챕터를 고르면 그 시점에 각 인물이 지도 위 어디에 있고 무엇을 했는지, 장소는 어떤 모습인지 보여 줍니다.
**선택한 챕터 이후의 내용은 나오지 않도록** 설계했습니다.

## 실행하기

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev
```

터미널에 나오는 주소(기본값 http://localhost:5173)를 브라우저에서 열면 됩니다.

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 검사 + 배포용 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리 보기 |
| `npm run validate` | 데이터 정합성 검사 + 검수 필요 항목 목록 출력 |

### 휴대폰에서 보기 (같은 Wi-Fi)

```bash
npm run dev:phone
```

터미널에 `Network: http://192.168.x.x:5173` 형태의 주소가 나옵니다. Mac과 같은 Wi-Fi에 연결된 휴대폰 브라우저에서 그 주소를 열면 됩니다. macOS가 들어오는 연결을 허용할지 물으면 허용하세요. Mac이 켜져 있고 이 명령이 실행 중일 때만 접속됩니다.

## 사용법

- **챕터 검색**: 영문 제목 일부를 입력하세요. 대소문자·악센트·관사(The/A/An)는 무시합니다. 예: `council` → *The Council of Elrond*, `khazad dum` → *The Bridge of Khazad-dûm*
- **인물 소개**: 드롭다운의 `인물 소개`(Book I 앞)에서 등장인물을 볼 수 있습니다. 처음 방문하면 이 페이지부터 열립니다. Book II 이후에 처음 나오는 인물은 스포일러 방지를 위해 접혀 있습니다.
- **드롭다운**: 인물 소개 → Book I~VI → 챕터 순으로 고를 수 있습니다.
- **이전/다음**: 버튼이나 키보드 `[` / `]` 키를 쓰세요.
- **지도**: 드래그 또는 방향키(Shift와 함께 누르면 크게)로 이동, 휠·핀치·＋/－ 버튼·`+`/`-` 키로 천천히 확대/축소합니다. 지도 전체가 보이는 크기보다 작게는 줄어들지 않고, 지도 밖으로 끌려 나가지도 않습니다. 🎯는 챕터 무대로, 🗺️는 전체 지도로 돌아갑니다.
- **장소·지역 설명**: 장소 점이나 Mirkwood·Rohan 같은 지역 이름을 누르면 그 자리에 설명 팝업이 뜹니다. 지금 그곳에 있는 인물도 함께 보여 줍니다. 빈 곳을 누르거나 Esc로 닫습니다.
- **인물 표시**: 지도에서는 인물마다 귀여운 얼굴 그림과 이름표로 표시합니다. 실제 외형이 아니라 머리색·모자·수염 같은 특징만 살린 오리지널 그림입니다(`src/components/Face.tsx`, 특징은 `characters.json`의 `look`).
- **모바일**: 오른쪽 아래 `📖 챕터 정보` 버튼으로 패널을 열고, 위쪽 손잡이나 바깥을 눌러 닫습니다.
- 마지막으로 본 챕터는 브라우저에 기억됩니다.

### 지도 읽는 법

| 표시 | 의미 |
| --- | --- |
| 진한 토큰 | 이번 챕터에 등장하는 인물. 같은 장소에 있는 인물은 말풍선 하나로 묶어서 보여 줍니다. |
| 흐린 점선 토큰 | 이번 챕터에는 없지만 **같은 작중 날짜에** 다른 곳에 있는 인물 (이미 읽은 장을 근거로 함) |
| ❓ 배지 | 그 시각의 행적이 아직 안 읽은 장에서만 나옴 → 마지막으로 알려진 곳에 "?"로 표시 |
| 점선 경로 | 지금까지 읽은 이동 경로 (인물별 색) |
| 노란 원 | 이번 챕터의 무대 |

### 스포일러 방지 규칙

1. 선택한 챕터보다 뒤에 있는 장의 사건·경로는 쓰지 않습니다.
2. 아직 한 번도 등장하지 않은 인물은 지도·필터 목록 어디에도 나오지 않습니다.
3. 독자가 아는 한 퇴장한 인물(예: II-5 이후의 간달프)은 다시 등장하는 장을 읽기 전까지 숨깁니다.
4. 정체가 나중에 밝혀지는 인물은 밝혀지기 전까지 다른 이름으로 표시합니다 (예: Strider → I-10부터 Strider (Aragorn), V-3·V-5의 Dernhelm).
5. **안 읽은 장면 숨기기** (기본값 켬): 끄면 같은 시각의 위치를 안 읽은 장 기준으로도 흐리게 보여 주지만, 무슨 일이 있었는지는 여전히 숨깁니다. 퇴장한 인물은 이 옵션과 관계없이 숨깁니다.

## 데이터 구조

모든 데이터는 `src/data/`의 JSON 파일에 있고, 타입은 `src/types.ts`에 정의되어 있습니다.

- **chapters.json**: Book I~VI 62개 챕터 (Prologue 제외)
  ```jsonc
  {
    "id": "II-02", "book": 2, "number": 2, "titleEn": "The Council of Elrond",
    "inStoryDate": { "start": "1418-10-25", "end": "1418-10-25" },
    "locations": ["rivendell"],          // 하이라이트·자동 줌 대상
    "events": [
      {
        "characters": ["frodo", "gandalf"],
        "locationId": "rivendell",
        "date": "1418-10-25",           // 회상 장면은 실제로 일어난 날짜
        "summary": "한국어 요약",
        "exits": ["gandalf"],           // (선택) 이 사건으로 퇴장하는 인물
        "confidence": "low"             // (선택) 검수 필요
      }
    ]
  }
  ```
- **locations.json**: `{ id, nameEn, x, y, region, description, major?, confidence? }` — 좌표는 1600×1200 지도 기준
- **characters.json**: `{ id, nameEn, color, initial, emoji, group, tracked, altName?, intro }` — `tracked: true`인 인물만 같은 시각 위치와 이동 경로를 추적합니다. `intro`는 인물 소개 페이지 문구(첫 등장 시점 기준)입니다.
- **regions.json**: `{ id, nameEn, x, y, size, rotate?, color, description }` — 지도 위 큰 지역 이름표. 누르면 설명이 나옵니다.

### 날짜

Appendix B "The Tale of Years" 기준의 **샤이어력(S.R.)**을 `"YYYY-MM-DD"`로 씁니다. 제3시대 3018년 = S.R. 1418, 3019년 = S.R. 1419입니다.
Tale of Years는 모든 달을 30일로 세므로 `1419-02-30` 같은 날짜도 유효합니다. I-1(생일 잔치)만 S.R. 1401년입니다.

같은 시각 계산은 **챕터의 `inStoryDate.end`** 시점을 기준으로 합니다. 인물마다 그 날짜까지의 마지막 사건 위치를 찾고, 그 사건이 이미 읽은 장에 있는지 확인합니다 (`src/lib/timeline.ts`).

## 검수 방법

```bash
npm run validate
```

- 인물·장소 id 오타, 날짜 형식, 챕터 수(권별 12/10/11/10/10/9), 챕터 기간을 벗어난 사건 등을 검사합니다.
- `confidence: "low"`가 달린 사건과 장소를 전부 목록으로 보여 줍니다. 날짜나 세부 사항이 확실하지 않은 항목이니 원서와 대조해 확인하고, 맞으면 플래그를 지우면 됩니다.
- 앱에서도 해당 항목에 `confidence: low · 검수 필요` 배지가 붙습니다.

## 콘텐츠 원칙

- 인물·지명은 원서 표기(Strider, Rivendell, Lothlórien 등)를 쓰고, UI와 요약은 한국어로 썼습니다.
- 요약과 장소 묘사는 모두 직접 쓴 짧은 요약이며, 원문 문장을 인용하거나 옮기지 않았습니다.
- 지도는 원작 지도나 영화 이미지를 따라 그리지 않았습니다. 지명의 대략적인 위치 관계만 참고해 새로 그린 도식 지도입니다 (`src/components/MapBase.tsx`).
- 인물은 외형을 그리지 않고 색깔 원형 토큰 + 이니셜로만 표시합니다.

## 폴더 구조

```
src/
  data/            chapters.json, locations.json, characters.json, regions.json
  lib/
    data.ts        JSON 로드, 인덱스, 날짜 포맷
    timeline.ts    챕터 시점의 토큰 배치·경로 계산 (스포일러 규칙)
    search.ts      챕터 제목 검색 (관사·악센트 무시)
    geom.ts        곡선 경로, 결정적 난수
  components/
    MapBase.tsx    정적 지도 (바다·지역색·산맥·숲·강)
    MapView.tsx    줌/팬, 하이라이트, 경로, 인물 토큰
    SidePanel.tsx  챕터 정보, 같은 시각 다른 일행, 필터
    ChapterPicker.tsx  검색·드롭다운·이전/다음
    IntroPage.tsx  등장인물 소개
scripts/validate-data.mjs
```
