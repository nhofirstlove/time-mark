import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useLanguageSync } from '@/i18n';
import { StampFontsProvider } from '@/overlay/fonts';
import { C } from '@/theme';

export default function RootLayout() {
  useLanguageSync();
  return (
    <SafeAreaProvider>
      <StampFontsProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="index" />
          {/* Swipe-back is off so the "discard photo?" prompt can't be skipped. */}
          <Stack.Screen name="editor" options={{ gestureEnabled: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </StampFontsProvider>
    </SafeAreaProvider>
  );
}
