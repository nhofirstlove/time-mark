import { Skia } from '@shopify/react-native-skia';

import {
  drawArcText,
  drawStack,
  drawText,
  fit,
  font,
  lineMetrics,
  paint,
  placeBlock,
  softShadow,
  strokePaint,
  textWidth,
  type DrawCtx,
} from './draw';
import type { Anchor, DateFormatId, FontKey, TemplateId, TimeFormatId } from './types';

export interface TemplateDef {
  id: TemplateId;
  /** false = fixed layout, the position control is hidden. 'vertical' = top/bottom only. */
  anchor: 'any' | 'vertical' | 'fixed';
  defaults: {
    font: FontKey;
    color: string;
    anchor: Anchor;
    dateFormat: DateFormatId;
    timeFormat: TimeFormatId;
  };
  draw(ctx: DrawCtx): void;
}

const join = (...parts: string[]) => parts.filter(Boolean).join('  ·  ');

/* ───────────── Minimal: clean corner text with a soft shadow ───────────── */
const minimal: TemplateDef = {
  id: 'minimal',
  anchor: 'any',
  defaults: { font: 'inter', color: '#FFFFFF', anchor: 'bottom-left', dateFormat: 'short', timeFormat: '24h' },
  draw(ctx) {
    const { u, lines, style } = ctx;
    const sh = softShadow(u);
    const main = paint(style.color, { shadow: sh });
    const sub = paint(style.color, { alpha: 0.92, shadow: sh });
    const bigKey: FontKey = style.font === 'inter' ? 'interBold' : style.font;
    const hero = lines.time || lines.date;
    const rest = lines.time ? lines.date : '';
    drawStack(
      ctx,
      [
        { text: hero, font: font(ctx, bigKey, u * 8), paint: main, gap: u * 0.8 },
        { text: rest, font: font(ctx, style.font, u * 3.8), paint: sub, gap: u * 0.6 },
        { text: lines.location, font: font(ctx, style.font, u * 3.2), paint: sub, gap: u * 0.6 },
        { text: lines.text, font: font(ctx, style.font, u * 3.2), paint: sub },
      ],
      u * 5,
      ctx.w - u * 10,
    );
  },
};

/* ───────────── Film date: orange glowing digits like a 90s point-and-shoot ───────────── */
const film: TemplateDef = {
  id: 'film',
  anchor: 'any',
  defaults: { font: 'pixel', color: '#FF8A1F', anchor: 'bottom-right', dateFormat: 'film', timeFormat: '24h' },
  draw(ctx) {
    const { u, lines, style } = ctx;
    const glow = { blur: u * 0.9, color: style.color };
    const p = paint(style.color, { shadow: glow });
    drawStack(
      ctx,
      [
        { text: lines.text, font: font(ctx, style.font, u * 3.6), paint: p, gap: u * 0.4 },
        { text: lines.location, font: font(ctx, style.font, u * 3.6), paint: p, gap: u * 0.6 },
        { text: [lines.date, lines.time].filter(Boolean).join('   '), font: font(ctx, style.font, u * 6.5), paint: p, spacing: u * 0.25 },
      ],
      u * 6,
      ctx.w - u * 12,
    );
  },
};

