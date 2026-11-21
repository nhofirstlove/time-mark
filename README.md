# TimeMark

Camera app that stamps photos with date, time, location and your own text, in a style you choose.
Built with Expo SDK 58 (React Native + TypeScript). Runs as an **installable web app** (works on
iPhone for free, no Apple account) and as a native iOS/Android app from the same code.

## Web app (iPhone & Android, free)

### Try it on your PC
```powershell
npx expo start --web
```
Opens http://localhost:8081. Phones can't use the camera over plain `http://` on your Wi-Fi,
so to test on a phone, deploy it (below) and open the `https://` link.

### Deploy (free, EAS Hosting)
```powershell
npm run deploy:web
```
This builds the site into `dist/` and uploads it. The first run asks you to pick a subdomain and
prints a preview link like `https://time-mark--xxxx.expo.app`. To publish the main link
(`https://time-mark.expo.app`), run `npx eas-cli@latest deploy --prod`.

### Install on iPhone
1. Open the link in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open TimeMark from the home screen. Allow camera (and location if you use the location stamp).

Saving: tap **Save** → **Save to Photos** → choose **Save Image** (or press and hold the photo).

### Web vs native differences
- **Camera:** the live camera uses the browser's video stream (sharp, but below the phone's
  full sensor resolution). For full-resolution shots tap the **photo button** next to the shutter:
  on iPhone it offers *Take Photo* (native camera) or the photo library.
- **Saving:** browsers can't write to the photo library directly, so photos go through the
  share sheet (iPhone/Android) or download (desktop).
- **Address lookup:** uses OpenStreetMap's free Nominatim service (needs internet).
- Needs internet to open (no offline mode yet).

## Native app (optional)
- Android APK: `npx eas-cli@latest build --platform android --profile preview` (needs an `eas.json`
  with an APK profile).
- iPhone native build requires the paid Apple Developer Program.
- Expo Go on the App Store only supports up to SDK 54, so it can't open this SDK 58 project.

## Features
- Live stamp preview on the camera (3:4 frame, matches the photo)
- 6 templates: Minimal, Film date, Polaroid, Travel stamp, Info bar, Elegant
- Customize font, color, size, position (9-point grid), opacity, date & time format
- Turn date / time / location / text on or off; edit every value (backdate, rename place)
- Stamp existing photos from the library (uses the photo's own date when available)
- Full-resolution export, optional clean original, share sheet
- English / Tiếng Việt UI and date words; all fonts include Vietnamese diacritics

## Project layout
```
index.js / index.web.js   entry points (web loads Skia's CanvasKit first)
public/                   web: index.html (PWA tags), manifest.json, icons, canvaskit.wasm
src/
  app/            screens (expo-router): index = camera, editor, settings
  overlay/        stamp engine: types, templates, Skia drawing helpers, render/export, fonts
  components/     UI; *.web.tsx files are the browser versions
                  (CameraSurface, StampCanvas, ExportSheet, DateTimeField)
  hooks/          useMinuteClock, usePhotoImage(.web)
  services/       datetime, location (+ geocodeWeb), media(.web), feedback (alerts/haptics)
  store/          zustand: persisted settings, current draft photo
  i18n/           en.json, vi.json, native-vi.json (iOS permission prompts)
```
The same `drawStamp` function renders the live overlay, the editor preview and the saved file,
on web and native, so what you see is what gets saved.

## Adding a template
Add a `TemplateDef` to `src/overlay/templates.ts`, add its id to `TemplateId` in `types.ts`, and
add its name to both `i18n/*.json` files.

## Checks
`npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`, `npm run build:web`.
