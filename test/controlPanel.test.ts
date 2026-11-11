import * as fs from 'fs';
import * as path from 'path';
import config from '../src/plugin/controlPanel';
import transformProps from '../src/plugin/transformProps';

const toCamel = (snake: string) =>
  snake.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());

const allControls = (): Array<{ section: string; name: string; config: any }> => {
  const result: Array<{ section: string; name: string; config: any }> = [];
  for (const section of config.controlPanelSections as any[]) {
    for (const row of section.controlSetRows) {
      for (const item of row) {
        if (item && typeof item === 'object' && item.name && item.config) {
          result.push({ section: section.label, name: item.name, config: item.config });
        }
      }
    }
  }
  return result;
};

const getControl = (controlName: string) => {
  const found = allControls().find(c => c.name === controlName);
  if (!found) {
    throw new Error(`Control ${controlName} not found in controlPanelSections`);
  }
  return found;
};

describe('StratumKPI Italian ControlPanel Config', () => {
  it('uses the ordered Italian sections with only Dati expanded', () => {
    const sections = config.controlPanelSections as any[];
    expect(sections.map(s => s.label)).toEqual([
      'Dati',
      'Confronto tra periodi',
      'Formato dei valori',
      'Aspetto',
      'Sparkline',
      'Interazione',
    ]);
    expect(sections[0].expanded).toBe(true);
    sections.slice(1).forEach(s => {
      expect(s.expanded).toBe(false);
    });
    expect(sections.map(s => s.tabOverride)).toEqual([
      'data',
      'data',
      'customize',
      'customize',
      'customize',
      'customize',
    ]);
    sections.forEach(s => {
      expect(typeof s.description).toBe('string');
      expect(s.description.trim().length).toBeGreaterThan(10);
    });
  });

  it('caps every row at 2 controls, provides non-empty descriptions and avoids emojis', () => {
    const emojiRe = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u;
    (config.controlPanelSections as any[]).forEach(section => {
      expect(section.label).not.toMatch(emojiRe);
      expect(section.description).not.toMatch(emojiRe);
      section.controlSetRows.forEach((row: any[]) => {
        expect(row.length).toBeLessThanOrEqual(2);
      });
    });

    allControls().forEach(({ name, config: ctrl }) => {
      expect(ctrl.label).toBeTruthy();
      expect(String(ctrl.label)).not.toMatch(emojiRe);
      expect(typeof ctrl.description).toBe('string');
      expect(ctrl.description.trim().length).toBeGreaterThan(10);
      expect(String(ctrl.description)).not.toMatch(emojiRe);
      if (Array.isArray(ctrl.choices)) {
        ctrl.choices.forEach((choice: any[]) => {
          expect(String(choice[1])).not.toMatch(emojiRe);
        });
      }
      // Avoid English/misleading "top right" on non-position controls
      if (name === 'badge_content') {
        expect(String(ctrl.label).toLowerCase()).not.toContain('top right');
        expect(String(ctrl.label).toLowerCase()).not.toContain('alto a destra');
      }
      if (name === 'apply_trend_color_to') {
        const badgeChoice = ctrl.choices.find((c: any[]) => c[0] === 'badge');
        expect(String(badgeChoice?.[1]).toLowerCase()).not.toContain('alto a destra');
      }
    });
  });

  it('places locale in Aspetto, time_column in Sparkline after show_sparkline, and show_progress_bar before targets', () => {
    const controls = allControls();
    const localeCtrl = getControl('locale');
    expect(localeCtrl.section).toBe('Aspetto');

    const sparklineControls = controls.filter(c => c.section === 'Sparkline').map(c => c.name);
    expect(sparklineControls[0]).toBe('show_sparkline');
    expect(sparklineControls[1]).toBe('time_column');

    const comparisonControls = controls
      .filter(c => c.section === 'Confronto tra periodi')
      .map(c => c.name);
    const barIdx = comparisonControls.indexOf('show_progress_bar');
    const targetMetricIdx = comparisonControls.indexOf('target_metric');
    const targetStaticIdx = comparisonControls.indexOf('target_static_value');
    expect(barIdx).toBeGreaterThanOrEqual(0);
    expect(targetMetricIdx).toBeGreaterThan(barIdx);
    expect(targetStaticIdx).toBeGreaterThan(barIdx);
  });

  it('uses a single badge-hiding mechanism (show_badge) and excludes "none" from badge_content choices', () => {
    const badgeContent = getControl('badge_content');
    const choiceValues = badgeContent.config.choices.map((c: any[]) => c[0]);
    expect(choiceValues).toEqual(['delta', 'percent_of_total']);
  });

  describe('Progressive Disclosure Visibility Callbacks', () => {
    it('evaluates time_column visibility based on show_sparkline', () => {
      const ctrl = getControl('time_column');
      expect(ctrl.config.visibility({ controls: { show_sparkline: { value: true } } })).toBe(true);
      expect(ctrl.config.visibility({ controls: { show_sparkline: { value: false } } })).toBe(false);
      expect(ctrl.config.visibility({ controls: {} })).toBe(false);
    });

    it('keeps duration controls visible when customized away from default even without a Time metric', () => {
      const fmtCtrl = getControl('time_display_format');
      const decCtrl = getControl('time_fraction_digits');
      expect(
        fmtCtrl.config.visibility({
          controls: { metric: { value: 'Richieste' }, time_display_format: { value: 'auto' } },
        }),
      ).toBe(false);
      expect(
        fmtCtrl.config.visibility({
          controls: { metric: { value: 'Richieste' }, time_display_format: { value: 'hms' } },
        }),
      ).toBe(true);
      expect(
        decCtrl.config.visibility({
          controls: { metric: { value: 'Richieste' }, time_fraction_digits: { value: 2 } },
        }),
      ).toBe(true);
    });

    it('shows target controls when static_target is selected or show_progress_bar is active', () => {
      const targetMetric = getControl('target_metric');
      const targetStatic = getControl('target_static_value');
      [targetMetric, targetStatic].forEach(ctrl => {
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: true }, calculation_mode: { value: 'static_target' } },
          }),
        ).toBe(true);
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: false }, show_progress_bar: { value: true } },
          }),
        ).toBe(true);
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: true }, calculation_mode: { value: 'dual_metric' }, show_progress_bar: { value: false } },
          }),
        ).toBe(false);
      });
    });

    it('evaluates card aesthetics visibility based on clean_card_mode and card_box_shadow', () => {
      const radiusCtrl = getControl('card_border_radius');
      const shadowCtrl = getControl('card_box_shadow');
      const borderColorCtrl = getControl('card_border_color');
      const borderWidthCtrl = getControl('card_border_width');

      expect(radiusCtrl.config.visibility({ controls: { clean_card_mode: { value: false } } })).toBe(true);
      expect(shadowCtrl.config.visibility({ controls: { clean_card_mode: { value: false } } })).toBe(true);
      expect(radiusCtrl.config.visibility({ controls: { clean_card_mode: { value: true } } })).toBe(false);
      expect(shadowCtrl.config.visibility({ controls: { clean_card_mode: { value: true } } })).toBe(false);

      expect(
        borderColorCtrl.config.visibility({
          controls: { clean_card_mode: { value: false }, card_box_shadow: { value: 'bordered' } },
        }),
      ).toBe(true);
      expect(
        borderWidthCtrl.config.visibility({
          controls: { clean_card_mode: { value: false }, card_box_shadow: { value: 'bordered' } },
        }),
      ).toBe(true);
      expect(
        borderColorCtrl.config.visibility({
          controls: { clean_card_mode: { value: false }, card_box_shadow: { value: 'subtle' } },
        }),
      ).toBe(false);
    });

    it('evaluates title typography visibility based on show_title and title_in_chart_header', () => {
      const sizeCtrl = getControl('title_font_size');
      const weightCtrl = getControl('title_font_weight');
      const transformCtrl = getControl('title_text_transform');

      [sizeCtrl, weightCtrl, transformCtrl].forEach(ctrl => {
        expect(
          ctrl.config.visibility({
            controls: { show_title: { value: true }, title_in_chart_header: { value: false } },
          }),
        ).toBe(true);
        expect(
          ctrl.config.visibility({
            controls: { show_title: { value: false }, title_in_chart_header: { value: false } },
          }),
        ).toBe(false);
        expect(
          ctrl.config.visibility({
            controls: { show_title: { value: true }, title_in_chart_header: { value: true } },
          }),
        ).toBe(false);
      });
    });

    it('evaluates comparison_font_size visibility based on enable_comparison', () => {
      const ctrl = getControl('comparison_font_size');
      expect(ctrl.config.visibility({ controls: { enable_comparison: { value: true } } })).toBe(true);
      expect(ctrl.config.visibility({ controls: { enable_comparison: { value: false } } })).toBe(false);
    });

    it('evaluates total_badge_color, badge_position, badge_style and show_absolute_delta visibility', () => {
      const totalColor = getControl('total_badge_color');
      const posCtrl = getControl('badge_position');
      const styleCtrl = getControl('badge_style');
      const absCtrl = getControl('show_absolute_delta');

      expect(
        totalColor.config.visibility({
          controls: { badge_content: { value: 'percent_of_total' }, show_badge: { value: true } },
        }),
      ).toBe(true);
      expect(
        totalColor.config.visibility({
          controls: { badge_content: { value: 'delta' }, show_badge: { value: true } },
        }),
      ).toBe(false);
      expect(
        totalColor.config.visibility({
          controls: { badge_content: { value: 'percent_of_total' }, show_badge: { value: false } },
        }),
      ).toBe(false);

      [posCtrl, styleCtrl].forEach(ctrl => {
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: true }, badge_content: { value: 'delta' }, show_badge: { value: true } },
          }),
        ).toBe(true);
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: false }, badge_content: { value: 'percent_of_total' }, show_badge: { value: true } },
          }),
        ).toBe(true);
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: true }, badge_content: { value: 'delta' }, show_badge: { value: false } },
          }),
        ).toBe(false);
      });

      expect(
        absCtrl.config.visibility({
          controls: { enable_comparison: { value: true }, badge_content: { value: 'delta' }, show_badge: { value: true } },
        }),
      ).toBe(true);
      expect(
        absCtrl.config.visibility({
          controls: { enable_comparison: { value: true }, badge_content: { value: 'percent_of_total' }, show_badge: { value: true } },
        }),
      ).toBe(false);
      expect(
        absCtrl.config.visibility({
          controls: { enable_comparison: { value: false }, badge_content: { value: 'delta' }, show_badge: { value: true } },
        }),
      ).toBe(false);
    });

    it('evaluates click_target and sparkline styling visibility', () => {
      const targetCtrl = getControl('click_target');
      expect(targetCtrl.config.visibility({ controls: { click_url: { value: '/dashboard/123' } } })).toBe(true);
      expect(targetCtrl.config.visibility({ controls: { click_url: { value: '   ' } } })).toBe(false);

      ['sparkline_color', 'sparkline_fill', 'sparkline_curve', 'sparkline_show_points'].forEach(name => {
        const ctrl = getControl(name);
        expect(ctrl.config.visibility({ controls: { show_sparkline: { value: true } } })).toBe(true);
        expect(ctrl.config.visibility({ controls: { show_sparkline: { value: false } } })).toBe(false);
      });
    });
  });

  describe('Wiring and default parity', () => {
    it('ensures every control in controlPanel.tsx is read by buildQuery.ts or transformProps.ts', () => {
      const root = path.resolve(__dirname, '..');
      const runtimeSource =
        fs.readFileSync(path.join(root, 'src/plugin/transformProps.ts'), 'utf8') +
        '\n' +
        fs.readFileSync(path.join(root, 'src/plugin/buildQuery.ts'), 'utf8');

      const frameworkManaged = new Set(['adhoc_filters', 'time_range']);
      const controls = allControls().filter(c => !frameworkManaged.has(c.name));
      expect(controls.length).toBeGreaterThan(40);

      controls.forEach(({ name }) => {
        const camel = toCamel(name);
        const referenced = runtimeSource.includes(name) || runtimeSource.includes(camel);
        expect({ name, referenced }).toEqual({ name, referenced: true });
      });
    });

    it('keeps panel defaults aligned with transformProps defaults (including card_bg_color, number_format, kpi_font_size_manual)', () => {
      const panelDefaults: Record<string, any> = {};
      allControls().forEach(({ name, config: ctrl }) => {
        if ('default' in ctrl) {
          panelDefaults[name] = ctrl.default;
        }
      });

      expect(panelDefaults.card_bg_color).toEqual({ r: 255, g: 255, b: 255, a: 0 });
      expect(panelDefaults.number_format).toBe('SMART_NUMBER');
      expect(panelDefaults.kpi_font_size_manual).toBe(36);
      expect(typeof panelDefaults.kpi_font_size_manual).toBe('number');

      const rows = [{ metric: 1200, metric_conf: 1000 }];
      const fromDefaults = transformProps({
        width: 320,
        height: 160,
        formData: { metric: 'metric', comparison_metric: 'metric_conf', ...panelDefaults },
        rawFormData: {},
        queriesData: [{ data: rows }],
      } as any);
      const fromOmitted = transformProps({
        width: 320,
        height: 160,
        formData: { metric: 'metric', comparison_metric: 'metric_conf' },
        rawFormData: {},
        queriesData: [{ data: rows }],
      } as any);

      // Normalize color representation equivalence (#2563eb === rgba(37, 99, 235, 1))
      const normalizeColor = (v: string) =>
        v.toLowerCase() === 'rgba(37, 99, 235, 1)' ? '#2563eb' : v;

      expect({ ...fromDefaults, sparklineColor: normalizeColor(fromDefaults.sparklineColor) }).toEqual(
        { ...fromOmitted, sparklineColor: normalizeColor(fromOmitted.sparklineColor) },
      );
    });
  });
});
