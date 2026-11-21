import { create } from 'zustand';

export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

/** The photo currently being edited. Not persisted. */
interface DraftState {
  photo: CapturedPhoto | null;
  /** When the shutter was pressed. */
  capturedAt: Date;
  /** Date/time shown on the stamp (editable, e.g. to backdate). */
  date: Date;
  location: string;

  start: (photo: CapturedPhoto, capturedAt: Date, location: string) => void;
  setDate: (d: Date) => void;
  setLocation: (l: string) => void;
  clear: () => void;
}

export const useDraft = create<DraftState>()((set) => ({
  photo: null,
  capturedAt: new Date(),
  date: new Date(),
  location: '',

  start: (photo, capturedAt, location) => set({ photo, capturedAt, date: capturedAt, location }),
  setDate: (date) => set({ date }),
  setLocation: (location) => set({ location }),
  clear: () => set({ photo: null }),
}));
