export type Pack = 'free' | 'pack_quiet_night'; // 팩을 늘리면 여기에 추가

export type Mood = 'tired' | 'anxious' | 'hurt' | 'thankful' | 'lonely' | 'worried';

export type VerseKind = 'scripture' | 'comfort' | 'gratitude';

export type Verse = {
  id: string;
  kind: VerseKind;
  text: string;
  ref?: string; // 성경 구절 표기, 예: '마태복음 11:28'
  moods: Mood[];
  pack: Pack;
};

export type Sound = { id: string; name: string; file: number; pack: Pack };

export type Background = {
  id: string;
  name: string;
  type: 'image' | 'video';
  file: number;
  thumb: number; // 고르기 화면에 쓰는 미리보기 이미지
  pack: Pack;
};

export type MixItem = { soundId: string; volume: number };

// 쉼 화면 한 번을 이루는 설정. lastSession, 즐겨찾기가 모두 이 형태를 씁니다.
export type Session = {
  verseIds: string[];
  mix: MixItem[];
  backgroundId: string;
  timerMin: number | null; // null = 끄지 않음
};

export type Favorite = Session & { id: string; name: string; createdAt: number };

export type Settings = {
  defaultTimerMin: number | null;
  brightness: number; // 쉼 화면 배경 밝기 0.3~1
  fontScale: number; // 1 = 기본
};
