import transformProps from '../src/plugin/transformProps';
import { isNumericCell, parseNumericValue, parseStaticNumber } from '../src/utils/formatters';
import { formatDuration, formatSignedDuration, parseTimeToSeconds } from '../src/utils/timeValues';
import { hasTimeMetric, showDurationControl } from '../src/plugin/timeMetricHints';

type Row = Record<string, any>;

const run = (formData: Record<string, any>, data: Row[]) =>
  transformProps({
    width: 320,
    height: 160,
    formData: { locale: 'it', ...formData },
    rawFormData: {},
    queriesData: [{ data }],
  } as any);

describe('time values', () => {
  it('reads the texts Superset sends for Time fields', () => {
    expect(parseTimeToSeconds('00:12:54.425000')).toBeCloseTo(774.425, 6);
    expect(parseTimeToSeconds('26:10:00')).toBe(94200);
    expect(parseTimeToSeconds('1 day, 2:03:04')).toBe(86400 + 7384);
    expect(parseTimeToSeconds('PT12M54S')).toBe(774);
    expect(parseTimeToSeconds('12:54')).toBeNull();
    expect(parseTimeToSeconds('2026-01-01 00:12:54')).toBeNull();
  });

  it('writes durations and signed differences', () => {
    expect(formatDuration(774.425)).toBe('12:54');
    expect(formatDuration(3599.6)).toBe('1:00:00');
    expect(formatDuration(774.425, { fractionDigits: 3 })).toBe('12:54.425');
    expect(formatSignedDuration(300)).toBe('+05:00');
    expect(formatSignedDuration(-30)).toBe('-00:30');
  });

  it('reads a time as seconds instead of zero, and leaves the other values alone', () => {
    expect(parseNumericValue('00:10:00')).toBe(600);
    expect(parseNumericValue('12,5')).toBe(12.5);
    expect(parseNumericValue(42)).toBe(42);
    expect(parseNumericValue('abc')).toBeNull();
    expect(isNumericCell('00:10:00')).toBe(true);
    expect(isNumericCell('Sportello')).toBe(false);
    expect(parseStaticNumber('00:10:00')).toBe(600);
    expect(parseStaticNumber('100')).toBe(100);
  });
});

describe('KPI card with a Time metric', () => {
  const dual = {
    calculation_mode: 'dual_metric',
    metric: 'attesa',
    comparison_metric: 'attesa_conf',
  };
  const row = { attesa: '00:15:00', attesa_conf: '00:10:00' };

  it('writes value, comparison and the absolute delta as durations', () => {
    const props = run(dual, [row]);
    expect(props.formattedPrimary).toBe('15:00');
    expect(props.formattedComparison).toBe('10:00');
    expect(props.formattedDeltaAbsolute).toBe('+05:00');
  });

  it('keeps the percentage delta as a number', () => {
    const props = run(dual, [row]);
    expect(props.deltaPercent).toBe(50);
    expect(props.formattedDeltaPercent).toContain('50');
    expect(props.formattedDeltaPercent).toContain('%');
  });

  it('follows the format and the decimals chosen', () => {
    const props = run({ ...dual, time_display_format: 'minutes', time_fraction_digits: 1 }, [row]);
    expect(props.formattedPrimary).toBe('15 min');
    const hms = run({ ...dual, time_display_format: 'hms' }, [row]);
    expect(hms.formattedPrimary).toBe('0:15:00');
  });

  it('shows hours from the automatic format when a value reaches one', () => {
    const props = run(dual, [{ attesa: '01:30:00', attesa_conf: '00:10:00' }]);
    expect(props.formattedPrimary).toBe('1:30:00');
    expect(props.formattedComparison).toBe('0:10:00');
  });

  it('reads a time target typed in the control for the progress bar', () => {
    const props = run(
      { calculation_mode: 'dual_metric', metric: 'attesa', show_progress_bar: true, target_static_value: '00:30:00' },
      [{ attesa: '00:15:00' }],
    );
    expect(props.targetProgressPercent).toBe(50);
  });

  it('reads the target and total metrics that arrive as times', () => {
    const props = run(
      { calculation_mode: 'dual_metric', metric: 'attesa', show_progress_bar: true, target_metric: 'obiettivo' },
      [{ attesa: '00:15:00', obiettivo: '00:20:00' }],
    );
    expect(props.targetProgressPercent).toBe(75);
  });

  it('finds the first Time column when the metric is not named', () => {
    const props = run({ calculation_mode: 'dual_metric' }, [{ sede: 'A', attesa: '00:15:00' }]);
    expect(props.formattedPrimary).toBe('15:00');
  });

  it('does not change a card of numbers', () => {
    const props = run({ calculation_mode: 'dual_metric', metric: 'richieste', comparison_metric: 'richieste_conf' }, [
      { richieste: 1200, richieste_conf: 1000 },
    ]);
    expect(props.formattedPrimary).toBe('1,2k');
    expect(props.formattedDeltaAbsolute).toBe('+200');
  });

  it('writes a null comparison as a dash, not as 00:00', () => {
    const props = run(dual, [{ attesa: '00:15:00', attesa_conf: null }]);
    expect(props.formattedComparison).toBe('—');
  });
});

