import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { C } from '@/theme';

import { Chip } from './ui';

/** "Change" button that lets the user pick any date and time (e.g. to backdate a stamp). */
export function DateTimeChange({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const { t } = useTranslation();
  const [iosOpen, setIosOpen] = useState(false);
  const [temp, setTemp] = useState(value);

  function open() {
    if (Platform.OS === 'android') {
      // Android shows date then time as two native dialogs.
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onValueChange: (_e, date) => {
          DateTimePickerAndroid.open({
            value: date,
            mode: 'time',
            is24Hour: true,
            onValueChange: (_e2, time) => onChange(time),
          });
        },
      });
    } else {
      setTemp(value);
      setIosOpen(true);
    }
  }

  return (
    <>
      <Chip label={t('content.change')} onPress={open} />
      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={s.backdrop} onPress={() => setIosOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Pressable onPress={() => setIosOpen(false)} hitSlop={10}>
                <Text style={s.cancel}>{t('common.cancel')}</Text>
              </Pressable>
              <Text style={s.title}>{t('content.pickDate')}</Text>
              <Pressable
                onPress={() => {
                  onChange(temp);
                  setIosOpen(false);
                }}
                hitSlop={10}
              >
                <Text style={s.done}>{t('common.done')}</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={temp}
              mode="datetime"
              display="spinner"
              themeVariant="dark"
              onValueChange={(_e, d) => setTemp(d)}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: C.panel, paddingBottom: 32, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  title: { color: C.text, fontSize: 16, fontWeight: '600' },
  cancel: { color: C.textDim, fontSize: 16 },
  done: { color: C.accent, fontSize: 16, fontWeight: '700' },
});
