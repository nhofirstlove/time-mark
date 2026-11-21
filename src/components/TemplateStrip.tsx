import type { SkImage } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLang, useTranslation } from '@/i18n';
import { buildLines } from '@/overlay/render';
import { TEMPLATE_IDS, TEMPLATES } from '@/overlay/templates';
import type { StampContent, StampStyle, StampVisibility, TemplateId } from '@/overlay/types';
import { C } from '@/theme';

import { StampCanvas } from './StampCanvas';

const THUMB_W = 66;
const THUMB_H = 88;

interface Props {
  current: StampStyle;
  content: StampContent;
  visibility: StampVisibility;
  onSelect: (id: TemplateId) => void;
  /** Photo to preview on; without it a neutral backdrop is used. */
  image?: SkImage | null;
  wrap?: boolean;
}

/** Thumbnails of every template, drawn with the user's real content. */
export function TemplateStrip({ current, content, visibility, onSelect, image, wrap }: Props) {
  const { t } = useTranslation();
  const lang = useLang();

  const items = useMemo(
    () =>
      TEMPLATE_IDS.map((id) => {
        const d = TEMPLATES[id].defaults;
        // Each thumbnail shows the template's own look, keeping the user's size/opacity.
        const style: StampStyle =
          id === current.templateId
            ? current
            : { ...current, ...d, templateId: id, timeFormat: current.timeFormat };
        return { id, style, lines: buildLines(content, visibility, style, lang) };
      }),
    [current, content, visibility, lang],
  );

  const body = items.map(({ id, style, lines }) => {
    const active = id === current.templateId;
    return (
      <Pressable
        key={id}
        onPress={() => onSelect(id)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={t(`templates.${id}`)}
        style={s.item}
      >
        <View style={[s.thumb, active && s.thumbActive]}>
          <StampCanvas
            width={THUMB_W}
            height={THUMB_H}
            lines={lines}
            style={style}
            image={image}
            background="#4A5A6E"
          />
        </View>
        <Text style={[s.label, active && { color: C.accent }]} numberOfLines={1}>
          {t(`templates.${id}`)}
        </Text>
      </Pressable>
    );
  });

  if (wrap) return <View style={s.wrap}>{body}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip}>
      {body}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  strip: { paddingHorizontal: 12, gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { alignItems: 'center', width: THUMB_W + 8 },
  thumb: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { borderColor: C.accent },
  label: { color: C.textDim, fontSize: 11, marginTop: 4, fontWeight: '500' },
});
