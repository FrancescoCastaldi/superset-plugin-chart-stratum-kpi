import {
  classifyExtremeTitle,
  extractSparklineData,
  selectReferenceRow,
} from '../src/utils/series';

const rows = [
  { mese: '2026-01', v: 10 },
  { mese: '2026-02', v: 50 },
  { mese: '2026-03', v: 30 },
];

const defaults = {
  isPeak: false,
  isMin: false,
  calculationMode: 'dual_metric' as const,
  showSparkline: false,
};

describe('KPI Comparison series utils', () => {
  describe('classifyExtremeTitle', () => {
    it.each([
      ['Mese di picco', true, false],
      ['Peak month', true, false],
      ['Minimo richieste', false, true],
      ['Mese più basso', false, true],
      ['Lowest month', false, true],
      ['Richieste ultimo mese', false, false],
      ['', false, false],
    ])('classifies "%s"', (title, isPeak, isMin) => {
      expect(classifyExtremeTitle(title)).toEqual({ isPeak, isMin });
    });

    it('matches keywords case-insensitively', () => {
      expect(classifyExtremeTitle('PICCO')).toEqual({ isPeak: true, isMin: false });
    });
  });

  describe('selectReferenceRow', () => {
    it('picks the row with the highest primary metric for peak cards', () => {
      expect(selectReferenceRow(rows, 'v', { ...defaults, isPeak: true })).toBe(rows[1]);
    });

    it('picks the row with the lowest primary metric for minimum cards', () => {
      expect(selectReferenceRow(rows, 'v', { ...defaults, isMin: true })).toBe(rows[0]);
    });

    it('keeps the first of equal extremes', () => {
      const tied = [{ v: 5 }, { v: 5 }];
      expect(selectReferenceRow(tied, 'v', { ...defaults, isPeak: true })).toBe(tied[0]);
    });

    it('falls back to the first numeric cell when the metric key is missing', () => {
      const data = [{ label: 'a', x: 1 }, { label: 'b', x: 9 }];
      expect(selectReferenceRow(data, '', { ...defaults, isPeak: true })).toBe(data[1]);
      expect(selectReferenceRow(data, 'absent', { ...defaults, isMin: true })).toBe(data[0]);
    });

    it('defaults to the first row when no row has a numeric value', () => {
      const data = [{ label: 'a' }, { label: 'b' }];
      expect(selectReferenceRow(data, 'v', { ...defaults, isPeak: true })).toBe(data[0]);
    });

    it('uses the last row of a sparkline series regardless of calculation mode', () => {
      expect(selectReferenceRow(rows, 'v', { ...defaults, showSparkline: true })).toBe(rows[2]);
      expect(
        selectReferenceRow(rows, 'v', { ...defaults, calculationMode: 'time_shift', showSparkline: true }),
      ).toBe(rows[2]);
      expect(
        selectReferenceRow(rows, 'v', { ...defaults, calculationMode: 'static_target', showSparkline: true }),
      ).toBe(rows[2]);
    });

    it('uses the first row when sparkline is off or there is only one row', () => {
      expect(selectReferenceRow(rows, 'v', defaults)).toBe(rows[0]);
      const single = [rows[0]];
      expect(selectReferenceRow(single, 'v', { ...defaults, showSparkline: true })).toBe(single[0]);
    });

    it('returns undefined for an empty data set', () => {
      expect(selectReferenceRow([], 'v', defaults)).toBeUndefined();
      expect(selectReferenceRow([], 'v', { ...defaults, isPeak: true })).toBeUndefined();
    });
  });

  describe('extractSparklineData', () => {
    it('collects the primary metric in row order', () => {
      expect(extractSparklineData(rows, 'v')).toEqual([10, 50, 30]);
    });

    it('parses numeric strings and skips empty or non-numeric cells', () => {
      const data = [{ v: '1,5' }, { v: null }, { v: '' }, { v: 'n/d' }, {}, { v: 4 }];
      expect(extractSparklineData(data, 'v')).toEqual([1.5, 4]);
    });

    it('returns an empty series when nothing matches', () => {
      expect(extractSparklineData([], 'v')).toEqual([]);
      expect(extractSparklineData(rows, 'other')).toEqual([]);
    });
  });
});
