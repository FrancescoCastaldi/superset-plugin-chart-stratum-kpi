/**
 * Texts the card generates by itself (month names, default comparison labels, the
 * period subtitle). Texts typed in the control panel are never translated.
 */
export type KpiLocale = 'en' | 'it';

export interface KpiTexts {
  months: string[];
  /** Prefix of the subtitle built from the active time range */
  period: string;
  /** Open range such as `from January 2026` */
  from: string;
  vsPreviousMonth: string;
  /** Label of the `1 month ago` time shift */
  vsPreviousMonthShift: string;
  twelveMonths: string;
  sixMonths: string;
  vsPreviousPeriod: string;
  vsPreviousWeek: string;
  vsSamePeriodLastYear: string;
  vsFourWeeksAgo: string;
  vsComparison: string;
  vsComparisonPeriod: string;
  vsTarget: string;
  requiresTimeFilter: string;
}

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const ITALIAN_MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const EN: KpiTexts = {
  months: ENGLISH_MONTHS,
  period: 'Period',
  from: 'from',
  vsPreviousMonth: 'vs Previous month',
  vsPreviousMonthShift: 'vs Previous month',
  twelveMonths: '12 months',
  sixMonths: '6 months',
  vsPreviousPeriod: 'vs Previous period',
  vsPreviousWeek: 'vs Previous week',
  vsSamePeriodLastYear: 'vs Same period last year',
  vsFourWeeksAgo: 'vs 4 weeks ago',
  vsComparison: 'vs Comparison',
  vsComparisonPeriod: 'vs Comparison period',
  vsTarget: 'vs Target',
  requiresTimeFilter: '⚠️ Requires a time filter',
};

const IT: KpiTexts = {
  months: ITALIAN_MONTH_NAMES,
  period: 'Periodo',
  from: 'dal',
  vsPreviousMonth: 'vs Mese precedente',
  vsPreviousMonthShift: 'vs Mese Prec.',
  twelveMonths: '12 mesi',
  sixMonths: '6 mesi',
  vsPreviousPeriod: 'vs Periodo Prec.',
  vsPreviousWeek: 'vs Settimana Prec.',
  vsSamePeriodLastYear: 'vs Stesso Periodo Anno Prec.',
  vsFourWeeksAgo: 'vs 4 Settimane Fa',
  vsComparison: 'vs Confronto',
  vsComparisonPeriod: 'vs Periodo Confronto',
  vsTarget: 'vs Obiettivo',
  requiresTimeFilter: '⚠️ Richiede Filtro Temporale',
};

export function getKpiTexts(locale: unknown): KpiTexts {
  return locale === 'it' ? IT : EN;
}

/** Index (0-11) of a month written in English or Italian, `-1` when it is neither */
export function monthIndexOf(name: string): number {
  const lower = name.trim().toLowerCase();
  const en = ENGLISH_MONTHS.findIndex(m => m.toLowerCase() === lower);
  return en !== -1 ? en : ITALIAN_MONTH_NAMES.findIndex(m => m.toLowerCase() === lower);
}

/** Labels written by earlier versions or by hand that mean "previous month" in either language */
export function isPreviousMonthLabel(label: string): boolean {
  const l = label.trim().toLowerCase();
  return l.startsWith('vs mese prec') || l.startsWith('vs previous month');
}

/** Labels that stand for "no custom label": the generated defaults of either language */
export function isGenericComparisonLabel(label: string): boolean {
  const l = label.trim().toLowerCase();
  return ['vs periodo prec.', 'vs previous period', 'vs confronto', 'vs comparison'].includes(l);
}

/** `vs <month name>` in either language, as left by a label that was resolved once */
export function isVsMonthLabel(label: string): boolean {
  const m = label.trim().match(/^vs\s+(\S+)/i);
  return Boolean(m && monthIndexOf(m[1]) !== -1);
}
