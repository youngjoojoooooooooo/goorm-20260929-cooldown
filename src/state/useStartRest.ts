// "지난번처럼"·즐겨찾기·바로 쉬기: 한 번 눌러 쉼 화면으로 바로 들어가기
import { router } from 'expo-router';
import { useCallback } from 'react';
import { mixer } from '../audio/mixer';
import { backgroundById, isUnlocked, soundById, verseById } from '../data/catalog';
import type { Session } from '../data/types';
import { useApp } from './AppState';

export function useStartRest() {
  const { ownedPacks, loadDraft, commitSession } = useApp();
  return useCallback(
    (s: Session) => {
      // 환불 등으로 잠긴 콘텐츠가 섞여 있으면 빼고 시작
      const ok = (pack: Parameters<typeof isUnlocked>[0] | undefined) => !!pack && isUnlocked(pack, ownedPacks);
      const bg = backgroundById(s.backgroundId);
      const session: Session = {
        verseIds: s.verseIds.filter((id) => ok(verseById(id)?.pack)),
        mix: s.mix.filter((m) => ok(soundById(m.soundId)?.pack)),
        backgroundId: bg && ok(bg.pack) ? s.backgroundId : 'vid_rain_window',
        timerMin: s.timerMin,
      };
      loadDraft(session);
      commitSession(session);
      mixer.setMix(session.mix);
      mixer.play();
      router.push('/rest');
    },
    [ownedPacks, loadDraft, commitSession],
  );
}
