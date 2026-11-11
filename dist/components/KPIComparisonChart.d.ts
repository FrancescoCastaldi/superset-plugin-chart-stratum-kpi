import React from 'react';
import { KPIComparisonProps } from '../types';
/** Accepts only http(s) URLs and safe relative paths; rejects javascript:, data:, vbscript: and protocol-relative // links. */
export declare function sanitizeClickUrl(raw?: string): string | null;
export declare function openSafeClickUrl(clickUrl?: string, clickTarget?: '_blank' | '_self'): boolean;
export declare const KPIComparisonChart: React.FC<KPIComparisonProps>;
export default KPIComparisonChart;
//# sourceMappingURL=KPIComparisonChart.d.ts.map