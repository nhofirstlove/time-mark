import { ImageFormat, Skia, type SkCanvas, type SkImage } from '@shopify/react-native-skia';

import { formatDate, formatTime } from '@/services/datetime';

import type { DrawCtx } from './draw';
import type { StampFonts } from './fonts';
import { TEMPLATES } from './templates';
import type { Lang, StampContent, StampLines, StampStyle, StampVisibility } from './types';

export function buildLines(
  content: StampContent,
  vis: StampVisibility,
  style: StampStyle,
  lang: Lang,
): StampLines {
  return {
    date: vis.date ? formatDate(content.date, style.dateFormat, lang) : '',
    time: vis.time ? formatTime(content.date, style.timeFormat, lang) : '',
    location: vis.location ? content.location.trim() : '',
    text: vis.text ? content.text.trim() : '',
  };
}

/**
 * Draws the stamp on a canvas of size w×h. The same function powers the live
 * camera overlay, the editor preview and the full-resolution export, so what
 * you see is exactly what gets saved.
 */
export function drawStamp(
  canvas: SkCanvas,
  w: number,
  h: number,
  lines: StampLines,
  style: StampStyle,
  fonts: StampFonts,
) {
  const base = Math.min(w, h) / 100;
  const ctx: DrawCtx = { canvas, w, h, base, u: base * style.scale, lines, style, fonts };
  const layered = style.opacity < 1;
  if (layered) {
    const p = Skia.Paint();
    p.setAlphaf(style.opacity);
    canvas.saveLayer(p);
  }
  TEMPLATES[style.templateId].draw(ctx);
  if (layered) canvas.restore();
}

/** Photo scaled to w×h, then the stamp on top. */
export function drawComposite(
  canvas: SkCanvas,
  image: SkImage,
  w: number,
  h: number,
  lines: StampLines,
  style: StampStyle,
  fonts: StampFonts,
) {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  canvas.drawImageRect(
    image,
    Skia.XYWHRect(0, 0, image.width(), image.height()),
    Skia.XYWHRect(0, 0, w, h),
    p,
  );
  drawStamp(canvas, w, h, lines, style, fonts);
}

/** Renders the stamped photo at the photo's full resolution and returns JPEG bytes. */
export function renderStampedJpeg(
  image: SkImage,
  lines: StampLines,
  style: StampStyle,
  fonts: StampFonts,
  quality = 92,
): Uint8Array {
  const w = image.width();
  const h = image.height();
  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Could not allocate drawing surface');
  drawComposite(surface.getCanvas(), image, w, h, lines, style, fonts);
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  return snapshot.encodeToBytes(ImageFormat.JPEG, quality);
}
