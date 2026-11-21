import { useTypeface, type SkTypeface } from '@shopify/react-native-skia';
import { useFonts } from 'expo-font';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { FontKey } from './types';

/**
 * Every font here ships Vietnamese glyphs, so diacritics (ă, ơ, ư, ệ…) render correctly.
 * Files are required individually so the bundle only carries the weights we use.
 */
export const FONT_SOURCES: Record<FontKey, number> = {
  inter: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  interBold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  playfair: require('@expo-google-fonts/playfair-display/500Medium/PlayfairDisplay_500Medium.ttf'),
  dancing: require('@expo-google-fonts/dancing-script/600SemiBold/DancingScript_600SemiBold.ttf'),
  oswald: require('@expo-google-fonts/oswald/600SemiBold/Oswald_600SemiBold.ttf'),
  pixel: require('@expo-google-fonts/vt323/400Regular/VT323_400Regular.ttf'),
};

export const FONT_KEYS = Object.keys(FONT_SOURCES) as FontKey[];

/** Family names registered with expo-font, for showing font samples in normal RN <Text>. */
export const RN_FONT_FAMILY: Record<FontKey, string> = {
  inter: 'TM-inter',
  interBold: 'TM-interBold',
  playfair: 'TM-playfair',
  dancing: 'TM-dancing',
  oswald: 'TM-oswald',
  pixel: 'TM-pixel',
};

export const FONT_LABEL: Record<FontKey, string> = {
  inter: 'Inter',
  interBold: 'Inter Bold',
  playfair: 'Playfair',
  dancing: 'Dancing',
  oswald: 'Oswald',
  pixel: 'VT323',
};

export type StampFonts = Record<FontKey, SkTypeface>;

const FontsContext = createContext<StampFonts | null>(null);

export function StampFontsProvider({ children }: { children: ReactNode }) {
  // One hook per font; the list is static so hook order never changes.
  const inter = useTypeface(FONT_SOURCES.inter);
  const interBold = useTypeface(FONT_SOURCES.interBold);
  const playfair = useTypeface(FONT_SOURCES.playfair);
  const dancing = useTypeface(FONT_SOURCES.dancing);
  const oswald = useTypeface(FONT_SOURCES.oswald);
  const pixel = useTypeface(FONT_SOURCES.pixel);

  useFonts(
    Object.fromEntries(FONT_KEYS.map((k) => [RN_FONT_FAMILY[k], FONT_SOURCES[k]])),
  );

  const fonts = useMemo<StampFonts | null>(() => {
    if (!inter || !interBold || !playfair || !dancing || !oswald || !pixel) return null;
    return { inter, interBold, playfair, dancing, oswald, pixel };
  }, [inter, interBold, playfair, dancing, oswald, pixel]);

  return <FontsContext.Provider value={fonts}>{children}</FontsContext.Provider>;
}

/** Returns null until all typefaces are loaded. */
export function useStampFonts(): StampFonts | null {
  return useContext(FontsContext);
}
