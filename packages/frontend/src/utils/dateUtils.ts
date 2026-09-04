// packages/frontend/src/utils/dateUtils.ts

/**
 * Format a date to IST with 24-hour format
 * @param date - Date string or Date object
 * @param format - 'full' | 'date' | 'time' | 'datetime'
 * @returns Formatted string in IST
 */

// IST offset in milliseconds (UTC + 5:30)
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

export const toIST = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const utcTime = d.getTime();
  const istTime = utcTime + IST_OFFSET;
  return new Date(istTime);
};

export const formatISTDate = (
  date: Date | string,
  format: 'full' | 'date' | 'time' | 'datetime' = 'datetime'
): string => {
  const istDate = toIST(date);
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');

  const dateStr = `${day}-${month}-${year}`;
  const timeStr = `${hours}:${minutes}`;

  switch (format) {
    case 'date':
      return dateStr;
    case 'time':
      return timeStr;
    case 'full':
      return `${dateStr} ${timeStr}:${seconds}`;
    case 'datetime':
    default:
      return `${dateStr} ${timeStr}`;
  }
};

export const formatSubmissionDate = (date: Date | string): string => {
  return formatISTDate(date, 'datetime');
};

export const formatISTDateOnly = (date: Date | string): string => {
  const istDate = toIST(date);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayIST = (): string => {
  const now = new Date();
  const istDate = toIST(now);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isSameDayIST = (date1: Date | string, date2: Date | string): boolean => {
  return formatISTDateOnly(date1) === formatISTDateOnly(date2);
};