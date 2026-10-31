import { ENGLISH_MONTHS, ITALIAN_MONTH_NAMES, monthIndexOf } from './locale';
import { getNumberFormatter } from '@superset-ui/core';

/**
 * Format a number using Italian convention (dot as thousands separator, comma as decimal).
 */
export function formatItalianNumber(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const parts = value.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (parts.length > 1) {
    return parts.join(',');
  }
  return parts[0];
}

/**
 * Format a percentage value with sign (+/-) and 1 or 2 decimals.
 */
export function formatDeltaPercent(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—%';
  }

  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  const formatted = formatItalianNumber(value, decimals);
  return `${sign}${formatted}%`;
}

/**
 * Format a value using Superset number formatter or Italian fallback.
 */
export function formatMetricValue(
  value: number | null | undefined,
  formatString?: string,
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  if (formatString) {
    try {
      const formatter = getNumberFormatter(formatString);
      return formatter(value);
    } catch {
      // Fallback if formatter string is not standard
    }
  }

  // Automatic heuristic: if integer, 0 decimals; if float, 2 decimals
  const isInteger = Math.abs(value % 1) < 0.0001;
  return formatItalianNumber(value, isInteger ? 0 : 2);
}

/**
 * Parse any arbitrary Superset cell value to a number.
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

export const ITALIAN_MONTHS = ITALIAN_MONTH_NAMES;

export function getMetricLabel(metric: any): string {
  if (!metric) return '';
  if (typeof metric === 'string') return metric;
  return (
    metric.label ||
    metric.metric_name ||
    metric.verbose_name ||
    metric.sqlExpression ||
    metric.column?.column_name ||
    metric.optionName ||
    ''
  );
}

/**
 * `Month Year` for a date, a timestamp, a `YYYY-MM` string or a text that already starts with a
 * month name (English or Italian). Month names are written with `months`, English by default.
 */
export function formatMonthYear(val: any, months: string[] = ENGLISH_MONTHS): string {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return `${months[val.getMonth()]} ${val.getFullYear()}`;
  }
  if (typeof val === 'number') {
    if (val > 100000000) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
      }
    }
    return '';
  }
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const matchIdx = monthIndexOf(parts[0]);
    if (matchIdx !== -1) {
      return `${months[matchIdx]} ${parts.slice(1).join(' ')}`;
    }
  }

  const m = trimmed.match(/^(\d{4})-(\d{1,2})/);
  if (m) {
    const year = m[1];
    const monthIdx = parseInt(m[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${year}`;
    }
  }

  return trimmed;
}


/** Italian month names, kept for callers written before the `locale` option */
export function formatMonthYearItalian(val: any): string {
  return formatMonthYear(val, ITALIAN_MONTH_NAMES);
}
