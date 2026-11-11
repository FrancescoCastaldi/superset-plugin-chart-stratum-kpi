import config from '../src/plugin/controlPanel';

describe('KPI Comparison Explore ControlPanel Config', () => {
  it('should export valid ControlPanelConfig with all required sections', () => {
    expect(config).toBeDefined();
    expect(config.controlPanelSections).toBeInstanceOf(Array);

    const sectionLabels = config.controlPanelSections.map((s: any) => s.label);
    expect(sectionLabels).toContain('Time filters');
    expect(sectionLabels).toContain('Metrics & comparison');
    expect(sectionLabels).toContain('Card aesthetics');
    expect(sectionLabels).toContain('Typography & text styling');
    expect(sectionLabels).toContain('Delta % & semantic polarity');
    expect(sectionLabels).toContain('Trendline / Sparkline');
  });

  it('should include typography controls for font family, size mode and weight', () => {
    const typoSection = config.controlPanelSections.find(
      (s: any) => s.label === 'Typography & text styling',
    );
    expect(typoSection).toBeDefined();

    const controlNames: string[] = [];
    typoSection.controlSetRows.forEach((row: any[]) => {
      row.forEach((ctrl: any) => {
        if (ctrl && ctrl.name) controlNames.push(ctrl.name);
      });
    });

    expect(controlNames).toContain('kpi_font_family');
    expect(controlNames).toContain('kpi_font_size_mode');
    expect(controlNames).toContain('kpi_font_weight');
    expect(controlNames).toContain('kpi_letter_spacing');
    expect(controlNames).toContain('kpi_tabular_nums');
    expect(controlNames).toContain('title_font_size');
    expect(controlNames).toContain('title_font_weight');
  });

  it('should configure tabOverride correctly on all 8 sections', () => {
    const sections = config.controlPanelSections;
    expect(sections).toHaveLength(8);

    const dataSections = sections.filter((s: any) => s.tabOverride === 'data');
    const customizeSections = sections.filter((s: any) => s.tabOverride === 'customize');

    expect(dataSections.map((s: any) => s.label)).toEqual([
      'Time filters',
      'Metrics & comparison',
    ]);
    expect(customizeSections.map((s: any) => s.label)).toEqual([
      'Card appearance & display',
      'Card aesthetics',
      'Typography & text styling',
      'Delta % & semantic polarity',
      'Interactivity & drill-through',
      'Trendline / Sparkline',
    ]);
  });

  it('should relocate total_badge_color to Delta % & semantic polarity section in Customize tab', () => {
    const metricsSection = config.controlPanelSections.find(
      (s: any) => s.label === 'Metrics & comparison',
    );
    const deltaSection = config.controlPanelSections.find(
      (s: any) => s.label === 'Delta % & semantic polarity',
    );

    const metricsControls: string[] = [];
    metricsSection.controlSetRows.forEach((row: any[]) => {
      row.forEach((ctrl: any) => {
        if (ctrl && ctrl.name) metricsControls.push(ctrl.name);
      });
    });
    expect(metricsControls).not.toContain('total_badge_color');

    const deltaControls: string[] = [];
    deltaSection.controlSetRows.forEach((row: any[]) => {
      row.forEach((ctrl: any) => {
        if (ctrl && ctrl.name) deltaControls.push(ctrl.name);
      });
    });
    expect(deltaControls).toContain('total_badge_color');
  });

  const getControl = (controlName: string) => {
    for (const section of config.controlPanelSections) {
      for (const row of section.controlSetRows) {
        for (const ctrl of row) {
          if (ctrl && ctrl.name === controlName) {
            return ctrl;
          }
        }
      }
    }
    throw new Error(`Control ${controlName} not found in controlPanelSections`);
  };

  describe('Progressive Disclosure Visibility Callbacks', () => {
    it('evaluates time_column visibility based on show_sparkline', () => {
      const ctrl = getControl('time_column');
      expect(ctrl.config.visibility).toBeDefined();

      expect(ctrl.config.visibility({ controls: { show_sparkline: { value: true } } })).toBe(true);
      expect(ctrl.config.visibility({ controls: { show_sparkline: { value: false } } })).toBe(false);
      expect(ctrl.config.visibility({ controls: {} })).toBe(false);
    });

    it('evaluates card aesthetics visibility based on clean_card_mode and card_box_shadow', () => {
      const radiusCtrl = getControl('card_border_radius');
      const shadowCtrl = getControl('card_box_shadow');
      const borderColorCtrl = getControl('card_border_color');
      const borderWidthCtrl = getControl('card_border_width');

      expect(radiusCtrl.config.visibility).toBeDefined();
      expect(shadowCtrl.config.visibility).toBeDefined();
      expect(borderColorCtrl.config.visibility).toBeDefined();
      expect(borderWidthCtrl.config.visibility).toBeDefined();

      // When clean_card_mode is false
      expect(radiusCtrl.config.visibility({ controls: { clean_card_mode: { value: false } } })).toBe(true);
      expect(shadowCtrl.config.visibility({ controls: { clean_card_mode: { value: false } } })).toBe(true);

      // When clean_card_mode is true
      expect(radiusCtrl.config.visibility({ controls: { clean_card_mode: { value: true } } })).toBe(false);
      expect(shadowCtrl.config.visibility({ controls: { clean_card_mode: { value: true } } })).toBe(false);

      // Border color and width require clean_card_mode false AND card_box_shadow === 'bordered'
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

      // Border color and width hidden when shadow is not 'bordered'
      expect(
        borderColorCtrl.config.visibility({
          controls: { clean_card_mode: { value: false }, card_box_shadow: { value: 'subtle' } },
        }),
      ).toBe(false);
      // Border color and width hidden when clean_card_mode is true even if shadow is 'bordered'
      expect(
        borderColorCtrl.config.visibility({
          controls: { clean_card_mode: { value: true }, card_box_shadow: { value: 'bordered' } },
        }),
      ).toBe(false);
    });

    it('evaluates title typography controls visibility based on show_title and title_in_chart_header', () => {
      const sizeCtrl = getControl('title_font_size');
      const weightCtrl = getControl('title_font_weight');
      const transformCtrl = getControl('title_text_transform');

      [sizeCtrl, weightCtrl, transformCtrl].forEach(ctrl => {
        expect(ctrl.config.visibility).toBeDefined();
        // Visible when show_title is true and title_in_chart_header is false
        expect(
          ctrl.config.visibility({
            controls: { show_title: { value: true }, title_in_chart_header: { value: false } },
          }),
        ).toBe(true);

        // Hidden when show_title is false
        expect(
          ctrl.config.visibility({
            controls: { show_title: { value: false }, title_in_chart_header: { value: false } },
          }),
        ).toBe(false);

        // Hidden when title_in_chart_header is true
        expect(
          ctrl.config.visibility({
            controls: { show_title: { value: true }, title_in_chart_header: { value: true } },
          }),
        ).toBe(false);
      });
    });

    it('evaluates comparison_font_size visibility based on enable_comparison', () => {
      const ctrl = getControl('comparison_font_size');
      expect(ctrl.config.visibility).toBeDefined();

      expect(ctrl.config.visibility({ controls: { enable_comparison: { value: true } } })).toBe(true);
      expect(ctrl.config.visibility({ controls: { enable_comparison: { value: false } } })).toBe(false);
      expect(ctrl.config.visibility({ controls: {} })).toBe(false);
    });

    it('evaluates total_badge_color visibility', () => {
      const ctrl = getControl('total_badge_color');
      expect(ctrl.config.visibility).toBeDefined();

      expect(
        ctrl.config.visibility({
          controls: { badge_content: { value: 'percent_of_total' }, show_badge: { value: true } },
        }),
      ).toBe(true);

      // Hidden if badge_content is not percent_of_total
      expect(
        ctrl.config.visibility({
          controls: { badge_content: { value: 'delta' }, show_badge: { value: true } },
        }),
      ).toBe(false);

      // Hidden if show_badge is false
      expect(
        ctrl.config.visibility({
          controls: { badge_content: { value: 'percent_of_total' }, show_badge: { value: false } },
        }),
      ).toBe(false);
    });

    it('evaluates badge_position and badge_style visibility', () => {
      const posCtrl = getControl('badge_position');
      const styleCtrl = getControl('badge_style');

      [posCtrl, styleCtrl].forEach(ctrl => {
        expect(ctrl.config.visibility).toBeDefined();

        // Visible with enable_comparison
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: true }, badge_content: { value: 'delta' }, show_badge: { value: true } },
          }),
        ).toBe(true);

        // Visible with percent_of_total even if enable_comparison is false
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: false }, badge_content: { value: 'percent_of_total' }, show_badge: { value: true } },
          }),
        ).toBe(true);

        // Hidden when badge_content is 'none'
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: true }, badge_content: { value: 'none' }, show_badge: { value: true } },
          }),
        ).toBe(false);

        // Hidden when show_badge is false
        expect(
          ctrl.config.visibility({
            controls: { enable_comparison: { value: true }, badge_content: { value: 'delta' }, show_badge: { value: false } },
          }),
        ).toBe(false);
      });
    });

    it('evaluates show_absolute_delta visibility', () => {
      const ctrl = getControl('show_absolute_delta');
      expect(ctrl.config.visibility).toBeDefined();

      // Visible when enable_comparison is true, badge_content is delta, show_badge is true
      expect(
        ctrl.config.visibility({
          controls: { enable_comparison: { value: true }, badge_content: { value: 'delta' }, show_badge: { value: true } },
        }),
      ).toBe(true);

      // Hidden when badge_content is percent_of_total
      expect(
        ctrl.config.visibility({
          controls: { enable_comparison: { value: true }, badge_content: { value: 'percent_of_total' }, show_badge: { value: true } },
        }),
      ).toBe(false);

      // Hidden when badge_content is none
      expect(
        ctrl.config.visibility({
          controls: { enable_comparison: { value: true }, badge_content: { value: 'none' }, show_badge: { value: true } },
        }),
      ).toBe(false);

      // Hidden when enable_comparison is false
      expect(
        ctrl.config.visibility({
          controls: { enable_comparison: { value: false }, badge_content: { value: 'delta' }, show_badge: { value: true } },
        }),
      ).toBe(false);

      // Hidden when show_badge is false
      expect(
        ctrl.config.visibility({
          controls: { enable_comparison: { value: true }, badge_content: { value: 'delta' }, show_badge: { value: false } },
        }),
      ).toBe(false);
    });

    it('evaluates click_target visibility based on click_url', () => {
      const ctrl = getControl('click_target');
      expect(ctrl.config.visibility).toBeDefined();

      expect(ctrl.config.visibility({ controls: { click_url: { value: '/dashboard/123' } } })).toBe(true);
      expect(ctrl.config.visibility({ controls: { click_url: { value: '' } } })).toBe(false);
      expect(ctrl.config.visibility({ controls: { click_url: { value: '   ' } } })).toBe(false);
      expect(ctrl.config.visibility({ controls: { click_url: { value: null } } })).toBe(false);
      expect(ctrl.config.visibility({ controls: {} })).toBe(false);
    });

    it('evaluates sparkline controls visibility based on show_sparkline', () => {
      const colorCtrl = getControl('sparkline_color');
      const fillCtrl = getControl('sparkline_fill');
      const curveCtrl = getControl('sparkline_curve');
      const pointsCtrl = getControl('sparkline_show_points');

      [colorCtrl, fillCtrl, curveCtrl, pointsCtrl].forEach(ctrl => {
        expect(ctrl.config.visibility).toBeDefined();
        expect(ctrl.config.visibility({ controls: { show_sparkline: { value: true } } })).toBe(true);
        expect(ctrl.config.visibility({ controls: { show_sparkline: { value: false } } })).toBe(false);
        expect(ctrl.config.visibility({ controls: {} })).toBe(false);
      });
    });
  });
});
