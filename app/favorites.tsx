// 즐겨찾기(F7): "나의 쉼표"(말씀 조합 + 소리 믹스 + 배경)와 따로 저장한 말씀
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { backgroundById, KIND_LABEL, soundById, timerLabel, verseById } from '../src/data/catalog';
import type { Favorite } from '../src/data/types';
import { useApp } from '../src/state/AppState';
import { useStartRest } from '../src/state/useStartRest';
import { Screen, SectionHeader, ThumbCard, Title } from '../src/ui/components';
import { Sheet } from '../src/ui/Sheet';
import { colors, radius } from '../src/ui/theme';

export default function Favorites() {
  const { favorites, savedVerses, removeFavorite, toggleSavedVerse, limits, hasPack } = useApp();
  const startRest = useStartRest();
  const [toDelete, setToDelete] = useState<Favorite | null>(null);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ 처음으로</Text>
      </Pressable>
      <Title sub={hasPack ? '한 번 눌러 바로 쉼을 시작해요.' : `한 번 눌러 바로 쉼을 시작해요 · ${favorites.length}/${limits.maxFavorites}개`}>나의 쉼표</Title>

      {favorites.length === 0 ? (
        <Text style={styles.empty}>쉼 화면 위쪽의 ♡ 를 누르면 지금의 말씀·소리·배경을 한 번에 저장할 수 있어요.</Text>
      ) : (
        favorites.map((f) => (
          <View key={f.id} style={styles.favRow}>
            <ThumbCard image={backgroundById(f.backgroundId)?.thumb ?? backgroundById('bg_rain_window')!.thumb} title="" badge="▶" onPress={() => startRest(f)} width={88} height={88} />
            <Pressable style={{ flex: 1 }} onPress={() => startRest(f)}>
              <Text style={styles.favName}>{f.name}</Text>
              <Text style={styles.favMeta} numberOfLines={1}>{f.mix.map((m) => soundById(m.soundId)?.name).join(' · ') || '소리 없음'}</Text>
              <Text style={styles.favMeta}>말씀 {f.verseIds.length}장 · 타이머 {timerLabel(f.timerMin)}</Text>
            </Pressable>
            <Pressable onPress={() => setToDelete(f)} hitSlop={12}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
        ))
      )}

      <SectionHeader title="저장한 말씀" />
      {savedVerses.length === 0 ? <Text style={styles.empty}>말씀 옆의 ♡ 를 누르면 여기에 모여요.</Text> : null}
      {savedVerses.map(verseById).map((v) =>
        v ? (
          <View key={v.id} style={styles.verse}>
            <View style={{ flex: 1 }}>
              <Text style={styles.verseKind}>{KIND_LABEL[v.kind]}</Text>
              <Text style={styles.verseText}>{v.text}</Text>
              {v.ref ? <Text style={styles.verseRef}>{v.ref}</Text> : null}
            </View>
            <Pressable onPress={() => toggleSavedVerse(v.id)} hitSlop={12}>
              <Text style={styles.heart}>♥</Text>
            </Pressable>
          </View>
        ) : null,
      )}

      <Sheet
        visible={toDelete != null}
        onClose={() => setToDelete(null)}
        title="이 쉼표를 지울까요?"
        message={toDelete?.name}
        actions={[
          { label: '지우기', onPress: () => { if (toDelete) removeFavorite(toDelete.id); setToDelete(null); } },
          { label: '그대로 두기', variant: 'ghost', onPress: () => setToDelete(null) },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.textDim, fontSize: 16, marginBottom: 16 },
  empty: { color: colors.textDim, fontSize: 15, lineHeight: 22 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 12, borderRadius: radius.md, backgroundColor: colors.card, marginBottom: 10 },
  favName: { color: colors.text, fontSize: 18, fontWeight: '600' },
  favMeta: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  remove: { color: colors.textFaint, fontSize: 18, padding: 6 },
  verse: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: colors.card, marginBottom: 10 },
  verseKind: { color: colors.gold, fontSize: 12, marginBottom: 6 },
  verseText: { color: colors.text, fontSize: 16, lineHeight: 24 },
  verseRef: { color: colors.textDim, fontSize: 13, marginTop: 6 },
  heart: { color: colors.text, fontSize: 22 },
});
