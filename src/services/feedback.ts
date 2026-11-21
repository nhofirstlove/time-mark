import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/** Simple message. React Native's Alert does nothing on web, so use the browser's. */
export function notify(title: string, message?: string) {
  if (isWeb) window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

/** Yes/no question; resolves true when the user confirms. */
export function confirm(title: string, okLabel: string, cancelLabel: string): Promise<boolean> {
  if (isWeb) return Promise.resolve(window.confirm(title));
  return new Promise((resolve) =>
    Alert.alert(title, undefined, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

/** Haptics are best-effort: iPhone Safari has no vibration API. */
export function tapFeedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
