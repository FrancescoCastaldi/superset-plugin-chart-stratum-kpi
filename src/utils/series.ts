import { CalculationMode } from '../types';
import { parseNumericValue } from './formatters';
import { monthIndexOf } from './locale';

export type DataRow = Record<string, any>;

export interface ExtremeTitleFlags {
  isPeak: boolean;
  isMin: boolean;
}

/** Peak/minimum cards are recognised from keywords in the (Italian or English) title. */
export function classifyExtremeTitle(title: string): ExtremeTitleFlags {
  const titleLower = title.toLowerCase();
  return {
    isPeak: titleLower.includes('picco') || titleLower.includes('peak'),
    isMin:
      titleLower.includes('minimo') ||
      titleLower.includes('basso') ||
      titleLower.includes('lowest'),
  };
}

export interface ReferenceRowOptions extends ExtremeTitleFlags {
  calculationMode?: CalculationMode;
  showSparkline: boolean;
}

const rowPrimaryValue = (row: DataRow, primaryMetricKey: string): number | null =>
  parseNumericValue(primaryMetricKey ? row[primaryMetricKey] : null) ??
  parseNumericValue(Object.values(row).find(val => typeof val === 'number'));

function toSortableTimestamp(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoYm = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (isoYm) {
    return Date.UTC(Number(isoYm[1]), Number(isoYm[2]) - 1, 1);
  }
  const monthYear = trimmed.match(/^([A-Za-zÀ-ÿ]+)\s+(\d{4})$/);
  if (monthYear) {
    const mIdx = monthIndexOf(monthYear[1]);
    if (mIdx !== -1) {
      return Date.UTC(Number(monthYear[2]), mIdx, 1);
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const ms = Date.parse(trimmed);
    return Number.isNaN(ms) ? null : ms;
  }
  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return null;
}

/**
 * Reverses a sparkline query ordered descending by time back into chronological
 * ascending order (`oldest -> newest`) for left-to-right plotting and latest-row selection.
 */
export function orderSparklineRows(data: DataRow[], timeColumn?: string): DataRow[] {
  if (!Array.isArray(data) || data.length < 2) return data;
  const firstRow = data[0];
  if (!firstRow) return data;

  const dateCol = Object.keys(firstRow).find(k => {
    if (timeColumn && k === timeColumn) return true;
    const low = k.toLowerCase();
    return low.includes('mese') || low.includes('month') || low.includes('data') || low.includes('date');
  });
  if (!dateCol) return data;

  let firstTime: number | null = null;
  let lastTime: number | null = null;
  for (let i = 0; i < data.length; i += 1) {
    firstTime = toSortableTimestamp(data[i]?.[dateCol]);
    if (firstTime !== null) break;
  }
  for (let i = data.length - 1; i >= 0; i -= 1) {
    lastTime = toSortableTimestamp(data[i]?.[dateCol]);
    if (lastTime !== null) break;
  }
  if (firstTime !== null && lastTime !== null && firstTime > lastTime) {
    return [...data].reverse();
  }
  return data;
}

/**
 * Row the KPI value is read from: the max/min row for peak/minimum cards,
 * the latest row of a sparkline series regardless of calculation mode, otherwise the first row.
 */
export function selectReferenceRow(
  data: DataRow[],
  primaryMetricKey: string,
  { isPeak, isMin, showSparkline }: ReferenceRowOptions,
): DataRow | undefined {
  if (isPeak) {
    let maxVal = -Infinity;
    let peakRow = data[0];
    data.forEach(r => {
      const v = rowPrimaryValue(r, primaryMetricKey);
      if (v !== null && v > maxVal) {
        maxVal = v;
        peakRow = r;
      }
    });
    return peakRow;
  }
  if (isMin) {
    let minVal = Infinity;
    let minRow = data[0];
    data.forEach(r => {
      const v = rowPrimaryValue(r, primaryMetricKey);
      if (v !== null && v < minVal) {
        minVal = v;
        minRow = r;
      }
    });
    return minRow;
  }
  return showSparkline && data.length > 1
    ? data[data.length - 1]
    : data[0];
}

/** Numeric series of the primary metric across rows, skipping non-numeric cells. */
export function extractSparklineData(data: DataRow[], primaryMetricKey: string): number[] {
  const sparklineData: number[] = [];
  data.forEach(row => {
    const val = parseNumericValue(row[primaryMetricKey]);
    if (val !== null) {
      sparklineData.push(val);
    }
  });
  return sparklineData;
}
