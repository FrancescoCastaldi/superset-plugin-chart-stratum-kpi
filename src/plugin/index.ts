import { Behavior, ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import example from '../images/example.png';

const metadata = new ChartMetadata({
  name: 'StratumKPI: scheda di confronto e variazione %',
  description:
    'Scheda KPI compatta con confronto nel tempo o tra due metriche, variazione % automatica, indicatore colorato, polarità invertibile (per esempio tempi di attesa o costi) e sparkline facoltativa.',
  behaviors: [Behavior.InteractiveChart],
  category: 'KPI',
  tags: ['Stratum', 'KPI', 'Confronto', 'Variazione', 'Scheda', 'Obiettivo', 'Sanità', 'Andamento'],
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
