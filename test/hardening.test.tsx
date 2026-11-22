/**
 * @jest-environment jsdom
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { KPIComparisonChart } from '../src/components/KPIComparisonChart';
import { KPIComparisonProps } from '../src/types';
import { kpiThemeVars, luminance, mix, parseCssColor, sampleHostColors } from '../src/utils/hostColors';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const baseProps: KPIComparisonProps = {
  width: 320,
  height: 180,
  primaryValue: 120,
  comparisonValue: 100,
  deltaAbsolute: 20,
  deltaPercent: 20,
  formattedPrimary: '120',
  formattedComparison: '100',
  formattedDeltaAbsolute: '+20',
  formattedDeltaPercent: '+20,0%',
  trendDirection: 'up',
  trendColor: '#10b981',
  badgeBackgroundColor: '#dcfce7',
  badgeTextColor: '#15803d',
  kpiTitle: 'Totale',
  kpiSubtitle: 'Periodo: Gennaio 2026',
  comparisonLabel: 'vs Confronto',
  prefixValue: '',
  suffixValue: '',
  cardBgColor: 'transparent',
  cardBorderRadius: 'square',
  cardBoxShadow: 'none',
  hasComparison: true,
  showTitle: true,
  titleInChartHeader: false,
  showBadge: true,
  badgeStyle: 'pill',
  badgePosition: 'bottom_left',
  cardAlignment: 'left',
  showComparisonValue: true,
  showComparisonLabel: true,
  showAbsoluteDelta: true,
  showSparkline: false,
  sparklineData: [],
  locale: 'it',
} as KPIComparisonProps;

let container: HTMLDivElement;
let root: Root;

const mount = (props: Partial<KPIComparisonProps> = {}, hostStyle = '') => {
  container = document.createElement('div');
  if (hostStyle) container.setAttribute('style', hostStyle);
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<KPIComparisonChart {...baseProps} {...props} />));
  return container.firstElementChild as HTMLElement;
};

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

describe('lettori di schermo e tastiera', () => {
  it('la scheda è un gruppo con una frase che riassume titolo, valore e variazione', () => {
    const card = mount();
    expect(card.getAttribute('role')).toBe('group');
    expect(card.getAttribute('aria-label')).toBe('Totale, 120, Variazione +20,0%, vs Confronto');
    expect(card.hasAttribute('tabindex')).toBe(false);
  });

  it('con un collegamento diventa un link raggiungibile con Tab e si apre con Invio e Spazio', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    const card = mount({ clickUrl: 'https://example.com/dettaglio', clickTarget: '_blank' });
    expect(card.getAttribute('role')).toBe('link');
    expect(card.tabIndex).toBe(0);
    act(() => Simulate.keyDown(card, { key: 'Enter' }));
    act(() => Simulate.keyDown(card, { key: ' ' }));
    act(() => Simulate.keyDown(card, { key: 'a' }));
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledWith('https://example.com/dettaglio', '_blank', 'noopener');
  });

  it('un URL non sicuro non rende la scheda un link', () => {
    const card = mount({ clickUrl: 'javascript:alert(1)' });
    expect(card.getAttribute('role')).toBe('group');
  });

  it('la sparkline ha un testo alternativo, nella lingua della scheda', () => {
    mount({ showSparkline: true, sparklineData: [1, 3, 2, 5], height: 200 });
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Andamento sui periodi');
  });

  it('in inglese anche la sparkline e il messaggio di errore parlano inglese', () => {
    mount({ locale: 'en', showSparkline: true, sparklineData: [1, 3, 2, 5], height: 200 });
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Trend over the periods');
  });
});

describe('errori di disegno', () => {
  it('mostra un messaggio al posto della scheda invece di lasciarla vuota', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const card = mount({ kpiTitle: {} as any });
    expect(card.getAttribute('role')).toBe('alert');
    expect(card.textContent).toBe('Impossibile mostrare la scheda.');
    expect(spy).toHaveBeenCalled();
  });
});

describe('tema scuro', () => {
  it('in una pagina scura i colori predefiniti diventano variabili chiare', () => {
    const card = mount({}, 'background-color: rgb(20, 24, 33); color: rgb(230, 232, 236)');
    expect(card.style.getPropertyValue('--kpi-text')).toBe('rgb(230, 232, 236)');
    expect(card.style.getPropertyValue('--kpi-track')).not.toBe('');
  });

  it('se la scheda ha un fondo chiaro suo, la pagina scura non conta', () => {
    const card = mount({ cardBgColor: '#ffffff' }, 'background-color: rgb(20, 24, 33); color: rgb(230, 232, 236)');
    expect(card.style.getPropertyValue('--kpi-text')).toBe('');
  });

  it('se la scheda ha un fondo scuro suo, i testi diventano chiari anche in una pagina chiara', () => {
    const card = mount({ cardBgColor: '#111827' }, 'background-color: rgb(255, 255, 255); color: rgb(230, 232, 236)');
    expect(card.style.getPropertyValue('--kpi-text')).toBe('rgb(230, 232, 236)');
  });

  it('in una pagina chiara non aggiunge variabili', () => {
    const card = mount({}, 'background-color: rgb(255, 255, 255); color: rgb(15, 23, 42)');
    expect(card.style.getPropertyValue('--kpi-text')).toBe('');
  });

  it('i colori scelti nel pannello non cambiano con il tema', () => {
    const card = mount(
      { kpiColor: '#ff0000', titleColor: '#00ff00' },
      'background-color: rgb(20, 24, 33); color: rgb(230, 232, 236)',
    );
    const value = Array.from(card.querySelectorAll('span')).find(s => s.textContent === '120') as HTMLElement;
    expect(value.style.color).toBe('rgb(255, 0, 0)');
    const title = Array.from(card.querySelectorAll('div')).find(d => d.textContent === 'Totale') as HTMLElement;
    expect(title.style.color).toBe('rgb(0, 255, 0)');
  });
});

describe('colori dell\'ospite', () => {
  it('legge i formati di getComputedStyle', () => {
    expect(parseCssColor('rgb(1, 2, 3)')).toEqual({ r: 1, g: 2, b: 3, a: 1 });
    expect(parseCssColor('rgba(1, 2, 3, 0.5)')?.a).toBe(0.5);
    expect(parseCssColor('rgb(1 2 3 / 25%)')?.a).toBe(0.25);
    expect(parseCssColor('transparent')).toBeNull();
  });

  it('luminanza e mescolanza', () => {
    expect(luminance({ r: 0, g: 0, b: 0, a: 1 })).toBe(0);
    expect(luminance({ r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1, 5);
    expect(mix({ r: 200, g: 100, b: 0, a: 1 }, { r: 0, g: 0, b: 100, a: 1 }, 0.5)).toBe('rgb(100, 50, 50)');
    expect(mix({ r: 255, g: 255, b: 255, a: 1 }, { r: 0, g: 0, b: 0, a: 1 }, 3)).toBe('rgb(255, 255, 255)');
  });

  it('senza elemento usa i colori chiari e non produce variabili', () => {
    const host = sampleHostColors(null);
    expect(host.dark).toBe(false);
    expect(kpiThemeVars(host)).toEqual({});
  });
});
