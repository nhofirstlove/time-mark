import { ImageFormat, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Image, PixelRatio, View } from 'react-native';

import { useStampFonts } from '@/overlay/fonts';
import { drawComposite, drawStamp } from '@/overlay/render';

import type { StampCanvasProps } from './StampCanvas';

/**
 * Web version. Each Skia <Canvas> on web holds a WebGL context and iPhone Safari
 * only allows a handful, so instead we draw in memory (CPU) and show the result
 * as a plain image. Same drawing code as native, so the output matches.
 */
export function StampCanvas({ width, height, lines, style, image, background, canvasStyle }: StampCanvasProps) {
  const fonts = useStampFonts();

  const uri = useMemo(() => {
    if (!fonts || width <= 0 || height <= 0) return null;
    const dpr = Math.min(PixelRatio.get(), 3);
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    const surface = Skia.Surface.Make(w, h);
    if (!surface) return null;
    const canvas = surface.getCanvas();
    if (image) {
      drawComposite(canvas, image, w, h, lines, style, fonts);
    } else {
      if (background) {
        const p = Skia.Paint();
        p.setColor(Skia.Color(background));
        canvas.drawRect(Skia.XYWHRect(0, 0, w, h), p);
      }
      drawStamp(canvas, w, h, lines, style, fonts);
    }
    surface.flush();
    const snap = surface.makeImageSnapshot();
    // Overlays need transparency (PNG); photo previews are smaller as JPEG.
    const opaque = !!image || !!background;
    const data = opaque ? snap.encodeToBase64(ImageFormat.JPEG, 88) : snap.encodeToBase64(ImageFormat.PNG, 100);
    snap.dispose?.();
    surface.dispose?.();
    return `data:image/${opaque ? 'jpeg' : 'png'};base64,${data}`;
  }, [fonts, width, height, lines, style, image, background]);

  return (
    <View style={[{ width, height }, canvasStyle]} pointerEvents="none">
      {uri && <Image source={{ uri }} style={{ width, height }} />}
    </View>
  );
}
