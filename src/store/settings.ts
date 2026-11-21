import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TEMPLATES } from '@/overlay/templates';
import type { Lang, StampStyle, StampVisibility, TemplateId } from '@/overlay/types';

export type LanguagePref = 'system' | Lang;
export type LocationDetail = 'short' | 'full' | 'coords';

interface SettingsState {
  language: LanguagePref;
  saveOriginal: boolean;
  locationDetail: LocationDetail;
  style: StampStyle;
  visibility: StampVisibility;
  /** Last caption typed, reused for the next photo. */
  text: string;

  setLanguage: (l: LanguagePref) => void;
  setSaveOriginal: (v: boolean) => void;
  setLocationDetail: (d: LocationDetail) => void;
  updateStyle: (patch: Partial<StampStyle>) => void;
  applyTemplate: (id: TemplateId) => void;
  toggle: (key: keyof StampVisibility) => void;
  setText: (t: string) => void;
}

const templateStyle = (id: TemplateId, prev?: StampStyle): StampStyle => {
  const d = TEMPLATES[id].defaults;
  return {
    templateId: id,
    font: d.font,
    color: d.color,
    anchor: d.anchor,
    dateFormat: d.dateFormat,
    timeFormat: prev?.timeFormat ?? d.timeFormat,
    scale: prev?.scale ?? 1,
    opacity: prev?.opacity ?? 1,
  };
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'system',
      saveOriginal: true,
      locationDetail: 'short',
      style: templateStyle('minimal'),
      visibility: { date: true, time: true, location: false, text: false },
      text: '',

      setLanguage: (language) => set({ language }),
      setSaveOriginal: (saveOriginal) => set({ saveOriginal }),
      setLocationDetail: (locationDetail) => set({ locationDetail }),
      updateStyle: (patch) => set((s) => ({ style: { ...s.style, ...patch } })),
      applyTemplate: (id) => set((s) => ({ style: templateStyle(id, s.style) })),
      toggle: (key) => set((s) => ({ visibility: { ...s.visibility, [key]: !s.visibility[key] } })),
      setText: (text) => set({ text }),
    }),
    {
      name: 'timemark-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language, saveOriginal, locationDetail, style, visibility, text }) => ({
        language,
        saveOriginal,
        locationDetail,
        style,
        visibility,
        text,
      }),
    },
  ),
);
