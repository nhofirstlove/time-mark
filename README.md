# TimeMark

Camera app that stamps photos with date, time, location and your own text, in a style you choose.
Built with Expo SDK 58 (React Native + TypeScript) for iOS and Android.

## Run it on your phone

1. Install **Expo Go** from the App Store / Google Play.
2. On the PC (same Wi-Fi as the phone):
   ```powershell
   npm install
   npx expo start
   ```
3. Scan the QR code: Android with the Expo Go app, iPhone with the Camera app.

If the phone can't reach the PC, use `npx expo start --tunnel`.

## Features (v1)

- Live stamp preview on the camera viewfinder (3:4 frame, matches the photo)
- 6 templates: Minimal, Film date, Polaroid, Travel stamp, Info bar, Elegant
- Customize font, color, size, position (9-point grid), opacity, date & time format
- Turn date / time / location / text on or off per photo; edit every value (backdate, rename place)
- Location from GPS + phone's built-in reverse geocoding (city/country, full address, or coordinates)
- Saves the stamped photo at full resolution, plus the clean original (toggle in Settings)
- Share sheet (Zalo, Messenger, Instagram…)
- English / Tiếng Việt UI and date words; all fonts support Vietnamese diacritics

## Project layout

```
src/
  app/            screens (expo-router): index = camera, editor, settings
  overlay/        stamp engine
    types.ts        data + style models
    templates.ts    the 6 template drawing functions
    draw.ts         Skia text/layout helpers (stacking, fitting, curved text)
    render.ts       drawStamp / drawComposite / full-res JPEG export
    fonts.tsx       bundled fonts → Skia typefaces
  components/     TemplateStrip, StampCanvas, ContentPanel, StylePanel, DateTimeField, ui
  services/       datetime formatting, location, media (save/share)
  store/          zustand: persisted settings, current draft photo
  i18n/           en.json, vi.json, native-vi.json (iOS permission prompts)
```

The same `drawStamp` function renders the camera overlay, the editor preview and the saved
file, so what you see is what gets saved.

## Adding a template

Add a `TemplateDef` to `src/overlay/templates.ts` (defaults + a `draw(ctx)` function using the
helpers in `draw.ts`), add its id to `TemplateId` in `types.ts`, and add its name to both
`i18n/*.json` files.

## Notes

- **Android gallery saving in Expo Go:** if saving fails with a permission error in Expo Go,
  build a development build: `npx eas-cli@latest build --profile development --platform android`.
- **Standalone iOS build** requires an Apple Developer account (EAS Build works from Windows).
- Checks: `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`.
