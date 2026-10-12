// 쉼 화면(F3): 배경 영상/이미지 위에 말씀을 한 장씩, 20초마다 또는 탭하면 다음 카드.
// 수면 타이머(F6): 끝나기 30초 전부터 소리가 작아지고 화면이 어두워짐.
// 이 화면에는 구매 안내를 절대 띄우지 않습니다.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mixer, useMixerPlaying } from '../audio/mixer';
import { backgroundById, CARD_SECONDS, FADE_SECONDS, KIND_LABEL, verseById } from '../data/catalog';
import type { Background, Verse } from '../data/types';
import { useApp } from '../state/AppState';
import { Sheet } from '../ui/Sheet';
import { colors } from '../ui/theme';

function VideoBackground({ bg }: { bg: Background }) {
  const player = useVideoPlayer(bg.file, (p) => {
    p.loop = true;
    p.muted = true; // 영상은 소리 없이 반복
    p.play();
  });
  // 화면에 붙은 뒤·불러오기가 끝난 뒤에도 한 번 더 재생 (웹 등에서 초기 play()가 무시되는 경우 대비)
  useEffect(() => {
    player.play();
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') player.play();
    });
    return () => sub.remove();
  }, [player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />;
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export default function Rest() {
  const insets = useSafeAreaInsets();
  const { draft, settings, savedVerses, toggleSavedVerse, addFavorite, favorites, limits } = useApp();
  const playing = useMixerPlaying();
  const bg = backgroundById(draft.backgroundId) ?? backgroundById('bg_rain_window')!;
  const verses = draft.verseIds.map(verseById).filter((v): v is Verse => !!v);

  // ── 말씀 카드 넘기기 ──
  const [index, setIndex] = useState(0);
  const [cardOpacity] = useState(() => new Animated.Value(1));
  const next = useCallback(() => {
    if (verses.length < 2) return;
    Animated.timing(cardOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
      setIndex((i) => (i + 1) % verses.length);
      Animated.timing(cardOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    });
  }, [verses.length, cardOpacity]);
  useEffect(() => {
    const t = setInterval(next, CARD_SECONDS * 1000);
    return () => clearInterval(t);
  }, [next, index]);

  // ── 수면 타이머 ──
  const [endsAt, setEndsAt] = useState<number | null>(() => (draft.timerMin ? Date.now() + draft.timerMin * 60_000 : null));
  const [remaining, setRemaining] = useState<number | null>(draft.timerMin ? draft.timerMin * 60 : null);
  const [finished, setFinished] = useState(false);
  const fading = useRef(false);
  const [night] = useState(() => new Animated.Value(0)); // 0 → 1 화면이 완전히 어두워짐

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= FADE_SECONDS && !fading.current) {
        fading.current = true;
        mixer.fadeOut(left, () => setFinished(true));
        Animated.timing(night, { toValue: 1, duration: left * 1000, easing: Easing.linear, useNativeDriver: true }).start();
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt, night]);

  const restart = () => {
    fading.current = false;
    setFinished(false);
    night.stopAnimation();
    night.setValue(0);
    mixer.play();
    setEndsAt(draft.timerMin ? Date.now() + draft.timerMin * 60_000 : null);
  };

  const togglePlay = () => {
    if (finished) return restart();
    if (playing) {
      mixer.cancelFade();
      mixer.pause();
    } else {
      mixer.play();
      if (fading.current) restart();
    }
  };

  const close = () => {
    mixer.stop();
    router.dismissAll();
  };

  // ── 나의 쉼표로 저장 ──
  const [saved, setSaved] = useState<null | 'ok' | 'full'>(null);
  const saveFavorite = () => {
    const name = `${bg.name}의 쉼표`;
    setSaved(addFavorite(name) ? 'ok' : 'full');
  };

  const verse = verses[index % Math.max(1, verses.length)];
  const fs = settings.fontScale;

  return (
    <View style={styles.root}>
      {bg.type === 'video' ? <VideoBackground key={bg.id} bg={bg} /> : <Image source={bg.file} style={StyleSheet.absoluteFill} contentFit="cover" />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: 1 - settings.brightness }]} />
      <View style={[StyleSheet.absoluteFill, styles.vignette]} />

      <Pressable style={styles.tapArea} onPress={next} accessibilityLabel="다음 말씀">
        {verse ? (
          <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
            <Text style={styles.kind}>{KIND_LABEL[verse.kind]}</Text>
            <Text style={[styles.verse, { fontSize: 26 * fs, lineHeight: 42 * fs }]}>{verse.text}</Text>
            {verse.ref ? <Text style={[styles.ref, { fontSize: 16 * fs }]}>{verse.ref}</Text> : null}
            <Pressable onPress={() => toggleSavedVerse(verse.id)} hitSlop={14} style={{ marginTop: 22 }}>
              <Text style={styles.heart}>{savedVerses.includes(verse.id) ? '♥ 저장한 말씀' : '♡ 이 말씀 저장'}</Text>
            </Pressable>
            {verses.length > 1 ? (
              <View style={styles.dots}>
                {verses.map((v, i) => (
                  <View key={v.id} style={[styles.dot, i === index % verses.length && styles.dotOn]} />
                ))}
              </View>
            ) : null}
          </Animated.View>
        ) : (
          <Text style={styles.quiet}>조용히 쉬어 가요</Text>
        )}
      </Pressable>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={close} hitSlop={14} style={styles.circle} accessibilityLabel="쉼 끝내기">
          <Text style={styles.circleIcon}>✕</Text>
        </Pressable>
        <Text style={styles.timer}>{remaining != null ? `☾ ${fmt(remaining)}` : '☾ 타이머 꺼짐'}</Text>
        <Pressable onPress={saveFavorite} hitSlop={14} style={styles.circle} accessibilityLabel="나의 쉼표로 저장">
          <Text style={styles.circleIcon}>♡</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={togglePlay} style={styles.play} accessibilityLabel={playing ? '일시정지' : '재생'}>
          <Text style={styles.playIcon}>{playing ? '❚❚' : '▶'}</Text>
        </Pressable>
      </View>

      <Animated.View style={[StyleSheet.absoluteFill, styles.night, { opacity: night, pointerEvents: finished ? 'auto' : 'none' }]}>
        {finished ? (
          <Pressable style={styles.nightInner} onPress={restart}>
            <Text style={styles.goodnight}>편안한 밤 되세요</Text>
            <Text style={styles.again}>다시 들으려면 화면을 눌러 주세요</Text>
          </Pressable>
        ) : null}
      </Animated.View>

      <Sheet
        visible={saved != null}
        onClose={() => setSaved(null)}
        title={saved === 'ok' ? '나의 쉼표에 저장했어요' : `나의 쉼표는 ${limits.maxFavorites}개까지 저장돼요`}
        message={saved === 'ok' ? '다음에는 홈에서 한 번에 불러올 수 있어요.' : `지금 ${favorites.length}개가 저장되어 있어요. 즐겨찾기 화면에서 정리할 수 있어요.`}
        actions={[{ label: '확인', onPress: () => setSaved(null) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  vignette: { backgroundColor: 'rgba(10,12,40,0.25)' },
  tapArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  card: { alignItems: 'center' },
  kind: { color: colors.gold, fontSize: 14, letterSpacing: 2, marginBottom: 18 },
  verse: { color: '#fff', fontWeight: '500', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 12 },
  ref: { color: 'rgba(255,255,255,0.8)', marginTop: 18, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
  heart: { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { backgroundColor: '#fff', width: 18 },
  quiet: { color: 'rgba(255,255,255,0.8)', fontSize: 22, textAlign: 'center' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  circle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  circleIcon: { color: '#fff', fontSize: 20 },
  timer: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontVariant: ['tabular-nums'] },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  play: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: colors.accentText, fontSize: 26, fontWeight: '700' },
  night: { backgroundColor: '#000' },
  nightInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  goodnight: { color: 'rgba(255,255,255,0.35)', fontSize: 20 },
  again: { color: 'rgba(255,255,255,0.2)', fontSize: 14, marginTop: 10 },
});
