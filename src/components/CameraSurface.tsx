import { CameraView } from 'expo-camera';
import { useImperativeHandle, useRef, type Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { CapturedPhoto } from '@/store/draft';

export interface CameraHandle {
  takePhoto(): Promise<CapturedPhoto>;
}

export interface CameraSurfaceProps {
  ref?: Ref<CameraHandle>;
  style?: StyleProp<ViewStyle>;
  onReady: () => void;
  /** Web only; native permission is handled by the screen. */
  onError?: (kind: 'denied' | 'unavailable') => void;
}

/** Native camera: a thin wrapper over expo-camera's CameraView. */
export function CameraSurface({ ref, style, onReady }: CameraSurfaceProps) {
  const camera = useRef<CameraView>(null);

  useImperativeHandle(ref, () => ({
    async takePhoto() {
      if (!camera.current) throw new Error('Camera not ready');
      const p = await camera.current.takePictureAsync({ quality: 1 });
      return { uri: p.uri, width: p.width, height: p.height };
    },
  }));

  return <CameraView ref={camera} style={style} facing="back" onCameraReady={onReady} />;
}
