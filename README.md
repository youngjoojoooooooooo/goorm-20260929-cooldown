<p align="center">
  <img src="docs/screenshots/01_home.png" width="24%" alt="홈 화면" />
  <img src="docs/screenshots/02_rest.webp" width="24%" alt="쉼 화면" />
  <img src="docs/screenshots/03_words.png" width="24%" alt="말씀 조합 화면" />
  <img src="docs/screenshots/04_home_2.png" width="24%" alt="홈 화면 (마음 고르기)" />
</p>

# 포즈스케이프 (MVP)

유독 힘든 날 퇴근 후, 짧은 말씀 몇 줄과 잔잔한 소리·배경 화면으로 10분 동안 몸과 마음을 가라앉히는 앱입니다.
교회에 다니는 25~45세 직장인을 위해 만들었습니다. **비행기 탑승 모드(인터넷 없음)에서도 모든 무료 기능과 이미 산 유료 팩이 그대로 동작**하는 것이 핵심 조건입니다.

## 저장소 구성

| 위치 | 내용 |
|---|---|
| [`index.html`](index.html) | 제품 소개 페이지. 이미지까지 들어 있는 단일 HTML 파일이라 브라우저로 바로 열립니다 |
| [`app/`](app) | 모바일 앱 (Expo 프로젝트) |
| [`docs/screenshots/`](docs/screenshots) | README에 쓰는 앱 화면 |

- 앱 틀: Expo SDK 57 + Expo Router (React Native 0.86, TypeScript)
- 소리 `expo-audio` · 배경 영상 `expo-video` · 이미지 `expo-image` · 저장 `AsyncStorage` · 결제 RevenueCat(`react-native-purchases`)

## 실행 방법

```bash
cd app
npm install
npx expo start          # 휴대폰의 Expo Go 또는 웹(w)으로 확인
npx tsc --noEmit        # 타입 검사
npx expo lint           # 린트
```

결제(RevenueCat)는 Expo Go에서 동작하지 않으므로 개발 빌드(`npx expo run:ios` 또는 `eas build --profile development`)가 필요합니다.
`app/.env.example`을 `app/.env`로 복사해 RevenueCat 키를 넣습니다. 키가 없으면 개발 중에만 **테스트 구매**로 잠금 해제를 흉내 냅니다.

## 1차 작업: MVP 구현

### 기능 (명세서 F1~F9)

| ID | 기능 | 구현 위치 |
|---|---|---|
| F1 | 오늘의 마음 6개(지쳤어요·불안해요·서운해요·감사해요·외로워요·걱정돼요) → 맞는 말씀이 먼저 보임 | `app/src/app/index.tsx`, `suggestVerses()` |
| F2 | 성경·위로·감사에서 각 0~1개, 최대 3장 조합 + 섞기 | `app/src/app/words.tsx` |
| F3 | 배경 위에 말씀을 큰 글씨로 한 장씩, 20초마다 또는 탭하면 다음 카드 | `app/src/app/rest.tsx` |
| F4 | 소리 8개 믹서, 소리별 볼륨, 동시 재생 무료 2개 / 팩 5개 | `app/src/app/mixer.tsx`, `app/src/audio/mixer.ts` |
| F5 | 배경 이미지 6개 + 영상 6개(소리 없이 반복) | `app/src/app/mixer.tsx` |
| F6 | 수면 타이머 10·20·30분·1시간·끄지 않음, 끝나기 30초 전부터 소리·화면 페이드 | `app/src/app/rest.tsx` |
| F7 | "나의 쉼표"(말씀+소리+배경) 저장(무료 3개) + 말씀 하나만 따로 저장 | `app/src/app/favorites.tsx` |
| F8 | 고요한 밤 팩(`pack_quiet_night`, 권한 `quiet_night`) 1회 구매·구매 복원 | `app/src/app/store.tsx`, `app/src/purchases.ts` |
| F9 | 백그라운드·잠금화면 재생 설정 (P1) | `app/src/audio/mixer.ts`, `app/app.json` |

- **3번 안에 소리:** 마음 고르기 → "다음"을 누르면 믹서 화면에서 바로 소리가 납니다. 두 번째 방문부터는 **"지난번처럼"** 한 번으로 쉼 화면에 들어갑니다.
- **잠긴 콘텐츠:** 잠긴 소리를 누르면 10초 미리듣기와 팩 안내가 나옵니다. 쉼 화면에는 구매 안내를 띄우지 않습니다.
- **오프라인:** 모든 소리·이미지·영상·말씀을 `require()`로 앱 안에 포함했습니다. 인터넷을 쓰는 코드는 `app/src/purchases.ts`뿐이고, 구매 목록은 기기에 저장해 오프라인에서도 잠금이 풀린 상태를 유지합니다. 새 팩 구매 시 연결이 없으면 "구매는 인터넷 연결 후 가능해요"라고 안내합니다.
- **설정:** 기본 타이머, 쉼 화면 밝기, 말씀 글자 크기, 만든 사람·출처 페이지(`app/src/app/settings.tsx`).

