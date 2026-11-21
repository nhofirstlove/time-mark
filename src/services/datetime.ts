import type { DateFormatId, Lang, TimeFormatId } from '@/overlay/types';

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const VI_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const VI_DAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function formatDate(d: Date, format: DateFormatId, lang: Lang): string {
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const wd = d.getDay();
  switch (format) {
    case 'dmy':
      return `${pad(day)}/${pad(month + 1)}/${year}`;
    case 'mdy':
      return `${pad(month + 1)}/${pad(day)}/${year}`;
    case 'ymd':
      return `${year}-${pad(month + 1)}-${pad(day)}`;
    case 'short':
      return lang === 'vi'
        ? `${VI_DAYS_SHORT[wd]}, ${pad(day)}/${pad(month + 1)}/${year}`
        : `${EN_DAYS_SHORT[wd]}, ${day} ${EN_MONTHS[month].slice(0, 3)} ${year}`;
    case 'long':
      return lang === 'vi'
        ? `${VI_DAYS[wd]}, ${day} tháng ${month + 1}, ${year}`
        : `${EN_DAYS[wd]}, ${day} ${EN_MONTHS[month]} ${year}`;
    case 'film':
      return `'${pad(year % 100)} ${pad(month + 1)} ${pad(day)}`;
  }
}

export function formatTime(d: Date, format: TimeFormatId, lang: Lang): string {
  const h = d.getHours();
  const m = pad(d.getMinutes());
  if (format === '24h') return `${pad(h)}:${m}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = lang === 'vi' ? (h < 12 ? 'SA' : 'CH') : h < 12 ? 'AM' : 'PM';
  return `${h12}:${m} ${suffix}`;
}

/** Example strings for the format pickers. */
export const SAMPLE_DATE = new Date(2026, 10, 21, 14, 5);
