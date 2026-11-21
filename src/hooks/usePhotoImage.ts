import { useImage, type SkImage } from '@shopify/react-native-skia';

/** Decodes the captured photo for drawing. Native files are already upright JPEGs. */
export function usePhotoImage(uri: string | null): SkImage | null {
  return useImage(uri);
}
