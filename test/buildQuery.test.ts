import buildQuery from '../src/plugin/buildQuery';
import { KPIComparisonFormData } from '../src/types';

const baseFormData = {
  datasource: '1__table',
} as KPIComparisonFormData;

const build = (overrides: Partial<KPIComparisonFormData>) =>
  buildQuery({ ...baseFormData, ...overrides } as KPIComparisonFormData);

describe('KPI Comparison buildQuery', () => {
  it('returns a single query context carrying the form data and datasource', () => {
    const context = build({ metric: 'sum_richieste' });
    expect(context.queries).toHaveLength(1);
    expect(context.datasource).toEqual({ id: 1, type: 'table' });
    expect(context.form_data?.datasource).toBe('1__table');
  });

  describe('dual metric mode', () => {
    it('requests the primary metric followed by the comparison metric', () => {
      const { queries } = build({
        calculation_mode: 'dual_metric',
        metric: 'sum_richieste',
        comparison_metric: 'sum_richieste_conf',
      });
      expect(queries[0].metrics).toEqual(['sum_richieste', 'sum_richieste_conf']);
      expect(queries[0].time_offsets).toBeUndefined();
    });

    it('does not duplicate metrics that share the same label', () => {
      const { queries } = build({
        calculation_mode: 'dual_metric',
        metrics: ['sum_x'],
        metric: 'sum_x',
        comparison_metric: 'sum_x',
      });
      expect(queries[0].metrics).toEqual(['sum_x']);
    });

    it('appends the comparison metric to a configured metrics list', () => {
      const { queries } = build({
        calculation_mode: 'dual_metric',
        metrics: ['metric_a', 'metric_b'],
        metric: 'metric_a',
        comparison_metric: 'metric_c',
      });
      expect(queries[0].metrics).toEqual(['metric_a', 'metric_b', 'metric_c']);
    });

    it('falls back to the comparison metric alone when the primary metric is missing', () => {
      const { queries } = build({
        calculation_mode: 'dual_metric',
        comparison_metric: 'sum_conf',
      });
      expect(queries[0].metrics).toEqual(['sum_conf']);
    });

    it('preserves ad-hoc metric objects and normalizes metric_name objects to their name', () => {
      const { queries } = build({
        calculation_mode: 'dual_metric',
        metric: { label: 'Accessi Diretti' },
        comparison_metric: { metric_name: 'accessi_conf' },
      });
      const metrics: any[] = queries[0].metrics as any[];
      expect(metrics).toHaveLength(2);
      expect(metrics[0]).toEqual({ label: 'Accessi Diretti' });
      expect(metrics[1]).toBe('accessi_conf');
    });

    it('adds the target metric when comparison is active', () => {
      const { queries } = build({
        calculation_mode: 'dual_metric',
        metric: 'sum_x',
        target_metric: 'sum_target',
      });
      expect(queries[0].metrics).toEqual(['sum_x', 'sum_target']);
    });

    it('adds the total metric for the percent-of-total badge', () => {
      const { queries } = build({
        calculation_mode: 'dual_metric',
        metric: 'sum_x',
        badge_content: 'percent_of_total',
        total_metric: 'sum_totale',
      });
      expect(queries[0].metrics).toEqual(['sum_x', 'sum_totale']);
    });
  });

  describe('time shift mode', () => {
    it('applies time offsets on the primary metric only when the time range is enclosed', () => {
      const { queries } = build({
        calculation_mode: 'time_shift',
        metric: 'sum_x',
        comparison_metric: 'sum_x_conf',
        time_compare: '1 month',
        time_range: 'LAST_MONTH',
      });
      expect(queries[0].metrics).toEqual(['sum_x']);
      expect(queries[0].time_offsets).toEqual(['1 month']);
    });

    it('suppresses time offsets when the time range is "No filter"', () => {
      const { queries } = build({
        calculation_mode: 'time_shift',
        metric: 'sum_x',
        time_compare: '1 month',
        time_range: 'No filter',
      });
      expect(queries[0].time_offsets).toBeUndefined();
    });

    it('suppresses time offsets when no time range is configured', () => {
      const { queries } = build({
        calculation_mode: 'time_shift',
        metric: 'sum_x',
        time_compare: '1 month',
      });
      expect(queries[0].time_offsets).toBeUndefined();
    });

    it('suppresses time offsets when no time shift value is configured', () => {
      const { queries } = build({
        calculation_mode: 'time_shift',
        metric: 'sum_x',
        time_range: 'LAST_MONTH',
      });
      expect(queries[0].time_offsets).toBeUndefined();
    });
  });

  describe('comparison disabled', () => {
    it('requests the primary metric only when enable_comparison is false', () => {
      const { queries } = build({
        enable_comparison: false,
        calculation_mode: 'dual_metric',
        metric: 'sum_x',
        comparison_metric: 'sum_y',
        target_metric: 'sum_target',
      });
      expect(queries[0].metrics).toEqual(['sum_x']);
      expect(queries[0].time_offsets).toBeUndefined();
    });

    it('adds the target metric when the progress bar is active even if comparison is disabled', () => {
      const { queries } = build({
        enable_comparison: false,
        calculation_mode: 'none',
        metric: 'sum_x',
        show_progress_bar: true,
        target_metric: 'sum_target',
      });
      expect(queries[0].metrics).toEqual(['sum_x', 'sum_target']);
    });

    it('requests the primary metric only when calculation_mode is none', () => {
      const { queries } = build({
        calculation_mode: 'none',
        metric: 'sum_x',
        comparison_metric: 'sum_y',
      });
      expect(queries[0].metrics).toEqual(['sum_x']);
    });
  });

  describe('row limit', () => {
    it('defaults to a single row for plain KPI queries', () => {
      const { queries } = build({ metric: 'sum_x' });
      expect(queries[0].row_limit).toBe(1);
    });

    it('respects an explicitly configured row_limit for single-value queries', () => {
      const { queries } = build({ metric: 'sum_x', row_limit: 10 });
      expect(queries[0].row_limit).toBe(10);
    });

    it('raises the row limit to 50 for peak/min KPIs', () => {
      const { queries } = build({
        metric: 'sum_x',
        kpi_title: 'Picco di richieste giornaliero',
      });
      expect(queries[0].metrics).toEqual(['sum_x']);
      expect(queries[0].row_limit).toBe(50);
    });
  });

  describe('sparkline', () => {
    it('orders descending by the time column to fetch the latest rows, includes it and raises row_limit', () => {
      const { queries } = build({
        metric: 'sum_x',
        show_sparkline: true,
        time_column: 'data',
      });
      expect(queries[0].columns).toContain('data');
      expect(queries[0].orderby).toEqual([['data', false]]);
      expect(queries[0].row_limit).toBe(50);
    });

    it('normalizes time column objects to their column_name with descending order', () => {
      const { queries } = build({
        metric: 'sum_x',
        show_sparkline: true,
        time_column: { column_name: 'data' } as any,
      });
      expect(queries[0].columns).toContain('data');
      expect(queries[0].orderby).toEqual([['data', false]]);
    });

    it('does not add ordering when the sparkline is disabled', () => {
      const { queries } = build({ metric: 'sum_x', time_column: 'data' });
      expect(queries[0].orderby).toBeUndefined();
      expect(queries[0].row_limit).toBe(1);
    });
  });

  it('adds the dynamic subtitle column to the query columns for strings and column objects', () => {
    const { queries } = build({
      metric: 'sum_x',
      dynamic_subtitle_column: 'sottotitolo',
    });
    expect(queries[0].columns).toContain('sottotitolo');

    const objQuery = build({
      metric: 'sum_x',
      dynamic_subtitle_column: { column_name: 'reparto' } as any,
    });
    expect(objQuery.queries[0].columns).toContain('reparto');
  });

  describe('dashboard period comparison (PeriodCompare filter)', () => {
    it('sets time_offsets when extra_form_data.time_compare is provided', () => {
      const { queries } = build({
        metric: 'sum_x',
        extra_form_data: {
          time_compare: ['2026-08-01 : 2026-08-31'],
        },
      });
      expect(queries[0].time_offsets).toEqual(['2026-08-01 : 2026-08-31']);
    });

    it('suppresses dashboard time_offsets when enable_comparison is false', () => {
      const { queries } = build({
        metric: 'sum_x',
        enable_comparison: false,
        extra_form_data: {
          time_compare: ['2026-08-01 : 2026-08-31'],
        },
      });
      expect(queries[0].time_offsets).toBeUndefined();
    });
  });

  it('builds an empty metrics list when no metric is configured', () => {
    const { queries } = build({ calculation_mode: 'dual_metric' });
    expect(queries[0].metrics).toEqual([]);
  });
});
