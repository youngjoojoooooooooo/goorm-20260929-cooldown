// 설정 + 만든 사람·출처
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import credits from '../assets/credits.json';
import { TIMER_OPTIONS, timerLabel } from '../src/data/catalog';
import { useApp } from '../src/state/AppState';
import { Chip, Screen, SectionHeader, Title } from '../src/ui/components';
import { colors, radius } from '../src/ui/theme';

const BRIGHTNESS = [
  { v: 0.5, label: '어둡게' },
  { v: 0.75, label: '보통' },
  { v: 1, label: '밝게' },
];
const FONT = [
  { v: 1, label: '보통' },
  { v: 1.15, label: '크게' },
  { v: 1.3, label: '아주 크게' },
];

export default function Settings() {
  const { settings, updateSettings } = useApp();
  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ 처음으로</Text>
      </Pressable>
      <Title>설정</Title>

      <SectionHeader title="기본 수면 타이머" />
      <View style={styles.row}>
        {TIMER_OPTIONS.map((m) => (
          <Chip key={String(m)} label={timerLabel(m)} active={settings.defaultTimerMin === m} onPress={() => updateSettings({ defaultTimerMin: m })} />
        ))}
      </View>

      <SectionHeader title="쉼 화면 밝기" />
      <View style={styles.row}>
        {BRIGHTNESS.map((b) => (
          <Chip key={b.label} label={b.label} active={settings.brightness === b.v} onPress={() => updateSettings({ brightness: b.v })} />
        ))}
      </View>

      <SectionHeader title="말씀 글자 크기" />
      <View style={styles.row}>
        {FONT.map((f) => (
          <Chip key={f.label} label={f.label} active={settings.fontScale === f.v} onPress={() => updateSettings({ fontScale: f.v })} />
        ))}
      </View>

      <SectionHeader title="만든 사람·출처" />
      <View style={styles.box}>
        {credits.files.map((c) => (
          <View key={c.file} style={styles.credit}>
            <Text style={styles.creditTitle}>{c.title}</Text>
            <Text style={styles.creditMeta}>{c.source}</Text>
            <Text style={styles.creditMeta}>{c.license}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.footnote}>쉼표 기도는 편안한 밤을 위한 앱이에요. 개인정보를 수집하지 않으며, 모든 기록은 이 기기 안에만 저장돼요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.textDim, fontSize: 16, marginBottom: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  box: { padding: 16, borderRadius: radius.md, backgroundColor: colors.card },
  credit: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  creditTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  creditMeta: { color: colors.textDim, fontSize: 13, marginTop: 2, lineHeight: 18 },
  footnote: { color: colors.textFaint, fontSize: 13, lineHeight: 20, marginTop: 24 },
});
