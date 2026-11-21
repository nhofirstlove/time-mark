import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export class GalleryPermissionError extends Error {}

/** Writes JPEG bytes to a fresh file in the cache dir and returns its file:// uri. */
export async function writeTempJpeg(bytes: Uint8Array): Promise<string> {
  const file = new File(Paths.cache, `timemark-${Date.now()}.jpg`);
  file.create({ overwrite: true });
  await file.write(bytes);
  return file.uri;
}

async function ensureGalleryWrite() {
  const perm = await requestPermissionsAsync(true, ['photo']);
  if (!perm.granted) throw new GalleryPermissionError('Photo library permission denied');
}

/** Saves the stamped photo, and the clean original when asked. */
export async function saveToGallery(stampedUri: string, originalUri: string | null) {
  await ensureGalleryWrite();
  if (originalUri) await Asset.create(originalUri);
  await Asset.create(stampedUri);
}

export async function shareImage(uri: string, dialogTitle: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing unavailable');
  await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg', dialogTitle });
}
