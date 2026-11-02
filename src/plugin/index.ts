import { Behavior, ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import example from '../images/example.png';

const t = (str: string) => str;

const metadata = new ChartMetadata({
  name: t('StratumKPI: Comparison Card & Delta %'),
  description: t(
    'All-in-one compact KPI card with time comparison or dual metric, automatic Delta % calculation, colored semantic indicator, polarity inversion (e.g. waiting times or costs) and an optional sparkline.',
  ),
  behaviors: [Behavior.InteractiveChart],
  category: t('KPI'),
  tags: [
    t('Stratum'),
    t('KPI'),
    t('Comparison'),
    t('Delta'),
    t('Card'),
    t('Benchmark'),
    t('Healthcare'),
    t('Trend'),
  ],
  credits: ['Francesco Castaldi'],
  exampleGallery: [{ url: example }],
  thumbnail,
});

export default class KPIComparisonChartPlugin extends ChartPlugin {
  constructor() {
    super({
      buildQuery: buildQuery as any,
      controlPanel,
      loadChart: () => import('../components/KPIComparisonChart'),
      metadata,
      transformProps: transformProps as any,
    });
  }
}
