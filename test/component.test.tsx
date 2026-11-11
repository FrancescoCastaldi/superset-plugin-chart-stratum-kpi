import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KPISparkline } from '../src/components/KPISparkline';
import { KPIComparisonChart, openSafeClickUrl, sanitizeClickUrl } from '../src/components/KPIComparisonChart';
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

describe('KPIComparison component rendering and security', () => {
  it('uses distinct SVG gradient IDs across multiple KPISparkline instances', () => {
    const html = renderToStaticMarkup(
      <div>
        <KPISparkline data={[10, 20, 30]} color="#2563eb" fill />
        <KPISparkline data={[5, 15, 25]} color="#10b981" fill />
      </div>,
    );
    const ids = Array.from(html.matchAll(/<linearGradient[^>]*id="([^"]+)"/g)).map(m => m[1]);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('renders top_right badge even when showTitle is false or kpiTitle is empty', () => {
    const htmlNoTitle = renderToStaticMarkup(
      <KPIComparisonChart
        {...baseProps}
        badgePosition="top_right"
        showTitle={false}
        kpiTitle=""
        formattedDeltaPercent="Nuovo"
        trendDirection="none"
      />,
    );
    expect(htmlNoTitle).toContain('Nuovo');

    const htmlHeaderTitle = renderToStaticMarkup(
      <KPIComparisonChart
        {...baseProps}
        badgePosition="top_right"
        showTitle
        titleInChartHeader
        formattedDeltaPercent="+20,0%"
      />,
    );
    expect(htmlHeaderTitle).toContain('+20,0%');
  });

  it('does not render kpiSubtitle twice when comparison is disabled on tall cards', () => {
    const html = renderToStaticMarkup(
      <KPIComparisonChart
        {...baseProps}
        hasComparison={false}
        showTitle
        kpiTitle="Totale"
        kpiSubtitle="Periodo: Gennaio 2026"
        width={320}
        height={180}
      />,
    );
    const occurrences = html.split('>Periodo: Gennaio 2026<').length - 1;
    expect(occurrences).toBe(1);

    const htmlWithoutTitle = renderToStaticMarkup(
      <KPIComparisonChart
        {...baseProps}
        hasComparison={false}
        showTitle={false}
        kpiTitle=""
        kpiSubtitle="Periodo: Gennaio 2026"
        width={320}
        height={180}
      />,
    );
    expect(htmlWithoutTitle.split('>Periodo: Gennaio 2026<').length - 1).toBe(1);
  });

  it('localizes badge tooltip and default target suffix', () => {
    const htmlIt = renderToStaticMarkup(
      <KPIComparisonChart
        {...baseProps}
        locale="it"
        showProgressBar
        targetProgressPercent={75}
      />,
    );
    expect(htmlIt).toContain('title="Variazione:');
    expect(htmlIt).toContain('del Target');

    const htmlEn = renderToStaticMarkup(
      <KPIComparisonChart
        {...baseProps}
        locale="en"
        showProgressBar
        targetProgressPercent={75}
      />,
    );
    expect(htmlEn).toContain('title="Change:');
    expect(htmlEn).toContain('of target');
  });

  it('sanitizes click_url to only allow http(s) and relative URLs and opens with noopener', () => {
    expect(sanitizeClickUrl('https://example.org/dash')).toBe('https://example.org/dash');
    expect(sanitizeClickUrl('http://localhost:8088/superset/dashboard/1/')).toBe(
      'http://localhost:8088/superset/dashboard/1/',
    );
    expect(sanitizeClickUrl('/superset/dashboard/12/')).toBe('/superset/dashboard/12/');
    expect(sanitizeClickUrl('./detail?id=1')).toBe('./detail?id=1');
    expect(sanitizeClickUrl('../parent')).toBe('../parent');

    expect(sanitizeClickUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeClickUrl('  JaVaScRiPt:alert(1)')).toBeNull();
    expect(sanitizeClickUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeClickUrl('//evil.example.com/phish')).toBeNull();
    expect(sanitizeClickUrl('')).toBeNull();

    const openSpy = jest.fn();
    const prevWindow = (global as any).window;
    (global as any).window = { open: openSpy };
    try {
      const unsafeHtml = renderToStaticMarkup(
        <KPIComparisonChart
          {...baseProps}
          clickUrl="javascript:alert(1)"
          clickTarget="_blank"
        />,
      );
      expect(unsafeHtml).toContain('cursor:default');
      expect(unsafeHtml).not.toContain('cursor:pointer');
      expect(openSafeClickUrl('javascript:alert(1)', '_blank')).toBe(false);
      expect(openSpy).not.toHaveBeenCalled();

      const safeHtml = renderToStaticMarkup(
        <KPIComparisonChart
          {...baseProps}
          clickUrl="https://example.org/dash"
          clickTarget="_blank"
        />,
      );
      expect(safeHtml).toContain('cursor:pointer');
      expect(openSafeClickUrl('https://example.org/dash', '_blank')).toBe(true);
      expect(openSpy).toHaveBeenCalledWith('https://example.org/dash', '_blank', 'noopener');
    } finally {
      if (prevWindow === undefined) {
        delete (global as any).window;
      } else {
        (global as any).window = prevWindow;
      }
    }
  });
});
