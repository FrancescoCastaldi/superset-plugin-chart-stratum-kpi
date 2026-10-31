import {
  formatMonthYear,
  formatItalianNumber,
  formatDeltaPercent,
  parseNumericValue,
  getMetricLabel,
  formatMonthYearItalian,
  ITALIAN_MONTHS,
} from '../src/utils/formatters';

describe('KPI Comparison formatters', () => {
  describe('formatItalianNumber', () => {
    it('formats thousands with the Italian dot separator', () => {
      expect(formatItalianNumber(1234567)).toBe('1.234.567');
      expect(formatItalianNumber(1500)).toBe('1.500');
    });

    it('formats decimals with the Italian comma separator', () => {
      expect(formatItalianNumber(1234.56, 2)).toBe('1.234,56');
      expect(formatItalianNumber(123, 2)).toBe('123,00');
    });

    it('rounds to the requested number of decimals by default', () => {
      expect(formatItalianNumber(1234.56)).toBe('1.235');
    });

    it('keeps the minus sign on negative values', () => {
      expect(formatItalianNumber(-1234.5, 1)).toBe('-1.234,5');
    });

    it('returns the em-dash placeholder for nullish or NaN input', () => {
      expect(formatItalianNumber(null)).toBe('—');
      expect(formatItalianNumber(undefined)).toBe('—');
      expect(formatItalianNumber(NaN)).toBe('—');
    });

    it('formats zero without separators', () => {
      expect(formatItalianNumber(0)).toBe('0');
    });
  });

  describe('formatDeltaPercent', () => {
    it('prefixes positive deltas with a plus sign', () => {
      expect(formatDeltaPercent(12.34)).toBe('+12,3%');
    });

    it('keeps the native minus sign on negative deltas', () => {
      expect(formatDeltaPercent(-5)).toBe('-5,0%');
    });

    it('does not add a sign on zero deltas', () => {
      expect(formatDeltaPercent(0)).toBe('0,0%');
    });

    it('honours the decimals argument', () => {
      expect(formatDeltaPercent(5.678, 2)).toBe('+5,68%');
    });

    it('returns the em-dash placeholder for nullish or NaN input', () => {
      expect(formatDeltaPercent(null)).toBe('—%');
      expect(formatDeltaPercent(undefined)).toBe('—%');
      expect(formatDeltaPercent(NaN)).toBe('—%');
    });
  });

  describe('parseNumericValue', () => {
    it('returns null for nullish or empty input', () => {
      expect(parseNumericValue(null)).toBeNull();
      expect(parseNumericValue(undefined)).toBeNull();
      expect(parseNumericValue('')).toBeNull();
    });

    it('passes through valid numbers and nulls NaN numbers', () => {
      expect(parseNumericValue(123)).toBe(123);
      expect(parseNumericValue(NaN)).toBeNull();
    });

    it('parses Italian comma decimals from strings', () => {
      expect(parseNumericValue('1234,56')).toBe(1234.56);
      expect(parseNumericValue('45,67')).toBe(45.67);
    });

    it('strips whitespace from strings before parsing', () => {
      expect(parseNumericValue('1 234')).toBe(1234);
    });

    it('returns null for non-numeric strings and unsupported types', () => {
      expect(parseNumericValue('abc')).toBeNull();
      expect(parseNumericValue(true)).toBeNull();
      expect(parseNumericValue({})).toBeNull();
    });
  });

  describe('getMetricLabel', () => {
    it('returns an empty string for falsy metrics', () => {
      expect(getMetricLabel(null)).toBe('');
      expect(getMetricLabel(undefined)).toBe('');
    });

    it('passes through string metrics', () => {
      expect(getMetricLabel('sum_richieste')).toBe('sum_richieste');
    });

    it('resolves ad-hoc metric objects by label', () => {
      expect(getMetricLabel({ label: 'Accessi Diretti' })).toBe('Accessi Diretti');
    });

    it('falls back to metric_name, verbose_name, sqlExpression, column and optionName', () => {
      expect(getMetricLabel({ metric_name: 'sum_x' })).toBe('sum_x');
      expect(getMetricLabel({ verbose_name: 'Somma X' })).toBe('Somma X');
      expect(getMetricLabel({ sqlExpression: 'COUNT(*)' })).toBe('COUNT(*)');
      expect(getMetricLabel({ column: { column_name: 'col' } })).toBe('col');
      expect(getMetricLabel({ optionName: 'opt' })).toBe('opt');
    });
  });

  describe('formatMonthYearItalian', () => {
    it('returns an empty string for nullish or non-string input', () => {
      expect(formatMonthYearItalian(null)).toBe('');
      expect(formatMonthYearItalian('')).toBe('');
      expect(formatMonthYearItalian(2025)).toBe('');
    });

    it('canonicalizes month names to the capitalized Italian form', () => {
      expect(formatMonthYearItalian('settembre 2025')).toBe('Settembre 2025');
      expect(formatMonthYearItalian('SETTEMBRE 2025')).toBe('Settembre 2025');
    });

    it('converts ISO year-month strings to Italian month names', () => {
      expect(formatMonthYearItalian('2025-09')).toBe('Settembre 2025');
      expect(formatMonthYearItalian('2025-9')).toBe('Settembre 2025');
    });

    it('falls back to the trimmed input when no pattern matches', () => {
      expect(formatMonthYearItalian('2025-13')).toBe('2025-13');
      expect(formatMonthYearItalian('  Q3 2025  ')).toBe('Q3 2025');
    });
  });

  describe('formatMonthYear', () => {
    it('writes English month names by default', () => {
      expect(formatMonthYear('2025-09')).toBe('September 2025');
      expect(formatMonthYear(new Date(2026, 2, 1))).toBe('March 2026');
    });

    it('translates a month name found in the data, whichever language it is in', () => {
      expect(formatMonthYear('settembre 2025')).toBe('September 2025');
      expect(formatMonthYear('october 2025')).toBe('October 2025');
    });

    it('writes the month names it is given', () => {
      expect(formatMonthYear('2025-09', ITALIAN_MONTHS)).toBe('Settembre 2025');
    });
  });

  it('exposes the 12 Italian month names', () => {
    expect(ITALIAN_MONTHS).toHaveLength(12);
    expect(ITALIAN_MONTHS[0]).toBe('Gennaio');
    expect(ITALIAN_MONTHS[11]).toBe('Dicembre');
  });
});
