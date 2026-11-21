export type TemplateId = 'minimal' | 'film' | 'polaroid' | 'travel' | 'block' | 'elegant';

export type FontKey = 'inter' | 'interBold' | 'playfair' | 'dancing' | 'oswald' | 'pixel';

export type Anchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type DateFormatId = 'dmy' | 'mdy' | 'ymd' | 'short' | 'long' | 'film';
export type TimeFormatId = '24h' | '12h';
export type Lang = 'en' | 'vi';

/** How the stamp looks. Persisted between sessions. */
export interface StampStyle {
  templateId: TemplateId;
  font: FontKey;
  color: string;
  /** Size multiplier, 0.6 – 1.8 */
  scale: number;
  anchor: Anchor;
  /** 0.3 – 1 */
  opacity: number;
  dateFormat: DateFormatId;
  timeFormat: TimeFormatId;
}

/** Which elements are drawn. Persisted between sessions. */
export interface StampVisibility {
  date: boolean;
  time: boolean;
  location: boolean;
  text: boolean;
}

/** What the stamp says for one photo. */
export interface StampContent {
  date: Date;
  location: string;
  text: string;
}

/** Already-formatted strings handed to a template. Empty string = hidden. */
export interface StampLines {
  date: string;
  time: string;
  location: string;
  text: string;
}
