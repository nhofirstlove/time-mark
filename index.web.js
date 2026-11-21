// Web entry. Skia's web build binds to CanvasKit when its module is first
// imported, so CanvasKit (public/canvaskit.wasm) must finish loading before
// any app code runs. The router is therefore imported only after the load.
// `@expo/metro-runtime` must stay the first import for Fast Refresh on web.
import '@expo/metro-runtime';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: (file) => `/${file}` })
  .then(() => {
    // `require` (not `import`) so these modules are bundled normally but only
    // evaluated now, after CanvasKit is ready.
    const { App } = require('expo-router/build/qualified-entry');
    const { renderRootComponent } = require('expo-router/build/renderRootComponent');
    renderRootComponent(App);
  })
  .catch((err) => {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML =
        '<div class="tm-boot"><div>Could not start TimeMark. Please reload.</div></div>';
    }
    console.error(err);
  });
