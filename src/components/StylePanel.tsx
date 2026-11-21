import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLang, useTranslation } from '@/i18n';
import { FONT_KEYS, FONT_LABEL, RN_FONT_FAMILY } from '@/overlay/fonts';
import { TEMPLATES } from '@/overlay/templates';
import type { Anchor, DateFormatId } from '@/overlay/types';
import { formatDate, formatTime, SAMPLE_DATE } from '@/services/datetime';
import { useSettings } from '@/store/settings';
import { C, SWATCHES } from '@/theme';

import { Chip, Row, Section } from './ui';

const DATE_FORMATS: DateFormatId[] = ['dmy', 'mdy', 'ymd', 'short', 'long', 'film'];
const GRID: Anchor[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];
const OPACITY = [1, 0.8, 0.6, 0.4];
const SCALE_MIN = 0.6;
const SCALE_MAX = 1.8;

export function StylePanel() {
  const { t } = useTranslation();
  const lang = useLang();
  const style = useSettings((s) => s.style);
  const update = useSettings((s) => s.updateStyle);
  const anchorMode = TEMPLATES[style.templateId].anchor;

  const step = (d: number) =>
    update({ scale: Math.round(Math.min(SCALE_MAX, Math.max(SCALE_MIN, style.scale + d)) * 10) / 10 });

  return (
    <View>
      <Section title={t('style.font')}>
        <Row>
          {FONT_KEYS.map((k) => (
            <Chip
              key={k}
              label={FONT_LABEL[k]}
              active={style.font === k}
              onPress={() => update({ font: k })}
              labelStyle={{ fontFamily: RN_FONT_FAMILY[k], fontWeight: undefined }}
            />
          ))}
        </Row>
      </Section>

      <Section title={t('style.color')}>
        <Row>
          {SWATCHES.map((c) => (
            <Pressable
              key={c}
              onPress={() => update({ color: c })}
              accessibilityRole="button"
              accessibilityLabel={c}
              accessibilityState={{ selected: style.color === c }}
              style={[s.swatch, { backgroundColor: c }, style.color === c && s.swatchActive]}
            />
          ))}
        </Row>
      </Section>

      <Section title={t('style.size')}>
        <View style={s.stepper}>
          <Chip label="−" onPress={() => step(-0.1)} style={s.stepBtn} />
          <Text style={s.stepValue}>{Math.round(style.scale * 100)}%</Text>
          <Chip label="+" onPress={() => step(0.1)} style={s.stepBtn} />
        </View>
      </Section>

      <Section title={t('style.position')}>
        {anchorMode === 'fixed' ? (
          <Text style={s.hint}>{t('style.fixedPosition')}</Text>
        ) : anchorMode === 'vertical' ? (
          <Row>
            <Chip label="▲" active={style.anchor.startsWith('top')} onPress={() => update({ anchor: 'top-left' })} />
            <Chip label="▼" active={!style.anchor.startsWith('top')} onPress={() => update({ anchor: 'bottom-left' })} />
          </Row>
        ) : (
          <View style={s.grid}>
            {GRID.map((a) => (
              <Pressable
                key={a}
                onPress={() => update({ anchor: a })}
                accessibilityRole="button"
                accessibilityLabel={a}
                accessibilityState={{ selected: style.anchor === a }}
                style={[s.cell, style.anchor === a && s.cellActive]}
              >
                <View style={[s.dot, style.anchor === a && { backgroundColor: C.accentText }]} />
              </Pressable>
            ))}
          </View>
        )}
      </Section>

      <Section title={t('style.opacity')}>
        <Row>
          {OPACITY.map((o) => (
            <Chip key={o} label={`${o * 100}%`} active={style.opacity === o} onPress={() => update({ opacity: o })} />
          ))}
        </Row>
      </Section>

      <Section title={t('style.dateFormat')}>
        <Row>
          {DATE_FORMATS.map((f) => (
            <Chip
              key={f}
              label={formatDate(SAMPLE_DATE, f, lang)}
              active={style.dateFormat === f}
              onPress={() => update({ dateFormat: f })}
            />
          ))}
        </Row>
      </Section>

      <Section title={t('style.timeFormat')}>
        <Row>
          {(['24h', '12h'] as const).map((f) => (
            <Chip
              key={f}
              label={formatTime(SAMPLE_DATE, f, lang)}
              active={style.timeFormat === f}
              onPress={() => update({ timeFormat: f })}
            />
          ))}
        </Row>
      </Section>
    </View>
  );
}

const s = StyleSheet.create({
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.border },
  swatchActive: { borderColor: C.accent, transform: [{ scale: 1.12 }] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: { width: 48, justifyContent: 'center' },
  stepValue: { color: C.text, fontSize: 16, fontWeight: '600', minWidth: 52, textAlign: 'center' },
  hint: { color: C.textDim, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 3 * 52 + 2 * 6, gap: 6 },
  cell: {
    width: 52,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.panelHi,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { backgroundColor: C.accent, borderColor: C.accent },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.textDim },
});
