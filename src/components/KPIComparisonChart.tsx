import React from 'react';
import { KPIComparisonProps } from '../types';
import { KPIComparisonBadge } from './KPIComparisonBadge';
import { KPISparkline } from './KPISparkline';
import { syncChartHeaderTitle } from '../utils/chartHeaderTitle';
import { getKpiTexts } from '../utils/locale';

/** Accepts only http(s) URLs and safe relative paths; rejects javascript:, data:, vbscript: and protocol-relative // links. */
export function sanitizeClickUrl(raw?: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  if (trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

export function openSafeClickUrl(
  clickUrl?: string,
  clickTarget: '_blank' | '_self' = '_self',
): boolean {
  const safeUrl = sanitizeClickUrl(clickUrl);
  if (!safeUrl || typeof window === 'undefined') return false;
  window.open(safeUrl, clickTarget, 'noopener');
  return true;
}

const GOOGLE_FONTS_MAP: Record<string, string> = {
  Inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  Roboto: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
  Montserrat: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap',
  Poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  Oswald: 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap',
  'JetBrains Mono': 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap',
  'Fira Code': 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
};

export const KPIComparisonChart: React.FC<KPIComparisonProps> = ({
  width,
  height,
  comparisonValue = null,
  formattedPrimary,
  formattedComparison,
  formattedDeltaAbsolute,
  formattedDeltaPercent,
  trendDirection,
  trendColor,
  badgeStyle,
  badgePosition = 'bottom_left',
  cleanCardMode = false,
  badgeBackgroundColor,
  badgeTextColor,
  kpiTitle,
  kpiSubtitle,
  comparisonLabel,
  prefixValue,
  suffixValue,
  hasComparison = true,
  cardAlignment = 'left',
  showTitle = true,
  titleInChartHeader = false,
  showBadge = true,
  showComparisonValue = true,
  showComparisonLabel = true,
  showAbsoluteDelta = true,
  wrapBottomContent = true,
  showSparkline = false,
  sparklineData = [],
  sparklineColor = '#2563eb',
  sparklineFill = true,
  sparklineCurve = 'smooth',
  sparklineShowPoints = false,
  cardBgColor = 'transparent',
  cardBorderRadius = 'square',
  cardBoxShadow = 'none',
  cardBorderColor = '',
  cardBorderWidth = 1,
  kpiFontFamily = '',
  kpiFontSizeMode = 'auto',
  kpiFontSizeManual = 36,
  kpiFontWeight = '800',
  kpiLetterSpacing = 'tight',
  kpiTabularNums = true,
  kpiColor = '',
  titleFontSize = 'auto',
  titleFontWeight = '600',
  titleColor = '',
  titleTextTransform = 'uppercase',
  subtitleFontSize = 'small',
  subtitleFontWeight = '400',
  subtitleColor = '',
  comparisonFontSize = 'small',
  comparisonFontWeight = '500',
  comparisonColor = '',
  showProgressBar = false,
  targetProgressPercent = null,
  targetProgressSuffix,
  applyTrendColorTo = 'badge',
  clickUrl = '',
  clickTarget = '_self',
  locale = 'en',
}) => {
  const texts = getKpiTexts(locale);
  const safeClickUrl = sanitizeClickUrl(clickUrl);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const headerTitle = showTitle && titleInChartHeader && Boolean(kpiTitle && kpiTitle.trim());

  // The title lives in the title bar of the dashboard chart, not inside the card
  React.useEffect(
    () => (headerTitle ? syncChartHeaderTitle(rootRef.current, kpiTitle ?? '') : undefined),
    [headerTitle, kpiTitle],
  );

  // Dynamically load Google Fonts if a web font is requested
  React.useEffect(() => {
    if (!kpiFontFamily || kpiFontFamily === 'inherit') return;
    const fontUrl = GOOGLE_FONTS_MAP[kpiFontFamily];
    if (fontUrl && typeof document !== 'undefined') {
      const linkId = `kpi-font-${kpiFontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = fontUrl;
        document.head.appendChild(link);
      }
    }
  }, [kpiFontFamily]);

  // Dimensional tiers (decoupled height and width)
  const isVerticalUltraCompact = height < 90;
  const isVerticalCompact = height < 135;
  const isHorizontalUltraCompact = width < 180;

  // Title intelligence:
  // When vertical height is very small (< 90px), vertical space is prioritized 100%
  // for the primary KPI value and comparison delta badge. Title is preserved in container tooltip.
  const canRenderTitle =
    showTitle &&
    !headerTitle &&
    !isVerticalUltraCompact &&
    Boolean(kpiTitle && kpiTitle.trim().length > 0);
  const isTitleMini = isHorizontalUltraCompact;
  const showSubtitle = canRenderTitle && height >= 140 && width >= 200 && Boolean(kpiSubtitle);

  const showTopRightBadge = badgePosition === 'top_right' && showBadge && hasComparison;
  const showTopRow = canRenderTitle || showTopRightBadge;

  // Bottom row content detection (avoid duplicating kpiSubtitle when already shown below title)
  const hasBottomComparisonContent = Boolean(
    hasComparison &&
      ((showBadge && badgePosition === 'bottom_left') ||
        (showComparisonValue && comparisonValue !== null) ||
        (showComparisonLabel && Boolean(comparisonLabel)))
  );
  const showBottomSubtitle = !hasComparison && !showSubtitle && Boolean(kpiSubtitle);
  const hasBottomContent = hasBottomComparisonContent || showBottomSubtitle;

  // Sparkline: requires sufficient vertical room (>= 125px)
  const canRenderSparkline =
    showSparkline && sparklineData && sparklineData.length > 1 && height >= 125;
  const sparklineHeight = canRenderSparkline ? (height < 160 ? 22 : 36) : 0;

  // Dynamic padding scaled to dimensions
  const padV =
    height < 65 ? 2 : height < 80 ? 4 : height < 100 ? 6 : height < 140 ? 10 : height < 180 ? 14 : 18;
  const padH = width < 150 ? 6 : width < 200 ? 10 : width < 280 ? 14 : 20;

  // Fluid responsive font size calculation
  const titleHeight = canRenderTitle
    ? showSubtitle
      ? 32
      : isTitleMini
      ? 14
      : 18
    : showTopRightBadge
    ? 20
    : 0;
  const bottomHeight = hasBottomContent
    ? (isVerticalUltraCompact ? 18 : isVerticalCompact ? 22 : 26)
    : 0;
  const innerGap = isVerticalUltraCompact ? 2 : isVerticalCompact ? 4 : 8;

  const availWidth = Math.max(30, width - padH * 2);
  const effectiveChars =
    (formattedPrimary ? formattedPrimary.length * 0.58 : 1) +
    (prefixValue ? prefixValue.length * 0.35 : 0) +
    (suffixValue ? suffixValue.length * 0.35 : 0);

  const maxFontFromWidth = Math.floor(availWidth / Math.max(1, effectiveChars));

  const availHeight = Math.max(
    14,
    height - padV * 2 - sparklineHeight - titleHeight - bottomHeight - innerGap,
  );
  const maxFontFromHeight = Math.floor(availHeight / 1.05);

  // Primary font size: Auto-fit fluid scaling, size presets, or manual pixel specification
  const calculatedFontPx = Math.max(
    13,
    Math.min(64, maxFontFromWidth, maxFontFromHeight),
  );
  let primaryFontSizePx: number;
  if (kpiFontSizeMode === 'small') {
    primaryFontSizePx = 24;
  } else if (kpiFontSizeMode === 'medium') {
    primaryFontSizePx = 36;
  } else if (kpiFontSizeMode === 'large') {
    primaryFontSizePx = 48;
  } else if (kpiFontSizeMode === 'xlarge') {
    primaryFontSizePx = 64;
  } else if (kpiFontSizeMode === 'manual') {
    primaryFontSizePx = Math.max(12, Math.min(120, Number(kpiFontSizeManual) || 36));
  } else {
    // auto-fit fluid
    primaryFontSizePx = calculatedFontPx;
  }

  const finalFontWeight = Number(kpiFontWeight) || (kpiFontWeight as any) || 800;
  const finalLetterSpacing =
    kpiLetterSpacing === 'normal'
      ? '0em'
      : kpiLetterSpacing === 'wide'
      ? '0.04em'
      : '-0.025em';

  const resolvedFontFamily =
    kpiFontFamily && kpiFontFamily !== 'inherit' && !kpiFontFamily.includes('-apple-system')
      ? `"${kpiFontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  // Absolute delta in badge: hide when horizontal width is tight (< 220px) to prevent crowded bottom row
  const hideBadgeAbsolute = !showAbsoluteDelta || width < 220;

  // Aesthetic border radius
  let borderRadius = '0px';
  switch (cardBorderRadius) {
    case 'subtle':
      borderRadius = '8px';
      break;
    case 'rounded':
      borderRadius = '14px';
      break;
    case 'pill':
      borderRadius = '24px';
      break;
    case 'square':
    default:
      borderRadius = '0px';
      break;
  }

  // Aesthetic shadow and border
  let boxShadow = 'none';
  let border = cardBorderColor
    ? `${cardBorderWidth || 1}px solid ${cardBorderColor}`
    : 'none';
  switch (cardBoxShadow) {
    case 'subtle':
      boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.05)';
      if (!cardBorderColor) border = '1px solid rgba(0, 0, 0, 0.06)';
      break;
    case 'elevated':
      boxShadow = '0 8px 16px -4px rgba(0, 0, 0, 0.10), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      if (!cardBorderColor) border = '1px solid rgba(0, 0, 0, 0.05)';
      break;
    case 'bordered':
      border = cardBorderColor
        ? `${cardBorderWidth || 1}px solid ${cardBorderColor}`
        : '1px solid #e2e8f0';
      boxShadow = 'none';
      break;
    case 'none':
    default:
      boxShadow = 'none';
      break;
  }

  // Resolving Semantic Colors from Theme
  let finalTrendColor = trendColor;
  let finalBadgeBg = badgeBackgroundColor;
  let finalBadgeText = badgeTextColor;
  let finalCardBg = cardBgColor;
  let primaryValueColor = '#0f172a';

  if (trendDirection === 'up' || trendDirection === 'down') {
    const isPositive =
      (trendDirection === 'up' && trendColor === '#10b981') || // default green from transformProps
      (trendDirection === 'down' && trendColor === '#10b981'); // inverted polarity green
      
    const semanticColor = isPositive
      ? { base: '#10b981', light2: '#dcfce7', dark1: '#15803d', dark2: '#064e3b' }
      : { base: '#ef4444', light2: '#fee2e2', dark1: '#b91c1c', dark2: '#7f1d1d' };

    // Always map trendColor to semantic base for sparklines/progress bar
    finalTrendColor = semanticColor.base;

    if (applyTrendColorTo === 'background') {
      finalCardBg = semanticColor.light2;
      primaryValueColor = semanticColor.dark2;

      // Neutral badge if background is already heavily colored
      finalBadgeBg = 'rgba(255, 255, 255, 0.6)';
      finalBadgeText = primaryValueColor;
    } else if (applyTrendColorTo === 'text') {
      primaryValueColor = semanticColor.base;
      // Neutral badge
      finalBadgeBg = '#f1f5f9';
      finalBadgeText = '#334155';
    } else {
      // Default: badge only
      finalBadgeBg = badgeStyle === 'subtle' ? 'transparent' : semanticColor.light2;
      finalBadgeText = semanticColor.dark1;
    }
  }

  const alignStyles: React.CSSProperties = {
    textAlign: cardAlignment,
    alignItems:
      cardAlignment === 'center'
        ? 'center'
        : cardAlignment === 'right'
        ? 'flex-end'
        : 'flex-start',
  };

  return (
    <div
      ref={rootRef}
      onClick={safeClickUrl ? () => openSafeClickUrl(safeClickUrl, clickTarget) : undefined}
      style={{
        width,
        height,
        boxSizing: 'border-box',
        padding: cleanCardMode ? '4px 6px' : `${padV}px ${padH}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: !showTopRow ? 'center' : 'space-between',
        gap: !showTopRow ? (height < 70 ? '2px' : '4px') : '0px',
        backgroundColor: finalCardBg,
        borderRadius: cleanCardMode ? '0px' : borderRadius,
        boxShadow: cleanCardMode ? 'none' : boxShadow,
        border: cleanCardMode ? 'none' : border,
        fontFamily: resolvedFontFamily,
        overflow: 'hidden',
        position: 'relative',
        cursor: safeClickUrl ? 'pointer' : 'default',
        transition: 'background-color 0.2s ease',
      }}
      title={
        !canRenderTitle && kpiTitle
          ? kpiSubtitle
            ? `${kpiTitle}: ${kpiSubtitle}`
            : kpiTitle
          : undefined
      }
    >
      {/* Top Section: Title, Subtitle & optional top_right Badge */}
      {showTopRow && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: canRenderTitle ? 'space-between' : 'flex-end',
            alignItems: 'flex-start',
            width: '100%',
            flexShrink: 0,
          }}
        >
          {canRenderTitle && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
                ...alignStyles,
              }}
            >
            <div
              style={{
                fontFamily: resolvedFontFamily,
                fontSize:
                  titleFontSize === 'small'
                    ? '0.70rem'
                    : titleFontSize === 'medium'
                    ? '0.82rem'
                    : titleFontSize === 'large'
                    ? '0.96rem'
                    : isTitleMini
                    ? '0.70rem'
                    : isVerticalCompact
                    ? '0.74rem'
                    : '0.90rem',
                fontWeight: (titleFontWeight as any) || 600,
                color: titleColor || '#475569',
                letterSpacing: '0.02em',
                textTransform: (titleTextTransform as any) || 'uppercase',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
              title={kpiTitle}
            >
              {kpiTitle}
            </div>
            {showSubtitle && (
              <div
                style={{
                  fontFamily: resolvedFontFamily,
                  fontSize:
                    subtitleFontSize === 'medium'
                      ? '0.82rem'
                      : subtitleFontSize === 'large'
                      ? '0.92rem'
                      : '0.74rem',
                  fontWeight: (subtitleFontWeight as any) || 400,
                  color: subtitleColor || '#94a3b8',
                  marginTop: '1px',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
                title={kpiSubtitle}
              >
                {kpiSubtitle}
              </div>
            )}
            </div>
          )}
          {showTopRightBadge && (
            <div style={{ marginLeft: canRenderTitle ? '6px' : '0px', flexShrink: 0 }}>
              <KPIComparisonBadge
                deltaPercentStr={formattedDeltaPercent}
                deltaAbsoluteStr={formattedDeltaAbsolute}
                trendDirection={trendDirection}
                badgeStyle={badgeStyle}
                badgeBackgroundColor={finalBadgeBg}
                badgeTextColor={finalBadgeText}
                showAbsoluteDelta={showAbsoluteDelta}
                isCompact={isVerticalCompact}
                isUltraCompact={isVerticalUltraCompact}
                hideAbsoluteDelta={hideBadgeAbsolute}
                tooltipPrefix={texts.changePrefix}
              />
            </div>
          )}
        </div>
      )}

      {/* Middle Section: Main Big Value */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent:
            cardAlignment === 'center'
              ? 'center'
              : cardAlignment === 'right'
              ? 'flex-end'
              : 'flex-start',
          margin: isVerticalUltraCompact
            ? '0px'
            : isVerticalCompact
            ? '1px 0'
            : '3px 0',
          width: '100%',
          flexShrink: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {prefixValue && (
          <span
            style={{
              fontSize: `${Math.max(10, Math.round(primaryFontSizePx * 0.52))}px`,
              fontWeight: 600,
              color: '#64748b',
              marginRight: '2px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {prefixValue}
          </span>
        )}
        <span
          style={{
            fontFamily: resolvedFontFamily,
            fontSize: `${primaryFontSizePx}px`,
            fontWeight: finalFontWeight as any,
            fontVariantNumeric: kpiTabularNums !== false ? 'tabular-nums' : 'normal',
            color: kpiColor || primaryValueColor,
            lineHeight: 1.05,
            letterSpacing: finalLetterSpacing,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            flexShrink: 1,
            transition: 'color 0.2s ease',
          }}
          title={`${prefixValue}${formattedPrimary}${suffixValue}`}
        >
          {formattedPrimary}
        </span>
        {suffixValue && (
          <span
            style={{
              fontFamily: resolvedFontFamily,
              fontSize: `${Math.max(10, Math.round(primaryFontSizePx * 0.5))}px`,
              fontWeight: 600,
              color: '#64748b',
              marginLeft: '3px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {suffixValue}
          </span>
        )}
        {badgePosition === 'inline_right' && showBadge && hasComparison && (
          <div style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
            <KPIComparisonBadge
              deltaPercentStr={formattedDeltaPercent}
              deltaAbsoluteStr={formattedDeltaAbsolute}
              trendDirection={trendDirection}
              badgeStyle={badgeStyle}
              badgeBackgroundColor={finalBadgeBg}
              badgeTextColor={finalBadgeText}
              showAbsoluteDelta={showAbsoluteDelta}
              isCompact={isVerticalCompact}
              isUltraCompact={isVerticalUltraCompact}
              hideAbsoluteDelta={hideBadgeAbsolute}
              tooltipPrefix={texts.changePrefix}
            />
          </div>
        )}
      </div>

      {/* Bottom Section: Comparison Badge if hasComparison, or dynamic Month/Subtitle */}
      {hasBottomContent && (
        <div
          style={{
            fontFamily: resolvedFontFamily,
            display: 'flex',
            flexWrap: wrapBottomContent !== false ? 'wrap' : 'nowrap',
            alignItems: 'center',
            rowGap: '2px',
            columnGap: isHorizontalUltraCompact ? '3px' : '5px',
            width: '100%',
            justifyContent:
              cardAlignment === 'center'
                ? 'center'
                : cardAlignment === 'right'
                ? 'flex-end'
                : 'flex-start',
            fontSize: isVerticalUltraCompact
              ? '0.72rem'
              : isVerticalCompact
              ? '0.78rem'
              : '0.84rem',
            lineHeight: 1.25,
            flexShrink: 0,
            overflow: wrapBottomContent !== false ? 'visible' : 'hidden',
          }}
        >
          {hasComparison ? (
            <>
              {showBadge && badgePosition === 'bottom_left' && (
                <KPIComparisonBadge
                  deltaPercentStr={formattedDeltaPercent}
                  deltaAbsoluteStr={formattedDeltaAbsolute}
                  trendDirection={trendDirection}
                  badgeStyle={badgeStyle}
                  badgeBackgroundColor={finalBadgeBg}
                  badgeTextColor={finalBadgeText}
                  showAbsoluteDelta={showAbsoluteDelta}
                  isCompact={isVerticalCompact}
                  isUltraCompact={isVerticalUltraCompact}
                  hideAbsoluteDelta={hideBadgeAbsolute}
                  tooltipPrefix={texts.changePrefix}
                />
              )}

              {((showComparisonValue && comparisonValue !== null) ||
                (showComparisonLabel && Boolean(comparisonLabel))) && (
                <div
                  style={{
                    fontFamily: resolvedFontFamily,
                    display: 'inline-flex',
                    flexWrap: wrapBottomContent !== false ? 'wrap' : 'nowrap',
                    alignItems: 'center',
                    gap: '3px',
                    color: comparisonColor || '#64748b',
                    fontSize:
                      comparisonFontSize === 'medium'
                        ? '0.84rem'
                        : comparisonFontSize === 'large'
                        ? '0.92rem'
                        : isVerticalUltraCompact
                        ? '0.70rem'
                        : isVerticalCompact
                        ? '0.74rem'
                        : '0.80rem',
                    fontWeight: (comparisonFontWeight as any) || 500,
                    whiteSpace: wrapBottomContent !== false ? 'normal' : 'nowrap',
                    overflow: wrapBottomContent !== false ? 'visible' : 'hidden',
                    textOverflow: wrapBottomContent !== false ? 'clip' : 'ellipsis',
                    flexShrink: 1,
                    minWidth: 0,
                  }}
                  title={
                    showComparisonLabel && comparisonLabel && showComparisonValue && comparisonValue !== null
                      ? `${comparisonLabel}: ${prefixValue}${formattedComparison}${suffixValue}`
                      : (showComparisonLabel && comparisonLabel) ||
                        `${prefixValue}${formattedComparison}${suffixValue}`
                  }
                >
                  {showComparisonLabel && comparisonLabel && (
                    <span
                      style={{
                        overflow: wrapBottomContent !== false ? 'visible' : 'hidden',
                        textOverflow: wrapBottomContent !== false ? 'clip' : 'ellipsis',
                        whiteSpace: wrapBottomContent !== false ? 'normal' : 'nowrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {comparisonLabel}
                      {showComparisonValue && comparisonValue !== null ? ':' : ''}
                    </span>
                  )}
                  {showComparisonValue && comparisonValue !== null && (
                    <span
                      style={{
                        fontWeight: 600,
                        color: comparisonColor ? comparisonColor : '#334155',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {prefixValue}
                      {formattedComparison}
                      {suffixValue}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            /* NO COMPARISON: Render dynamic month and year as bottom subtitle when not shown above */
            showBottomSubtitle && (
              <div
                style={{
                  color: '#64748b',
                  fontSize: isVerticalUltraCompact
                    ? '0.74rem'
                    : isVerticalCompact
                    ? '0.78rem'
                    : '0.84rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={kpiSubtitle}
              >
                {kpiSubtitle}
              </div>
            )
          )}
        </div>
      )}

      {/* Optional Sparkline Area */}
      {canRenderSparkline && (
        <div style={{ width: '100%', marginTop: 'auto', flexShrink: 0 }}>
          <KPISparkline
            data={sparklineData}
            color={sparklineColor}
            fill={sparklineFill}
            height={height < 160 ? 22 : 36}
            curve={sparklineCurve}
            showPoints={sparklineShowPoints}
          />
        </div>
      )}
      {/* Optional Target Progress Bar */}
      {showProgressBar && targetProgressPercent !== null && (
        <div
          style={{
            width: '100%',
            marginTop: 'auto',
            paddingTop: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e2e8f0',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(targetProgressPercent, 100)}%`,
                height: '100%',
                backgroundColor:
                  targetProgressPercent > 100
                    ? '#f59e0b'
                    : finalTrendColor !== '#94a3b8'
                    ? finalTrendColor
                    : '#2563eb',
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              color: '#64748b',
              textAlign: 'right',
              fontWeight: 500,
            }}
          >
            {targetProgressPercent > 100 ? '>100%' : `${Math.round(targetProgressPercent)}%`} {targetProgressSuffix ?? texts.ofTarget}
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIComparisonChart;