describe('hasTimeMetric', () => {
  const dataset = {
    columns: [{ column_name: 'TempoAttesa', type: 'TIME' }, { column_name: 'Richieste', type: 'INTEGER' }],
    metrics: [{ metric_name: 'Attesa Sportello', expression: 'AVG([TempoAttesa])' }, { metric_name: 'Numero', expression: 'COUNT(*)' }],
  };
  const panel = (controls: Record<string, unknown>) => ({ controls: { datasource: { datasource: dataset }, ...controls } });

  it('shows for a saved metric on a Time column or with a duration name', () => {
    expect(hasTimeMetric(panel({ metric: { value: 'Attesa Sportello' } }))).toBe(true);
    expect(hasTimeMetric(panel({ metric: { value: 'Durata Prelievo' } }))).toBe(true);
    expect(hasTimeMetric(panel({ comparison_metric: { value: 'Attesa Sportello' } }))).toBe(true);
  });

  it('stays hidden for counts', () => {
    expect(hasTimeMetric(panel({ metric: { value: 'Numero' } }))).toBe(false);
    expect(hasTimeMetric({})).toBe(false);
  });
});


describe('hasTimeMetric with the dataset as Explore passes it', () => {
  const dataset = {
    columns: [{ column_name: 'TempoAttesa', type: 'TIME' }, { column_name: 'Richieste', type: 'INTEGER' }],
    metrics: [{ metric_name: 'Attesa Sportello', expression: 'AVG([TempoAttesa])' }, { metric_name: 'Numero', expression: 'COUNT(*)' }],
  };

  it('finds a saved metric on a Time column when the dataset is on the props, not in the controls', () => {
    const props = { datasource: dataset, controls: { metric: { value: 'Attesa Sportello' } } };
    expect(hasTimeMetric(props as any)).toBe(true);
  });

  it('stays hidden for a count when the dataset is on the props', () => {
    const props = { datasource: dataset, controls: { metric: { value: 'Numero' } } };
    expect(hasTimeMetric(props as any)).toBe(false);
  });

  it('keeps customized duration controls visible even without a Time metric', () => {
    const fmtVis = showDurationControl('time_display_format', 'auto');
    expect(fmtVis({ datasource: dataset, controls: { metric: { value: 'Numero' }, time_display_format: { value: 'auto' } } })).toBe(false);
    expect(fmtVis({ datasource: dataset, controls: { metric: { value: 'Numero' }, time_display_format: { value: 'minutes' } } })).toBe(true);
    expect(fmtVis({ datasource: dataset, controls: { metric: { value: 'Attesa Sportello' }, time_display_format: { value: 'auto' } } })).toBe(true);
  });
});
