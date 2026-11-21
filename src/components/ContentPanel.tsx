import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { useLang, useTranslation } from '@/i18n';
import type { StampVisibility } from '@/overlay/types';
import { formatDate, formatTime } from '@/services/datetime';
import { placeLabel, useLocation } from '@/services/location';
import { useDraft } from '@/store/draft';
import { useSettings } from '@/store/settings';
import { C } from '@/theme';

import { DateTimeChange } from './DateTimeField';
import { Chip } from './ui';

function ToggleRow({ k, children }: { k: keyof StampVisibility; children?: ReactNode }) {
  const { t } = useTranslation();
  const on = useSettings((s) => s.visibility[k]);
  const toggle = useSettings((s) => s.toggle);
  return (
    <View style={s.block}>
      <View style={s.head}>
        <Text style={s.label}>{t(`content.${k}`)}</Text>
        <Switch
          value={on}
          onValueChange={() => toggle(k)}
          trackColor={{ true: C.accent, false: C.border }}
          thumbColor="#fff"
          accessibilityLabel={t(`content.${k}`)}
        />
      </View>
      {children}
    </View>
  );
}

export function ContentPanel() {
  const { t } = useTranslation();
  const lang = useLang();
  const style = useSettings((s) => s.style);
  const visibility = useSettings((s) => s.visibility);
  const text = useSettings((s) => s.text);
  const setText = useSettings((s) => s.setText);
  const toggle = useSettings((s) => s.toggle);
  const detail = useSettings((s) => s.locationDetail);
  const { date, capturedAt, location, setDate, setLocation } = useDraft();
  const locStatus = useLocation((s) => s.status);
  const refresh = useLocation((s) => s.refresh);

  const edited = date.getTime() !== capturedAt.getTime();

  async function fillFromGps() {
    await refresh();
    const { coords, address } = useLocation.getState();
    const label = placeLabel(coords, address, detail);
    if (label) setLocation(label);
  }

  return (
    <View>
      <ToggleRow k="date">
        <Text style={s.value}>{formatDate(date, style.dateFormat, lang)}</Text>
      </ToggleRow>
      <ToggleRow k="time">
        <Text style={s.value}>{formatTime(date, style.timeFormat, lang)}</Text>
      </ToggleRow>
      {(visibility.date || visibility.time) && (
        <View style={s.actions}>
          <DateTimeChange value={date} onChange={setDate} />
          {edited && <Chip label={t('content.resetNow')} onPress={() => setDate(capturedAt)} />}
        </View>
      )}

      <ToggleRow k="location">
        <View style={s.inputRow}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={location}
            onChangeText={(v) => {
              setLocation(v);
              if (v && !visibility.location) toggle('location');
            }}
            placeholder={t('content.locationPlaceholder')}
            placeholderTextColor={C.textDim}
          />
          <Chip label={t('content.refreshLocation')} onPress={fillFromGps}>
            {locStatus === 'loading' && <ActivityIndicator size="small" color={C.accent} />}
          </Chip>
        </View>
      </ToggleRow>

      <ToggleRow k="text">
        <TextInput
          style={s.input}
          value={text}
          onChangeText={(v) => {
            setText(v);
            if (v && !visibility.text) toggle('text');
          }}
          placeholder={t('content.textPlaceholder')}
          placeholderTextColor={C.textDim}
          maxLength={80}
        />
      </ToggleRow>
    </View>
  );
}

const s = StyleSheet.create({
  block: { marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: C.text, fontSize: 15, fontWeight: '600' },
  value: { color: C.textDim, fontSize: 14, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: -4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  input: {
    backgroundColor: C.panelHi,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 6,
  },
});
