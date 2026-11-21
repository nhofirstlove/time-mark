import { Skia, type SkImage } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';

/** Longest side kept for editing/export; keeps memory sane on phones. */
const MAX_SIDE = 4096;

/**
 * Web: let the browser decode the photo first. That applies EXIF rotation and
 * handles formats Skia can't read (e.g. HEIC from the iPhone library), then we
 * hand Skia a plain JPEG.
 */
export function usePhotoImage(uri: string | null): SkImage | null {
  // Tagged with its source uri so a new photo never shows the previous image.
  const [loaded, setLoaded] = useState<{ uri: string; image: SkImage | null } | null>(null);

  useEffect(() => {
    let alive = true;
    if (!uri) return;
    (async () => {
      const el = new window.Image();
      el.decoding = 'async';
      el.src = uri;
      await el.decode();
      const k = Math.min(1, MAX_SIDE / Math.max(el.naturalWidth, el.naturalHeight));
      const w = Math.round(el.naturalWidth * k);
      const h = Math.round(el.naturalHeight * k);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(el, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.95));
      if (!blob) throw new Error('Could not read photo');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const img = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(bytes));
      if (alive) setLoaded({ uri, image: img });
    })().catch((e) => console.warn('Photo decode failed', e));
    return () => {
      alive = false;
    };
  }, [uri]);

  return loaded && loaded.uri === uri ? loaded.image : null;
}
