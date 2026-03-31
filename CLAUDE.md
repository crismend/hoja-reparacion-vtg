# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Single-file browser application (`hoja_reparacion_vtg.html`) for managing railway wheelset repair sheets at VTG Rail Europe GmbH. The form collects inspection data across 6 steps and exports a VPI 3.1 XML for upload to the Hermes portal, plus a PDF via browser print.

The companion script `generar_docs.js` (Node.js) replicates the browser's export logic headlessly to generate both files from hardcoded test data, using Chrome's `--headless=new --print-to-pdf` flag for the PDF.

## Generating test documents

```bash
node generar_docs.js
# Outputs: hoja_vtg_<num_eje>_<fecha>.xml and hoja_vtg_<num_eje>_<fecha>.pdf
```

Requires Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`.

## Architecture of `hoja_reparacion_vtg.html`

All logic is inline in a single HTML file. Key sections:

**Form state**
- `currentStep` (0–5) controls which `<div id="secN">` is visible.
- `fieldErrors` object accumulates validation failures; the summary step reads it to show warnings.
- Draft data is persisted to `localStorage` key `vtg_hoja_draft` via `autosave()` (debounced 600 ms). `loadDraft()` restores it on page load, including toggle-button state and trabajo checkboxes.

**TRABAJOS array** (line ~1443)
Defines the 12 maintenance activity rows rendered by `initTrabajos()`. Each entry has `code` and `desc`. Codes: `A B D E EM S W CL IR PT MR EP`. The XML uses `t.code` directly — never falls back to `'X'` anymore. Any new activity must be added here.

**vtgLimits** (line ~1458)
Validation ranges applied by `checkMedVtg(input, key)`. Keys: `sd sh qr oval ar cc alabeo_fuste`. Current ranges per VTG spec:
- Sd: 22–35 mm · Sh: 26–36 mm · qR: 6–13 mm · Ovalización: ≤ 0.3 mm
- AR: 1590–1600 mm · C-C': ≤ 2 mm · Alabeo fuste: ≤ 1 mm
- SR has no automated check (limit 1659 mm shown as static warning text `#warn_sr`).

**XML generation — `generarYDescargarXML()`** (line ~1634)
Produces a VPI 3.1 `VPI_Data_Exchange` document. Key field mappings:
- `<ns3:ArDimension>` ← `ar_dep` (AR distancia caras activas, después del torneo)
- `<ns3:SrMass>` ← `sr_dep` || `ar_dep` (SR distancia caras exteriores, después del torneo)
- `<ns3:UTRadsatzkranz>` ← maps Spanish form value to German: `'Con resultados aceptables'` → `'mit akzeptablem Befund'`, anything else → `'ohne Befund'`
- `<ns3:State>` ← `'Einsatzfähig'` if `clase_fallo` is empty or `'F1'`, else `'Nicht einsatzfähig'`
- `VPI_CONFIG`: sender `124501`, receiver `137101`, taller `V-REQ (131)`

**PDF generation — `generarPDF()`**
Calls `window.print()`. There are no `@media print` styles, so it prints the current step view. In the headless script, a separate summary HTML is built and printed instead.

**Toggle buttons**
`toggleSingle(el, hiddenId)` — selects one button in a group and writes its text to a `<input type="hidden">`. The hidden input's value is what gets saved/read. Groups: `nivel-mant`, `tipo-rod-grp`, `tipo-jaula-grp`, `tipo-grasa-grp`, `perfil-grp`, `denom-grp`, `color-grp`, `velo-a-grp`, `velo-b-grp`, `tipo-insp-grp`, `clase-fallo-grp`.

## Field ID reference for the XML output fields

| XML element | Form field ID |
|---|---|
| `AxleNumberOld` / `Wheelsetnumber` | `num_eje` |
| `ArDimension` | `ar_dep` |
| `SrMass` | `sr_dep` (fallback: `ar_dep`) |
| `NominalTreadDiameter` A/B | `rod_a_dep` / `rod_b_dep` |
| `FlangeThicknessSd` A/B | `sd_a_dep` / `sd_b_dep` |
| `FlangeHeigthSh` A/B | `sh_a_dep` / `sh_b_dep` |
| `FlangeFaceQr` A/B | `qr_a_dep` / `qr_b_dep` |
| `RadialDeviation` A/B | `alabeo_a_dep` / `alabeo_b_dep` |
| `InteralStressTest` A/B | `mpa_a` / `mpa_b` |
| `UTRadsatzkranz` A/B | `velo_a` / `velo_b` (hidden inputs) |
| `IsMaintenanceLevel` | `nivel_mant` (hidden input) |
| `WheelsetType` | `tipo_eje` |
| `MaximumLoad` | `carga_eje` |
| `State` | derived from `clase_fallo` |