/* ───────────── Polaroid: white frame with a handwritten caption strip ───────────── */
const polaroid: TemplateDef = {
  id: 'polaroid',
  anchor: 'fixed',
  defaults: { font: 'dancing', color: '#2A2A2A', anchor: 'bottom-left', dateFormat: 'long', timeFormat: '24h' },
  draw(ctx) {
    const { canvas, w, h, base, u, lines, style } = ctx;
    const side = base * 4.5;
    const band = base * 22;
    const frame = paint('#FBF9F4');
    canvas.drawRect(Skia.XYWHRect(0, 0, w, side), frame);
    canvas.drawRect(Skia.XYWHRect(0, 0, side, h), frame);
    canvas.drawRect(Skia.XYWHRect(w - side, 0, side, h), frame);
    canvas.drawRect(Skia.XYWHRect(0, h - band, w, band), frame);
    // faint inner edge so the photo looks inset
    canvas.drawRect(
      Skia.XYWHRect(side, side, w - side * 2, h - side - band),
      strokePaint('rgba(0,0,0,0.12)', base * 0.25),
    );

    const ink = paint(style.color);
    const inkSoft = paint(style.color, { alpha: 0.7 });
    const big = lines.text || lines.location || lines.date || lines.time;
    const small =
      big === lines.text
        ? join(lines.date, lines.time, lines.location)
        : big === lines.location
          ? join(lines.date, lines.time)
          : big === lines.date
            ? lines.time
            : '';
    const maxW = w - side * 2 - base * 4;
    const fBig = font(ctx, style.font, u * 8);
    const fSmall = font(ctx, style.font === 'dancing' ? 'inter' : style.font, u * 3.2);
    const mb = lineMetrics(fBig);
    const ms = lineMetrics(fSmall);
    const gap = small ? u * 1.2 : 0;
    const blockH = mb.height + (small ? ms.height + gap : 0);
    let y = h - band + (band - blockH) / 2;
    const x = side + base * 2;
    drawText(ctx, fit(fBig, big, maxW), x, y + mb.ascent, fBig, ink);
    y += mb.height + gap;
    if (small) drawText(ctx, fit(fSmall, small, maxW), x, y + ms.ascent, fSmall, inkSoft);
  },
};

/* ───────────── Travel stamp: round postmark with curved place name ───────────── */
const travel: TemplateDef = {
  id: 'travel',
  anchor: 'any',
  defaults: { font: 'oswald', color: '#F3EAD8', anchor: 'bottom-right', dateFormat: 'dmy', timeFormat: '24h' },
  draw(ctx) {
    const { canvas, u, lines, style } = ctx;
    const R = u * 17;
    const m = u * 5;
    const { x, y } = placeBlock(style.anchor, R * 2, R * 2, ctx.w, ctx.h, m);
    const cx = x + R;
    const cy = y + R;
    const sh = { blur: u * 0.45, color: 'rgba(0,0,0,0.45)' };

    canvas.save();
    canvas.rotate(-10, cx, cy);
    const ring = R - u * 3.2;
    canvas.drawCircle(cx, cy, R, strokePaint(style.color, u * 0.8, sh));
    canvas.drawCircle(cx, cy, ring, strokePaint(style.color, u * 0.35, sh));

    const ink = paint(style.color, { shadow: sh });
    const fArc = font(ctx, style.font, u * 2.5);
    const arcMax = Math.PI * (ring + u * 0.4) * 0.8;
    const top = fit(fArc, (lines.location || 'TIMEMARK').toUpperCase(), arcMax);
    drawArcText(ctx, top, cx, cy, ring + u * 0.45, fArc, ink, true, u * 0.25);
    const bottom = lines.text ? fit(fArc, lines.text.toUpperCase(), arcMax) : '';
    if (bottom) drawArcText(ctx, bottom, cx, cy, R - u * 0.85, fArc, ink, false, u * 0.25);

    // dots where the arcs meet
    const dotR = u * 0.45;
    const mid = (R + ring) / 2;
    canvas.drawCircle(cx - mid, cy, dotR, ink);
    canvas.drawCircle(cx + mid, cy, dotR, ink);

    const inner = (ring - u * 1.2) * 2;
    const fDate = font(ctx, style.font, u * 5);
    const fTime = font(ctx, style.font, u * 3.4);
    const d = fit(fDate, lines.date, inner);
    const t = fit(fTime, lines.time, inner * 0.8);
    const md = lineMetrics(fDate);
    const mt = lineMetrics(fTime);
    const blockH = (d ? md.height : 0) + (t ? mt.height + (d ? u * 0.6 : 0) : 0);
    let ty = cy - blockH / 2;
    if (d) {
      drawText(ctx, d, cx, ty + md.ascent, fDate, ink, 'center');
      ty += md.height + u * 0.6;
    }
    if (t) drawText(ctx, t, cx, ty + mt.ascent, fTime, ink, 'center');
    canvas.restore();
  },
};

