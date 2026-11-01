import { periodTitle, readDashboardPeriods, withNoData } from '../src/utils/dashboardPeriods';

describe('dashboardPeriods', () => {
  const info = {
    version: 1,
    period_labels: { reference: 'This year', comparison: 'Last year' },
    period_text: { reference: '1 Jan - 31 Mar 2008', comparison: '1 Jan - 31 Mar 2007' },
    locale: 'it',
  };

  it('reads the names and ranges from the list Superset keeps', () => {
    expect(readDashboardPeriods({ custom_form_data: [info] })).toEqual({
      referenceName: 'This year',
      comparisonName: 'Last year',
      referenceText: '1 Jan - 31 Mar 2008',
      comparisonText: '1 Jan - 31 Mar 2007',
      locale: 'it',
    });
  });

  it('also accepts the object itself', () => {
    expect(readDashboardPeriods({ custom_form_data: info }).referenceName).toBe('This year');
  });

  it('ignores other custom data, blanks and missing input', () => {
    expect(readDashboardPeriods(undefined)).toEqual({});
    expect(readDashboardPeriods({ custom_form_data: [{ something: 1 }] }).referenceText).toBeUndefined();
    expect(
      readDashboardPeriods({ custom_form_data: [{ period_labels: { reference: '  ' }, period_text: {} }] }).referenceName,
    ).toBeUndefined();
  });

  it('joins name and range, falling back to what exists', () => {
    expect(periodTitle('This year', '1 Jan - 31 Mar 2008', 'raw')).toBe('This year · 1 Jan - 31 Mar 2008');
    expect(periodTitle(undefined, '1 Jan - 31 Mar 2008', 'raw')).toBe('1 Jan - 31 Mar 2008');
    expect(periodTitle('This year', undefined, 'raw')).toBe('This year');
    expect(periodTitle(undefined, undefined, 'raw')).toBe('raw');
  });

  it('marks an empty period in the language of the filter', () => {
    expect(withNoData('Last year · 2007', 'en')).toBe('Last year · 2007 · no data');
    expect(withNoData('Anno scorso · 2007', 'it')).toBe('Anno scorso · 2007 · nessun dato');
    expect(withNoData(undefined, 'en')).toBeUndefined();
  });
});
