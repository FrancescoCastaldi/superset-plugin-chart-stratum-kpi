import { CSSProperties, RefObject } from 'react';
interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}
export interface HostColors {
    /** Il fondo della pagina che ospita la scheda è scuro con testo chiaro. */
    dark: boolean;
    text: Rgba;
    background: Rgba;
}
/** Colore da `rgb(0, 0, 0)`, `rgba(0, 0, 0, 0.5)` o `rgb(0 0 0 / 50%)`, come lo restituisce getComputedStyle. */
export declare function parseCssColor(value: string): Rgba | null;
/** Luminanza relativa WCAG, da 0 (nero) a 1 (bianco). */
export declare function luminance({ r, g, b }: Rgba): number;
/** Mescola due colori: `weight` è la quota del primo (da 0 a 1). */
export declare function mix(first: Rgba, second: Rgba, weight: number): string;
/**
 * Colori su cui poggia la scheda: il testo ereditato e il primo fondo non trasparente risalendo
 * dalla scheda stessa. Se la scheda ha un fondo suo (scelto nel pannello) conta quello; se è
 * trasparente conta la pagina che la ospita. Così si adatta a un tema scuro senza conoscere il
 * tema di Superset.
 */
export declare function sampleHostColors(element: Element | null): HostColors;
/**
 * Variabili CSS per i colori predefiniti della scheda. In tema chiaro è vuoto: valgono i colori
 * scritti accanto a ogni var(--kpi-..., colore). I colori scelti nel pannello non passano di qui.
 */
export declare function kpiThemeVars(host: HostColors): CSSProperties;
/** Misura i colori dell'ospite e li tiene aggiornati quando la pagina cambia tema. */
export declare function useHostColors(ref: RefObject<HTMLElement>): HostColors;
export {};
//# sourceMappingURL=hostColors.d.ts.map