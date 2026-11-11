import React from 'react';
import { BadgeStyle, TrendDirection } from '../types';
interface KPIComparisonBadgeProps {
    deltaPercentStr: string;
    deltaAbsoluteStr: string;
    trendDirection: TrendDirection;
    badgeStyle: BadgeStyle;
    badgeBackgroundColor: string;
    badgeTextColor: string;
    showAbsoluteDelta?: boolean;
    isCompact?: boolean;
    isUltraCompact?: boolean;
    hideAbsoluteDelta?: boolean;
    tooltipPrefix?: string;
}
export declare const KPIComparisonBadge: React.FC<KPIComparisonBadgeProps>;
export {};
//# sourceMappingURL=KPIComparisonBadge.d.ts.map