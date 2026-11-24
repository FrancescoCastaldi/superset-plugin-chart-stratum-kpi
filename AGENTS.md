# AGENTS.md — Regole, Architettura e Aggiornamenti per Agenti AI

Questo documento contiene le direttive operative, l'architettura tecnica e il registro cronologico degli aggiornamenti per tutti gli agenti AI che interagiscono con il repository `superset-plugin-chart-kpi-comparison`.

---

## 🛑 Direttive di Sicurezza & Protocolli Globali

1. **Massima Efficienza & Autonomia Operativa**: Eseguire build, compilazioni, formattazioni e test in modo proattivo e autonomo.
2. **Safety Database `yasidb` (READ-ONLY)**:
   - Divieto assoluto di modifiche (`DELETE`, `UPDATE`, `DROP`, `TRUNCATE`) verso qualsiasi database gestionale clinico di produzione (`yasidb`).
   - Consentite esclusivamente query di lettura (`SELECT ... WITH (NOLOCK)`).
3. **Idempotenza e Integrità Superset**:
   - Qualsiasi modifica apportata ai file core di Apache Superset (es. `MainPreset.ts`) deve essere accompagnata da backup preventivo `.bak` e deve risultare strettamente idempotente (nessun duplicato di import o registrazioni).

---

## 📐 Architettura del Plugin

- **Repository**: `<SSD_DRIVE>:\Actual\03_Sviluppo_Software\Repositories\_work\superset-6.1.0-custom\superset-frontend\plugins\superset-plugin-chart-kpi-comparison`
- **Nome Plugin**: `superset-plugin-chart-kpi-comparison`
- **Key Registrazione**: `kpi_comparison`
- **Class Plugin**: `KPIComparisonChartPlugin`
- **Framework & Dipendenze**:
  - React 18, TypeScript (ESNext / ES2022)
  - `@superset-ui/core`, `@superset-ui/chart-controls`
  - SVG puro per sparkline ad alte prestazioni (zero librerie grafiche esterne pesanti)

### Struttura Directory
```
src/
├── components/
│   ├── KPIComparisonChart.tsx       # Componente React container principale della card
│   ├── KPIComparisonBadge.tsx       # Badge di variazione percentuale con icone semantiche
│   └── KPISparkline.tsx             # Sparkline vettoriale SVG con sfumatura
├── plugin/
│   ├── buildQuery.ts                # Gestione query (Dual Metric o Time Shift)
│   ├── controlPanel.tsx             # Pannello di configurazione Explore Superset
│   ├── transformProps.ts            # Trasformazione dati, delta %, polarità e formattazione
│   └── index.ts                     # ChartPlugin & ChartMetadata registration
├── utils/
│   └── formatters.ts                # Formattatore numeri e percentuali (standard IT)
├── types.ts                         # Tipizzazioni TypeScript complete
└── index.ts                         # Export pubblico del bundle
```

---

## 🚀 Script di Installazione e Deploy

- **`install-plugin.ps1`**:
  - Rileva automaticamente `<SSD_DRIVE>:\Actual\03_Sviluppo_Software\Repositories\apache-superset-6.1.0`.
  - Compila i sorgenti (`npm run build`).
  - Sincronizza i file in `superset-frontend/plugins/superset-plugin-chart-kpi-comparison`.
  - Registra il plugin in `src/visualizations/presets/MainPreset.ts` con creazione backup `.bak`.
- **`install.bat`**:
  - Launcher interattivo Windows con menu a selezione numerata per esecuzione immediata con doppio clic.

---

## 📝 Registro Aggiornamenti Agenti (Agent Activity Log)

### [2026-09-08 13:14] — Visibilità Repository impostata su Privata
- **Agente**: Antigravity (Gemini 3.8 Flash)
- **Attività svolte**:
  1. Esecuzione comando GitHub CLI `gh repo edit FrancescoCastaldi/superset-plugin-chart-kpi-comparison --visibility private`.
  2. Verifica dello stato: `visibility: PRIVATE`, `isPrivate: true`.

### [2026-09-08 12:51] — Release v0.1.3: Auto-Fit Fluido Dinamico & Personalizzazione Estetica
- **Agente**: DeepCoder subagent
- **Attività svolte**:
  1. Risoluzione bug di collasso e overflow dei font con ricalcolo continuo del font size (`13px` - `64px`), applicazione di `flexShrink: 0`, `minHeight: 0`, e per testi lunghi `minWidth: 0` con ellissi.
  2. Omissione automatica del titolo interno duplicato quando l'altezza scende sotto i 90px (salvaguardando il 100% dell'altezza per numero e delta).
  3. Riga inferiore bloccata a `flexWrap: 'nowrap'`.
  4. Introduzione controlli estetici nativi nel Control Panel: `card_bg_color`, `card_border_radius`, `card_box_shadow`.
  5. Rilascio e tag `v0.1.3`.

