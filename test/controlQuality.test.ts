import config from '../src/plugin/controlPanel';

interface Control {
  name: string;
  config: Record<string, any>;
}

const controls: Control[] = (config.controlPanelSections as any[])
  .flatMap(section => section.controlSetRows.flat())
  .filter(
    (item: any): item is Control =>
      !!item && typeof item === 'object' && typeof item.name === 'string' && 'config' in item,
  );

// Trattino lungo, trattino medio e doppio trattino usato come separatore.
const banned = /[–—]| -- /;

describe('qualità dei controlli del pannello', () => {
  it('ogni descrizione porta un esempio', () => {
    const without = controls.filter(c => !/Esempi?[o:]|\bes\./i.test(String(c.config.description))).map(c => c.name);
    expect(without).toEqual([]);
  });

  it('nessun trattino lungo né doppio trattino nei testi visibili', () => {
    const offenders: string[] = [];
    for (const { name, config: c } of controls) {
      const texts = [c.label, c.description, ...(c.choices ?? []).map((x: [unknown, string]) => x[1])];
      if (texts.some(t => typeof t === 'string' && banned.test(t))) offenders.push(name);
    }
    expect(offenders).toEqual([]);
  });

  it('i valori predefiniti dei menu a scelta chiusa sono tra le scelte', () => {
    const wrong: string[] = [];
    for (const { name, config: c } of controls) {
      if (c.type !== 'SelectControl' || c.freeForm || !Array.isArray(c.choices)) continue;
      const values = c.choices.map((x: [unknown, string]) => x[0]);
      const defaults = Array.isArray(c.default) ? c.default : [c.default];
      if (!defaults.every((d: unknown) => d === undefined || d === '' || d === null || values.includes(d))) wrong.push(name);
    }
    expect(wrong).toEqual([]);
  });

  it('le scelte hanno etichette non vuote e valori unici', () => {
    const wrong: string[] = [];
    for (const { name, config: c } of controls) {
      if (!Array.isArray(c.choices)) continue;
      const values = c.choices.map((x: [unknown, string]) => x[0]);
      const labels = c.choices.map((x: [unknown, string]) => String(x[1]).trim());
      if (new Set(values).size !== values.length || labels.some((l: string) => l === '')) wrong.push(name);
    }
    expect(wrong).toEqual([]);
  });
});
