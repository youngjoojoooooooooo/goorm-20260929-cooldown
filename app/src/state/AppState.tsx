// 앱 전체 상태: 지금 만들고 있는 쉼 설정(draft) + 기기에 저장된 사용자 데이터
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SESSION, LIMITS } from '../data/catalog';
import { DEFAULT_SETTINGS, loadAll, save } from '../data/storage';
import type { Favorite, Mood, Pack, Session, Settings } from '../data/types';
import { refreshOwnedPacks } from '../purchases';

type AppState = {
  ready: boolean;
  mood: Mood | null;
  draft: Session;
  favorites: Favorite[];
  savedVerses: string[];
  lastSession: Session | null;
  ownedPacks: Pack[];
  settings: Settings;
  hasPack: boolean;
  limits: { maxSounds: number; maxFavorites: number };
  setMood: (m: Mood | null) => void;
  updateDraft: (patch: Partial<Session>) => void;
  loadDraft: (s: Session) => void;
  commitSession: (s?: Session) => void;
  addFavorite: (name: string) => Favorite | null;
  removeFavorite: (id: string) => void;
  toggleSavedVerse: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setOwnedPacks: (packs: Pack[]) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const [draft, setDraft] = useState<Session>(DEFAULT_SESSION);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [savedVerses, setSavedVerses] = useState<string[]>([]);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [ownedPacks, setOwned] = useState<Pack[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadAll().then((d) => {
      setFavorites(d.favorites);
      setSavedVerses(d.savedVerses);
      setLastSession(d.lastSession);
      setOwned(d.ownedPacks);
      setSettings(d.settings);
      setDraft({ ...(d.lastSession ?? DEFAULT_SESSION), timerMin: d.lastSession?.timerMin ?? d.settings.defaultTimerMin });
      setReady(true);
    });
    // 인터넷이 있으면 구매 목록을 다시 확인, 없으면 저장값 유지
    refreshOwnedPacks().then((packs) => {
      if (packs) {
        setOwned(packs);
        save('ownedPacks', packs);
      }
    });
  }, []);

  const hasPack = ownedPacks.includes('pack_quiet_night');
  const limits = hasPack ? LIMITS.pack : LIMITS.free;

  const updateDraft = useCallback((patch: Partial<Session>) => setDraft((d) => ({ ...d, ...patch })), []);
  const loadDraft = useCallback((s: Session) => setDraft({ verseIds: s.verseIds, mix: s.mix, backgroundId: s.backgroundId, timerMin: s.timerMin }), []);

  const commitSession = useCallback(
    (s: Session = draft) => {
      setLastSession(s);
      save('lastSession', s);
    },
    [draft],
  );

  const addFavorite = useCallback(
    (name: string) => {
      if (favorites.length >= limits.maxFavorites) return null;
      const fav: Favorite = { ...draft, id: `f${Date.now()}`, name, createdAt: Date.now() };
      const next = [fav, ...favorites];
      setFavorites(next);
      save('favorites', next);
      return fav;
    },
    [draft, favorites, limits.maxFavorites],
  );

  const removeFavorite = useCallback(
    (id: string) => {
      const next = favorites.filter((f) => f.id !== id);
      setFavorites(next);
      save('favorites', next);
    },
    [favorites],
  );

  const toggleSavedVerse = useCallback(
    (id: string) => {
      const next = savedVerses.includes(id) ? savedVerses.filter((v) => v !== id) : [id, ...savedVerses];
      setSavedVerses(next);
      save('savedVerses', next);
    },
    [savedVerses],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      save('settings', next);
    },
    [settings],
  );

  const setOwnedPacks = useCallback((packs: Pack[]) => {
    setOwned(packs);
    save('ownedPacks', packs);
  }, []);

  const value = useMemo(
    () => ({
      ready, mood, draft, favorites, savedVerses, lastSession, ownedPacks, settings, hasPack, limits,
      setMood, updateDraft, loadDraft, commitSession, addFavorite, removeFavorite, toggleSavedVerse, updateSettings, setOwnedPacks,
    }),
    [ready, mood, draft, favorites, savedVerses, lastSession, ownedPacks, settings, hasPack, limits,
      updateDraft, loadDraft, commitSession, addFavorite, removeFavorite, toggleSavedVerse, updateSettings, setOwnedPacks],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}
