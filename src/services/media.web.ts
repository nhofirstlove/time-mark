/**
 * Web save/share. Browsers can't write to the photo library, so we hand files to
 * the system share sheet (iPhone: "Save Image" / "Save 2 Images"), or download
 * them where sharing files isn't supported (most desktop browsers).
 *
 * Sharing must start directly from a tap, so the editor prepares the files first
 * and calls `shareFiles` from a button press.
 */

export class GalleryPermissionError extends Error {}

export async function writeTempJpeg(bytes: Uint8Array): Promise<string> {
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' }));
}

export async function toFile(uri: string, name: string): Promise<File> {
  const blob = await fetch(uri).then((r) => r.blob());
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

export function canShareFiles(files: File[]): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files });
}

/** Must be called synchronously from a user tap. Resolves false if the user cancelled. */
export async function shareFiles(files: File[]): Promise<boolean> {
  try {
    await navigator.share({ files });
    return true;
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return false;
    throw e;
  }
}

export function downloadFiles(files: File[]) {
  for (const f of files) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  }
}

// Native-only APIs kept for a matching module shape; the web editor uses the sheet instead.
export async function saveToGallery(): Promise<void> {
  throw new Error('saveToGallery is not available on web');
}

export async function shareImage(): Promise<void> {
  throw new Error('shareImage is not available on web');
}
