/**
 * Texts the card generates by itself (month names, default comparison labels, the
 * period subtitle). Texts typed in the control panel are never translated.
 */
export type KpiLocale = 'en' | 'it';
export interface KpiTexts {
    months: string[];
    /** Prefix of the subtitle built from the active time range */
    period: string;
    /** `of target` next to a progress bar */
    ofTarget: string;
    /** Badge for a comparison that was zero */
    newBadge: string;
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
    peakPrefix: string;
    minPrefix: string;
    requestsPrefix: string;
    changePrefix: string;
}
export declare const ENGLISH_MONTHS: string[];
export declare const ITALIAN_MONTH_NAMES: string[];
export declare function getKpiTexts(locale: unknown): KpiTexts;
/** Index (0-11) of a month written in English or Italian, `-1` when it is neither */
export declare function monthIndexOf(name: string): number;
/** Labels written by earlier versions or by hand that mean "previous month" in either language */
export declare function isPreviousMonthLabel(label: string): boolean;
/** Labels that stand for "no custom label": the generated defaults of either language */
export declare function isGenericComparisonLabel(label: string): boolean;
/** `vs <month name>` in either language, as left by a label that was resolved once */
export declare function isVsMonthLabel(label: string): boolean;
//# sourceMappingURL=locale.d.ts.map