// 기기 안 저장소(AsyncStorage)에만 저장합니다. 회원가입·서버 없음.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Favorite, Pack, Session, Settings } from './types';

type Schema = {
  favorites: Favorite[];
  savedVerses: string[];
  lastSession: Session | null;
  ownedPacks: Pack[];
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = { defaultTimerMin: 30, brightness: 0.75, fontScale: 1 };

const DEFAULTS: Schema = {
  favorites: [],
  savedVerses: [],
  lastSession: null,
  ownedPacks: [],
  settings: DEFAULT_SETTINGS,
};

export async function load<K extends keyof Schema>(key: K): Promise<Schema[K]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return DEFAULTS[key];
    const value = JSON.parse(raw);
    if (key === 'settings') return { ...DEFAULT_SETTINGS, ...value };
    return value;
  } catch {
    return DEFAULTS[key];
  }
}

export async function save<K extends keyof Schema>(key: K, value: Schema[K]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 앱 사용을 막지 않음
  }
}

export async function loadAll(): Promise<Schema> {
  const [favorites, savedVerses, lastSession, ownedPacks, settings] = await Promise.all([
    load('favorites'),
    load('savedVerses'),
    load('lastSession'),
    load('ownedPacks'),
    load('settings'),
  ]);
  return { favorites, savedVerses, lastSession, ownedPacks, settings };
}
