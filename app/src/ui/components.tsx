import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradient, radius } from './theme';

export function Screen({ children, scroll = true, footer }: { children: ReactNode; scroll?: boolean; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: (footer ? 120 : 40) + insets.bottom }]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1, paddingTop: insets.top + 12 }]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>{footer}</View> : null}
    </View>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.title}>{children}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={12}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function BigButton({
  label, onPress, variant = 'primary', icon, disabled, style,
}: {
  label: string; onPress: () => void; variant?: 'primary' | 'ghost'; icon?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.bigBtn, primary ? styles.bigPrimary : styles.bigGhost, { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style]}
    >
      {icon ? <Text style={[styles.bigLabel, { color: primary ? colors.accentText : colors.text }]}>{icon}</Text> : null}
      <Text style={[styles.bigLabel, { color: primary ? colors.accentText : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, locked }: { label: string; active?: boolean; onPress: () => void; locked?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && { color: colors.accentText }]}>
        {locked ? '🔒 ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

export function ThumbCard({
  image, title, subtitle, selected, locked, badge, onPress, width = 150, height = 190,
}: {
  image: number; title: string; subtitle?: string; selected?: boolean; locked?: boolean; badge?: string;
  onPress: () => void; width?: number; height?: number;
}) {
  return (
    <Pressable onPress={onPress} style={{ width, marginRight: 12 }}>
      <View style={[styles.thumb, { height }, selected && styles.thumbSelected]}>
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
        {locked ? <View style={styles.lockVeil}><Text style={{ fontSize: 24 }}>🔒</Text></View> : null}
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        {selected ? <Text style={styles.check}>✓</Text> : null}
      </View>
      <Text style={styles.thumbTitle} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={styles.thumbSub} numberOfLines={2}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'rgba(30,30,90,0.6)' },
  title: { color: colors.text, fontSize: 30, fontWeight: '600', letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: 15, marginTop: 6, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '600' },
  sectionAction: { color: colors.textDim, fontSize: 14 },
  bigBtn: { minHeight: 60, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  bigPrimary: { backgroundColor: colors.accent },
  bigGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  bigLabel: { fontSize: 18, fontWeight: '600' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, marginRight: 8 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { color: colors.text, fontSize: 15, fontWeight: '500' },
  thumb: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 2, borderColor: 'transparent' },
  thumbSelected: { borderColor: colors.accent },
  lockVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', left: 8, bottom: 8, color: '#fff', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  check: { position: 'absolute', right: 8, top: 8, color: colors.accentText, backgroundColor: colors.accent, width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, fontWeight: '700', overflow: 'hidden' },
  thumbTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 8 },
  thumbSub: { color: colors.textDim, fontSize: 13, marginTop: 2, lineHeight: 18 },
});
