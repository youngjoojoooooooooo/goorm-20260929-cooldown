import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mixer } from '../src/audio/mixer';
import { AppStateProvider } from '../src/state/AppState';
import { colors } from '../src/ui/theme';

export default function RootLayout() {
  useEffect(() => {
    mixer.init();
  }, []);

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night }, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="words" />
          <Stack.Screen name="mixer" />
          <Stack.Screen name="rest" options={{ gestureEnabled: false }} />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="store" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
