// 아래에서 올라오는 간단한 안내 창 (iOS·안드로이드·웹 모두 동일하게 동작)
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from './components';
import { colors, radius } from './theme';

export type SheetAction = { label: string; onPress: () => void; variant?: 'primary' | 'ghost' };

export function Sheet({
  visible, title, message, actions, onClose, children,
}: {
  visible: boolean; title: string; message?: string; actions: SheetAction[]; onClose: () => void; children?: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <View style={{ gap: 10, marginTop: 20 }}>
            {actions.map((a) => (
              <BigButton key={a.label} label={a.label} onPress={a.onPress} variant={a.variant ?? 'primary'} />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5,8,30,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#25306f', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 24, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '600' },
  message: { color: colors.textDim, fontSize: 16, lineHeight: 24, marginTop: 10 },
});
