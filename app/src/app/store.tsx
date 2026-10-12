// 유료 콘텐츠 팩(F8): 비소모성 1회 구매 + 구매 복원
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BACKGROUNDS, PACKS, SOUNDS } from '../data/catalog';
import { buyPack, devFakePurchases, restorePurchases, type PurchaseResult } from '../purchases';
import { useApp } from '../state/AppState';
import { BigButton, Screen } from '../ui/components';
import { colors, radius } from '../ui/theme';

const pack = PACKS.pack_quiet_night;

export default function Store() {
  const { ownedPacks, setOwnedPacks, hasPack } = useApp();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handle = async (fn: () => Promise<PurchaseResult>, successMsg: string) => {
    setBusy(true);
    setMessage(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) {
      setOwnedPacks(r.owned);
      setMessage(r.owned.includes(pack.id) ? successMsg : '복원할 구매 내역이 없어요.');
    } else if (r.reason !== 'cancelled') {
      setMessage(r.message);
    }
  };

  const thumbs = BACKGROUNDS.filter((b) => b.pack === pack.id && b.type === 'image');
  const sounds = SOUNDS.filter((s) => s.pack === pack.id);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>✕ 닫기</Text>
      </Pressable>

      <View style={styles.hero}>
        {thumbs.map((b) => (
          <Image key={b.id} source={b.thumb} style={styles.heroImg} contentFit="cover" />
        ))}
      </View>
      <Text style={styles.title}>🌙 {pack.name}</Text>
      <Text style={styles.sub}>한 번 구매하면 계속 쓸 수 있어요. 인터넷 없이도 그대로 열려 있어요.</Text>

      <View style={styles.box}>
        {pack.summary.map((line) => (
          <Text key={line} style={styles.item}>✓  {line}</Text>
        ))}
        <Text style={styles.detail}>새 소리: {sounds.map((s) => s.name).join(', ')}</Text>
        <Text style={styles.detail}>새 배경: {thumbs.map((b) => b.name).join(', ')}</Text>
      </View>

      {hasPack ? (
        <Text style={styles.owned}>이미 열려 있어요. 고맙습니다 🙏</Text>
      ) : (
        <BigButton
          label={busy ? '잠시만요…' : `${pack.price} · 한 번 구매`}
          disabled={busy}
          onPress={() => handle(() => buyPack(pack.id, ownedPacks), '고요한 밤 팩이 열렸어요.')}
          style={{ marginTop: 24 }}
        />
      )}
      <BigButton
        variant="ghost"
        label="구매 복원"
        disabled={busy}
        onPress={() => handle(() => restorePurchases(ownedPacks), '구매를 복원했어요.')}
        style={{ marginTop: 12 }}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {devFakePurchases ? <Text style={styles.dev}>개발 모드: 결제 SDK 없이 테스트 구매로 잠금이 풀려요. 실제 결제는 개발 빌드 + RevenueCat 키가 필요해요.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.textDim, fontSize: 16, marginBottom: 16 },
  hero: { flexDirection: 'row', gap: 10, height: 200 },
  heroImg: { flex: 1, borderRadius: radius.md },
  title: { color: colors.text, fontSize: 28, fontWeight: '600', marginTop: 24 },
  sub: { color: colors.textDim, fontSize: 15, marginTop: 8, lineHeight: 22 },
  box: { marginTop: 20, padding: 20, borderRadius: radius.lg, backgroundColor: colors.card, gap: 10 },
  item: { color: colors.text, fontSize: 17 },
  detail: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  owned: { color: colors.gold, fontSize: 18, textAlign: 'center', marginTop: 28 },
  message: { color: colors.text, fontSize: 16, textAlign: 'center', marginTop: 18 },
  dev: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
