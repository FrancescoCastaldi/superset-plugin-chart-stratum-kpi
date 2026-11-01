/**
 * Names and readable ranges of the two periods chosen with a dashboard filter such as the Calendar
 * Filter. The filter sends them in `extra_form_data.custom_form_data`, as a list with one object
 * (Superset only keeps that key when it is a list):
 * `{ period_labels: { reference, comparison }, period_text: { reference, comparison } }`.
 */
export interface DashboardPeriods {
  referenceName?: string;
  comparisonName?: string;
  referenceText?: string;
  comparisonText?: string;
}

const clean = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export function readDashboardPeriods(extraFormData: unknown): DashboardPeriods {
  const custom = (extraFormData as { custom_form_data?: unknown } | null | undefined)?.custom_form_data;
  const info = ([] as unknown[])
    .concat(custom ?? [])
    .find(
      (v): v is { period_labels?: Record<string, unknown>; period_text?: Record<string, unknown> } =>
        Boolean(v) && typeof v === 'object' && ('period_labels' in (v as object) || 'period_text' in (v as object)),
    );
  return {
    referenceName: clean(info?.period_labels?.reference),
    comparisonName: clean(info?.period_labels?.comparison),
    referenceText: clean(info?.period_text?.reference),
    comparisonText: clean(info?.period_text?.comparison),
  };
}

/** `Name · range`, or whichever of the two exists, or the fallback */
export function periodTitle(name?: string, text?: string, fallback?: string): string | undefined {
  if (name && text) return `${name} · ${text}`;
  return name || text || fallback;
}
