import { CSSProperties, RefObject, useLayoutEffect, useState } from 'react';

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

const LIGHT_TEXT: Rgba = { r: 15, g: 23, b: 42, a: 1 };
const LIGHT_BACKGROUND: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const LIGHT: HostColors = { dark: false, text: LIGHT_TEXT, background: LIGHT_BACKGROUND };

/** Colore da `rgb(0, 0, 0)`, `rgba(0, 0, 0, 0.5)` o `rgb(0 0 0 / 50%)`, come lo restituisce getComputedStyle. */
export function parseCssColor(value: string): Rgba | null {
  const m = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)/i);
  if (!m) return null;
  const alpha = m[4] === undefined ? 1 : m[5] === '%' ? Number(m[4]) / 100 : Number(m[4]);
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: alpha };
}

/** Luminanza relativa WCAG, da 0 (nero) a 1 (bianco). */
export function luminance({ r, g, b }: Rgba): number {
  const [lr, lg, lb] = [r, g, b].map(channel => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

const css = ({ r, g, b }: Rgba): string => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

/** Mescola due colori: `weight` è la quota del primo (da 0 a 1). */
export function mix(first: Rgba, second: Rgba, weight: number): string {
  const w = Math.min(1, Math.max(0, weight));
  return css({
    r: first.r * w + second.r * (1 - w),
    g: first.g * w + second.g * (1 - w),
    b: first.b * w + second.b * (1 - w),
    a: 1,
  });
}

/**
 * Colori su cui poggia la scheda: il testo ereditato e il primo fondo non trasparente risalendo
 * dalla scheda stessa. Se la scheda ha un fondo suo (scelto nel pannello) conta quello; se è
 * trasparente conta la pagina che la ospita. Così si adatta a un tema scuro senza conoscere il
 * tema di Superset.
 */
export function sampleHostColors(element: Element | null): HostColors {
  const start = element;
  if (!start || typeof window === 'undefined') return LIGHT;
  // La scheda non imposta un colore del testo suo: eredita quello della pagina.
  const text = parseCssColor(window.getComputedStyle(start.parentElement ?? start).color) ?? LIGHT_TEXT;

  let background: Rgba | null = null;
  for (let node: Element | null = start; node; node = node.parentElement) {
    const color = parseCssColor(window.getComputedStyle(node).backgroundColor);
    if (color && color.a > 0.5) {
      background = color;
      break;
    }
  }
  const bg = background ?? LIGHT_BACKGROUND;
  return { dark: luminance(bg) < 0.35 && luminance(text) > luminance(bg), text, background: bg };
}

/**
 * Variabili CSS per i colori predefiniti della scheda. In tema chiaro è vuoto: valgono i colori
 * scritti accanto a ogni var(--kpi-..., colore). I colori scelti nel pannello non passano di qui.
 */
export function kpiThemeVars(host: HostColors): CSSProperties {
  if (!host.dark) return {};
  const { text, background } = host;
  return {
    '--kpi-text': css(text),
    '--kpi-title': mix(text, background, 0.82),
    '--kpi-strong': mix(text, background, 0.88),
    '--kpi-muted': mix(text, background, 0.68),
    '--kpi-subtitle': mix(text, background, 0.55),
    '--kpi-track': mix(text, background, 0.18),
    '--kpi-border': mix(text, background, 0.2),
    '--kpi-badge-bg': mix(text, background, 0.12),
  } as CSSProperties;
}

/** Misura i colori dell'ospite e li tiene aggiornati quando la pagina cambia tema. */
export function useHostColors(ref: RefObject<HTMLElement>): HostColors {
  const [colors, setColors] = useState<HostColors>(LIGHT);

  useLayoutEffect(() => {
    const measure = () =>
      setColors(prev => {
        const next = sampleHostColors(ref.current);
        const same =
          prev.dark === next.dark &&
          css(prev.text) === css(next.text) &&
          css(prev.background) === css(next.background);
        return same ? prev : next;
      });
    measure();

    const observers: MutationObserver[] = [];
    if (typeof MutationObserver !== 'undefined') {
      for (const target of [document.documentElement, document.body]) {
        if (!target) continue;
        const observer = new MutationObserver(measure);
        observer.observe(target, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-bs-theme'] });
        observers.push(observer);
      }
    }
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    media?.addEventListener?.('change', measure);
    return () => {
      observers.forEach(observer => observer.disconnect());
      media?.removeEventListener?.('change', measure);
    };
  }, [ref]);

  return colors;
}
