// 홈: 오늘의 마음 고르기(F1), 지난번처럼, 나의 쉼표 바로가기
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { backgroundById, DEFAULT_SESSION, MOODS, soundById, suggestVerses } from '../src/data/catalog';
import type { Mood } from '../src/data/types';
import { useApp } from '../src/state/AppState';
import { useStartRest } from '../src/state/useStartRest';
import { BigButton, Screen, SectionHeader, ThumbCard } from '../src/ui/components';
import { colors, radius } from '../src/ui/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return '늦은 밤이에요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '오늘 하루 어떠세요';
  return '오늘 하루도 수고했어요';
}

export default function Home() {
  const { ready, lastSession, favorites, ownedPacks, hasPack, setMood, updateDraft } = useApp();
  const startRest = useStartRest();

  const pickMood = (m: Mood) => {
    setMood(m);
    updateDraft({ verseIds: suggestVerses(m, ownedPacks) });
    router.push('/words');
  };

  const last = lastSession ?? DEFAULT_SESSION;
  const lastDesc = last.mix.map((m) => soundById(m.soundId)?.name).filter(Boolean).join(' · ');

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text style={styles.brand}>쉼표 기도</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Text style={styles.gear}>⚙︎</Text>
        </Pressable>
      </View>
      <Text style={styles.hello}>{greeting()}</Text>
      <Text style={styles.helloSub}>잠시 내려놓고, 조용히 쉬어 가요.</Text>

      <View style={styles.quick}>
        <Text style={styles.quickLabel}>{lastSession ? '지난번 쉼' : '처음이라면'}</Text>
        <Text style={styles.quickTitle}>{backgroundById(last.backgroundId)?.name}</Text>
        <Text style={styles.quickDesc} numberOfLines={1}>{lastDesc}</Text>
        <BigButton
          icon="▶"
          label={lastSession ? '지난번처럼' : '바로 쉬기'}
          onPress={() => startRest(last)}
          disabled={!ready}
          style={{ marginTop: 16 }}
        />
      </View>

      <SectionHeader title="오늘의 마음은 어떤가요?" />
      <View style={styles.grid}>
        {MOODS.map((m) => (
          <Pressable key={m.id} onPress={() => pickMood(m.id)} style={({ pressed }) => [styles.mood, pressed && { opacity: 0.75 }]}>
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={styles.moodLabel}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {favorites.length > 0 ? (
        <>
          <SectionHeader title="나의 쉼표" action="모두 보기" onAction={() => router.push('/favorites')} />
          <View style={{ flexDirection: 'row' }}>
            {favorites.slice(0, 2).map((f) => (
              <ThumbCard
                key={f.id}
                image={backgroundById(f.backgroundId)?.thumb ?? backgroundById('bg_rain_window')!.thumb}
                title={f.name}
                subtitle={f.mix.map((m) => soundById(m.soundId)?.name).join(' · ')}
                badge="▶"
                onPress={() => startRest(f)}
                width={160}
                height={120}
              />
            ))}
          </View>
        </>
      ) : (
        <Pressable onPress={() => router.push('/favorites')} style={{ marginTop: 20 }}>
          <Text style={styles.link}>♡ 나의 쉼표 · 저장한 말씀</Text>
        </Pressable>
      )}

      {!hasPack ? (
        <Pressable onPress={() => router.push('/store')} style={styles.packBanner}>
          <Text style={styles.packTitle}>🌙 고요한 밤 팩</Text>
          <Text style={styles.packDesc}>소리·배경·말씀을 더해 보세요. 한 번 구매로 계속 사용해요.</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.textDim, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  gear: { color: colors.textDim, fontSize: 24 },
  hello: { color: colors.text, fontSize: 32, fontWeight: '600', marginTop: 24, letterSpacing: -0.5 },
  helloSub: { color: colors.textDim, fontSize: 16, marginTop: 6 },
  quick: { marginTop: 24, padding: 20, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  quickLabel: { color: colors.textFaint, fontSize: 13 },
  quickTitle: { color: colors.text, fontSize: 22, fontWeight: '600', marginTop: 4 },
  quickDesc: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  mood: { width: '48.5%', height: 84, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 },
  moodEmoji: { fontSize: 26 },
  moodLabel: { color: colors.text, fontSize: 19, fontWeight: '600' },
  link: { color: colors.textDim, fontSize: 16, textAlign: 'center' },
  packBanner: { marginTop: 28, padding: 18, borderRadius: radius.md, backgroundColor: 'rgba(255,217,138,0.12)', borderWidth: 1, borderColor: 'rgba(255,217,138,0.35)' },
  packTitle: { color: colors.gold, fontSize: 17, fontWeight: '600' },
  packDesc: { color: colors.textDim, fontSize: 14, marginTop: 4, lineHeight: 20 },
});
