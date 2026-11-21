import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePreventRemove } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentPanel } from '@/components/ContentPanel';
import { ExportSheet } from '@/components/ExportSheet';
import { StampCanvas } from '@/components/StampCanvas';
import { StylePanel } from '@/components/StylePanel';
import { TemplateStrip } from '@/components/TemplateStrip';
import { Button } from '@/components/ui';
import { usePhotoImage } from '@/hooks/usePhotoImage';
import { useLang, useTranslation } from '@/i18n';
import { useStampFonts } from '@/overlay/fonts';
import { buildLines, renderStampedJpeg } from '@/overlay/render';
import { confirm, notify, successFeedback } from '@/services/feedback';
import { GalleryPermissionError, saveToGallery, shareImage, writeTempJpeg } from '@/services/media';
import { useDraft } from '@/store/draft';
import { useSettings } from '@/store/settings';
import { C } from '@/theme';

type Tab = 'template' | 'content' | 'style';
const TABS: Tab[] = ['template', 'content', 'style'];
const isWeb = Platform.OS === 'web';

export default function EditorScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const fonts = useStampFonts();

  const photo = useDraft((s) => s.photo);
  const date = useDraft((s) => s.date);
  const location = useDraft((s) => s.location);
  const style = useSettings((s) => s.style);
  const visibility = useSettings((s) => s.visibility);
  const text = useSettings((s) => s.text);
  const saveOriginal = useSettings((s) => s.saveOriginal);
  const applyTemplate = useSettings((s) => s.applyTemplate);

  const image = usePhotoImage(photo?.uri ?? null);
  const [tab, setTab] = useState<Tab>('template');
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  /** Web: finished photo waiting in the save/share sheet. */
  const [sheet, setSheet] = useState<{ stamped: string; original: string | null } | null>(null);
  /** Last full-res render, reused when sharing right after saving. */
  const rendered = useRef<{ key: string; uri: string } | null>(null);

  const content = useMemo(() => ({ date, location, text }), [date, location, text]);
  const lines = useMemo(() => buildLines(content, visibility, style, lang), [content, visibility, style, lang]);
  const key = JSON.stringify([lines, style]);
  const isSaved = savedKey === key;

  // Ask before throwing away an unsaved photo.
  const [discarded, setDiscarded] = useState(false);
  usePreventRemove(!!photo && !isSaved && !busy && !discarded, ({ repeat }) => {
    confirm(t('editor.discardTitle'), t('editor.discard'), t('common.cancel')).then((ok) => {
      if (!ok) return;
      setDiscarded(true);
      repeat();
    });
  });

  if (!photo) {
    return (
      <View style={s.center}>
        <Button label={t('common.back')} onPress={() => router.back()} style={{ flex: 0, paddingHorizontal: 32 }} />
      </View>
    );
  }

  const iw = image?.width() ?? photo.width;
  const ih = image?.height() ?? photo.height;
  const k = Math.min(box.w / iw, box.h / ih) || 0;
  const pw = Math.floor(iw * k);
  const ph = Math.floor(ih * k);

  async function renderFile(): Promise<string> {
    if (rendered.current?.key === key) return rendered.current.uri;
    if (!image || !fonts) throw new Error('Photo not ready');
    // Let the spinner paint before the heavy synchronous render.
    await new Promise((r) => setTimeout(r, 30));
    const bytes = renderStampedJpeg(image, lines, style, fonts);
    const uri = await writeTempJpeg(bytes);
    rendered.current = { key, uri };
    return uri;
  }

  async function onSave() {
    setBusy('save');
    try {
      const uri = await renderFile();
      if (isWeb) {
        setSheet({ stamped: uri, original: saveOriginal ? photo!.uri : null });
        return;
      }
      await saveToGallery(uri, saveOriginal ? photo!.uri : null);
      setSavedKey(key);
      successFeedback();
      notify(saveOriginal ? t('editor.savedWithOriginal') : t('editor.saved'));
    } catch (e) {
      const msg = e instanceof GalleryPermissionError ? t('editor.galleryPermission') : String(e);
      notify(t('editor.saveFailed'), msg);
    } finally {
      setBusy(null);
    }
  }

  async function onShare() {
    setBusy('share');
    try {
      const uri = await renderFile();
      if (isWeb) {
        setSheet({ stamped: uri, original: null });
        return;
      }
      await shareImage(uri, t('editor.share'));
    } catch (e) {
      notify(t('editor.shareFailed'), String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={s.title}>{t('editor.title')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View
        style={s.previewBox}
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          setBox({ w: width - 24, h: height - 12 });
        }}
      >
        {image && fonts && pw > 0 ? (
          <StampCanvas width={pw} height={ph} lines={lines} style={style} image={image} />
        ) : (
          <ActivityIndicator color={C.accent} />
        )}
      </View>

      <View style={s.tabs}>
        {TABS.map((x) => (
          <Pressable
            key={x}
            onPress={() => setTab(x)}
            style={[s.tab, tab === x && s.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === x }}
          >
            <Text style={[s.tabText, tab === x && { color: C.text }]}>
              {t(`editor.tab${x[0].toUpperCase()}${x.slice(1)}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={s.panel} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {tab === 'template' && (
          <TemplateStrip
            current={style}
            content={content}
            visibility={visibility}
            onSelect={applyTemplate}
            image={image}
            wrap
          />
        )}
        {tab === 'content' && <ContentPanel />}
        {tab === 'style' && <StylePanel />}
      </ScrollView>

      <View style={[s.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          variant="outline"
          label={t('editor.share')}
          onPress={onShare}
          disabled={!!busy || !image}
          icon={busy === 'share' ? <ActivityIndicator color={C.text} /> : <Ionicons name="share-outline" size={20} color={C.text} />}
        />
        <Button
          label={busy === 'save' ? t('editor.saving') : isSaved ? t('editor.saved') : t('editor.save')}
          onPress={onSave}
          disabled={!!busy || !image || isSaved}
          icon={
            busy === 'save' ? (
              <ActivityIndicator color={C.accentText} />
            ) : (
              <Ionicons name={isSaved ? 'checkmark' : 'download-outline'} size={20} color={C.accentText} />
            )
          }
        />
      </View>
      <ExportSheet
        stampedUri={sheet?.stamped ?? null}
        originalUri={sheet?.original ?? null}
        onClose={() => setSheet(null)}
        onDone={() => {
          setSavedKey(key);
          setSheet(null);
          successFeedback();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  title: { color: C.text, fontSize: 17, fontWeight: '600' },
  previewBox: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, paddingHorizontal: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.accent },
  tabText: { color: C.textDim, fontSize: 15, fontWeight: '600' },
  panel: { maxHeight: 300, backgroundColor: C.panel },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.panel },
});
