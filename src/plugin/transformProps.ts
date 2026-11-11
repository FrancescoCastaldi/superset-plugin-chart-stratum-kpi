import { ChartProps } from '@superset-ui/core';
import {
  BadgePosition,
  BadgeStyle,
  CalculationMode,
  CardAlignment,
  CardBorderRadius,
  CardBoxShadow,
  KPIComparisonFormData,
  KPIComparisonProps,
  TrendDirection,
} from '../types';
import {
  formatDeltaPercent,
  formatNumberLocale,
  formatMetricValue,
  formatMonthYear,
  getMetricLabel,
  isNumericCell,
  parseNumericValue,
  parseStaticNumber,
} from '../utils/formatters';
import { formatDuration, formatSignedDuration, parseTimeToSeconds, TimeDisplayFormat } from '../utils/timeValues';
import { periodTitle, readDashboardPeriods, withNoData } from '../utils/dashboardPeriods';
import {
  getKpiTexts,
  isGenericComparisonLabel,
  isPreviousMonthLabel,
  isVsMonthLabel,
  monthIndexOf,
} from '../utils/locale';
import {
  getContrastTextColor,
  getTrendColors,
  resolveCardBgColor,
  resolveSparklineColor,
  toRgbaString,
} from '../utils/colors';
import {
  classifyExtremeTitle,
  extractSparklineData,
  orderSparklineRows,
  selectReferenceRow,
} from '../utils/series';
import { computeDelta, getTrendPolarity } from '../utils/trend';

function resolveColumnName(col: any): string {
  if (!col) return '';
  if (typeof col === 'string') return col.trim();
  if (Array.isArray(col)) return resolveColumnName(col[0]);
  if (typeof col === 'object') {
    return String(col.label || col.column_name || col.sqlExpression || '').trim();
  }
  return '';
}

function isTargetOrTotalKey(
  key: string,
  matchedPrefix: string | null,
  targetMetricKey: string,
  totalMetricKey: string,
): boolean {
  const kLow = key.toLowerCase();
  const targetLow = targetMetricKey.toLowerCase();
  const totalLow = totalMetricKey.toLowerCase();
  if (
    targetLow &&
    (kLow === targetLow || kLow.startsWith(`${targetLow}__`) || kLow.startsWith(`${targetLow}_`))
  ) {
    return true;
  }
  if (
    totalLow &&
    (kLow === totalLow || kLow.startsWith(`${totalLow}__`) || kLow.startsWith(`${totalLow}_`))
  ) {
    return true;
  }
  const remainder = matchedPrefix && kLow.startsWith(matchedPrefix) ? kLow.slice(matchedPrefix.length) : kLow;
  return (
    remainder.includes('target') ||
    remainder.includes('obiettivo') ||
    remainder.includes('totale') ||
    remainder.includes('total')
  );
}

function findPrefixedComparisonKey(
  row: Record<string, any>,
  primaryKeys: string[],
  targetMetricKey: string,
  totalMetricKey: string,
  keywordTest: (suffix: string) => boolean,
): string | undefined {
  const prefixes = primaryKeys.map(p => p.trim().toLowerCase()).filter(Boolean);
  if (prefixes.length === 0) return undefined;

  return Object.keys(row).find(k => {
    const kLow = k.toLowerCase();
    const matchedPrefix = prefixes.find(p => kLow !== p && kLow.startsWith(p));
    if (!matchedPrefix) return false;
    if (isTargetOrTotalKey(k, matchedPrefix, targetMetricKey, totalMetricKey)) return false;
    return keywordTest(kLow.slice(matchedPrefix.length));
  });
}

function findTimeShiftKey(
  row: Record<string, any>,
  primaryKeys: string[],
  preferredShifts: string[],
  targetMetricKey: string,
  totalMetricKey: string,
): string | undefined {
  const keys = Object.keys(row);
  const prefixes = primaryKeys.map(p => p.trim()).filter(Boolean);

  for (const prefix of prefixes) {
    const pLow = prefix.toLowerCase();
    for (const shift of preferredShifts) {
      const exactCandidate = `${prefix}__${shift}`;
      const foundExact = keys.find(
        k =>
          (k === exactCandidate || k.toLowerCase() === exactCandidate.toLowerCase()) &&
          !isTargetOrTotalKey(k, pLow, targetMetricKey, totalMetricKey),
      );
      if (foundExact) return foundExact;
    }
    const foundWildcard = keys.find(
      k =>
        k.toLowerCase().startsWith(`${pLow}__`) &&
        !isTargetOrTotalKey(k, pLow, targetMetricKey, totalMetricKey),
    );
    if (foundWildcard) return foundWildcard;
  }

  return keys.find(k => {
    const kLow = k.toLowerCase();
    const matchedPrefix = prefixes.map(p => p.toLowerCase()).find(p => kLow !== p && kLow.startsWith(p));
    if (!matchedPrefix) return false;
    if (isTargetOrTotalKey(k, matchedPrefix, targetMetricKey, totalMetricKey)) return false;
    return kLow.slice(matchedPrefix.length).includes('ago');
  });
}

