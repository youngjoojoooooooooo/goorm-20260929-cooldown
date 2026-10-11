// 앱에 포함된 콘텐츠 목록. 모든 파일은 require()로 설치 파일 안에 들어갑니다 (인터넷 다운로드 없음).
import versesJson from '../../assets/content/verses.json';
import type { Background, Mood, Pack, Session, Sound, Verse, VerseKind } from './types';

export const VERSES = versesJson as Verse[];

export const SOUNDS: Sound[] = [
  { id: 'rain_soft', name: '창밖 빗소리', file: require('../../assets/audio/rain_soft.m4a'), pack: 'free' },
  { id: 'waves_calm', name: '잔잔한 파도', file: require('../../assets/audio/waves_calm.m4a'), pack: 'free' },
  { id: 'fireplace', name: '벽난로', file: require('../../assets/audio/fireplace.m4a'), pack: 'free' },
  { id: 'night_forest', name: '밤 숲·풀벌레', file: require('../../assets/audio/night_forest.m4a'), pack: 'free' },
  { id: 'piano_worship', name: '피아노 예배 연주', file: require('../../assets/audio/piano_worship.m4a'), pack: 'free' },
  { id: 'ambient_pad', name: '기도 앰비언트', file: require('../../assets/audio/ambient_pad.m4a'), pack: 'pack_quiet_night' },
  { id: 'acoustic_guitar', name: '어쿠스틱 기타 묵상', file: require('../../assets/audio/acoustic_guitar.m4a'), pack: 'pack_quiet_night' },
  { id: 'hymn_musicbox', name: '찬송가풍 오르골', file: require('../../assets/audio/hymn_musicbox.m4a'), pack: 'pack_quiet_night' },
];

const IMG = {
  rain_window: require('../../assets/images/bg_rain_window.jpg'),
  moon_sea: require('../../assets/images/bg_moon_sea.jpg'),
  candle: require('../../assets/images/bg_candle.jpg'),
  stars: require('../../assets/images/bg_stars.jpg'),
  misty_forest: require('../../assets/images/bg_misty_forest.jpg'),
  fireplace: require('../../assets/images/bg_fireplace.jpg'),
};

const VID = {
  rain_window: require('../../assets/videos/vid_rain_window.mp4'),
  moon_sea: require('../../assets/videos/vid_moon_sea.mp4'),
  candle: require('../../assets/videos/vid_candle.mp4'),
  stars: require('../../assets/videos/vid_stars.mp4'),
  misty_forest: require('../../assets/videos/vid_misty_forest.mp4'),
  fireplace: require('../../assets/videos/vid_fireplace.mp4'),
};

const THEMES: { key: keyof typeof IMG; name: string; pack: Pack }[] = [
  { key: 'rain_window', name: '빗방울 맺힌 창문', pack: 'free' },
  { key: 'moon_sea', name: '밤바다와 달빛', pack: 'free' },
  { key: 'candle', name: '촛불 하나', pack: 'free' },
  { key: 'stars', name: '별이 뜨는 하늘', pack: 'free' },
  { key: 'misty_forest', name: '안개 낀 숲길', pack: 'pack_quiet_night' },
  { key: 'fireplace', name: '모닥불', pack: 'pack_quiet_night' },
];

export const BACKGROUNDS: Background[] = [
  ...THEMES.map((t) => ({ id: `vid_${t.key}`, name: t.name, type: 'video' as const, file: VID[t.key], thumb: IMG[t.key], pack: t.pack })),
  ...THEMES.map((t) => ({ id: `bg_${t.key}`, name: t.name, type: 'image' as const, file: IMG[t.key], thumb: IMG[t.key], pack: t.pack })),
];

export const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: 'tired', label: '지쳤어요', emoji: '🌙' },
  { id: 'anxious', label: '불안해요', emoji: '🌊' },
  { id: 'hurt', label: '서운해요', emoji: '🍂' },
  { id: 'thankful', label: '감사해요', emoji: '🕯️' },
  { id: 'lonely', label: '외로워요', emoji: '⭐' },
  { id: 'worried', label: '걱정돼요', emoji: '☁️' },
];

export const KIND_LABEL: Record<VerseKind, string> = {
  scripture: '성경 말씀',
  comfort: '위로의 말',
  gratitude: '감사의 말',
};

export const PACKS = {
  pack_quiet_night: {
    id: 'pack_quiet_night' as const,
    entitlement: 'quiet_night',
    name: '고요한 밤 팩',
    price: '4,900원',
    summary: ['소리 3개 추가', '배경 이미지·영상 각 2개 추가', '말씀 50개 추가', '동시 재생 5개까지', '즐겨찾기 무제한'],
  },
};

export const TIMER_OPTIONS: (number | null)[] = [10, 20, 30, 60, null];
export const timerLabel = (m: number | null) => (m == null ? '끄지 않음' : m >= 60 ? `${m / 60}시간` : `${m}분`);

export const LIMITS = {
  free: { maxSounds: 2, maxFavorites: 3 },
  pack: { maxSounds: 5, maxFavorites: Infinity },
};

export const PREVIEW_SECONDS = 10;
export const CARD_SECONDS = 20;
export const FADE_SECONDS = 30;

export const verseById = (id: string) => VERSES.find((v) => v.id === id);
export const soundById = (id: string) => SOUNDS.find((s) => s.id === id);
export const backgroundById = (id: string) => BACKGROUNDS.find((b) => b.id === id);

export const isUnlocked = (pack: Pack, owned: Pack[]) => pack === 'free' || owned.includes(pack);

// 처음 쓰는 사람도 바로 소리가 나도록 정해 둔 기본 쉼 설정
export const DEFAULT_SESSION: Session = {
  verseIds: ['v001', 'c001', 'g001'],
  mix: [{ soundId: 'rain_soft', volume: 0.7 }, { soundId: 'piano_worship', volume: 0.4 }],
  backgroundId: 'vid_rain_window',
  timerMin: 30,
};

const pick = <T,>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];

// 마음에 맞는 말씀을 종류별로 1개씩 골라 조합 (F1 + F2 섞기)
export function suggestVerses(mood: Mood | null, owned: Pack[]): string[] {
  const kinds: VerseKind[] = ['scripture', 'comfort', 'gratitude'];
  return kinds
    .map((kind) => {
      const pool = VERSES.filter((v) => v.kind === kind && isUnlocked(v.pack, owned));
      const matched = mood ? pool.filter((v) => v.moods.includes(mood)) : [];
      return pick(matched.length ? matched : pool)?.id;
    })
    .filter((id): id is string => !!id);
}