/* ───────────── Info bar: translucent strip with big time and details ───────────── */
const block: TemplateDef = {
  id: 'block',
  anchor: 'vertical',
  defaults: { font: 'oswald', color: '#FFC93C', anchor: 'bottom-left', dateFormat: 'short', timeFormat: '24h' },
  draw(ctx) {
    const { canvas, w, h, u, lines, style } = ctx;
    const hero = lines.time || lines.date;
    const details = [lines.time ? lines.date : '', lines.location, lines.text].filter(Boolean);
    if (!hero && !details.length) return;

    const pad = u * 4;
    const fHero = font(ctx, style.font, u * 10);
    const detailKey: FontKey = style.font === 'oswald' || style.font === 'pixel' ? 'inter' : style.font;
    const fDet = font(ctx, detailKey, u * 3.3);
    const mh = lineMetrics(fHero);
    const md = lineMetrics(fDet);
    const lineGap = u * 0.8;
    const detH = details.length * md.height + Math.max(0, details.length - 1) * lineGap;
    const barH = Math.max(hero ? mh.height : 0, detH) + pad * 2;
    const top = style.anchor.startsWith('top');
    const by = top ? 0 : h - barH;

    canvas.drawRect(Skia.XYWHRect(0, by, w, barH), paint('#000000', { alpha: 0.45 }));

    let x = pad;
    if (hero) {
      drawText(ctx, hero, x, by + (barH - mh.height) / 2 + mh.ascent, fHero, paint(style.color));
      x += textWidth(fHero, hero) + pad * 0.8;
      canvas.drawRect(Skia.XYWHRect(x, by + pad, u * 0.6, barH - pad * 2), paint(style.color));
      x += u * 0.6 + pad * 0.8;
    }
    const white = paint('#FFFFFF');
    const maxW = w - x - pad;
    let y = by + (barH - detH) / 2;
    details.forEach((d) => {
      drawText(ctx, fit(fDet, d, maxW), x, y + md.ascent, fDet, white);
      y += md.height + lineGap;
    });
  },
};

/* ───────────── Elegant: centered serif with fine rules ───────────── */
const elegant: TemplateDef = {
  id: 'elegant',
  anchor: 'any',
  defaults: { font: 'playfair', color: '#FFFFFF', anchor: 'bottom-center', dateFormat: 'long', timeFormat: '24h' },
  draw(ctx) {
    const { canvas, u, lines, style } = ctx;
    const sh = softShadow(u, 0.45);
    const p = paint(style.color, { shadow: sh });
    const pSoft = paint(style.color, { alpha: 0.85, shadow: sh });
    const rect = drawStack(
      ctx,
      [
        { text: lines.location.toUpperCase(), font: font(ctx, 'inter', u * 2.6), paint: pSoft, spacing: u * 0.6, gap: u * 3 },
        { text: lines.date, font: font(ctx, style.font, u * 5.4), paint: p, gap: u * 0.6 },
        { text: lines.time, font: font(ctx, style.font, u * 3.4), paint: pSoft, gap: u * 1.6 },
        { text: lines.text, font: font(ctx, style.font, u * 3.6), paint: p },
      ],
      u * 7,
      ctx.w - u * 14,
    );
    // hairline under the location line
    if (rect && lines.location && (lines.date || lines.time || lines.text)) {
      const fLoc = font(ctx, 'inter', u * 2.6);
      const ly = rect.y + lineMetrics(fLoc).height + u * 1.5;
      const ha = style.anchor.endsWith('left') ? 'left' : style.anchor.endsWith('right') ? 'right' : 'center';
      const len = u * 12;
      const lx = ha === 'left' ? rect.x : ha === 'right' ? rect.x + rect.w - len : rect.x + (rect.w - len) / 2;
      const line = paint(style.color, { alpha: 0.8, shadow: sh });
      line.setStrokeWidth(u * 0.2);
      canvas.drawLine(lx, ly, lx + len, ly, line);
    }
  },
};

export const TEMPLATES: Record<TemplateId, TemplateDef> = { minimal, film, polaroid, travel, block, elegant };
export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[];
