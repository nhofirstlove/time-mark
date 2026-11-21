import Ionicons from '@expo/vector-icons/Ionicons';
import { createElement, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { notify } from '@/services/feedback';
import { canShareFiles, downloadFiles, shareFiles, toFile } from '@/services/media.web';
import { C } from '@/theme';

import type { ExportSheetProps } from './ExportSheet';
import { Button } from './ui';

/**
 * Web "save" step: shows the finished photo and hands it to the share sheet
 * (iPhone → "Save Image") or downloads it. Files are prepared up front so the
 * share call happens directly inside the button tap, as Safari requires.
 */
export function ExportSheet({ stampedUri, originalUri, onClose, onDone }: ExportSheetProps) {
  const { t } = useTranslation();
  // Files are tagged with the photo they belong to, so a new photo never shows stale files.
  const [prepared, setPrepared] = useState<{ uri: string; files: File[] } | null>(null);
  const files = prepared && prepared.uri === stampedUri ? prepared.files : null;

  useEffect(() => {
    if (!stampedUri) return;
    let alive = true;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    Promise.all([
      toFile(stampedUri, `timemark-${stamp}.jpg`),
      originalUri ? toFile(originalUri, `timemark-${stamp}-original.jpg`) : null,
    ]).then((fs) => {
      if (alive) setPrepared({ uri: stampedUri, files: fs.filter((f): f is File => !!f) });
    });
    return () => {
      alive = false;
    };
  }, [stampedUri, originalUri]);

  const shareable = !!files && canShareFiles(files);

  async function onShare() {
    if (!files) return;
    try {
      if (await shareFiles(files)) onDone();
    } catch (e) {
      notify(t('editor.shareFailed'), String(e));
    }
  }

  function onDownload() {
    if (!files) return;
    downloadFiles(files);
    onDone();
  }

  return (
    <Modal visible={!!stampedUri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.head}>
            <Text style={s.title}>{t('editor.readyTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
              <Ionicons name="close" size={24} color={C.text} />
            </Pressable>
          </View>

          <View style={s.previewWrap}>
            {stampedUri &&
              // A real <img> so iPhone users can also press-and-hold → "Save to Photos".
              createElement('img', {
                src: stampedUri,
                alt: 'TimeMark',
                style: { width: '100%', height: '100%', objectFit: 'contain', WebkitTouchCallout: 'default' },
              })}
          </View>

          <Text style={s.hint}>{t(shareable ? 'editor.webSaveHint' : 'editor.webDownloadHint')}</Text>

          {!files ? (
            <ActivityIndicator color={C.accent} style={{ marginVertical: 14 }} />
          ) : (
            <View style={s.actions}>
              {shareable && (
                <Button
                  label={t('editor.saveToPhotos')}
                  onPress={onShare}
                  icon={<Ionicons name="share-outline" size={20} color={C.accentText} />}
                />
              )}
              <Button
                variant={shareable ? 'outline' : 'primary'}
                label={t('editor.download')}
                onPress={onDownload}
                icon={<Ionicons name="download-outline" size={20} color={shareable ? C.text : C.accentText} />}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.panel,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 28,
    maxHeight: '92%',
    gap: 12,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: C.text, fontSize: 18, fontWeight: '700' },
  previewWrap: { height: 360, width: '100%', overflow: 'hidden' },
  hint: { color: C.textDim, fontSize: 13, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
});
