import {
  ControlPanelConfig,
  sharedControls,
} from '@superset-ui/chart-controls';

const t = (str: string) => str;

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Time filters'),
      expanded: true,
      tabOverride: 'data',
      controlSetRows: [
        [
          {
            name: 'time_range',
            config: {
              ...sharedControls.time_range,
              label: t('Filtro Temporale (Range)'),
              description: t('Closed analysis period (start and end).'),
              clearable: true,
              validators: [],
            },
          },
        ],
      ],
    },
    {
      label: t('Metrics & comparison'),
      expanded: true,
      tabOverride: 'data',
      controlSetRows: [
        [
          {
            name: 'enable_comparison',
            config: {
              type: 'CheckboxControl',
              label: t('Enable comparison / Delta %'),
              default: true,
              description: t(
                'Enable the comparison with a second metric, a fixed target or a time period. When disabled, the card shows only the main KPI in a clean single mode.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'calculation_mode',
            config: {
              type: 'SelectControl',
              label: t('Comparison calculation mode'),
              default: 'dual_metric',
              choices: [
                ['dual_metric', t('Explicit dual metric (dataset/SQL)')],
                ['anti_cartesian', t('Anti-Cartesian (reference vs comparison periods)')],
                ['static_target', t('Fixed target value (numeric goal)')],
                ['time_shift', t('Time shift (Superset time offset)')],
              ],
              description: t(
                'Choose whether to compare two explicit columns or metrics already aggregated in the dataset, set a fixed target, or compute an automatic time offset.',
              ),
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              label: t('Main metric'),
              description: t('The primary metric shown in large text on the card.'),
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'comparison_metric',
            config: {
              ...sharedControls.metric,
              validators: [],
              clearable: true,
              clear_on_hide: true,
              label: t('Comparison metric (optional)'),
              description: t(
                'The benchmark metric to compare with (e.g. previous month, previous year, budget). Leave empty if not needed.',
              ),
              visibility: ({ controls }) =>
                Boolean(controls?.enable_comparison?.value) &&
                (!controls?.calculation_mode?.value ||
                  controls?.calculation_mode?.value === 'dual_metric' ||
                  controls?.calculation_mode?.value === 'anti_cartesian'),
            },
          },
        ],
        [
          {
            name: 'time_compare',
            config: {
              type: 'SelectControl',
              label: t('Time offset (time shift)'),
              default: '1 year ago',
              choices: [
                ['1 year ago', t('1 year ago (same period, previous year)')],
                ['1 month ago', t('1 month ago (same period, previous month)')],
                ['1 week ago', t('1 week ago')],
                ['28 days ago', t('28 days ago (4 weeks ago)')],
              ],
              description: t('Past time period to compare the current value with.'),
              clearable: true,
              clear_on_hide: true,
              visibility: ({ controls }) =>
                Boolean(controls?.enable_comparison?.value) &&
                controls?.calculation_mode?.value === 'time_shift',
            },
          },
        ],
        [
          {
            name: 'comparison_label',
            config: {
              type: 'TextControl',
              label: t('Comparison period label'),
              default: 'vs previous period',
              description: t(
                'Descriptive text shown next to the comparison value (e.g. "vs previous month"). Supports the placeholders {comp_month} or {mese_prec}, or automatic resolution.',
              ),
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
        [
          {
            name: 'locale',
            config: {
              type: 'SelectControl',
              label: t('Language of generated texts'),
              description: t(
                'Language of the month names, the period subtitle and the automatic comparison labels. Texts you type yourself are never translated.',
              ),
              default: 'en',
              clearable: false,
              renderTrigger: true,
              choices: [
                ['en', 'English'],
                ['it', 'Italiano'],
              ],
            },
          },
        ],
        [
          {
            name: 'time_column',
            config: {
              ...sharedControls.groupby,
              label: t('Time column (optional, for the sparkline)'),
              description: t('Time column used to sort and plot the sparkline.'),
              multi: false,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
        ],
        [
          {
            name: 'target_metric',
            config: {
              ...sharedControls.metric,
              validators: [],
              clearable: true,
              clear_on_hide: true,
              label: t('Target metric (dynamic)'),
              description: t('Select a metric to compute the target dynamically. When set, it overrides the fixed value.'),
              visibility: ({ controls }) =>
                Boolean(controls?.enable_comparison?.value) &&
                (controls?.calculation_mode?.value === 'static_target' || Boolean(controls?.show_progress_bar?.value)),
            },
          },
        ],
        [
          {
            name: 'target_static_value',
            config: {
              type: 'TextControl',
              label: t('Fixed target value (optional)'),
              default: '',
              clear_on_hide: true,
              description: t('Enter a fixed number as the goal (e.g. 150000). It is used when no target metric is set.'),
              renderTrigger: true,
              visibility: ({ controls }) =>
                Boolean(controls?.enable_comparison?.value) &&
                (controls?.calculation_mode?.value === 'static_target' || Boolean(controls?.show_progress_bar?.value)),
            },
          },
        ],
        [
          {
            name: 'show_progress_bar',
            config: {
              type: 'CheckboxControl',
              label: t('Show goal progress bar'),
              default: false,
              description: t('Shows a thin line at the bottom indicating the percentage of the target reached.'),
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
        [
          {
            name: 'badge_content',
            config: {
              type: 'SelectControl',
              label: t('Badge content (top right)'),
              default: 'delta',
              choices: [
                ['delta', t('Delta vs previous period')],
                ['percent_of_total', t('% of total')],
                ['none', t('No badge')],
              ],
              description: t('What to show in the colored badge at the top right.'),
              renderTrigger: true,
              clearable: false,
            },
          },
        ],
        [
          {
            name: 'total_metric',
            config: {
              ...sharedControls.metric,
              validators: [],
              clearable: true,
              clear_on_hide: true,
              label: t('Total metric'),
              description: t('Metric used as the denominator for the percentage (e.g. SUM(value) OVER() or a custom metric).'),
              visibility: ({ controls }) => controls?.badge_content?.value === 'percent_of_total',
            },
          },
        ],
        ['adhoc_filters'],
      ],
    },
    {
      label: t('Card appearance & display'),
      expanded: false,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'show_title',
            config: {
              type: 'CheckboxControl',
              label: t('Show top title'),
              default: true,
              description: t(
                'Shows or hides the text label above the main numeric value.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'kpi_title',
            config: {
              type: 'TextControl',
              label: t('KPI title'),
              default: '',
              description: t(
                'Highlighted title above the numeric value. Supports dynamic placeholders: {month} / {mese} and {period} / {periodo}, or automatic resolution from data and filters.',
              ),
              renderTrigger: true,
              visibility: ({ controls }) => controls?.show_title?.value !== false,
            },
          },
        ],
        [
          {
            name: 'title_in_chart_header',
            config: {
              type: 'CheckboxControl',
              label: t('Title in the chart header'),
              default: false,
              description: t(
                'On dashboards, writes the KPI title (with the dynamic month) in the chart header instead of the fixed name, and removes the title inside the card so it is not repeated twice.',
              ),
              renderTrigger: true,
              visibility: ({ controls }) => controls?.show_title?.value !== false,
            },
          },
        ],
        [
          {
            name: 'kpi_subtitle',
            config: {
              type: 'TextControl',
              label: t('Subtitle / detail'),
              default: '',
              description: t(
                'Optional caption under the title. Supports the dynamic placeholders {month}, {period} and {dynamic}.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'dynamic_subtitle_column',
            config: {
              ...sharedControls.groupby,
              label: t('Dynamic subtitle column'),
              description: t(
                'Choose a dataset column to extract the subtitle value (e.g. "September 2026"). Use {dynamic} in the title or subtitle to place it.',
              ),
              multi: false,
            },
          },
        ],

        [
          {
            name: 'card_alignment',
            config: {
              type: 'SelectControl',
              label: t('Content alignment'),
              default: 'left',
              choices: [
                ['left', t('Align left')],
                ['center', t('Centrato')],
                ['right', t('Align right')],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'prefix_value',
            config: {
              type: 'TextControl',
              label: t('Value prefix (e.g. €)'),
              default: '',
              renderTrigger: true,
            },
          },
          {
            name: 'suffix_value',
            config: {
              type: 'TextControl',
              label: t('Value suffix (e.g. %, days)'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'number_format',
            config: {
              ...sharedControls.y_axis_format,
              label: t('Number format'),
              default: 'SMART_NUMBER',
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Card aesthetics'),
      expanded: false,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'clean_card_mode',
            config: {
              type: 'CheckboxControl',
              label: t('Clean card mode (no box-in-box)'),
              default: false,
              description: t(
                'Removes inner padding, borders and redundant shadows so the card blends into standard Superset boxes.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'card_bg_color',
            config: {
              type: 'ColorPickerControl',
              label: t('Card background color'),
              default: { r: 255, g: 255, b: 255, a: 1 },
              description: t(
                'Background color of the KPI card. Lower the alpha to 0 for a transparent background.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'card_border_radius',
            config: {
              type: 'SelectControl',
              label: t('Card border and radius style'),
              default: 'square',
              choices: [
                ['square', t('Squadrato (0px)')],
                ['subtle', t('Morbido (8px)')],
                ['rounded', t('Arrotondato (14px)')],
                ['pill', t('Pill')],
              ],
              description: t('Corner radius of the card.'),
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) => !controls?.clean_card_mode?.value,
            },
          },
        ],
        [
          {
            name: 'card_box_shadow',
            config: {
              type: 'SelectControl',
              label: t('Card shadow / border'),
              default: 'none',
              choices: [
                ['none', t('None')],
                ['subtle', t('Light shadow')],
                ['elevated', t('Strong shadow')],
                ['bordered', t('Thin border')],
              ],
              description: t('Elevation and shadow style of the card.'),
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) => !controls?.clean_card_mode?.value,
            },
          },
        ],
        [
          {
            name: 'card_border_color',
            config: {
              type: 'TextControl',
              label: t('Custom border color (e.g. #e2e8f0)'),
              default: '',
              renderTrigger: true,
              visibility: ({ controls }) =>
                !controls?.clean_card_mode?.value &&
                controls?.card_box_shadow?.value === 'bordered',
            },
          },
          {
            name: 'card_border_width',
            config: {
              type: 'SelectControl',
              label: t('Border width'),
              default: 1,
              choices: [
                [1, t('1 pixel (thin)')],
                [2, t('2 pixels (medium)')],
                [3, t('3 pixel (Evidente)')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) =>
                !controls?.clean_card_mode?.value &&
                controls?.card_box_shadow?.value === 'bordered',
            },
          },
        ],
      ],
    },
    {
      label: t('Typography & text styling'),
      expanded: false,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'kpi_font_family',
            config: {
              type: 'SelectControl',
              label: t('Font family'),
              default: '',
              choices: [
                ['', t('Predefinito di Sistema (UI Nativo)')],
                ['Inter', t('Inter (Pulito & Moderno)')],
                ['Roboto', t('Roboto (Material Design)')],
                ['Montserrat', t('Montserrat (Geometrico)')],
                ['Poppins', t('Poppins (Arrotondato Morbido)')],
                ['Oswald', t('Oswald (Condensato Impatto)')],
                ['JetBrains Mono', t('JetBrains Mono (Monospace Tech)')],
                ['Fira Code', t('Fira Code (Tabular Dev)')],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'kpi_font_size_mode',
            config: {
              type: 'SelectControl',
              label: t('Main value size mode'),
              default: 'auto',
              choices: [
                ['auto', t('Dynamic auto-fit (recommended, scales with the card)')],
                ['small', t('Small (24px)')],
                ['medium', t('Medium (36px)')],
                ['large', t('Large (48px)')],
                ['xlarge', t('Extra large (64px)')],
                ['manual', t('Personalizzato in Pixel (px)')],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
          {
            name: 'kpi_font_size_manual',
            config: {
              type: 'TextControl',
              label: t('Manual size (px)'),
              default: '36',
              description: t('Font size in pixels (e.g. 24, 36, 48, 64).'),
              renderTrigger: true,
              visibility: ({ controls }) => controls?.kpi_font_size_mode?.value === 'manual',
            },
          },
        ],
        [
          {
            name: 'kpi_font_weight',
            config: {
              type: 'SelectControl',
              label: t('Main value font weight (bold)'),
              default: '800',
              choices: [
                ['300', t('Light (300)')],
                ['400', t('Regular (400)')],
                ['500', t('Medium (500)')],
                ['600', t('Semigrassetto / Semi-Bold (600)')],
                ['700', t('Bold (700)')],
                ['800', t('Extra-Bold (800 - Default)')],
                ['900', t('Black (900)')],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
          {
            name: 'kpi_letter_spacing',
            config: {
              type: 'SelectControl',
              label: t('Value letter spacing'),
              default: 'tight',
              choices: [
                ['tight', t('Stretta (-0.025em)')],
                ['normal', t('Normal (0em)')],
                ['wide', t('Wide (+0.04em)')],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'kpi_tabular_nums',
            config: {
              type: 'CheckboxControl',
              label: t('Tabular numeric alignment (tabular-nums)'),
              default: true,
              description: t('Gives all digits the same width to prevent jitter.'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'title_font_size',
            config: {
              type: 'SelectControl',
              label: t('Title size'),
              default: 'auto',
              choices: [
                ['auto', t('Scalato Dinamico')],
                ['small', t('Compact (11px)')],
                ['medium', t('Medium (13px)')],
                ['large', t('Large (15px)')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) =>
                controls?.show_title?.value !== false &&
                !controls?.title_in_chart_header?.value,
            },
          },
          {
            name: 'title_font_weight',
            config: {
              type: 'SelectControl',
              label: t('Title font weight'),
              default: '600',
              choices: [
                ['400', t('Regular (400)')],
                ['500', t('Medium (500)')],
                ['600', t('Semigrassetto (600)')],
                ['700', t('Bold (700)')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) =>
                controls?.show_title?.value !== false &&
                !controls?.title_in_chart_header?.value,
            },
          },
        ],
        [
          {
            name: 'title_text_transform',
            config: {
              type: 'SelectControl',
              label: t('Title text transform'),
              default: 'uppercase',
              choices: [
                ['uppercase', t('All caps (UPPERCASE)')],
                ['capitalize', t('Iniziali Maiuscole (Capitalize)')],
                ['none', t('As entered (none)')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) =>
                controls?.show_title?.value !== false &&
                !controls?.title_in_chart_header?.value,
            },
          },
          {
            name: 'comparison_font_size',
            config: {
              type: 'SelectControl',
              label: t('Comparison row size'),
              default: 'small',
              choices: [
                ['small', t('Compact')],
                ['medium', t('Medium')],
                ['large', t('Large')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
      ],
    },
    {
      label: t('Delta % & semantic polarity'),
      expanded: false,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'invert_polarity',
            config: {
              type: 'CheckboxControl',
              label: t('Invert color polarity (lower is better)'),
              default: false,
              description: t(
                'When on, a percentage decrease shows GREEN (positive) and an increase shows RED (negative). Ideal for waiting times, cancellation rates and costs.',
              ),
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
        [
          {
            name: 'show_badge',
            config: {
              type: 'CheckboxControl',
              label: t('Show delta % / percentage badge'),
              default: true,
              description: t(
                'Shows or hides the colored badge with the comparison percentage or the percentage of total.',
              ),
              renderTrigger: true,
              visibility: ({ controls }) =>
                Boolean(controls?.enable_comparison?.value) ||
                controls?.badge_content?.value === 'percent_of_total',
            },
          },
        ],
        [
          {
            name: 'badge_position',
            config: {
              type: 'SelectControl',
              label: t('Delta badge position'),
              default: 'bottom_left',
              choices: [
                ['bottom_left', t('Bottom, with comparison (default)')],
                ['inline_right', t('Beside the main value')],
                ['top_right', t('Top right')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) =>
                (Boolean(controls?.enable_comparison?.value) ||
                  controls?.badge_content?.value === 'percent_of_total') &&
                controls?.badge_content?.value !== 'none' &&
                controls?.show_badge?.value !== false,
            },
          },
        ],
        [
          {
            name: 'badge_style',
            config: {
              type: 'SelectControl',
              label: t('Delta badge style'),
              default: 'pill',
              choices: [
                ['pill', t('Rounded pill (prominent)')],
                ['full', t('Riquadro Morbido')],
                ['subtle', t('Minimal text')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) =>
                (Boolean(controls?.enable_comparison?.value) ||
                  controls?.badge_content?.value === 'percent_of_total') &&
                controls?.badge_content?.value !== 'none' &&
                controls?.show_badge?.value !== false,
            },
          },
        ],
        [
          {
            name: 'total_badge_color',
            config: {
              type: 'ColorPickerControl',
              label: t('Total badge background color'),
              default: { r: 99, g: 102, b: 241, a: 1 }, // Indigo 500
              description: t('Color for the percentage-of-total badge.'),
              renderTrigger: true,
              visibility: ({ controls }) =>
                controls?.badge_content?.value === 'percent_of_total' &&
                controls?.show_badge?.value !== false,
            },
          },
        ],
        [
          {
            name: 'show_comparison_value',
            config: {
              type: 'CheckboxControl',
              label: t('Show comparison numeric value'),
              default: true,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
          {
            name: 'show_comparison_label',
            config: {
              type: 'CheckboxControl',
              label: t('Show comparison text label'),
              default: true,
              description: t(
                'Shows or hides the descriptive comparison text (e.g. "vs previous month").',
              ),
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
        [
          {
            name: 'show_absolute_delta',
            config: {
              type: 'CheckboxControl',
              label: t('Show absolute delta in brackets'),
              default: true,
              renderTrigger: true,
              visibility: ({ controls }) =>
                Boolean(controls?.enable_comparison?.value) &&
                controls?.badge_content?.value !== 'percent_of_total' &&
                controls?.badge_content?.value !== 'none' &&
                controls?.show_badge?.value !== false,
            },
          },
        ],
        [
          {
            name: 'wrap_bottom_content',
            config: {
              type: 'CheckboxControl',
              label: t('Wrap comparison text'),
              default: true,
              description: t(
                'Lets the comparison text (previous month with year and value) wrap neatly when there is not enough horizontal space, instead of being cut off.',
              ),
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
        [
          {
            name: 'apply_trend_color_to',
            config: {
              type: 'SelectControl',
              label: t('Apply trend color to:'),
              default: 'badge',
              choices: [
                ['badge', t('Badge only (top right)')],
                ['text', t('Main value text')],
                ['background', t('Whole card background (gradient)')],
              ],
              description: t("Determina dove applicare l'evidenziazione visiva semantica (Verde/Rosso)."),
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.enable_comparison?.value),
            },
          },
        ],
      ],
    },
    {
      label: t('Interactivity & drill-through'),
      expanded: false,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'click_url',
            config: {
              type: 'TextControl',
              label: t('Navigation URL (drill-through)'),
              default: '',
              description: t('Enter a link (e.g. /superset/dashboard/123). Makes the whole card clickable.'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'click_target',
            config: {
              type: 'SelectControl',
              label: t('Link behaviour'),
              default: '_self',
              choices: [
                ['_self', t('Open in the same window')],
                ['_blank', t('Open in a new tab')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) =>
                Boolean(controls?.click_url?.value && String(controls.click_url.value).trim()),
            },
          },
        ],
      ],
    },
    {
      label: t('Trendline / Sparkline'),
      expanded: false,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'show_sparkline',
            config: {
              type: 'CheckboxControl',
              label: t('Show micro sparkline at the bottom'),
              default: false,
              description: t('Shows a trend line over time at the base of the card.'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'sparkline_color',
            config: {
              type: 'ColorPickerControl',
              label: t('Sparkline color'),
              default: { r: 37, g: 99, b: 235, a: 1 },
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
          {
            name: 'sparkline_fill',
            config: {
              type: 'CheckboxControl',
              label: t('Fill gradient'),
              default: true,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
        ],
        [
          {
            name: 'sparkline_curve',
            config: {
              type: 'SelectControl',
              label: t('Sparkline curve style'),
              default: 'smooth',
              choices: [
                ['smooth', t('Curva Morbida Spline (Bezier)')],
                ['linear', t('Lineare Poligonale Standard')],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
          {
            name: 'sparkline_show_points',
            config: {
              type: 'CheckboxControl',
              label: t('Highlight peak and current value'),
              default: false,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
