import {
  ControlPanelConfig,
  sharedControls,
} from '@superset-ui/chart-controls';
import { showDurationControl } from './timeMetricHints';

/*
 * Pannello di controllo del grafico StratumKPI, in italiano.
 * Ogni sezione e ogni controllo descrive cosa fa con almeno un esempio.
 * I nomi dei controlli restano invariati per preservare la compatibilita dei chart salvati.
 */

const isComparing = ({ controls }: any) => Boolean(controls?.enable_comparison?.value);

const isBadgeAvailable = ({ controls }: any) =>
  isComparing({ controls }) || controls?.badge_content?.value === 'percent_of_total';

const isBadgeVisible = ({ controls }: any) =>
  isBadgeAvailable({ controls }) &&
  controls?.badge_content?.value !== 'none' &&
  controls?.show_badge?.value !== false;

const isTargetControlVisible = ({ controls }: any) =>
  (isComparing({ controls }) && controls?.calculation_mode?.value === 'static_target') ||
  Boolean(controls?.show_progress_bar?.value);

const isTitleVisibleInsideCard = ({ controls }: any) =>
  controls?.show_title?.value !== false && !controls?.title_in_chart_header?.value;

const isBorderStyleVisible = ({ controls }: any) =>
  !controls?.clean_card_mode?.value && controls?.card_box_shadow?.value === 'bordered';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: 'Dati',
      expanded: true,
      tabOverride: 'data',
      description:
        'Metrica principale, intervallo temporale e filtri della query. La prima metrica determina il valore grande al centro della scheda.',
      controlSetRows: [
        [
          {
            name: 'time_range',
            config: {
              ...sharedControls.time_range,
              label: 'Intervallo temporale',
              description:
                'Periodo di analisi chiuso o relativo applicato alla query. Esempio: Ultimi 30 giorni oppure 2026-01-01 : 2026-03-31.',
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              label: 'Metrica principale',
              description:
                'Valore numerico o durata mostrato in evidenza nella scheda KPI. Esempi: Totale accessi, Ricavi, Tempo medio attesa.',
              clearable: true,
              validators: [],
            },
          },
        ],
        ['adhoc_filters'],
      ],
    },
    {
      label: 'Confronto tra periodi',
      expanded: false,
      tabOverride: 'data',
      description:
        'Confronta il valore principale con una metrica di riferimento, un periodo precedente, un obiettivo o il totale.',
      controlSetRows: [
        [
          {
            name: 'enable_comparison',
            config: {
              type: 'CheckboxControl',
              label: 'Abilita confronto e variazione percentuale',
              default: true,
              description:
                'Attiva il confronto con una seconda metrica, un periodo passato o un obiettivo. Se disattivato mostra solo il valore principale.',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'calculation_mode',
            config: {
              type: 'SelectControl',
              label: 'Modalita di calcolo del confronto',
              default: 'dual_metric',
              choices: [
                ['dual_metric', 'Doppia metrica esplicita (dataset o SQL)'],
                ['anti_cartesian', 'Anti-cartesiana (colonne o righe corrente vs confronto)'],
                ['static_target', 'Obiettivo di confronto (metrica o valore fisso)'],
                ['time_shift', 'Confronto temporale automatico (time offset)'],
              ],
              description:
                'Scegli come recuperare il valore di confronto. Esempio: Doppia metrica per confrontare richieste attuali e mese precedente gia presenti nel dataset.',
              clearable: false,
              renderTrigger: true,
              visibility: isComparing,
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
              label: 'Metrica di confronto (opzionale)',
              description:
                'Metrica o colonna di benchmark con cui confrontare la metrica principale. Esempio: Accessi mese precedente oppure Budget.',
              visibility: ({ controls }) =>
                isComparing({ controls }) &&
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
              label: 'Sfasamento temporale',
              default: '1 year ago',
              choices: [
                ['1 year ago', '1 anno fa (stesso periodo anno precedente)'],
                ['1 month ago', '1 mese fa (stesso periodo mese precedente)'],
                ['1 week ago', '1 settimana fa'],
                ['28 days ago', '28 giorni fa (4 settimane)'],
              ],
              description:
                'Periodo passato interrogato da Superset per il confronto. Esempio: 1 month ago confronta marzo con febbraio.',
              clearable: true,
              clear_on_hide: true,
              visibility: ({ controls }) =>
                isComparing({ controls }) && controls?.calculation_mode?.value === 'time_shift',
            },
          },
        ],
        [
          {
            name: 'comparison_label',
            config: {
              type: 'TextControl',
              label: 'Etichetta del periodo di confronto',
              default: '',
              description:
                'Testo mostrato accanto al valore di confronto. Lascia vuoto per il testo automatico oppure usa il segnaposto {comp_month}. Esempio: vs {comp_month}.',
              renderTrigger: true,
              visibility: isComparing,
            },
          },
        ],
        [
          {
            name: 'badge_content',
            config: {
              type: 'SelectControl',
              label: 'Contenuto del badge',
              default: 'delta',
              choices: [
                ['delta', 'Variazione rispetto al confronto'],
                ['percent_of_total', 'Percentuale sul totale'],
              ],
              description:
                'Indica se il badge mostra la variazione percentuale rispetto al confronto oppure la quota sul totale. Esempio: Percentuale sul totale per mostrare 24% dei ricavi.',
              renderTrigger: true,
              clearable: false,
            },
          },
          {
            name: 'total_metric',
            config: {
              ...sharedControls.metric,
              validators: [],
              clearable: true,
              clear_on_hide: true,
              label: 'Metrica totale (denominatore)',
              description:
                'Metrica usata come denominatore quando il badge mostra la percentuale sul totale. Esempio: SUM(accessi) OVER().',
              visibility: ({ controls }) => controls?.badge_content?.value === 'percent_of_total',
            },
          },
        ],
        [
          {
            name: 'show_progress_bar',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra barra di avanzamento obiettivo',
              default: false,
              description:
                'Disegna una barra alla base della scheda con la percentuale raggiunta rispetto all obiettivo. Esempio: 75% del target con KPI 1.500 su obiettivo 2.000.',
              renderTrigger: true,
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
              label: 'Metrica obiettivo (prioritaria)',
              description:
                'Metrica dinamica usata come obiettivo sia per il confronto sia per la barra di avanzamento; ha priorita sul valore fisso. Esempio: Target mensile.',
              visibility: isTargetControlVisible,
            },
          },
          {
            name: 'target_static_value',
            config: {
              type: 'TextControl',
              label: 'Valore obiettivo fisso (riepiego)',
              default: '',
              clear_on_hide: true,
              description:
                'Numero o durata usati come obiettivo quando non e impostata una metrica obiettivo. Esempi: 150.000, € 150.000 oppure 00:10:00.',
              renderTrigger: true,
              visibility: isTargetControlVisible,
            },
          },
        ],
      ],
    },
    {
      label: 'Formato dei valori',
      expanded: false,
      tabOverride: 'customize',
      description:
        'Formattazione dei numeri, prefisso o suffisso (valuta o unita di misura) e visualizzazione delle durate.',
      controlSetRows: [
        [
          {
            name: 'number_format',
            config: {
              ...sharedControls.y_axis_format,
              label: 'Formato numeri',
              description:
                'Formato numerico applicato ai valori principale e di confronto. Esempi: SMART_NUMBER per formato adattivo locale, ,.2f per due decimali.',
              default: 'SMART_NUMBER',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'prefix_value',
            config: {
              type: 'TextControl',
              label: 'Prefisso valore',
              description: 'Testo visualizzato prima del numero principale. Esempio: € prima dell importo.',
              default: '',
              renderTrigger: true,
            },
          },
          {
            name: 'suffix_value',
            config: {
              type: 'TextControl',
              label: 'Suffisso valore',
              description: 'Unita visualizzata dopo il numero principale. Esempi: % oppure gg.',
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'time_display_format',
            config: {
              type: 'SelectControl',
              label: 'Formato delle durate',
              renderTrigger: true,
              clearable: false,
              default: 'auto',
              visibility: showDurationControl('time_display_format', 'auto'),
              choices: [
                ['auto', 'Automatico (mm:ss, oppure h:mm:ss da un ora)'],
                ['hms', 'Ore, minuti e secondi (1:05:30)'],
                ['ms', 'Minuti e secondi (65:30)'],
                ['minutes', 'Minuti decimali (65.5 min)'],
                ['hours', 'Ore decimali (1.09 h)'],
                ['seconds', 'Secondi (3930 s)'],
              ],
              description:
                'Controlla come vengono formattate le metriche temporali (hh:mm:ss). Esempio: auto mostra 12:54 sotto un ora e 1:05:30 sopra.',
            },
          },
          {
            name: 'time_fraction_digits',
            config: {
              type: 'SelectControl',
              label: 'Decimali delle durate',
              renderTrigger: true,
              clearable: false,
              default: 0,
              visibility: showDurationControl('time_fraction_digits', 0),
              choices: [
                [0, 'Nessuno'],
                [1, 'Uno'],
                [2, 'Due'],
                [3, 'Tre'],
              ],
              description:
                'Cifre dopo la virgola per i secondi o per le durate decimali. Esempio: 3 mostra 12:54.425.',
            },
          },
        ],
      ],
    },
    {
      label: 'Aspetto',
      expanded: false,
      tabOverride: 'customize',
      description:
        'Lingua dei testi automatici, titolo e sottotitolo, contenitore, tipografia e stile del badge di confronto.',
      controlSetRows: [
        [
          {
            name: 'locale',
            config: {
              type: 'SelectControl',
              label: 'Lingua dei testi e dei numeri automatici',
              description:
                'Lingua per mesi, prefissi automatici (Picco/Minimo), SMART_NUMBER e tooltip del badge; i testi scritti a mano non vengono tradotti. Esempio: Italiano scrive Marzo 2026.',
              default: 'en',
              clearable: false,
              renderTrigger: true,
              choices: [
                ['en', 'English'],
                ['it', 'Italiano'],
              ],
            },
          },
          {
            name: 'card_alignment',
            config: {
              type: 'SelectControl',
              label: 'Allineamento contenuti',
              description: 'Allineamento orizzontale di titolo, valore grande e riga di confronto. Esempio: Centrato per schede quadrate in griglia.',
              default: 'left',
              choices: [
                ['left', 'A sinistra'],
                ['center', 'Centrato'],
                ['right', 'A destra'],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_title',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra titolo',
              default: true,
              description:
                'Mostra o nasconde il titolo della KPI card sopra il valore principale. Esempio: disattiva su widget compatti.',
              renderTrigger: true,
            },
          },
          {
            name: 'title_in_chart_header',
            config: {
              type: 'CheckboxControl',
              label: 'Titolo nell intestazione del grafico',
              default: false,
              description:
                'In dashboard sposta il titolo risolto nella barra del grafico evitando di ripeterlo dentro la card. Esempio: Richieste · Marzo 2026 nella barra superiore.',
              renderTrigger: true,
              visibility: ({ controls }) => controls?.show_title?.value !== false,
            },
          },
        ],
        [
          {
            name: 'kpi_title',
            config: {
              type: 'TextControl',
              label: 'Titolo KPI',
              default: '',
              description:
                'Titolo visualizzato sopra il numero; supporta {month}, {mese}, {period}, {periodo} e {dynamic}. Esempio: Accessi {mese}.',
              renderTrigger: true,
              visibility: ({ controls }) => controls?.show_title?.value !== false,
            },
          },
          {
            name: 'kpi_subtitle',
            config: {
              type: 'TextControl',
              label: 'Sottotitolo / dettaglio',
              default: '',
              description:
                'Didascalia opzionale sotto il titolo; supporta {month}, {period} e {dynamic}. Esempio: Aggiornato a {month}.',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'dynamic_subtitle_column',
            config: {
              ...sharedControls.groupby,
              label: 'Colonna per sottotitolo dinamico',
              description:
                'Colonna del dataset letta per valorizzare {dynamic} o come sottotitolo automatico. Esempio: Reparto.',
              multi: false,
            },
          },
        ],
        [
          {
            name: 'clean_card_mode',
            config: {
              type: 'CheckboxControl',
              label: 'Modalita pulita (senza riquadro interno)',
              default: false,
              description:
                'Rimuove padding, bordi e ombre per integrare la scheda direttamente nel contenitore della dashboard. Esempio: attivo per dashboard dense.',
              renderTrigger: true,
            },
          },
          {
            name: 'card_bg_color',
            config: {
              type: 'ColorPickerControl',
              label: 'Colore sfondo card',
              default: { r: 255, g: 255, b: 255, a: 0 },
              description:
                'Colore di sfondo della scheda KPI; alpha 0 lascia lo sfondo trasparente. Esempio: bianco pieno (#ffffff) per card staccate.',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'card_border_radius',
            config: {
              type: 'SelectControl',
              label: 'Arrotondamento angoli',
              default: 'square',
              choices: [
                ['square', 'Squadrato (0px)'],
                ['subtle', 'Morbido (8px)'],
                ['rounded', 'Arrotondato (14px)'],
                ['pill', 'Pillola (24px)'],
              ],
              description: 'Raggio di curvatura degli angoli della card. Esempio: Morbido (8px).',
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }) => !controls?.clean_card_mode?.value,
            },
          },
          {
            name: 'card_box_shadow',
            config: {
              type: 'SelectControl',
              label: 'Ombra o bordo',
              default: 'none',
              choices: [
                ['none', 'Nessuno'],
                ['subtle', 'Ombra leggera'],
                ['elevated', 'Ombra pronunciata'],
                ['bordered', 'Bordo sottile'],
              ],
              description: 'Stile di elevazione o bordo esterno della card. Esempio: Bordo sottile per schede affiancate.',
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
              label: 'Colore bordo personalizzato',
              description: 'Codice colore CSS del bordo quando e selezionato Bordo sottile. Esempio: #e2e8f0.',
              default: '',
              renderTrigger: true,
              visibility: isBorderStyleVisible,
            },
          },
          {
            name: 'card_border_width',
            config: {
              type: 'SelectControl',
              label: 'Spessore bordo',
              description: 'Spessore del bordo in pixel quando e attivo Bordo sottile. Esempio: 1 pixel (sottile).',
              default: 1,
              choices: [
                [1, '1 pixel (sottile)'],
                [2, '2 pixel (medio)'],
                [3, '3 pixel (evidente)'],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: isBorderStyleVisible,
            },
          },
        ],
        [
          {
            name: 'kpi_font_family',
            config: {
              type: 'SelectControl',
              label: 'Famiglia di font',
              description: 'Carattere tipografico usato nella card KPI. Esempio: Inter per un aspetto moderno e pulito.',
              default: '',
              choices: [
                ['', 'Predefinito di sistema'],
                ['Inter', 'Inter (pulito e moderno)'],
                ['Roboto', 'Roboto (lineare)'],
                ['Montserrat', 'Montserrat (geometrico)'],
                ['Poppins', 'Poppins (arrotondato)'],
                ['Oswald', 'Oswald (condensato)'],
                ['JetBrains Mono', 'JetBrains Mono (monospace)'],
                ['Fira Code', 'Fira Code (tabulare)'],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
          {
            name: 'kpi_tabular_nums',
            config: {
              type: 'CheckboxControl',
              label: 'Cifre tabulari allineate',
              default: true,
              description: 'Assegna la stessa larghezza a tutte le cifre evitando spostamenti orizzontali. Esempio: utile su colonne di KPI in griglia.',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'kpi_font_size_mode',
            config: {
              type: 'SelectControl',
              label: 'Dimensione valore principale',
              description: 'Sceglie tra ridimensionamento automatico in base alla card o misura fissa. Esempio: Adattamento automatico (consigliato).',
              default: 'auto',
              choices: [
                ['auto', 'Adattamento automatico alla scheda'],
                ['small', 'Piccolo (24px)'],
                ['medium', 'Medio (36px)'],
                ['large', 'Grande (48px)'],
                ['xlarge', 'Molto grande (64px)'],
                ['manual', 'Personalizzato in pixel'],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
          {
            name: 'kpi_font_size_manual',
            config: {
              type: 'TextControl',
              isInt: true,
              label: 'Dimensione manuale (px)',
              default: 36,
              description: 'Altezza del numero principale in pixel (tra 12 e 120). Esempio: 42.',
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
              label: 'Spessore valore principale',
              description: 'Peso tipografico del numero principale. Esempio: Extra-Bold (800).',
              default: '800',
              choices: [
                ['300', 'Leggero (300)'],
                ['400', 'Normale (400)'],
                ['500', 'Medio (500)'],
                ['600', 'Semigrassetto (600)'],
                ['700', 'Grassetto (700)'],
                ['800', 'Extra-Bold (800)'],
                ['900', 'Nero (900)'],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
          {
            name: 'kpi_letter_spacing',
            config: {
              type: 'SelectControl',
              label: 'Spaziatura cifre',
              description: 'Distanza tra i caratteri del valore principale. Esempio: Stretta (-0.025em) per cifre compatte.',
              default: 'tight',
              choices: [
                ['tight', 'Stretta (-0.025em)'],
                ['normal', 'Normale (0em)'],
                ['wide', 'Ampia (+0.04em)'],
              ],
              clearable: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'title_font_size',
            config: {
              type: 'SelectControl',
              label: 'Dimensione titolo',
              description: 'Grandezza del titolo sopra il numero principale. Esempio: Scalato dinamico.',
              default: 'auto',
              choices: [
                ['auto', 'Scalato dinamico'],
                ['small', 'Compatto'],
                ['medium', 'Medio'],
                ['large', 'Grande'],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: isTitleVisibleInsideCard,
            },
          },
          {
            name: 'title_font_weight',
            config: {
              type: 'SelectControl',
              label: 'Spessore titolo',
              description: 'Peso tipografico del titolo. Esempio: Semigrassetto (600).',
              default: '600',
              choices: [
                ['400', 'Normale (400)'],
                ['500', 'Medio (500)'],
                ['600', 'Semigrassetto (600)'],
                ['700', 'Grassetto (700)'],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: isTitleVisibleInsideCard,
            },
          },
        ],
        [
          {
            name: 'title_text_transform',
            config: {
              type: 'SelectControl',
              label: 'Stile maiuscole titolo',
              description: 'Trasformazione delle lettere del titolo. Esempio: Tutto maiuscolo (UPPERCASE).',
              default: 'uppercase',
              choices: [
                ['uppercase', 'Tutto maiuscolo'],
                ['capitalize', 'Iniziali maiuscole'],
                ['none', 'Come digitato'],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: isTitleVisibleInsideCard,
            },
          },
          {
            name: 'comparison_font_size',
            config: {
              type: 'SelectControl',
              label: 'Dimensione riga di confronto',
              description: 'Dimensione del testo della riga di confronto. Esempio: Compatto.',
              default: 'small',
              choices: [
                ['small', 'Compatto'],
                ['medium', 'Medio'],
                ['large', 'Grande'],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: isComparing,
            },
          },
        ],
        [
          {
            name: 'show_badge',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra badge variazione o quota',
              default: true,
              description:
                'Mostra o nasconde il badge colorato con la variazione percentuale o la quota sul totale. Esempio: disattiva per mostrare solo il valore di confronto.',
              renderTrigger: true,
              visibility: isBadgeAvailable,
            },
          },
          {
            name: 'invert_polarity',
            config: {
              type: 'CheckboxControl',
              label: 'Inverti polarita colori (calo = positivo)',
              default: false,
              description:
                'Se attivo, una diminuzione diventa verde e un aumento diventa rosso. Esempio: tempi di attesa, costi o tassi di errore.',
              renderTrigger: true,
              visibility: isComparing,
            },
          },
        ],
        [
          {
            name: 'badge_position',
            config: {
              type: 'SelectControl',
              label: 'Posizione del badge',
              description: 'Dove collocare il badge nella scheda KPI. Esempio: In basso a sinistra accanto al confronto (predefinito).',
              default: 'bottom_left',
              choices: [
                ['bottom_left', 'In basso, accanto al confronto'],
                ['inline_right', 'Accanto al valore principale'],
                ['top_right', 'In alto a destra'],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: isBadgeVisible,
            },
          },
          {
            name: 'badge_style',
            config: {
              type: 'SelectControl',
              label: 'Stile del badge',
              description: 'Forma visiva del badge. Esempio: Pillola arrotondata.',
              default: 'pill',
              choices: [
                ['pill', 'Pillola arrotondata'],
                ['full', 'Riquadro morbido'],
                ['subtle', 'Testo minimale senza sfondo'],
              ],
              clearable: false,
              renderTrigger: true,
              visibility: isBadgeVisible,
            },
          },
        ],
        [
          {
            name: 'show_absolute_delta',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra delta assoluto tra parentesi',
              description:
                'Aggiunge la differenza assoluta accanto alla variazione percentuale nel badge. Esempio: +20,0% (+200).',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }) =>
                isComparing({ controls }) &&
                controls?.badge_content?.value !== 'percent_of_total' &&
                isBadgeVisible({ controls }),
            },
          },
          {
            name: 'total_badge_color',
            config: {
              type: 'ColorPickerControl',
              label: 'Colore sfondo badge percentuale sul totale',
              default: { r: 99, g: 102, b: 241, a: 1 },
              description: 'Colore di sfondo del badge quando mostra la percentuale sul totale. Esempio: indaco per distinguerlo dai trend.',
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
              label: 'Mostra valore numerico di confronto',
              description: 'Visualizza il numero di confronto nella riga inferiore. Esempio: 1.000 accanto a vs Mese precedente.',
              default: true,
              renderTrigger: true,
              visibility: isComparing,
            },
          },
          {
            name: 'show_comparison_label',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra etichetta di confronto',
              default: true,
              description:
                'Mostra o nasconde il testo descrittivo del confronto. Esempio: vs Gennaio 2026.',
              renderTrigger: true,
              visibility: isComparing,
            },
          },
        ],
        [
          {
            name: 'wrap_bottom_content',
            config: {
              type: 'CheckboxControl',
              label: 'Manda a capo il testo di confronto',
              default: true,
              description:
                'Permette al testo di confronto di andare a capo quando la card e stretta, evitando troncamenti. Esempio: consigliato in colonne strette.',
              renderTrigger: true,
              visibility: isComparing,
            },
          },
          {
            name: 'apply_trend_color_to',
            config: {
              type: 'SelectControl',
              label: 'Applica il colore del trend a',
              default: 'badge',
              choices: [
                ['badge', 'Solo badge di variazione'],
                ['text', 'Testo del valore principale'],
                ['background', 'Sfondo della scheda (sfumato)'],
              ],
              description:
                'Sceglie quale elemento viene colorato in verde o rosso in base all andamento. Esempio: Testo del valore principale.',
              clearable: false,
              renderTrigger: true,
              visibility: isComparing,
            },
          },
        ],
      ],
    },
    {
      label: 'Sparkline',
      expanded: false,
      tabOverride: 'customize',
      description:
        'Mini grafico dell andamento storico alla base della scheda KPI e colonna temporale usata per ordinarne i punti.',
      controlSetRows: [
        [
          {
            name: 'show_sparkline',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra sparkline alla base',
              default: false,
              description:
                'Disegna una linea temporale nella parte inferiore della scheda usando il valore piu recente come KPI corrente. Esempio: andamento degli ultimi 12 mesi.',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'time_column',
            config: {
              ...sharedControls.groupby,
              label: 'Colonna temporale della sparkline',
              description:
                'Colonna usata per ordinare la serie storica della sparkline prendendo i punti piu recenti. Esempio: Data o Mese.',
              multi: false,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
        ],
        [
          {
            name: 'sparkline_color',
            config: {
              type: 'ColorPickerControl',
              label: 'Colore sparkline',
              description: 'Colore della linea e della sfumatura della sparkline. Esempio: blu (#2563eb).',
              default: { r: 37, g: 99, b: 235, a: 1 },
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
          {
            name: 'sparkline_fill',
            config: {
              type: 'CheckboxControl',
              label: 'Riempimento sfumato',
              description: 'Aggiunge una sfumatura semitrasparente sotto la linea della sparkline. Esempio: attivo per evidenziare il volume.',
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
              label: 'Stile curva sparkline',
              description: 'Sceglie tra linea smussata (Bezier) e spezzata lineare. Esempio: Curva morbida per serie mensili.',
              default: 'smooth',
              choices: [
                ['smooth', 'Curva morbida (Bezier)'],
                ['linear', 'Spezzata lineare'],
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
              label: 'Evidenzia picco e punto corrente',
              description: 'Mostra un marcatore sul valore massimo oltre che sul punto finale della serie. Esempio: evidenzia il mese di picco.',
              default: false,
              renderTrigger: true,
              visibility: ({ controls }) => Boolean(controls?.show_sparkline?.value),
            },
          },
        ],
      ],
    },
    {
      label: 'Interazione',
      expanded: false,
      tabOverride: 'customize',
      description:
        'Collegamento esterno o verso un altra dashboard quando l utente fa clic sulla scheda KPI.',
      controlSetRows: [
        [
          {
            name: 'click_url',
            config: {
              type: 'TextControl',
              label: 'URL di navigazione al clic',
              default: '',
              description:
                'Indirizzo http(s) o percorso relativo aperto al clic sulla scheda; schemi non sicuri sono bloccati. Esempio: /superset/dashboard/123.',
              renderTrigger: true,
            },
          },
          {
            name: 'click_target',
            config: {
              type: 'SelectControl',
              label: 'Apertura collegamento',
              description: 'Indica se aprire l URL nella finestra attuale o in una nuova scheda del browser. Esempio: Apri in una nuova scheda.',
              default: '_self',
              choices: [
                ['_self', 'Apri nella stessa finestra'],
                ['_blank', 'Apri in una nuova scheda'],
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
  ],
};

export default config;
