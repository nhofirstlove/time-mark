import { createElement, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { CameraSurfaceProps } from './CameraSurface';

export type { CameraHandle } from './CameraSurface';

/**
 * Browser camera. expo-camera's web view uses the browser's default stream size
 * (often 640×480 on iPhone), so this asks getUserMedia for a high resolution
 * 4:3 stream and grabs full-size frames from it.
 */
export function CameraSurface({ ref, style, onReady, onError }: CameraSurfaceProps) {
  const video = useRef<HTMLVideoElement | null>(null);
  const handlers = useRef({ onReady, onError });
  useEffect(() => {
    handlers.current = { onReady, onError };
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        handlers.current.onError?.('unavailable');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 4032 },
            height: { ideal: 3024 },
            aspectRatio: { ideal: 4 / 3 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const el = video.current;
        if (!el) return;
        el.srcObject = stream;
        await el.play().catch(() => {});
        if (el.videoWidth > 0) handlers.current.onReady();
        else el.onloadedmetadata = () => handlers.current.onReady();
      } catch (e) {
        const name = (e as DOMException)?.name;
        handlers.current.onError?.(
          name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable',
        );
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async takePhoto() {
      const el = video.current;
      if (!el || !el.videoWidth) throw new Error('Camera not ready');
      const width = el.videoWidth;
      const height = el.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(el, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Capture failed'))), 'image/jpeg', 0.95),
      );
      return { uri: URL.createObjectURL(blob), width, height };
    },
  }));

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      {createElement('video', {
        ref: video,
        playsInline: true,
        muted: true,
        autoPlay: true,
        style: { width: '100%', height: '100%', objectFit: 'cover', background: '#000' },
      })}
    </View>
  );
}
