import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KPIComparisonChart } from '../src/components/KPIComparisonChart';
import { KPIComparisonProps } from '../src/types';

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
  sparklineColor: '#2563eb',
  sparklineFill: true,
};

describe('colori predefiniti della scheda', () => {
  it('passano dalle variabili del tema, con il colore chiaro come riserva', () => {
    const html = renderToStaticMarkup(<KPIComparisonChart {...baseProps} />);
    expect(html).toContain('color:var(--kpi-text, #0f172a)');
    expect(html).toContain('var(--kpi-title, #475569)');
    expect(html).toContain('var(--kpi-muted, #64748b)');
    expect(html).not.toMatch(/color:#0f172a/);
  });

  it('un colore scelto nel pannello resta quello scelto', () => {
    const html = renderToStaticMarkup(<KPIComparisonChart {...baseProps} kpiColor="#ff0000" titleColor="#00ff00" />);
    expect(html).toContain('color:#ff0000');
    expect(html).toContain('color:#00ff00');
  });

  it('il riassunto per i lettori di schermo c\'è anche senza JavaScript', () => {
    const html = renderToStaticMarkup(<KPIComparisonChart {...baseProps} />);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Totale, 120');
  });
});