### [2026-09-08 10:40] — Release v0.1.1: Fix Layout GUI, Docker Non-Dev & Private Repo
- **Agente**: Antigravity (Gemini 3.8 Flash)
- **Attività svolte**:
  1. Identificazione e risoluzione del bug di docking z-order in WinForms: `headerPanel` si sovrapponeva a `mainPanel` tagliando la Sezione 1 (Path Superset). Risolto chiamando `headerPanel.SendToBack()` e `mainPanel.BringToFront()`.
  2. Applicato padding orizzontale uniforme (`padX = 24`) per allineare tutti i campi con l'intestazione.
  3. Ricompilazione dell'eseguibile nativo `KPIComparisonInstallerGUI.exe`.
  4. Integrazione supporto nativo per `docker compose -f docker-compose-non-dev.yml up -d --build superset`.
  5. Impostazione della repository GitHub `FrancescoCastaldi/superset-plugin-chart-kpi-comparison` in modalità **Privata**.

### [2026-09-08 10:27] — Inizializzazione Completa del Progetto (v0.1.0)
- **Agente**: Antigravity (Gemini 3.8 Flash)
- **Attività svolte**:
  1. Definizione e approvazione dell'implementation plan per il chart KPI all-in-one con confronto temporale e delta integrato per il modulo Programmazione Sanitaria.
  2. Creazione della configurazione package (`package.json`, `tsconfig.json`, `.gitignore`).
  3. Implementazione di `src/types.ts` e delle utility di formattazione italiana `src/utils/formatters.ts`.
  4. Sviluppo del componente vettoriale sparkline SVG `KPISparkline.tsx` e del badge semantico con supporto polarità invertita `KPIComparisonBadge.tsx`.
  5. Sviluppo del layout responsive `KPIComparisonChart.tsx`.
  6. Implementazione di `buildQuery.ts`, `controlPanel.tsx` e `transformProps.ts`.
  7. Creazione di `README.md`, `CHANGELOG.md` e `AGENTS.md`.
  8. Configurazione dello script di deploy PowerShell `install-plugin.ps1` e batch `install.bat`.

---

## 🔐 Credenziali, token & chiavi API — protocollo vault (obbligatorio)

Questo file non contiene segreti e non deve mai contenerne. Tutte le credenziali della chiavetta vivono nel **vault unico** `<SSD_DRIVE>:/Actual/00_Sicurezza_e_Credenziali/Vault_USB/.env`, cifrato a riposo in `<SSD_DRIVE>:/Actual/00_Sicurezza_e_Credenziali/Vault_USB/.env.7z` (AES-256). Il protocollo completo è in `<SSD_DRIVE>:/Actual/AGENTS.md` §5, da leggere prima di qualsiasi attività che richieda un token. In sintesi:

```powershell
powershell -File <SSD_DRIVE>:/Actual/00_Sicurezza_e_Credenziali/Vault_USB/scripts/status-env.ps1   # exit 0 = UNLOCKED; exit 2 = LOCKED -> fermarsi e chiedere all'utente di eseguire unlock-env.ps1
. <SSD_DRIVE>:/Actual/00_Sicurezza_e_Credenziali/Vault_USB/scripts/load-env.ps1 -Quiet             # esporta le variabili nella sessione corrente (mai stamparne i valori)
```

- **Chiavi rilevanti per quest'area**: `GH_TOKEN`, `GITHUB_TOKEN`, `GITHUB_USER`. Schema completo (nomi, nessun valore): `<SSD_DRIVE>:/Actual/00_Sicurezza_e_Credenziali/Vault_USB/.env.example`.
- **Vietato**: leggere altri `.env`, `.npmrc` o `connessione_*.txt` come fonte di token; stampare, loggare o copiare valori; committare `.env*` (eccetto `.env.example`); chiedere la password del vault in chat.
- Vault **LOCKED** → fermarsi e chiedere l'unlock, senza cercare copie altrove. Chiave assente dallo schema → non esiste nel vault: proporne l'aggiunta secondo `<SSD_DRIVE>:/Actual/AGENTS.md` §5.5.
- **Fine sessione**: ricordare all'utente `powershell -File <SSD_DRIVE>:/Actual/00_Sicurezza_e_Credenziali/Vault_USB/scripts/lock-env.ps1`.
