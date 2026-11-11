import { formatMetricValue } from '../src/utils/formatters';

describe('KPI Comparison formatMetricValue', () => {
  it('returns the em-dash placeholder for empty values', () => {
    expect(formatMetricValue(null, 'SMART_NUMBER')).toBe('—');
    expect(formatMetricValue(undefined)).toBe('—');
    expect(formatMetricValue(NaN, ',d')).toBe('—');
  });

  it('uses the Italian fallback without a format string', () => {
    expect(formatMetricValue(1234)).toBe('1.234');
    expect(formatMetricValue(1234.567)).toBe('1.234,57');
  });

  it('uses the Superset adaptive SMART_NUMBER formatter respecting locale', () => {
    expect(formatMetricValue(1234, 'SMART_NUMBER')).toBe('1,23k');
    expect(formatMetricValue(2500000000, 'SMART_NUMBER')).toBe('2,5B');
    expect(formatMetricValue(12.345, 'SMART_NUMBER')).toBe('12,35');
    expect(formatMetricValue(0.01234, 'SMART_NUMBER')).toBe('0,0123');
    expect(formatMetricValue(0, 'SMART_NUMBER')).toBe('0');

    expect(formatMetricValue(1234, 'SMART_NUMBER', 'en')).toBe('1.23k');
    expect(formatMetricValue(2500000000, 'SMART_NUMBER', 'en')).toBe('2.5B');
    expect(formatMetricValue(12.345, 'SMART_NUMBER', 'en')).toBe('12.35');
    expect(formatMetricValue(0.01234, 'SMART_NUMBER', 'en')).toBe('0.0123');
    expect(formatMetricValue(0, 'SMART_NUMBER', 'en')).toBe('0');
  });

  it('uses d3 format strings with the default Superset locale', () => {
    expect(formatMetricValue(1234.5, ',.2f')).toBe('1,234.50');
    expect(formatMetricValue(0.256, ',.1%')).toBe('25.6%');
    expect(formatMetricValue(1234, '$,d')).toBe('$1,234');
  });

  it('reports invalid format strings instead of throwing', () => {
    expect(formatMetricValue(12, 'not-a-format')).toBe('12 (Invalid format: not-a-format)');
  });
});
