import React from 'react';
interface KPISparklineProps {
    data: number[];
    color?: string;
    fill?: boolean;
    height?: number;
    width?: number | string;
    curve?: 'smooth' | 'linear';
    showPoints?: boolean;
    /** Testo per i lettori di schermo; senza, il grafico è decorativo. */
    label?: string;
}
export declare const KPISparkline: React.FC<KPISparklineProps>;
export {};
//# sourceMappingURL=KPISparkline.d.ts.map