export default function transformProps(chartProps: ChartProps): KPIComparisonProps {
  const { width, height, formData, queriesData } = chartProps;
  const fd = formData as KPIComparisonFormData;
  const rawFd = (chartProps.rawFormData || {}) as any;

  // Superset normalizes formData to camelCase in modern versions (ChartRenderer),
  // while explore and legacy views keep snake_case.
  // We resolve every control checking camelCase, snake_case on both formData and rawFormData.
  const getProp = <T>(camelKey: string, snakeKey: string, defaultVal: T): T => {
    const val =
      (fd as any)?.[camelKey] ??
      (fd as any)?.[snakeKey] ??
      rawFd?.[camelKey] ??
      rawFd?.[snakeKey];
    return val !== undefined && val !== null ? val : defaultVal;
  };

  const kpiLocale: 'en' | 'it' = getProp<string>('locale', 'locale', 'en') === 'it' ? 'it' : 'en';
  const texts = getKpiTexts(kpiLocale);
  const fmtMonth = (val: any): string => formatMonthYear(val, texts.months);

  const data = (queriesData?.[0]?.data as Array<Record<string, any>>) || [];

  // Determine calculation mode
  const calculationMode = getProp<CalculationMode>('calculationMode', 'calculation_mode', 'dual_metric');
  const enableComparison =
    getProp<boolean>('enableComparison', 'enable_comparison', true) &&
    calculationMode !== 'none';
  const metricProp = getProp('metric', 'metric', fd.metric);
  const comparisonMetricProp = getProp('comparisonMetric', 'comparison_metric', (fd as any)?.comparison_metric);
  const targetMetricProp = getProp<any>('targetMetric', 'target_metric', null);
  const totalMetricProp = getProp<any>('totalMetric', 'total_metric', null);
  const primaryMetricKey = getMetricLabel(metricProp);
  const comparisonMetricKey = getMetricLabel(comparisonMetricProp);
  const targetMetricKey = getMetricLabel(targetMetricProp);
  const totalMetricKey = getMetricLabel(totalMetricProp);
  const targetStaticVal = getProp<string>('targetStaticValue', 'target_static_value', '');
  const timeColumnName = resolveColumnName(getProp<any>('timeColumn', 'time_column', undefined));
  const showSparkline = Boolean(getProp('showSparkline', 'show_sparkline', false));

  const rawDashboardShifts = ([] as unknown[])
    .concat(rawFd.extra_form_data?.time_compare ?? rawFd.extraFormData?.time_compare ?? [])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  const rawChartShift = getProp<string | string[]>('timeCompare', 'time_compare', '1 year ago');
  const chartShifts = (Array.isArray(rawChartShift) ? rawChartShift : [rawChartShift])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  const preferredShifts = [...rawDashboardShifts, ...chartShifts];

  const resolveTargetValue = (row: Record<string, any> | undefined): number | null => {
    if (targetMetricKey && row) {
      const exactVal = row[targetMetricKey];
      const matchedKey =
        exactVal !== undefined
          ? targetMetricKey
          : Object.keys(row).find(k => k.toLowerCase() === targetMetricKey.toLowerCase());
      if (matchedKey) {
        const parsedMetric = parseNumericValue(row[matchedKey]);
        if (parsedMetric !== null) {
          return parsedMetric;
        }
      }
    }
    if (targetStaticVal) {
      const parsedStatic = parseStaticNumber(targetStaticVal);
      if (!isNaN(parsedStatic)) {
        return parsedStatic;
      }
    }
    return null;
  };

  let primaryValue: number | null = null;
  let comparisonValue: number | null = null;
  let primaryKeyUsed: string | null = null;
  let sparklineData: number[] = [];
  let referenceRow: Record<string, any> | undefined;

  const rawTitle = getProp<string>('kpiTitle', 'kpi_title', '') || getProp<string>('sliceName', 'slice_name', '');
  const { isPeak, isMin } = classifyExtremeTitle(rawTitle);

  const seriesData =
    showSparkline && data.length > 1 && !isPeak && !isMin && calculationMode !== 'anti_cartesian'
      ? orderSparklineRows(data, timeColumnName || undefined)
      : data;

  if (seriesData.length > 0) {
    const firstRow = seriesData[0];
    referenceRow =
      selectReferenceRow(seriesData, primaryMetricKey, {
        isPeak,
        isMin,
        calculationMode,
        showSparkline,
      }) ?? firstRow;

    // 1. Primary Value extraction
    if (primaryMetricKey && referenceRow[primaryMetricKey] !== undefined) {
      primaryValue = parseNumericValue(referenceRow[primaryMetricKey]);
      primaryKeyUsed = primaryMetricKey;
    } else if (primaryMetricKey) {
      const foundKey = Object.keys(referenceRow).find(
        k => k.toLowerCase() === primaryMetricKey.toLowerCase(),
      );
      if (foundKey) {
        primaryValue = parseNumericValue(referenceRow[foundKey]);
        primaryKeyUsed = foundKey;
      }
    }

    if (primaryValue === null) {
      // Fallback: first numeric column
      const firstNumKey = Object.keys(referenceRow).find(
        k => isNumericCell(referenceRow?.[k]),
      );
      if (firstNumKey) {
        primaryValue = parseNumericValue(referenceRow[firstNumKey]);
        primaryKeyUsed = firstNumKey;
      }
    }

    const primaryKeys = Array.from(new Set([primaryKeyUsed || '', primaryMetricKey || ''].filter(Boolean)));

    // 2. Comparison Value extraction
    if (!enableComparison) {
      comparisonValue = null;
    } else if (calculationMode === 'static_target') {
      comparisonValue = resolveTargetValue(referenceRow);
    } else if (calculationMode === 'dual_metric') {
      if (comparisonMetricKey && referenceRow[comparisonMetricKey] !== undefined) {
        comparisonValue = parseNumericValue(referenceRow[comparisonMetricKey]);
      } else if (comparisonMetricKey) {
        const foundCompKey = Object.keys(referenceRow).find(
          k => k.toLowerCase() === comparisonMetricKey.toLowerCase(),
        );
        if (foundCompKey) {
          comparisonValue = parseNumericValue(referenceRow[foundCompKey]);
        }
      }

      // Heuristic fallback requires the primary metric prefix and excludes target/total columns
      if (comparisonValue === null && comparisonMetricKey) {
        const keywordKey = findPrefixedComparisonKey(
          referenceRow,
          primaryKeys,
          targetMetricKey,
          totalMetricKey,
          suffix =>
            suffix.includes('conf') ||
            suffix.includes('prev') ||
            suffix.includes('comp') ||
            suffix.includes('prec') ||
            suffix.includes('bench'),
        );
        if (keywordKey) {
          comparisonValue = parseNumericValue(referenceRow[keywordKey]);
        }
      }
    } else if (calculationMode === 'anti_cartesian') {
      // Pattern A: 2-row period-sliced dataset (IS_CORRENTE / IS_CONFRONTO or PERIODO column)
      if (seriesData.length > 1) {
        const currentPeriodRow = seriesData.find(
          (r: any) => r.IS_CORRENTE === 1 || r.is_corrente === 1 || String(r.PERIODO).toUpperCase() === 'CORRENTE',
        ) || seriesData[0];

        const comparisonPeriodRow = seriesData.find(
          (r: any) => r.IS_CONFRONTO === 1 || r.is_confronto === 1 || String(r.PERIODO).toUpperCase() === 'CONFRONTO',
        ) || seriesData[1];

        if (primaryMetricKey && currentPeriodRow[primaryMetricKey] !== undefined) {
          primaryValue = parseNumericValue(currentPeriodRow[primaryMetricKey]);
          primaryKeyUsed = primaryMetricKey;
        }
        if (primaryMetricKey && comparisonPeriodRow[primaryMetricKey] !== undefined) {
          comparisonValue = parseNumericValue(comparisonPeriodRow[primaryMetricKey]);
        }
        referenceRow = currentPeriodRow;
      } else if (seriesData.length === 1) {
        // Pattern B: 1-row paired columns (metric_corr vs metric_conf)
        const row = seriesData[0];
        referenceRow = row;
        if (primaryMetricKey && row[primaryMetricKey] !== undefined) {
          primaryValue = parseNumericValue(row[primaryMetricKey]);
          primaryKeyUsed = primaryMetricKey;
        }
        if (comparisonMetricKey && row[comparisonMetricKey] !== undefined) {
          comparisonValue = parseNumericValue(row[comparisonMetricKey]);
        } else {
          const foundPairedExact = comparisonMetricKey
            ? Object.keys(row).find(k => k.toLowerCase() === comparisonMetricKey.toLowerCase())
            : undefined;
          if (foundPairedExact) {
            comparisonValue = parseNumericValue(row[foundPairedExact]);
          } else {
            const pairedKey = findPrefixedComparisonKey(
              row,
              primaryKeys,
              targetMetricKey,
              totalMetricKey,
              suffix =>
                suffix.includes('conf') ||
                suffix.includes('confronto') ||
                suffix.endsWith('_t2'),
            );
            if (pairedKey) {
              comparisonValue = parseNumericValue(row[pairedKey]);
            }
          }
        }
      }
    } else if (calculationMode === 'time_shift') {
      // Time-shift mode: inspect offset columns matching primary metric first, excluding target/total
      const offsetKey = findTimeShiftKey(
        referenceRow,
        primaryKeys,
        preferredShifts,
        targetMetricKey,
        totalMetricKey,
      );
      if (offsetKey) {
        comparisonValue = parseNumericValue(referenceRow[offsetKey]);
      } else if (!showSparkline && seriesData.length > 1) {
        comparisonValue = parseNumericValue(seriesData[1][primaryMetricKey]);
      }
    }

    // 2.1 Fallback: if comparisonValue is still null and comparison is enabled, check for offset column matching primary metric
    if (comparisonValue === null && enableComparison) {
      const offsetKey = findTimeShiftKey(
        referenceRow,
        primaryKeys,
        preferredShifts,
        targetMetricKey,
        totalMetricKey,
      );
      if (offsetKey) {
        comparisonValue = parseNumericValue(referenceRow[offsetKey]);
      }
    }

    // 3. Sparkline data extraction in chronological ascending order
    if (showSparkline && seriesData.length > 1) {
      sparklineData = extractSparklineData(seriesData, primaryMetricKey);
    }
  }

  // Target Tracking calculations
  let targetProgressPercent: number | null = null;
  const showProgressBar = Boolean(getProp('showProgressBar', 'show_progress_bar', false));

  if (showProgressBar && primaryValue !== null) {
    const targetValue = resolveTargetValue(referenceRow);
    if (targetValue !== null && targetValue > 0) {
      targetProgressPercent = (primaryValue / targetValue) * 100;
    }
  }

  // Delta calculations
  const delta = computeDelta(primaryValue, comparisonValue);
  let deltaAbsolute: number | null = delta.deltaAbsolute;
  let deltaPercent: number | null = delta.deltaPercent;
  let trendDirection: TrendDirection = delta.trendDirection;

  // Semantic color coding and polarity
  const invertPolarity =
    Boolean(getProp('invertPolarity', 'invert_polarity', false)) ||
    Boolean(getProp('lowerIsBetter', 'lower_is_better', false));
  const badgeStyle: BadgeStyle = getProp<BadgeStyle>('badgeStyle', 'badge_style', 'pill');
  const trendColors = getTrendColors(getTrendPolarity(trendDirection, invertPolarity), badgeStyle);
  const { trendColor } = trendColors;
  let { badgeBackgroundColor, badgeTextColor } = trendColors;

  // Format strings
  const numberFormat = getProp<string | undefined>('numberFormat', 'number_format', 'SMART_NUMBER');
  // A Time metric (its values are texts like "00:12:54") is written as a duration, not with the number format
  const primaryRaw = primaryKeyUsed && referenceRow ? referenceRow[primaryKeyUsed] : undefined;
  const isTimeKpi = parseTimeToSeconds(primaryRaw) !== null;
  const timeOptions = {
    format: getProp<TimeDisplayFormat>('timeDisplayFormat', 'time_display_format', 'auto'),
    fractionDigits: Math.min(3, Math.max(0, Math.round(Number(getProp('timeFractionDigits', 'time_fraction_digits', 0))) || 0)),
    referenceSeconds: Math.max(Math.abs(primaryValue ?? 0), Math.abs(comparisonValue ?? 0)),
  };
  const formatValue = (value: number | null): string =>
    isTimeKpi && value !== null ? formatDuration(value, timeOptions) : formatMetricValue(value, numberFormat, kpiLocale);
  const formattedPrimary = formatValue(primaryValue);
  const formattedComparison = formatValue(comparisonValue);
  let formattedDeltaPercent = formatDeltaPercent(deltaPercent, 1, kpiLocale);
  let formattedDeltaAbsolute =
    deltaAbsolute === null
      ? '—'
      : isTimeKpi
      ? formatSignedDuration(deltaAbsolute, timeOptions)
      : `${deltaAbsolute > 0 ? '+' : ''}${formatNumberLocale(deltaAbsolute, 0, kpiLocale)}`;

  // Zero baseline badge and neutral styling
  if (delta.isZeroBaseline && primaryValue !== null) {
    formattedDeltaPercent = texts.newBadge;
    trendDirection = 'none';
    badgeBackgroundColor = '#f1f5f9';
    badgeTextColor = '#64748b';
  }

  // Percent of Total override
  const badgeContent = getProp<string>('badgeContent', 'badge_content', 'delta');
  let hasPercentOfTotal = false;
  if (badgeContent === 'percent_of_total' && primaryValue !== null) {
    const totalMetric = getProp<any>('totalMetric', 'total_metric', null);
    if (totalMetric) {
      const totalMetricKey = getMetricLabel(totalMetric);
      if (totalMetricKey && data && data.length > 0 && isNumericCell(data[0][totalMetricKey])) {
        const totalValue = parseNumericValue(data[0][totalMetricKey]);
        if (totalValue !== null && totalValue !== 0) {
          const pct = (primaryValue / totalValue) * 100;
          formattedDeltaPercent = `${formatNumberLocale(pct, 1, kpiLocale)}%`;
          formattedDeltaAbsolute = '—'; // Hide absolute delta
          trendDirection = 'none'; // Hide trend arrow
          hasPercentOfTotal = true;
          
          // Badge color from user settings
          const totalBadgeColor = getProp<any>('totalBadgeColor', 'total_badge_color', { r: 99, g: 102, b: 241, a: 1 });
          if (totalBadgeColor && totalBadgeColor.r !== undefined) {
            badgeBackgroundColor = toRgbaString(totalBadgeColor);
            badgeTextColor = getContrastTextColor(totalBadgeColor);
          }
        }
      }
    }
  }

  // Sparkline color
  const sparklineColor = resolveSparklineColor(
    getProp<any>('sparklineColor', 'sparkline_color', undefined),
  );

  // Dynamic context: extract active time range filter from dashboard
  const activeTimeRange =
    rawFd.time_range ||
    rawFd.extra_form_data?.time_range ||
    rawFd.extraFormData?.time_range;

  // --- Explicit Dynamic Subtitle Config ---
  let explicitDynamicVal: string | null = null;
  const dynamicSubtitleCol = resolveColumnName(
    getProp<any>('dynamicSubtitleColumn', 'dynamic_subtitle_column', undefined),
  );
  if (dynamicSubtitleCol && referenceRow) {
    const dynamicKey =
      referenceRow[dynamicSubtitleCol] !== undefined
        ? dynamicSubtitleCol
        : Object.keys(referenceRow).find(k => k.toLowerCase() === dynamicSubtitleCol.toLowerCase());
    if (dynamicKey && referenceRow[dynamicKey] !== undefined) {
      explicitDynamicVal = String(referenceRow[dynamicKey]);
    }
  }

  // --- Dynamic Month & Period Discovery ---
  let dynamicMonth: string | null = null;
  let dynamicCompMonth: string | null = null;
  // Names and readable ranges of the periods when a dashboard filter (the Calendar Filter) chose them
  const dashboardPeriods = readDashboardPeriods(rawFd.extra_form_data ?? rawFd.extraFormData ?? (fd as any).extra_form_data);
  let dynamicPeriod: string | null = dashboardPeriods.referenceText ?? null;

  // 1. Inspect referenceRow for explicit string metrics or date columns
  if (referenceRow) {
    for (const [key, val] of Object.entries(referenceRow)) {
      if (typeof val === 'string' && val.trim()) {
        const kLow = key.toLowerCase();
        if (kLow.includes('picco') || kLow.includes('peak')) {
          dynamicMonth = fmtMonth(val);
        } else if (
          kLow.includes('minimo') ||
          kLow.includes('minimum') ||
          kLow.includes('lowest') ||
          kLow.includes('più basso') ||
          kLow.includes('piu basso')
        ) {
          dynamicMonth = fmtMonth(val);
        } else if (
          kLow.includes('corrente') ||
          (kLow.includes('ultimo') && !kLow.includes('penultimo')) ||
          kLow.includes('current') ||
          kLow.includes('riferimento') ||
          kLow.includes('reference') ||
          kLow === 'mese_corrente_etichetta' ||
          kLow === 'data_corrente' ||
          kLow === 'data_riferimento'
        ) {
          if (!dynamicMonth) {
            dynamicMonth = fmtMonth(val);
          }
        } else if (
          kLow.includes('confronto') ||
          kLow.includes('comparison') ||
          kLow.includes('prec') ||
          kLow.includes('penultimo') ||
          kLow.includes('prev') ||
          kLow.includes('comp') ||
          kLow === 'mese_confronto_etichetta' ||
          kLow === 'data_confronto'
        ) {
          if (!dynamicCompMonth) {
            dynamicCompMonth = fmtMonth(val);
          }
        } else if (
          kLow.includes('periodo') ||
          kLow.includes('period') ||
          kLow.includes('mesi') ||
          kLow.includes('finestra')
        ) {
          if (!dynamicPeriod) {
            dynamicPeriod = val.trim();
          }
        } else if (
          kLow.includes('mese') ||
          kLow.includes('month') ||
          kLow.includes('data') ||
          kLow.includes('date')
        ) {
          if (!dynamicMonth) {
            dynamicMonth = fmtMonth(val);
          }
        }
      }
    }
  }

  // In anti_cartesian 2-row mode, also extract dynamicCompMonth from comparison row
  if (calculationMode === 'anti_cartesian' && seriesData && seriesData.length > 1) {
    const compRow = seriesData.find(
      (r: any) => r.IS_CONFRONTO === 1 || r.is_confronto === 1 || String(r.PERIODO).toUpperCase() === 'CONFRONTO',
    ) || seriesData[1];

    if (compRow) {
      for (const [key, val] of Object.entries(compRow)) {
        if (typeof val === 'string' && val.trim()) {
          const kLow = key.toLowerCase();
          if (
            kLow.includes('confronto') ||
            kLow.includes('comparison') ||
            kLow.includes('mese') ||
            kLow.includes('data') ||
            kLow.includes('periodo')
          ) {
            dynamicCompMonth = fmtMonth(val);
            break;
          }
        }
      }
    }
  }

  // 2. If data has multiple rows (series/sparkline/monthly groups), detect from rows
  if (seriesData.length > 1 && calculationMode !== 'anti_cartesian') {
    const dateCol = Object.keys(seriesData[0]).find(k => {
      const kLow = k.toLowerCase();
      return (
        (timeColumnName && k === timeColumnName) ||
        kLow.includes('mese') ||
        kLow.includes('month') ||
        kLow.includes('data') ||
        kLow.includes('date')
      );
    });

    if (dateCol) {
      // Only the explicit KPI title counts here: a peak/min slice name alone
      // still labels the card with the latest row month.
      const { isPeak, isMin } = classifyExtremeTitle(getProp<string>('kpiTitle', 'kpi_title', ''));

      if (isPeak) {
        let maxVal = -Infinity;
        let peakRow = seriesData[0];
        seriesData.forEach(r => {
          const v = parseNumericValue(r[primaryKeyUsed || primaryMetricKey]);
          if (v !== null && v > maxVal) {
            maxVal = v;
            peakRow = r;
          }
        });
        if (peakRow && peakRow[dateCol]) {
          dynamicMonth = fmtMonth(String(peakRow[dateCol]));
        }
      } else if (isMin) {
        let minVal = Infinity;
        let minRow = seriesData[0];
        seriesData.forEach(r => {
          const v = parseNumericValue(r[primaryKeyUsed || primaryMetricKey]);
          if (v !== null && v < minVal) {
            minVal = v;
            minRow = r;
          }
        });
        if (minRow && minRow[dateCol]) {
          dynamicMonth = fmtMonth(String(minRow[dateCol]));
        }
      } else {
        const lastRow = seriesData[seriesData.length - 1];
        if (lastRow && lastRow[dateCol]) {
          dynamicMonth = fmtMonth(String(lastRow[dateCol]));
        }
        if (seriesData.length > 1) {
          const prevRow = seriesData[seriesData.length - 2];
          if (prevRow && prevRow[dateCol]) {
            dynamicCompMonth = fmtMonth(String(prevRow[dateCol]));
          }
        }
      }
    }
  }

  // 3. Fallback from activeTimeRange if month or period still unknown
  if (activeTimeRange && activeTimeRange !== 'No filter') {
    const rangeMatch = activeTimeRange.match(
      /(\d{4}-\d{2}-\d{2})\s*:\s*(\d{4}-\d{2}-\d{2})?/,
    );
    if (rangeMatch) {
      const startFmt = fmtMonth(rangeMatch[1]);
      const endFmt = rangeMatch[2] ? fmtMonth(rangeMatch[2]) : null;
      if (!dynamicPeriod) {
        dynamicPeriod = endFmt ? `${startFmt} - ${endFmt}` : `${texts.from} ${startFmt}`;
      }
      if (!dynamicMonth && endFmt) {
        dynamicMonth = endFmt;
      }
    } else if (activeTimeRange.toLowerCase().includes('last 12 months')) {
      if (!dynamicPeriod) dynamicPeriod = texts.twelveMonths;
    } else if (activeTimeRange.toLowerCase().includes('last 6 months')) {
      if (!dynamicPeriod) dynamicPeriod = texts.sixMonths;
    }
  }

  // 4. Heuristic fallback for dynamicCompMonth when comparing to previous month
  if (!dynamicCompMonth) {
    const rawCompLabel = (getProp<string | undefined>('comparisonLabel', 'comparison_label', '') || '').toLowerCase();
    const isPreviousMonthTarget =
      rawCompLabel.includes('mese prec') ||
      rawCompLabel.includes('previous month') ||
      rawCompLabel.includes('precedente') ||
      rawCompLabel.includes('{comp_month}') ||
      rawCompLabel.includes('{mese_prec}') ||
      (comparisonMetricKey && (
        comparisonMetricKey.toLowerCase().includes('penultimo') ||
        comparisonMetricKey.toLowerCase().includes('prec') ||
        comparisonMetricKey.toLowerCase().includes('prev')
      ));

    if (isPreviousMonthTarget) {
      let anchorDate = new Date();
      if (dynamicMonth) {
        const parts = dynamicMonth.split(' ');
        if (parts.length >= 2) {
          const mIdx = monthIndexOf(parts[0]);
          const y = parseInt(parts[1], 10);
          if (mIdx !== -1 && !isNaN(y)) {
            anchorDate = new Date(y, mIdx, 1);
          }
        }
      }
      const prevDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
      dynamicCompMonth = `${texts.months[prevDate.getMonth()]} ${prevDate.getFullYear()}`;
    }
  }

  // Dynamic subtitle resolution
  let dynamicSubtitle = getProp<string>('kpiSubtitle', 'kpi_subtitle', '');
  
  if (explicitDynamicVal) {
    if (dynamicSubtitle && dynamicSubtitle.includes('{dynamic}')) {
      dynamicSubtitle = dynamicSubtitle.replace(/{dynamic}/gi, explicitDynamicVal);
    } else if (!dynamicSubtitle) {
      dynamicSubtitle = explicitDynamicVal;
    }
  }

  if (!dynamicSubtitle && activeTimeRange && activeTimeRange !== 'No filter') {
    dynamicSubtitle = `${texts.period}: ${dynamicPeriod || activeTimeRange}`;
  } else if (dynamicSubtitle) {
    if (dynamicPeriod) {
      dynamicSubtitle = dynamicSubtitle.replace(/{period}|{periodo}/gi, dynamicPeriod);
    }
    if (dynamicMonth) {
      dynamicSubtitle = dynamicSubtitle.replace(
        /{month}|{mese}|{current_month}|{mese_corrente}/gi,
        dynamicMonth,
      );
    }
    if (dynamicCompMonth) {
      dynamicSubtitle = dynamicSubtitle.replace(
        /{comp_month}|{mese_prec}|{mese_confronto}/gi,
        dynamicCompMonth,
      );
    }
    if (explicitDynamicVal && dynamicSubtitle.includes('{dynamic}')) {
      dynamicSubtitle = dynamicSubtitle.replace(/{dynamic}/gi, explicitDynamicVal);
    }
  }

  // Dynamic comparison label resolution
  let resolvedComparisonLabel = getProp<string | undefined>('comparisonLabel', 'comparison_label', '');
  if (dynamicCompMonth) {
    if (
      resolvedComparisonLabel &&
      (resolvedComparisonLabel.includes('{comp_month}') ||
        resolvedComparisonLabel.includes('{mese_prec}') ||
        resolvedComparisonLabel.includes('{month}') ||
        resolvedComparisonLabel.includes('{mese}'))
    ) {
      resolvedComparisonLabel = resolvedComparisonLabel
        .replace(/{comp_month}|{mese_prec}/gi, dynamicCompMonth)
        .replace(/{month}|{mese}/gi, dynamicCompMonth);
    } else if (
      resolvedComparisonLabel && isPreviousMonthLabel(resolvedComparisonLabel)
    ) {
      resolvedComparisonLabel = `${texts.vsPreviousMonth} (${dynamicCompMonth})`;
    } else if (
      !resolvedComparisonLabel ||
      isGenericComparisonLabel(resolvedComparisonLabel) ||
      isVsMonthLabel(resolvedComparisonLabel)
    ) {
      resolvedComparisonLabel = `vs ${dynamicCompMonth}`;
    }
  } else if (
    !resolvedComparisonLabel ||
    isGenericComparisonLabel(resolvedComparisonLabel) ||
    resolvedComparisonLabel === 'vs Benchmark'
  ) {
    if (calculationMode === 'anti_cartesian') {
      if (dynamicCompMonth) {
        resolvedComparisonLabel = `vs ${dynamicCompMonth}`;
      } else {
        resolvedComparisonLabel = texts.vsComparisonPeriod;
      }
    } else if (calculationMode === 'static_target') {
      resolvedComparisonLabel = texts.vsTarget;
    } else if (calculationMode === 'time_shift') {
      const sentByDashboard = ([] as unknown[])
        .concat(rawFd.extra_form_data?.time_compare ?? rawFd.extraFormData?.time_compare ?? [])
        .some(v => typeof v === 'string' && v.trim() !== '');
      if (comparisonValue === null && sentByDashboard) {
        // The dashboard sent a period but it holds no data: say so instead of asking for a time filter
        resolvedComparisonLabel = `vs ${withNoData(
          periodTitle(dashboardPeriods.comparisonName, dashboardPeriods.comparisonText, texts.vsComparisonPeriod.replace(/^vs /, '')),
          dashboardPeriods.locale ?? (getProp<string>('locale', 'locale', 'en') === 'it' ? 'it' : 'en'),
        )}`;
      } else if (comparisonValue === null) {
        resolvedComparisonLabel = texts.requiresTimeFilter;
      } else {
        // A dashboard filter (the calendar filter) sends its comparison period as an explicit range
        const dashboardShift = ([] as unknown[])
          .concat(rawFd.extra_form_data?.time_compare ?? rawFd.extraFormData?.time_compare ?? [])
          .find((v): v is string => typeof v === 'string' && v.trim() !== '');
        const chartShift = getProp<string | string[]>('timeCompare', 'time_compare', '1 year ago');
        const shift: string = dashboardShift || (Array.isArray(chartShift) ? String(chartShift[0] ?? '1 year ago') : chartShift);
        const dashboardTitle = dashboardShift
          ? periodTitle(dashboardPeriods.comparisonName, dashboardPeriods.comparisonText)
          : undefined;
        switch (dashboardTitle ? 'dashboard' : shift) {
          case 'dashboard':
            resolvedComparisonLabel = `vs ${dashboardTitle}`;
            break;
          case '1 year ago':
            resolvedComparisonLabel = texts.vsSamePeriodLastYear;
            break;
          case '1 month ago':
            resolvedComparisonLabel = texts.vsPreviousMonthShift;
            break;
          case '1 week ago':
            resolvedComparisonLabel = texts.vsPreviousWeek;
            break;
          case '28 days ago':
            resolvedComparisonLabel = texts.vsFourWeeksAgo;
            break;
          default:
            resolvedComparisonLabel = `vs ${shift}`;
        }
      }
    } else if (
      comparisonMetricKey &&
      !comparisonMetricKey.toLowerCase().includes('conf')
    ) {
      resolvedComparisonLabel = `vs ${comparisonMetricKey}`;
    } else {
      resolvedComparisonLabel = texts.vsComparison;
    }
  }

  // Dynamic title resolution
  let resolvedTitle = getProp<string>('kpiTitle', 'kpi_title', '');

  if (resolvedTitle) {
    // 1. Template replacement if placeholders present
    if (explicitDynamicVal && resolvedTitle.includes('{dynamic}')) {
      resolvedTitle = resolvedTitle.replace(/{dynamic}/gi, explicitDynamicVal);
    }
    if (
      dynamicMonth &&
      (resolvedTitle.includes('{month}') || resolvedTitle.includes('{mese}'))
    ) {
      resolvedTitle = resolvedTitle.replace(/{month}|{mese}/gi, dynamicMonth);
    }
    if (
      dynamicPeriod &&
      (resolvedTitle.includes('{period}') || resolvedTitle.includes('{periodo}'))
    ) {
      resolvedTitle = resolvedTitle.replace(/{period}|{periodo}/gi, dynamicPeriod);
    }

    // 2. Automatic smart append/update if title is standard pattern without template token
    const tLow = resolvedTitle.toLowerCase().trim();
    if (dynamicMonth) {
      if (
        tLow === 'mese di picco' ||
        tLow === 'picco' ||
        tLow === 'peak month' ||
        tLow === 'peak' ||
        tLow.startsWith('picco:') ||
        tLow.startsWith('picco :') ||
        tLow.startsWith('picco ·') ||
        tLow.startsWith('peak:') ||
        tLow.startsWith('peak :') ||
        tLow.startsWith('peak ·')
      ) {
        resolvedTitle = `${texts.peakPrefix} · ${dynamicMonth}`;
      } else if (
        tLow === 'mese più basso' ||
        tLow === 'lowest month' ||
        tLow === 'mese piu basso' ||
        tLow === 'minimo' ||
        tLow === 'min' ||
        tLow.startsWith('minimo:') ||
        tLow.startsWith('minimo :') ||
        tLow.startsWith('minimo ·') ||
        tLow.startsWith('min:') ||
        tLow.startsWith('min :') ||
        tLow.startsWith('min ·')
      ) {
        resolvedTitle = `${texts.minPrefix} · ${dynamicMonth}`;
      } else if (
        tLow === 'richieste ultimo mese' ||
        tLow === 'ultimo mese' ||
        tLow === 'richieste mese corrente' ||
        tLow === 'richieste' ||
        tLow === 'requests' ||
        tLow.startsWith('richieste ·') ||
        tLow.startsWith('richieste:') ||
        tLow.startsWith('requests ·') ||
        tLow.startsWith('requests:')
      ) {
        resolvedTitle = `${texts.requestsPrefix} · ${dynamicMonth}`;
      }
    }
    if (isPeak || isMin) {
      resolvedTitle = '';
      if (dynamicMonth) {
        dynamicSubtitle = dynamicMonth;
      }
    }
  } else {
    resolvedTitle = '';
  }

  const showTitle = getProp<boolean>('showTitle', 'show_title', true) !== false;
  if (!showTitle) {
    resolvedTitle = '';
  }

  // If Peak or Min or comparison disabled, comparison is strictly disabled
  if (isPeak || isMin || !enableComparison) {
    comparisonValue = null;
    deltaAbsolute = null;
    deltaPercent = null;
    if (dynamicMonth) {
      dynamicSubtitle = dynamicMonth;
    }
  }

  const isBadgeNone = badgeContent === 'none';

  const hasComparison =
    !isBadgeNone &&
    !isPeak &&
    !isMin &&
    primaryValue !== null &&
    ((enableComparison && comparisonValue !== null && (deltaPercent !== null || Boolean(delta.isZeroBaseline))) || hasPercentOfTotal);

  // Aesthetic Customization
  const cardBgColor = resolveCardBgColor(getProp<any>('cardBgColor', 'card_bg_color', undefined));

  const cardBorderRadius: CardBorderRadius = getProp<CardBorderRadius>('cardBorderRadius', 'card_border_radius', 'square');
  const cardBoxShadow: CardBoxShadow = getProp<CardBoxShadow>('cardBoxShadow', 'card_box_shadow', 'none');
  const cardBorderColor = getProp<string>('cardBorderColor', 'card_border_color', '');
  const cardBorderWidth = getProp<number>('cardBorderWidth', 'card_border_width', 1);

  // Typography Customization
  const kpiFontFamily = getProp<string>('kpiFontFamily', 'kpi_font_family', '');
  const kpiFontSizeMode = getProp<string>('kpiFontSizeMode', 'kpi_font_size_mode', 'auto');
  const kpiFontSizeManual = Number(getProp<number | string>('kpiFontSizeManual', 'kpi_font_size_manual', 36)) || 36;
  const kpiFontWeight = getProp<string | number>('kpiFontWeight', 'kpi_font_weight', '800');
  const kpiLetterSpacing = getProp<string>('kpiLetterSpacing', 'kpi_letter_spacing', 'tight');
  const kpiTabularNums = getProp<boolean>('kpiTabularNums', 'kpi_tabular_nums', true);
  const kpiColor = getProp<string>('kpiColor', 'kpi_color', '');

  const titleFontSize = getProp<string>('titleFontSize', 'title_font_size', 'auto');
  const titleFontWeight = getProp<string | number>('titleFontWeight', 'title_font_weight', '600');
  const titleColor = getProp<string>('titleColor', 'title_color', '');
  const titleTextTransform = getProp<'uppercase' | 'capitalize' | 'none'>('titleTextTransform', 'title_text_transform', 'uppercase');

  const subtitleFontSize = getProp<string>('subtitleFontSize', 'subtitle_font_size', 'small');
  const subtitleFontWeight = getProp<string | number>('subtitleFontWeight', 'subtitle_font_weight', '400');
  const subtitleColor = getProp<string>('subtitleColor', 'subtitle_color', '');

  const comparisonFontSize = getProp<string>('comparisonFontSize', 'comparison_font_size', 'small');
  const comparisonFontWeight = getProp<string | number>('comparisonFontWeight', 'comparison_font_weight', '500');
  const comparisonColor = getProp<string>('comparisonColor', 'comparison_color', '');

  const sparklineCurve = getProp<'smooth' | 'linear'>('sparklineCurve', 'sparkline_curve', 'smooth');
  const sparklineShowPoints = getProp<boolean>('sparklineShowPoints', 'sparkline_show_points', false);

  const prefixValue = getProp<string>('prefixValue', 'prefix_value', '');
  const suffixValue = getProp<string>('suffixValue', 'suffix_value', '');
  const cardAlignment = getProp<CardAlignment>('cardAlignment', 'card_alignment', 'left');
  const showComparisonValue = getProp<boolean>('showComparisonValue', 'show_comparison_value', true);
  const showComparisonLabel = getProp<boolean>('showComparisonLabel', 'show_comparison_label', true);
  const showBadge = getProp<boolean>('showBadge', 'show_badge', true);
  const showAbsoluteDelta = getProp<boolean>('showAbsoluteDelta', 'show_absolute_delta', true);
  const sparklineFill = getProp<boolean>('sparklineFill', 'sparkline_fill', true);
  const badgePosition = getProp<BadgePosition>('badgePosition', 'badge_position', 'bottom_left');
  const cleanCardMode = getProp<boolean>('cleanCardMode', 'clean_card_mode', false);

  return {
    width,
    height,
    primaryValue,
    comparisonValue,
    hasComparison,
    deltaAbsolute,
    deltaPercent,
    formattedPrimary,
    formattedComparison,
    formattedDeltaAbsolute,
    formattedDeltaPercent,
    trendDirection,
    trendColor,
    badgeBackgroundColor,
    badgeTextColor,
    kpiTitle: resolvedTitle,
    kpiSubtitle: dynamicSubtitle,
    comparisonLabel: resolvedComparisonLabel,
    prefixValue,
    suffixValue,
    cardBgColor,
    cardBorderRadius,
    cardBoxShadow,
    cardBorderColor,
    cardBorderWidth,
    kpiFontFamily,
    kpiFontSizeMode,
    kpiFontSizeManual,
    kpiFontWeight,
    kpiLetterSpacing,
    kpiTabularNums,
    kpiColor,
    titleFontSize,
    titleFontWeight,
    titleColor,
    titleTextTransform,
    subtitleFontSize,
    subtitleFontWeight,
    subtitleColor,
    comparisonFontSize,
    comparisonFontWeight,
    comparisonColor,
    badgeStyle,
    badgePosition,
    cleanCardMode,
    cardAlignment,
    showTitle: showTitle !== false,
    titleInChartHeader: getProp<boolean>('titleInChartHeader', 'title_in_chart_header', false) === true,
    showBadge: showBadge !== false,
    showComparisonValue: showComparisonValue !== false,
    showComparisonLabel: showComparisonLabel !== false,
    showAbsoluteDelta: showAbsoluteDelta !== false,
    wrapBottomContent: getProp<boolean>('wrapBottomContent', 'wrap_bottom_content', true),
    showSparkline,
    sparklineData,
    sparklineColor,
    sparklineFill: sparklineFill !== false,
    sparklineCurve,
    sparklineShowPoints,
    showProgressBar,
    targetProgressPercent,
    targetProgressSuffix: texts.ofTarget,
    applyTrendColorTo: getProp<'badge' | 'text' | 'background'>('applyTrendColorTo', 'apply_trend_color_to', 'badge'),
    clickUrl: getProp<string>('clickUrl', 'click_url', ''),
    clickTarget: getProp<'_blank' | '_self'>('clickTarget', 'click_target', '_self'),
    locale: kpiLocale,
  };
}
