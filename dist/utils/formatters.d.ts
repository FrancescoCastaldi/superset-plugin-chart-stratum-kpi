/**
 * Format a number using Italian convention (dot as thousands separator, comma as decimal).
 */
export declare function formatItalianNumber(value: number | null | undefined, decimals?: number): string;
/** Same as `formatItalianNumber` for `it`; comma as thousands separator and dot as decimal for `en` */
export declare function formatNumberLocale(value: number | null | undefined, decimals?: number, locale?: 'en' | 'it'): string;
/**
 * Format a percentage value with sign (+/-) and 1 or 2 decimals.
 */
export declare function formatDeltaPercent(value: number | null | undefined, decimals?: number, locale?: 'en' | 'it'): string;
/**
 * Format a value using Superset number formatter or Italian fallback.
 */
export declare function formatMetricValue(value: number | null | undefined, formatString?: string, locale?: 'en' | 'it'): string;
/**
 * Parse any arbitrary Superset cell value to a number.
 */
export declare function parseNumericValue(val: any): number | null;
/** A cell that holds a number, or a time that is read as one */
export declare function isNumericCell(val: unknown): boolean;
/** The target typed in a control: a time (`00:10:00`, in seconds), localized number (`150.000`, `150,5`, `€ 150.000`) or plain number. */
export declare function parseStaticNumber(text: string): number;
export declare const ITALIAN_MONTHS: string[];
export declare function getMetricLabel(metric: any): string;
/**
 * `Month Year` for a date, a timestamp, a `YYYY-MM` string or a text that already starts with a
 * month name (English or Italian). Month names are written with `months`, English by default.
 */
export declare function formatMonthYear(val: any, months?: string[]): string;
/** Italian month names, kept for callers written before the `locale` option */
export declare function formatMonthYearItalian(val: any): string;
//# sourceMappingURL=formatters.d.ts.map