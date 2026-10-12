@AGENTS.md

# 포즈스케이프 — 프로젝트 규칙 (MVP 기술명세서 요약)

## 무엇을 만드나
유독 힘든 날 퇴근 후, 짧은 말씀 몇 줄과 잔잔한 소리·배경 화면으로 10분 동안 몸과 마음을 가라앉히는 앱.
대상: 교회에 다니는 25~45세 직장인. Expo(React Native) + Expo Router, iOS·안드로이드.

## 절대 규칙
- **인터넷 호출 금지.** 예외는 `src/purchases.ts`(RevenueCat 결제)뿐. 분석·광고·웹 폰트·원격 이미지 금지.
- **모든 콘텐츠 파일은 `require()`로 앱에 포함.** 다운로드 없음. 유료 팩 파일도 앱에 들어 있고 잠금 표시만 함.
- 사용자 데이터는 AsyncStorage(`src/data/storage.ts`)에만. 회원가입·서버 없음. 기도 내용·일기 같은 민감한 글은 받지 않음.
- 비행기 모드에서 무료 기능과 이미 산 팩이 아무 안내 없이 그대로 동작해야 함. 새 팩 구매 시에만 "구매는 인터넷 연결 후 가능해요".
- **쉼 화면(`src/app/rest.tsx`)에는 구매 안내를 절대 띄우지 않음.**
- 화면 원칙: 버튼은 크게, 글자는 적게, 어두운 배경. 앱을 열고 3번 안에 소리가 나와야 함.
- 콘텐츠를 추가·교체하면 `assets/credits.json`에 출처·라이선스·날짜를 반드시 기록.
- 앱 설명·화면에 의료 효능 표현("불면증 치료", "불안 해소") 금지. "편안한 밤을 위한" 수준만.

## 기능 (P0 = 출시 필수)
| ID | 기능 | 위치 |
|---|---|---|
| F1 | 오늘의 마음 6개 → 맞는 말씀 먼저 | `src/app/index.tsx`, `suggestVerses()` |
| F2 | 성경·위로·감사 각 0~1개, 최대 3장 조합 + 섞기 | `src/app/words.tsx` |
| F3 | 배경 위 말씀 한 장씩, 20초 또는 탭으로 넘김 | `src/app/rest.tsx` |
| F4 | 소리 8개 믹서, 소리별 볼륨, 무료 동시 2개 / 팩 5개 | `src/app/mixer.tsx`, `src/audio/mixer.ts` |
| F5 | 배경 이미지 6 + 영상 6(소리 없이 반복) | `src/app/mixer.tsx` |
| F6 | 타이머 10·20·30분·1시간·끄지 않음, 끝 30초 페이드 | `src/app/rest.tsx` |
| F7 | "나의 쉼표" 저장(무료 3개) + 말씀 따로 저장 | `src/app/favorites.tsx` |
| F8 | 고요한 밤 팩(pack_quiet_night, entitlement quiet_night) 1회 구매·복원 | `src/app/store.tsx`, `src/purchases.ts` |
| F9 (P1) | 백그라운드·잠금화면 재생 | `src/audio/mixer.ts` |

잠긴 소리를 누르면 10초 미리듣기 + 팩 안내. "지난번처럼" 버튼으로 한 번에 쉼 화면.

## 데이터 모델
- 콘텐츠(읽기 전용): `src/data/types.ts` — `Verse`, `Sound`, `Background`, `Pack`. 목록은 `src/data/catalog.ts`, 말씀은 `assets/content/verses.json`(90개: 성경 40, 위로 25, 감사 25 / 무료 40, 팩 50).
- 사용자 데이터(AsyncStorage 키): `favorites`, `savedVerses`, `lastSession`, `ownedPacks`, `settings`.

## 오디오 (expo-audio)
- 소리마다 플레이어 1개, `loop = true`, `volume` 0~1. 앱 시작 시 `setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: 'doNotMix' })`.
- 안드로이드는 잠금화면 컨트롤이 없으면 ~3분 뒤 멈추므로 대표 플레이어 하나에 `setActiveForLockScreen`. 잠금화면에서 멈추면 나머지도 함께 멈춤.

## 결제
- RevenueCat은 Expo Go에서 동작하지 않음 → 개발 빌드 필요. 키는 `.env`의 `EXPO_PUBLIC_RC_IOS_KEY`/`EXPO_PUBLIC_RC_ANDROID_KEY`.
- 키가 없으면 개발 중(__DEV__)에만 "테스트 구매"로 잠금 해제를 흉내 냄.

## 콘텐츠 재생성
- 자연음 4종: `swift tools/gen_ambient.swift <폴더>` → `afconvert -f m4af -d aac -b 160000`
- 배경 이미지·영상: `swift tools/gen_visuals.swift assets/images assets/videos`
