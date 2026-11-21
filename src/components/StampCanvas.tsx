import { Canvas, createPicture, Picture, Skia, type SkImage } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useStampFonts } from '@/overlay/fonts';
import { drawComposite, drawStamp } from '@/overlay/render';
import type { StampLines, StampStyle } from '@/overlay/types';

interface Props {
  width: number;
  height: number;
  lines: StampLines;
  style: StampStyle;
  /** When given, the photo is drawn underneath (editor + thumbnails). Otherwise transparent (camera overlay). */
  image?: SkImage | null;
  /** Solid backdrop used when there is no photo (template thumbnails). */
  background?: string;
  canvasStyle?: StyleProp<ViewStyle>;
}

export function StampCanvas({ width, height, lines, style, image, background, canvasStyle }: Props) {
  const fonts = useStampFonts();

  const picture = useMemo(() => {
    if (!fonts || width <= 0 || height <= 0) return null;
    return createPicture((canvas) => {
      if (image) {
        drawComposite(canvas, image, width, height, lines, style, fonts);
        return;
      }
      if (background) {
        const p = Skia.Paint();
        p.setColor(Skia.Color(background));
        canvas.drawRect(Skia.XYWHRect(0, 0, width, height), p);
      }
      drawStamp(canvas, width, height, lines, style, fonts);
    }, Skia.XYWHRect(0, 0, width, height));
  }, [fonts, width, height, lines, style, image, background]);

  return (
    <Canvas style={[{ width, height }, canvasStyle]} pointerEvents="none">
      {picture && <Picture picture={picture} />}
    </Canvas>
  );
}
