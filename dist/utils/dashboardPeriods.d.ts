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
    /** Language of the texts, the one chosen in the filter */
    locale?: 'en' | 'it';
}
export declare function readDashboardPeriods(extraFormData: unknown): DashboardPeriods;
/** `Name · range`, or whichever of the two exists, or the fallback */
export declare function periodTitle(name?: string, text?: string, fallback?: string): string | undefined;
/** Marks a period whose query returned no data, in the language of the filter */
export declare function withNoData(title: string | undefined, locale?: 'en' | 'it'): string | undefined;
//# sourceMappingURL=dashboardPeriods.d.ts.map