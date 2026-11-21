import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StampCanvas } from '@/components/StampCanvas';
import { TemplateStrip } from '@/components/TemplateStrip';
import { Button } from '@/components/ui';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import { useLang, useTranslation } from '@/i18n';
import { buildLines } from '@/overlay/render';
import type { StampContent, StampVisibility } from '@/overlay/types';
import { useLocation, useLocationLabel } from '@/services/location';
import { useDraft } from '@/store/draft';
import { useSettings } from '@/store/settings';
import { C } from '@/theme';

/** Room needed below the preview for toggles, templates and the shutter. */
const CONTROLS_H = 250;
const TOP_H = 52;

const TOGGLES: { key: keyof StampVisibility; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'date', icon: 'calendar-outline' },
  { key: 'time', icon: 'time-outline' },
  { key: 'location', icon: 'location-outline' },
  { key: 'text', icon: 'text-outline' },
];

export default function CameraScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const style = useSettings((s) => s.style);
  const visibility = useSettings((s) => s.visibility);
  const text = useSettings((s) => s.text);
  const detail = useSettings((s) => s.locationDetail);
  const applyTemplate = useSettings((s) => s.applyTemplate);
  const toggle = useSettings((s) => s.toggle);
  const refreshLocation = useLocation((s) => s.refresh);
  const { label: place, status: locStatus } = useLocationLabel(detail);
  const startDraft = useDraft((s) => s.start);

  const now = useMinuteClock();

  // Only ask for location when the user actually shows it on the stamp.
  useEffect(() => {
    if (visibility.location && locStatus === 'idle') refreshLocation();
  }, [visibility.location, locStatus, refreshLocation]);

  // Preview is 3:4 like the photo, shrunk on short screens so controls still fit.
  const available = height - insets.top - insets.bottom - TOP_H - CONTROLS_H;
  const previewW = width;
  const previewH = Math.max(200, Math.min((width * 4) / 3, available));

  const content: StampContent = useMemo(
    () => ({ date: now, location: place || placeholderPlace(locStatus, t), text }),
    [now, place, locStatus, text, t],
  );
  const lines = useMemo(() => buildLines(content, visibility, style, lang), [content, visibility, style, lang]);

  async function capture() {
    if (!camera.current || !ready || busy) return;
    setBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const shotAt = new Date();
      const photo = await camera.current.takePictureAsync({ quality: 1 });
      startDraft({ uri: photo.uri, width: photo.width, height: photo.height }, shotAt, place);
      router.push('/editor');
    } catch (e) {
      Alert.alert('Camera', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!permission) {
    return <View style={s.center}><ActivityIndicator color={C.accent} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[s.center, { padding: 32 }]}>
        <Ionicons name="camera-outline" size={56} color={C.accent} />
        <Text style={s.permTitle}>{t('camera.permissionTitle')}</Text>
        <Text style={s.permBody}>{t('camera.permissionBody')}</Text>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
          {permission.canAskAgain ? (
            <Button label={t('camera.grant')} onPress={requestPermission} />
          ) : (
            <Button label={t('camera.openSettings')} onPress={() => Linking.openSettings()} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.topBar}>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
        >
          <Ionicons name="settings-outline" size={24} color={C.text} />
        </Pressable>
        {visibility.location && (
          <Pressable style={s.locPill} onPress={refreshLocation} accessibilityRole="button">
            {locStatus === 'loading' ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <Ionicons name="location" size={14} color={place ? C.accent : C.textDim} />
            )}
            <Text style={s.locText} numberOfLines={1}>
              {place || placeholderPlace(locStatus, t)}
            </Text>
          </Pressable>
        )}
        <View style={{ width: 24 }} />
      </View>

      <View style={{ width: previewW, height: previewH, backgroundColor: '#000' }}>
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setReady(true)}
        />
        <StampCanvas width={previewW} height={previewH} lines={lines} style={style} canvasStyle={StyleSheet.absoluteFill} />
      </View>

      <View style={s.controls}>
        <View style={s.toggles}>
          {TOGGLES.map(({ key, icon }) => {
            const on = visibility[key];
            return (
              <Pressable
                key={key}
                onPress={() => toggle(key)}
                style={[s.toggle, on && s.toggleOn]}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t(`content.${key}`)}
              >
                <Ionicons name={icon} size={18} color={on ? C.accentText : C.text} />
              </Pressable>
            );
          })}
        </View>

        <TemplateStrip current={style} content={content} visibility={visibility} onSelect={applyTemplate} />

        <View style={s.shutterRow}>
          <Pressable
            onPress={capture}
            disabled={!ready || busy}
            accessibilityRole="button"
            accessibilityLabel="Shutter"
            style={({ pressed }) => [s.shutter, (pressed || busy) && { transform: [{ scale: 0.92 }] }]}
          >
            <View style={s.shutterInner}>{busy && <ActivityIndicator color={C.accentText} />}</View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function placeholderPlace(status: string, t: (k: string) => string) {
  if (status === 'loading' || status === 'idle') return t('camera.locating');
  return t('camera.noLocation');
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  permTitle: { color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  permBody: { color: C.textDim, fontSize: 15, textAlign: 'center', marginBottom: 12 },
  topBar: {
    height: TOP_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.panelHi,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '70%',
  },
  locText: { color: C.text, fontSize: 13, flexShrink: 1 },
  controls: { flex: 1, justifyContent: 'space-evenly' },
  toggles: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.panelHi,
    borderWidth: 1,
    borderColor: C.border,
  },
  toggleOn: { backgroundColor: C.accent, borderColor: C.accent },
  shutterRow: { alignItems: 'center' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