### 콘텐츠

| 종류 | 내용 | 확보 방법 |
|---|---|---|
| 소리 8개 (무료 5 + 팩 3) | 빗소리·파도·벽난로·밤 숲 / 피아노·앰비언트·기타·오르골 | 자연음 4개는 코드로 합성(`app/tools/gen_ambient.swift`), 음악 4개는 직접 만든 CCM 합성 음원을 AAC(.m4a)로 변환 |
| 배경 이미지 6 + 영상 6 | 빗방울 창문·밤바다·촛불·별하늘 / 안개 숲길·모닥불(팩) | 코드로 직접 그림(`app/tools/gen_visuals.swift`), 영상은 720×1280 H.264 16초 무음 루프 |
| 말씀 90개 (무료 40 + 팩 50) | 성경 40 · 위로 25 · 감사 25, 마음 태그 1~2개 | 성경은 개역한글 본문, 위로·감사는 직접 작성 (`app/assets/content/verses.json`) |

모든 파일의 출처·라이선스는 `app/assets/credits.json`에 기록했습니다. 코드로 만든 콘텐츠는 출시 전에 실제 녹음본이나 Pexels·Pixabay 자료로 바꿀 수 있는 **임시 자료**입니다.

### 프로젝트 구조

```
index.html                # 제품 소개 페이지 (단일 HTML)
docs/screenshots/         # README용 화면
app/                      # 모바일 앱 (Expo 프로젝트 루트)
  src/
    app/                  # 화면 (Expo Router)
      _layout.tsx         # 전체 내비게이션, 오디오 모드 초기화
      index.tsx           # 홈: 오늘의 마음, 지난번처럼
      words.tsx           # 말씀 조합
      mixer.tsx           # 소리 믹서 + 배경 고르기 + 타이머
      rest.tsx            # 쉼 화면 (배경 + 말씀 + 타이머)
      favorites.tsx       # 나의 쉼표, 저장한 말씀
      store.tsx           # 콘텐츠 팩
      settings.tsx        # 설정, 만든 사람·출처
    audio/mixer.ts        # 플레이어 관리, 볼륨, 페이드, 잠금화면 연동, 미리듣기
    data/catalog.ts       # 소리·배경·마음 목록과 require() 연결
    data/storage.ts       # AsyncStorage 읽기·쓰기
    data/types.ts         # 데이터 모델
    state/AppState.tsx    # 앱 상태 (지금 설정 + 저장된 사용자 데이터)
    purchases.ts          # RevenueCat, 구매 목록 캐시
    ui/                   # 공통 컴포넌트, 테마, 안내 시트
  assets/                 # audio/ images/ videos/ content/verses.json credits.json
  tools/                  # 소리·배경을 다시 만드는 Swift 스크립트
  CLAUDE.md               # AI에게 주는 프로젝트 규칙 (명세서 요약)
```

## 1차 작업 오류 수정 사항

| 문제 | 원인 | 수정 |
|---|---|---|
| 쉼 화면에서 배경 영상이 첫 프레임에서 멈춤 (웹) | `useVideoPlayer` 초기 설정에서 호출한 `play()`가 영상이 화면에 붙기 전이라 무시됨 | 화면에 붙은 뒤와 `statusChange`가 `readyToPlay`일 때 한 번 더 `play()` 호출 (`app/src/app/rest.tsx`) |
| 쉼 화면에서 탭·저장·닫기 버튼이 반응하지 않음 | 타이머 끝에 화면을 어둡게 하는 투명 층의 `pointerEvents` prop이 웹에서 무시되어 모든 터치를 가로챔 | `pointerEvents`를 style 안으로 옮김 |
| 린트 오류: 렌더 중 ref 접근 (`react-hooks/refs`) | `useRef(new Animated.Value()).current` 패턴 | `useState(() => new Animated.Value())`로 변경 |
| 타입 오류: `StyleSheet.absoluteFillObject` 없음 | RN 0.86에서 제거됨 | position 값을 직접 지정 |
| `expo-doctor`: 필수 peer dependency 누락 | `expo-audio`가 `expo-asset`을 요구 | `npx expo install expo-asset` |
| 라우트 파일에서 default 외 export 경고 | `mixer.tsx`에서 `timerLabel` 등을 export | 공용 함수는 `app/src/data/catalog.ts`로 이동 |
| 잠금화면 정지 시 일부 소리만 멈춤 | 잠금화면은 플레이어 하나만 제어 가능 | 대표 플레이어 상태 변화를 감지해 나머지 플레이어도 함께 재생/정지 (`app/src/audio/mixer.ts`) |

