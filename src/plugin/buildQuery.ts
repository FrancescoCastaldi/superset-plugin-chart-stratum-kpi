import { buildQueryContext, QueryContext, ensureIsArray } from '@superset-ui/core';
import { KPIComparisonFormData } from '../types';
import { getMetricLabel } from '../utils/formatters';

export default function buildQuery(formData: KPIComparisonFormData): QueryContext {
  const fd: any = formData || {};
  const getFd = (snake: string, camel: string, defaultVal?: any) => {
    const val = fd[snake] ?? fd[camel];
    return val !== undefined ? val : defaultVal;
  };

  const enable_comparison = getFd('enable_comparison', 'enableComparison', true);
  const calculation_mode = getFd('calculation_mode', 'calculationMode', 'dual_metric');
  const metric = getFd('metric', 'metric');
  const comparison_metric = getFd('comparison_metric', 'comparisonMetric');
  const fdMetrics = getFd('metrics', 'metrics');
  const time_compare = getFd('time_compare', 'timeCompare');
  const time_column = getFd('time_column', 'timeColumn');
  const dynamic_subtitle_column = getFd('dynamic_subtitle_column', 'dynamicSubtitleColumn');
  const show_sparkline = getFd('show_sparkline', 'showSparkline');
  const show_progress_bar = Boolean(getFd('show_progress_bar', 'showProgressBar', false));
  const target_metric = getFd('target_metric', 'targetMetric');
  const badge_content = getFd('badge_content', 'badgeContent');
  const total_metric = getFd('total_metric', 'totalMetric');
  const fdColumns = getFd('columns', 'columns');
  const fdGroupby = getFd('groupby', 'groupby');

  const isComparisonActive = enable_comparison !== false && calculation_mode !== 'none';
  const isDual = isComparisonActive && (calculation_mode === 'dual_metric' || calculation_mode === 'anti_cartesian');
  const isTimeShift = isComparisonActive && calculation_mode === 'time_shift';
  const isAntiCartesian = isComparisonActive && calculation_mode === 'anti_cartesian';

  return buildQueryContext(formData as any, (baseQueryObject: any) => {
    // In dual metric mode, request primary, comparison and any configured extra metrics
    let metrics: any[] = [];
    const titleLow = String(getFd('kpi_title', 'kpiTitle') || getFd('slice_name', 'sliceName') || '').toLowerCase();
    const isPeakOrMin =
      titleLow.includes('picco') ||
      titleLow.includes('peak') ||
      titleLow.includes('minimo') ||
      titleLow.includes('basso') ||
      titleLow.includes('lowest');

    if (isPeakOrMin) {
      metrics = metric ? [metric] : (Array.isArray(fdMetrics) && fdMetrics.length > 0 ? [fdMetrics[0]] : []);
    } else if (Array.isArray(fdMetrics) && fdMetrics.length > 0) {
      metrics = [...fdMetrics];
      if (metric && !metrics.some(m => getMetricLabel(m) === getMetricLabel(metric))) {
        metrics.unshift(metric);
      }
      if (
        isDual &&
        comparison_metric &&
        !metrics.some(m => getMetricLabel(m) === getMetricLabel(comparison_metric))
      ) {
        metrics.push(comparison_metric);
      }
    } else if (isDual) {
      metrics = [metric, comparison_metric].filter(Boolean);
    } else {
      metrics = metric ? [metric] : [];
    }

    if (
      (isComparisonActive || show_progress_bar) &&
      target_metric &&
      !metrics.some(m => getMetricLabel(m) === getMetricLabel(target_metric))
    ) {
      metrics.push(target_metric);
    }
    if (badge_content === 'percent_of_total' && total_metric && !metrics.some(m => getMetricLabel(m) === getMetricLabel(total_metric))) {
      metrics.push(total_metric);
    }

    const rawTimeCol = Array.isArray(time_column) ? time_column[0] : time_column;
    
    // Support modern Superset where groupby/columns can be objects { column_name: 'xxx' }
    const sanitizeColumn = (col: any): any => {
      if (typeof col === 'string') {
        const trimmed = col.trim();
        return trimmed.length > 0 ? trimmed : null;
      }
      if (col && typeof col === 'object' && !Array.isArray(col)) {
        if (typeof col.label === 'string' && col.label.trim()) return col;
        if (typeof col.sqlExpression === 'string' && col.sqlExpression.trim()) return col;
        if (typeof col.column_name === 'string' && col.column_name.trim()) return col.column_name.trim();
      }
      return null;
    };

    const colKey = (col: any): string => {
      if (!col) return '';
      if (typeof col === 'string') return col.trim();
      if (typeof col === 'object') {
        return String(col.label || col.column_name || col.sqlExpression || '').trim();
      }
      return '';
    };

    const validTimeCol = sanitizeColumn(rawTimeCol);
    const isSparklineActive = Boolean(show_sparkline && validTimeCol);

    const baseExtraCols = Array.isArray(fdColumns)
      ? fdColumns
      : Array.isArray(fdGroupby)
      ? fdGroupby
      : [];

    const extraCols = [...baseExtraCols];
    const cleanDynamicCol = sanitizeColumn(dynamic_subtitle_column);
    if (
      cleanDynamicCol &&
      !extraCols.some((c: any) => colKey(sanitizeColumn(c) ?? c) === colKey(cleanDynamicCol))
    ) {
      extraCols.push(cleanDynamicCol);
    }

    // Safely add validTimeCol to rawColumns if not present
    const rawColumns = isSparklineActive && validTimeCol
      ? [validTimeCol, ...extraCols.filter((c: any) => colKey(sanitizeColumn(c) ?? c) !== colKey(validTimeCol))]
      : extraCols;

    const finalColumns = (rawColumns || [])
      .map(sanitizeColumn)
      .filter((c: any) => c !== null);

    const isMultiRow = isSparklineActive || isPeakOrMin || isAntiCartesian;

    // Ensure metrics are non-empty and sanitized
    const sanitizeMetric = (m: any): any => {
      if (typeof m === 'string') {
        const trimmed = m.trim();
        return trimmed.length > 0 ? trimmed : null;
      }
      if (m && typeof m === 'object' && !Array.isArray(m)) {
        if (typeof m.label === 'string' && m.label.trim()) return m;
        if (typeof m.metric_name === 'string' && m.metric_name.trim()) return m.metric_name.trim();
        if (typeof m.sqlExpression === 'string' && m.sqlExpression.trim()) return m;
      }
      return null;
    };

    let cleanMetrics = (metrics || [])
      .map(sanitizeMetric)
      .filter((m: any) => m !== null);

    if (cleanMetrics.length === 0 && metric) {
      const sanitized = sanitizeMetric(metric);
      if (sanitized) cleanMetrics = [sanitized];
    }

    // Clean baseQueryObject.columns to avoid polluted default groupby controls
    const cleanBaseColumns = (Array.isArray(baseQueryObject.columns) ? baseQueryObject.columns : [])
      .map(sanitizeColumn)
      .filter((c: any) => c !== null);

    const seenColKeys = new Set<string>();
    const mergedColumns = [...cleanBaseColumns, ...finalColumns].filter((c: any) => {
      const k = colKey(c);
      if (!k || seenColKeys.has(k)) return false;
      seenColKeys.add(k);
      return true;
    });

    const query: any = {
      ...baseQueryObject,
      columns: mergedColumns,
      metrics: cleanMetrics,
      row_limit: isMultiRow ? 50 : (baseQueryObject.row_limit || 1),
    };

    if (isSparklineActive && validTimeCol) {
      query.orderby = [[validTimeCol, false]];
    }

    // In time shift mode, or when a dashboard PeriodCompare filter is active, apply Superset's native time offset query
    const dashboardTimeCompare = ensureIsArray(
      fd.extra_form_data?.time_compare ||
      baseQueryObject.extra_form_data?.time_compare,
    ).filter(Boolean);
    const hasDashboardCompare = dashboardTimeCompare.length > 0;
    const isComparisonAllowed = enable_comparison !== false && calculation_mode !== 'none';

    // Superset requires an enclosed time_range for time_offsets. If missing or 'No filter', suppress time_offsets to prevent the 'Data error'.
    const timeRangeValue = formData.time_range || baseQueryObject.time_range;
    const isTimeRangeEnclosed = typeof timeRangeValue === 'string' && timeRangeValue !== 'No filter' && timeRangeValue.trim() !== '';

    if (hasDashboardCompare && isComparisonAllowed && !isAntiCartesian) {
      query.time_offsets = dashboardTimeCompare;
    } else if (isTimeShift && time_compare && isTimeRangeEnclosed) {
      query.time_offsets = ensureIsArray(time_compare);
    } else {
      delete query.time_offsets;
    }

    return [query];
  });
}

