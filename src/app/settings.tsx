import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, Row, Section } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useSettings, type LanguagePref, type LocationDetail } from '@/store/settings';
import { C } from '@/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const s = useSettings();

  const langs: { v: LanguagePref; label: string }[] = [
    { v: 'system', label: t('settings.langSystem') },
    { v: 'en', label: 'English' },
    { v: 'vi', label: 'Tiếng Việt' },
  ];
  const details: { v: LocationDetail; label: string }[] = [
    { v: 'short', label: t('settings.locShort') },
    { v: 'full', label: t('settings.locFull') },
    { v: 'coords', label: t('settings.locCoords') },
  ];

  return (
    <View style={[st.root, { paddingBottom: insets.bottom }]}>
      <View style={st.header}>
        <Text style={st.title}>{t('settings.title')}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.done')}>
          <Ionicons name="close" size={26} color={C.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Section title={t('settings.language')}>
          <Row>
            {langs.map(({ v, label }) => (
              <Chip key={v} label={label} active={s.language === v} onPress={() => s.setLanguage(v)} />
            ))}
          </Row>
        </Section>

        <Section title={t('settings.locationDetail')}>
          <Row>
            {details.map(({ v, label }) => (
              <Chip key={v} label={label} active={s.locationDetail === v} onPress={() => s.setLocationDetail(v)} />
            ))}
          </Row>
        </Section>

        <View style={st.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={st.switchLabel}>{t('settings.saveOriginal')}</Text>
            <Text style={st.switchHint}>{t('settings.saveOriginalHint')}</Text>
          </View>
          <Switch
            value={s.saveOriginal}
            onValueChange={s.setSaveOriginal}
            trackColor={{ true: C.accent, false: C.border }}
            thumbColor="#fff"
          />
        </View>
        {Platform.OS === 'web' && <Text style={st.attrib}>{t('settings.osm')}</Text>}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.panel },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  title: { color: C.text, fontSize: 20, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  switchLabel: { color: C.text, fontSize: 16, fontWeight: '500' },
  switchHint: { color: C.textDim, fontSize: 13, marginTop: 2 },
  attrib: { color: C.textDim, fontSize: 12, marginTop: 28, textAlign: 'center' },
});
