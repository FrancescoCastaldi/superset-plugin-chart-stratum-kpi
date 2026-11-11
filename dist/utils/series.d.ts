import { CalculationMode } from '../types';
export type DataRow = Record<string, any>;
export interface ExtremeTitleFlags {
    isPeak: boolean;
    isMin: boolean;
}
/** Peak/minimum cards are recognised from keywords in the (Italian or English) title. */
export declare function classifyExtremeTitle(title: string): ExtremeTitleFlags;
export interface ReferenceRowOptions extends ExtremeTitleFlags {
    calculationMode?: CalculationMode;
    showSparkline: boolean;
}
/**
 * Reverses a sparkline query ordered descending by time back into chronological
 * ascending order (`oldest -> newest`) for left-to-right plotting and latest-row selection.
 */
export declare function orderSparklineRows(data: DataRow[], timeColumn?: string): DataRow[];
/**
 * Row the KPI value is read from: the max/min row for peak/minimum cards,
 * the latest row of a sparkline series regardless of calculation mode, otherwise the first row.
 */
export declare function selectReferenceRow(data: DataRow[], primaryMetricKey: string, { isPeak, isMin, showSparkline }: ReferenceRowOptions): DataRow | undefined;
/** Numeric series of the primary metric across rows, skipping non-numeric cells. */
export declare function extractSparklineData(data: DataRow[], primaryMetricKey: string): number[];
//# sourceMappingURL=series.d.ts.map