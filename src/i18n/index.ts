import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { useEffect } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';

import type { Lang } from '@/overlay/types';
import { useSettings, type LanguagePref } from '@/store/settings';

import en from './en.json';
import vi from './vi.json';

export const systemLang = (): Lang => (getLocales()[0]?.languageCode === 'vi' ? 'vi' : 'en');

export const resolveLang = (pref: LanguagePref): Lang => (pref === 'system' ? systemLang() : pref);

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  lng: systemLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/** Keeps i18next in sync with the language setting. Call once near the root. */
export function useLanguageSync() {
  const pref = useSettings((s) => s.language);
  useEffect(() => {
    const lang = resolveLang(pref);
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }, [pref]);
}

/** Current UI/stamp language. */
export function useLang(): Lang {
  const pref = useSettings((s) => s.language);
  return resolveLang(pref);
}

export { useTranslation };
export default i18n;
