/**
 * Does the chart being set up use a Time metric? Read in Explore from what is picked in the Data
 * section, so that the controls of the durations (format, decimals, roll-up) show up only when they
 * matter. It is a hint: the data decide at render time (a column whose values are all times is read as
 * a duration whatever this says), so a wrong answer only hides or shows controls, never changes a chart.
 */
/** True when any metric picked in the Data section looks like a Time field */
export declare function hasTimeMetric(props: {
    controls?: any;
    datasource?: any;
}): boolean;
/**
 * Shows a duration control when the selected metric looks like a Time field OR when
 * the user has already customized this control away from its default value.
 */
export declare const showDurationControl: (name: string, defaultValue: unknown) => (props: {
    controls?: any;
    datasource?: any;
}) => boolean;
//# sourceMappingURL=timeMetricHints.d.ts.map