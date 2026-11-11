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

export const KPIComparisonBadge: React.FC<KPIComparisonBadgeProps> = ({
  deltaPercentStr,
  deltaAbsoluteStr,
  trendDirection,
  badgeStyle,
  badgeBackgroundColor,
  badgeTextColor,
  showAbsoluteDelta = true,
  isCompact = false,
  isUltraCompact = false,
  hideAbsoluteDelta = false,
  tooltipPrefix = 'Change',
}) => {
  const getArrowIcon = () => {
    switch (trendDirection) {
      case 'up':
        return '▲';
      case 'down':
        return '▼';
      case 'none':
        return null;
      default:
        return '■';
    }
  };

  const isPill = badgeStyle === 'pill';
  const isFull = badgeStyle === 'full';

  const badgePadding = isUltraCompact
    ? isPill ? '1px 6px' : isFull ? '2px 5px' : '0px'
    : isCompact
    ? isPill ? '2px 8px' : isFull ? '3px 8px' : '1px 0px'
    : isPill ? '3px 9px' : isFull ? '4px 10px' : '2px 0px';

  const badgeFontSize = isUltraCompact
    ? '0.72rem'
    : isCompact
    ? '0.78rem'
    : '0.85rem';

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: isUltraCompact ? '3px' : '4px',
    padding: badgePadding,
    borderRadius: isPill ? '9999px' : isFull ? '6px' : '0px',
    backgroundColor: badgeBackgroundColor,
    color: badgeTextColor,
    fontSize: badgeFontSize,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
    boxShadow: isPill && !isUltraCompact ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
    transition: 'all 0.2s ease-in-out',
    userSelect: 'none',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };

  const arrowStyle: React.CSSProperties = {
    fontSize: isUltraCompact ? '0.62rem' : isCompact ? '0.68rem' : '0.75rem',
    lineHeight: 1,
    transform: trendDirection === 'up' ? 'translateY(-1px)' : trendDirection === 'down' ? 'translateY(1px)' : 'none',
  };

  // Only render absolute delta if enabled, horizontal room exists, and value is valid
  const hasAbsoluteDelta = deltaAbsoluteStr && deltaAbsoluteStr !== '—';
  const shouldRenderAbsoluteDelta = showAbsoluteDelta && !hideAbsoluteDelta && hasAbsoluteDelta;

  const tooltipText = hasAbsoluteDelta
    ? `${tooltipPrefix}: ${deltaPercentStr} (${deltaAbsoluteStr})`
    : `${tooltipPrefix}: ${deltaPercentStr}`;

  const arrowIcon = getArrowIcon();

  return (
    <span style={containerStyle} title={tooltipText}>
      {arrowIcon && <span style={arrowStyle}>{arrowIcon}</span>}
      <span>{deltaPercentStr}</span>
      {shouldRenderAbsoluteDelta && (
        <span
          style={{
            fontSize: isCompact ? '0.68rem' : '0.75rem',
            fontWeight: 500,
            opacity: 0.85,
            marginLeft: '2px',
          }}
        >
          ({deltaAbsoluteStr})
        </span>
      )}
    </span>
  );
};
