// 말씀 조합(F2): 성경·위로·감사에서 각 0~1개, 최대 3장. 마음에 맞는 말씀이 먼저 보임(F1)
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isUnlocked, KIND_LABEL, MOODS, suggestVerses, verseById, VERSES } from '../src/data/catalog';
import type { Verse, VerseKind } from '../src/data/types';
import { useApp } from '../src/state/AppState';
import { BigButton, Chip, Screen, Title } from '../src/ui/components';
import { Sheet } from '../src/ui/Sheet';
import { colors, radius } from '../src/ui/theme';

const KINDS: VerseKind[] = ['scripture', 'comfort', 'gratitude'];

export default function Words() {
  const { mood, draft, updateDraft, ownedPacks, savedVerses, toggleSavedVerse } = useApp();
  const [tab, setTab] = useState<VerseKind>('scripture');
  const [lockedNotice, setLockedNotice] = useState(false);
  const moodLabel = MOODS.find((m) => m.id === mood)?.label;

  const selected = draft.verseIds.map(verseById).filter((v): v is Verse => !!v);

  const list = useMemo(() => {
    const ofKind = VERSES.filter((v) => v.kind === tab);
    const score = (v: Verse) => (isUnlocked(v.pack, ownedPacks) ? 0 : 2) + (mood && v.moods.includes(mood) ? 0 : 1);
    return [...ofKind].sort((a, b) => score(a) - score(b));
  }, [tab, mood, ownedPacks]);

  const toggle = (v: Verse) => {
    if (!isUnlocked(v.pack, ownedPacks)) return setLockedNotice(true);
    const others = draft.verseIds.filter((id) => verseById(id)?.kind !== v.kind);
    const already = draft.verseIds.includes(v.id);
    const next = already ? others : [...others, v.id];
    // 성경 → 위로 → 감사 순서로 보여 줌
    next.sort((a, b) => KINDS.indexOf(verseById(a)!.kind) - KINDS.indexOf(verseById(b)!.kind));
    updateDraft({ verseIds: next });
  };

  return (
    <Screen footer={<BigButton label="다음 · 소리 고르기" onPress={() => router.push('/mixer')} />}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ 처음으로</Text>
      </Pressable>
      <Title sub={moodLabel ? `'${moodLabel}' 마음에 닿는 말씀을 먼저 모았어요.` : '마음에 닿는 문장을 골라 조합해 보세요.'}>말씀 조합</Title>

      <View style={styles.comboBox}>
        <View style={styles.comboHead}>
          <Text style={styles.comboTitle}>나의 조합 {selected.length}/3</Text>
          <Pressable onPress={() => updateDraft({ verseIds: suggestVerses(mood, ownedPacks) })} hitSlop={10} style={styles.shuffle}>
            <Text style={styles.shuffleLabel}>⤮ 섞기</Text>
          </Pressable>
        </View>
        {selected.length === 0 ? <Text style={styles.empty}>아래에서 골라 주세요. 말씀 없이 소리만 들어도 괜찮아요.</Text> : null}
        {selected.map((v) => (
          <Text key={v.id} style={styles.comboLine} numberOfLines={2}>
            <Text style={{ color: colors.gold }}>{KIND_LABEL[v.kind]}  </Text>
            {v.text}
          </Text>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20, marginBottom: 12 }}>
        {KINDS.map((k) => (
          <Chip key={k} label={KIND_LABEL[k]} active={tab === k} onPress={() => setTab(k)} />
        ))}
      </ScrollView>

      {list.map((v) => {
        const isSel = draft.verseIds.includes(v.id);
        const locked = !isUnlocked(v.pack, ownedPacks);
        const saved = savedVerses.includes(v.id);
        return (
          <Pressable key={v.id} onPress={() => toggle(v)} style={[styles.card, isSel && styles.cardSel, locked && { opacity: 0.55 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardText}>{v.text}</Text>
              {v.ref ? <Text style={styles.cardRef}>{v.ref}</Text> : null}
              {mood && v.moods.includes(mood) && !locked ? <Text style={styles.match}>지금 마음에 맞는 말씀</Text> : null}
            </View>
            <View style={styles.cardSide}>
              {locked ? (
                <Text style={styles.icon}>🔒</Text>
              ) : (
                <>
                  <Text style={[styles.radio, isSel && styles.radioOn]}>{isSel ? '✓' : ''}</Text>
                  <Pressable onPress={() => toggleSavedVerse(v.id)} hitSlop={10}>
                    <Text style={styles.icon}>{saved ? '♥' : '♡'}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        );
      })}

      <Sheet
        visible={lockedNotice}
        title="고요한 밤 팩의 말씀이에요"
        message="팩을 열면 말씀 50개와 소리·배경이 더해져요."
        onClose={() => setLockedNotice(false)}
        actions={[
          { label: '팩 살펴보기', onPress: () => { setLockedNotice(false); router.push('/store'); } },
          { label: '닫기', variant: 'ghost', onPress: () => setLockedNotice(false) },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.textDim, fontSize: 16, marginBottom: 16 },
  comboBox: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.cardStrong, gap: 10 },
  comboHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comboTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  shuffle: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  shuffleLabel: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
  empty: { color: colors.textDim, fontSize: 14 },
  comboLine: { color: colors.text, fontSize: 15, lineHeight: 22 },
  card: { flexDirection: 'row', gap: 12, padding: 18, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 10 },
  cardSel: { borderColor: colors.accent, backgroundColor: colors.cardStrong },
  cardText: { color: colors.text, fontSize: 17, lineHeight: 26 },
  cardRef: { color: colors.textDim, fontSize: 14, marginTop: 6 },
  match: { color: colors.gold, fontSize: 12, marginTop: 6 },
  cardSide: { alignItems: 'center', justifyContent: 'space-between', minHeight: 64 },
  radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.textFaint, textAlign: 'center', lineHeight: 24, color: colors.accentText, fontWeight: '700', overflow: 'hidden' },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  icon: { color: colors.text, fontSize: 22 },
});