## 2차 작업: 이름 변경 · 소개 페이지 · 폴더 정리

### 주요 내용

| 작업 | 내용 |
|---|---|
| 앱 이름 변경 | "쉼표 기도" → **포즈스케이프**. 앱 이름(`app/app.json`), 홈 상단, 설정 안내 문구, 잠금화면 재생 정보 제목, README·CLAUDE.md 제목을 바꿈. 즐겨찾기 기능 이름 "나의 쉼표"와 내부 식별자(slug, 번들 ID `com.shympyo.prayer`)는 그대로 둠 |
| 제품 소개 페이지 | 저장소 최상위 [`index.html`](index.html). 첫 화면(휴대폰 안에서 말씀 카드가 넘어가는 쉼 화면), 3단계 사용 방법과 마음 고르기 체험, 핵심 기능 6가지와 타이머 그림, 실제 앱 화면, 무료/고요한 밤 팩 요금, 약속 3가지, 출시 알림 신청과 스토어 출시 예정 표시 |
| 단일 파일 | 앱 배경 그림과 화면 캡처를 이미지 데이터로 파일 안에 넣어(약 500KB) 이 파일 하나만으로 열림. 글꼴은 Google Fonts(고운바탕, IBM Plex Sans KR)를 쓰고, 연결이 없으면 기기 글꼴로 대체 |
| 폴더 정리 | 앱 전체를 `app/`으로 옮기고, 화면 파일은 `app/src/app/`에 둠. 최상위에는 소개 페이지·README·스크린샷만 남김 |

### 오류·문제 수정

| 문제 | 원인 | 수정 |
|---|---|---|
| 앱을 `app/`으로 옮기면 화면 폴더가 `app/app/`으로 겹침 | Expo Router는 프로젝트 안의 `app/` 폴더를 화면 폴더로 씀 | Expo Router가 함께 인식하는 `src/app/`으로 화면 파일을 옮김 |
| 화면 파일의 import 경로가 깨짐 | 화면 파일 위치가 `src/` 안으로 바뀜 | `../src/...` → `../...`, `../assets/...` → `../../assets/...`로 고침 |
| 자동 생성 네이티브 폴더가 git에 올라갈 수 있음 | `.gitignore`의 `/ios`, `/android`가 최상위 기준 | `/app/ios`, `/app/android`로 고침 |
| 문서의 파일 경로가 옛 위치를 가리킴 | 폴더 이동 | README·`app/CLAUDE.md`·`app/AGENTS.md` 경로를 새 구조로 고침 |
| 소개 페이지의 성경 구절이 중간을 생략한 채 인용됨 | 이사야 40:31을 짧게 줄이면서 생략 표시 없이 뺌 | 앱에 들어 있는 원문 그대로인 출애굽기 33:14로 바꿈 |
| 미리보기 서버가 꺼져 화면 확인이 안 됨 | 이전 실행이 종료됨 | 서버를 다시 띄워 이름 변경(탭 제목·홈 상단)과 새 위치 실행을 확인 |

옮긴 뒤 `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`(21/21)를 모두 통과했고, 웹 미리보기에서 화면이 오류 없이 열리는 것을 확인했습니다.

> 소개 페이지의 출시 알림 신청 칸은 아직 아무 곳에도 연결되지 않았습니다. 화면에 안내만 나오고 이메일은 저장·전송되지 않으므로, 메일링 서비스 주소를 연결해야 실제로 신청을 받을 수 있습니다.

## 남은 일 (실제 기기 확인 필요)

- [ ] 소리 3개 동시 재생 + 화면 끔 상태로 1시간 재생 시 끊김 없음 (iOS·안드로이드)
- [ ] 잠금화면 재생·정지, 전화·알람 뒤 재생 이어짐
- [ ] 타이머 종료 시 소리가 서서히 작아지고 완전히 멈춤
- [ ] 개발 빌드 + 샌드박스 계정으로 구매·복원, 구매 후 비행기 모드 재실행
- [ ] 성경 본문을 개역한글 원문과 대조 교정, 번역본 사용 조건 대한성서공회 확인
- [ ] 위로·감사 문구 목회자 검토
- [ ] 한글 폰트 파일 포함 (현재 시스템 폰트 사용)
- [ ] 소개 페이지의 출시 알림 신청을 메일링 서비스에 연결
- [ ] 합성 음원·코드 배경을 고품질 녹음본·사진/영상으로 교체 후 `credits.json` 갱신
