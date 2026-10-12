// 소리 믹서(F4) + 배경 고르기(F5) + 수면 타이머(F6)
// 이 화면에 들어오면 바로 소리가 나기 시작합니다 (앱을 열고 3번 안에 소리).
import Slider from '@react-native-community/slider';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mixer, useMixerPlaying } from '../audio/mixer';
import { BACKGROUNDS, isUnlocked, PREVIEW_SECONDS, SOUNDS, TIMER_OPTIONS, timerLabel } from '../data/catalog';
import type { MixItem, Sound } from '../data/types';
import { useApp } from '../state/AppState';
import { BigButton, Chip, Screen, SectionHeader, ThumbCard } from '../ui/components';
import { Sheet } from '../ui/Sheet';
import { colors, radius } from '../ui/theme';

type Notice = null | { kind: 'limit' } | { kind: 'locked'; name: string } | { kind: 'lockedBg' };

export default function MixerScreen() {
  const { draft, updateDraft, ownedPacks, limits, hasPack, commitSession } = useApp();
  const [bgType, setBgType] = useState<'video' | 'image'>('video');
  const [notice, setNotice] = useState<Notice>(null);
  const playing = useMixerPlaying();

  // 화면에 들어오면 지금 믹스를 바로 재생
  useFocusEffect(
    useCallback(() => {
      mixer.setMix(draft.mix);
      if (!mixer.playing) mixer.play();
      return () => mixer.stopPreview();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const setMix = (mix: MixItem[]) => {
    updateDraft({ mix });
    mixer.setMix(mix);
    if (!mixer.playing && mix.length) mixer.play();
  };

  const toggleSound = (s: Sound) => {
    if (!isUnlocked(s.pack, ownedPacks)) {
      mixer.playPreview(s.id);
      return setNotice({ kind: 'locked', name: s.name });
    }
    const on = draft.mix.some((m) => m.soundId === s.id);
    if (on) return setMix(draft.mix.filter((m) => m.soundId !== s.id));
    if (draft.mix.length >= limits.maxSounds) return setNotice({ kind: 'limit' });
    setMix([...draft.mix, { soundId: s.id, volume: 0.6 }]);
  };

  const setVolume = (soundId: string, volume: number, commit: boolean) => {
    mixer.setVolume(soundId, volume);
    if (commit) updateDraft({ mix: draft.mix.map((m) => (m.soundId === soundId ? { ...m, volume } : m)) });
  };

  const start = () => {
    mixer.stopPreview();
    commitSession();
    router.push('/rest');
  };

  const closeNotice = () => {
    mixer.stopPreview();
    setNotice(null);
  };

  return (
    <Screen footer={<BigButton icon="☾" label="쉼 시작하기" onPress={start} />}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ 말씀 조합</Text>
      </Pressable>
      <Text style={styles.title}>소리와 배경</Text>
      <Text style={styles.sub}>
        여러 소리를 함께 틀 수 있어요 · 동시에 {limits.maxSounds}개까지{hasPack ? '' : ' (무료)'}
      </Text>

      <SectionHeader title="소리" action={playing ? '❚❚ 잠시 멈춤' : '▶ 다시 듣기'} onAction={() => (playing ? mixer.pause() : mixer.play())} />
      {SOUNDS.map((s) => {
        const item = draft.mix.find((m) => m.soundId === s.id);
        const locked = !isUnlocked(s.pack, ownedPacks);
        return (
          <View key={s.id} style={[styles.soundRow, item && styles.soundOn]}>
            <Pressable onPress={() => toggleSound(s)} style={styles.soundHead}>
              <Text style={[styles.toggle, item && styles.toggleOn]}>{locked ? '🔒' : item ? '♪' : '+'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.soundName}>{s.name}</Text>
                {locked ? <Text style={styles.soundHint}>{PREVIEW_SECONDS}초 미리듣기 · 고요한 밤 팩</Text> : null}
              </View>
              {item ? <Text style={styles.vol}>{Math.round(item.volume * 100)}</Text> : null}
            </Pressable>
            {item ? (
              <Slider
                style={{ height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={item.volume}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor="rgba(255,255,255,0.25)"
                thumbTintColor={colors.accent}
                onValueChange={(v) => setVolume(s.id, v, false)}
                onSlidingComplete={(v) => setVolume(s.id, v, true)}
              />
            ) : null}
          </View>
        );
      })}

      <SectionHeader title="배경" />
      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        <Chip label="움직이는 영상" active={bgType === 'video'} onPress={() => setBgType('video')} />
        <Chip label="이미지" active={bgType === 'image'} onPress={() => setBgType('image')} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {BACKGROUNDS.filter((b) => b.type === bgType).map((b) => {
          const locked = !isUnlocked(b.pack, ownedPacks);
          return (
            <ThumbCard
              key={b.id}
              image={b.thumb}
              title={b.name}
              badge={b.type === 'video' ? '▶ 영상' : undefined}
              selected={draft.backgroundId === b.id}
              locked={locked}
              onPress={() => (locked ? setNotice({ kind: 'lockedBg' }) : updateDraft({ backgroundId: b.id }))}
              width={120}
              height={200}
            />
          );
        })}
      </ScrollView>

      <SectionHeader title="수면 타이머" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 }}>
        {TIMER_OPTIONS.map((m) => (
          <Chip key={String(m)} label={timerLabel(m)} active={draft.timerMin === m} onPress={() => updateDraft({ timerMin: m })} />
        ))}
      </View>
      <Text style={styles.note}>끝나기 30초 전부터 소리와 화면이 서서히 잦아들어요.</Text>

      <Sheet
        visible={notice != null}
        onClose={closeNotice}
        title={
          notice?.kind === 'limit' ? `동시에 ${limits.maxSounds}개까지 틀 수 있어요` : notice?.kind === 'locked' ? `'${notice.name}' 미리듣기 중` : '고요한 밤 팩의 배경이에요'
        }
        message={
          notice?.kind === 'limit'
            ? '다른 소리를 하나 끄고 골라 주세요. 고요한 밤 팩에서는 5개까지 함께 틀 수 있어요.'
            : notice?.kind === 'locked'
              ? `${PREVIEW_SECONDS}초 동안 들려드려요. 고요한 밤 팩을 열면 계속 들을 수 있어요.`
              : '안개 낀 숲길, 모닥불 배경은 고요한 밤 팩에 들어 있어요.'
        }
        actions={[
          { label: '팩 살펴보기', onPress: () => { closeNotice(); router.push('/store'); } },
          { label: '닫기', variant: 'ghost', onPress: closeNotice },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.textDim, fontSize: 16, marginBottom: 16 },
  title: { color: colors.text, fontSize: 30, fontWeight: '600', letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: 15, marginTop: 6 },
  soundRow: { borderRadius: radius.md, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 10 },
  soundOn: { backgroundColor: colors.cardStrong },
  soundHead: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 },
  toggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', color: colors.text, textAlign: 'center', lineHeight: 40, fontSize: 18, overflow: 'hidden' },
  toggleOn: { backgroundColor: colors.accent, color: colors.accentText },
  soundName: { color: colors.text, fontSize: 18, fontWeight: '500' },
  soundHint: { color: colors.gold, fontSize: 12, marginTop: 2 },
  vol: { color: colors.textDim, fontSize: 14, width: 32, textAlign: 'right' },
  note: { color: colors.textFaint, fontSize: 13, marginTop: 12 },
});

