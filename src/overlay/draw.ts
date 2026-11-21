import { Skia, type SkCanvas, type SkFont, type SkPaint } from '@shopify/react-native-skia';

import type { StampFonts } from './fonts';
import type { Anchor, FontKey, StampLines, StampStyle } from './types';

export interface DrawCtx {
  canvas: SkCanvas;
  /** Canvas size in pixels. */
  w: number;
  h: number;
  /** 1% of the short side, unscaled. Use for frames that must not grow with "size". */
  base: number;
  /** 1% of the short side × style.scale. Use for text and decorations. */
  u: number;
  lines: StampLines;
  style: StampStyle;
  fonts: StampFonts;
}

export type HAlign = 'left' | 'center' | 'right';

export function font(ctx: DrawCtx, key: FontKey, size: number): SkFont {
  return Skia.Font(ctx.fonts[key], size);
}

export function paint(color: string, opts?: { alpha?: number; shadow?: ShadowOpts }): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  if (opts?.alpha !== undefined) p.setAlphaf(opts.alpha);
  if (opts?.shadow) {
    const s = opts.shadow;
    p.setImageFilter(
      Skia.ImageFilter.MakeDropShadow(s.dx ?? 0, s.dy ?? 0, s.blur, s.blur, Skia.Color(s.color)),
    );
  }
  return p;
}

export function strokePaint(color: string, width: number, shadow?: ShadowOpts): SkPaint {
  const p = paint(color, { shadow });
  p.setStyle(1); // PaintStyle.Stroke
  p.setStrokeWidth(width);
  return p;
}

export interface ShadowOpts {
  blur: number;
  color: string;
  dx?: number;
  dy?: number;
}

/** Soft dark shadow that keeps light text readable on bright photos. */
export function softShadow(u: number, strength = 0.55): ShadowOpts {
  return { blur: u * 0.5, dx: u * 0.15, dy: u * 0.2, color: `rgba(0,0,0,${strength})` };
}

/** Advance width of a string (sum of glyph advances). */
export function textWidth(f: SkFont, text: string): number {
  if (!text) return 0;
  const ids = f.getGlyphIDs(text);
  return f.getGlyphWidths(ids).reduce((a, b) => a + b, 0);
}

/** Shortens text with an ellipsis so it fits maxWidth. */
export function fit(f: SkFont, text: string, maxWidth: number): string {
  if (textWidth(f, text) <= maxWidth) return text;
  const chars = Array.from(text);
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (textWidth(f, chars.slice(0, mid).join('').trimEnd() + '…') <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo === 0 ? '' : chars.slice(0, lo).join('').trimEnd() + '…';
}

export function lineMetrics(f: SkFont) {
  const m = f.getMetrics();
  // ascent is negative in Skia
  return { ascent: -m.ascent, descent: m.descent, height: -m.ascent + m.descent };
}

/** Draws text with optional letter spacing; x is the alignment point. */
export function drawText(
  ctx: DrawCtx,
  text: string,
  x: number,
  baseline: number,
  f: SkFont,
  p: SkPaint,
  align: HAlign = 'left',
  spacing = 0,
) {
  if (!text) return;
  const chars = spacing ? Array.from(text) : [text];
  const widths = chars.map((c) => textWidth(f, c));
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cx = align === 'left' ? x : align === 'center' ? x - total / 2 : x - total;
  chars.forEach((c, i) => {
    ctx.canvas.drawText(c, cx, baseline, p, f);
    cx += widths[i] + spacing;
  });
}

export function spacedWidth(f: SkFont, text: string, spacing: number): number {
  const chars = Array.from(text);
  return textWidth(f, text) + spacing * Math.max(0, chars.length - 1);
}

export function hAlignOf(anchor: Anchor): HAlign {
  if (anchor.endsWith('left')) return 'left';
  if (anchor.endsWith('right')) return 'right';
  return 'center';
}

/** Top-left corner for a block of size bw×bh placed at `anchor` with margin m. */
export function placeBlock(anchor: Anchor, bw: number, bh: number, w: number, h: number, m: number) {
  const ha = hAlignOf(anchor);
  const x = ha === 'left' ? m : ha === 'right' ? w - m - bw : (w - bw) / 2;
  const y = anchor.startsWith('top') ? m : anchor.startsWith('bottom') ? h - m - bh : (h - bh) / 2;
  return { x, y };
}

/** X coordinate to pass to drawText for a block starting at bx with width bw. */
export function alignX(align: HAlign, bx: number, bw: number) {
  return align === 'left' ? bx : align === 'center' ? bx + bw / 2 : bx + bw;
}

export interface StackLine {
  text: string;
  font: SkFont;
  paint: SkPaint;
  /** Extra space after this line, in px. */
  gap?: number;
  spacing?: number;
}

/**
 * Lays out lines vertically as one block at the style's anchor and draws them.
 * Returns the block rect so templates can add decorations.
 */
export function drawStack(ctx: DrawCtx, raw: StackLine[], margin: number, maxWidth: number) {
  const lines = raw
    .filter((l) => l.text)
    .map((l) => ({ ...l, text: fit(l.font, l.text, maxWidth) }));
  if (!lines.length) return null;
  const align = hAlignOf(ctx.style.anchor);
  const sizes = lines.map((l) => ({
    w: spacedWidth(l.font, l.text, l.spacing ?? 0),
    ...lineMetrics(l.font),
  }));
  const bw = Math.max(...sizes.map((s) => s.w));
  const bh = sizes.reduce((acc, s, i) => acc + s.height + (i < lines.length - 1 ? lines[i].gap ?? 0 : 0), 0);
  const { x, y } = placeBlock(ctx.style.anchor, bw, bh, ctx.w, ctx.h, margin);
  let cy = y;
  lines.forEach((l, i) => {
    const s = sizes[i];
    drawText(ctx, l.text, alignX(align, x, bw), cy + s.ascent, l.font, l.paint, align, l.spacing ?? 0);
    cy += s.height + (l.gap ?? 0);
  });
  return { x, y, w: bw, h: bh };
}

/**
 * Draws text bent around a circle (for the travel stamp).
 * `outward` = top arc reading clockwise; otherwise bottom arc reading left→right.
 */
export function drawArcText(
  ctx: DrawCtx,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  f: SkFont,
  p: SkPaint,
  outward: boolean,
  spacing = 0,
) {
  if (!text) return;
  const glyphs = f.getGlyphIDs(text);
  const widths = f.getGlyphWidths(glyphs);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, glyphs.length - 1);
  const span = total / radius;
  const center = outward ? -Math.PI / 2 : Math.PI / 2;
  const dir = outward ? 1 : -1;
  let start = center - (dir * span) / 2;
  let run = 0;
  const xforms = glyphs.map((_, i) => {
    const gw = widths[i];
    const a = start + (dir * (run + gw / 2)) / radius;
    run += gw + spacing;
    const rot = a + (dir * Math.PI) / 2;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const px = cx + radius * Math.cos(a) - (gw / 2) * cos;
    const py = cy + radius * Math.sin(a) - (gw / 2) * sin;
    return Skia.RSXform(cos, sin, px, py);
  });
  const blob = Skia.TextBlob.MakeFromRSXformGlyphs(glyphs, xforms, f);
  ctx.canvas.drawTextBlob(blob, 0, 0, p);
}
