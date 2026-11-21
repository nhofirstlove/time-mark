/** Native builds save straight to the gallery, so there is no export sheet. */
export interface ExportSheetProps {
  /** Rendered stamped photo; null hides the sheet. */
  stampedUri: string | null;
  /** Clean original to include, if any. */
  originalUri: string | null;
  onClose: () => void;
  /** Called after the user saved/shared or downloaded. */
  onDone: () => void;
}

export function ExportSheet(_props: ExportSheetProps) {
  return null;
}
