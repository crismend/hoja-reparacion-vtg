/**
 * Script que genera el XML VPI y el PDF a partir de los datos de prueba
 * Simula exactamente la lógica de generarYDescargarXML() del HTML
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── DATOS DE PRUEBA ─────────────────────────────────────────────────────────
const D = {
  // Paso 1 — Identificación
  num_eje:           '8000181630',
  num_pedido:        'DM25-757',
  num_pedido_cliente:'4510024777',
  fecha_creacion:    '2026-03-05',
  tipo_eje:          'ES3',
  fab_eje:           'MAST.',
  anio_fab_eje:      '2022',
  mat_eje:           'EA1N',
  lote_colada_eje:   '22003812',
  prop_eje:          'VTG',
  carga_eje:         '22.5',

  // Paso 2 — Trabajos
  nivel_mant:        'IS 1',
  observaciones:     'FAG. Rodamientos nuevos',

  // Paso 3 — Ruedas
  fab_rueda_a:       'MG',
  anio_rueda_a:      '2022',
  colada_rueda_a:    '22-0-04495-129',
  fab_rueda_b:       'MG',
  anio_rueda_b:      '2022',
  colada_rueda_b:    '22-0-04494-129',
  tipo_rueda:        'ER7',
  tipo_rodamiento:   'Cil.',
  tipo_eje_completo: 'ES3',

  // Paso 4 — Mediciones
  sd_a_ant:     '28.3', sd_a_dep:     '30',
  sd_b_ant:     '28.4', sd_b_dep:     '29',
  sh_a_ant:     '29.5', sh_a_dep:     '28',
  sh_b_ant:     '29',   sh_b_dep:     '28',
  qr_a_ant:     '8.1',  qr_a_dep:     '11',
  qr_b_ant:     '8.5',  qr_b_dep:     '11',
  llanta_a_ant: '137.2',llanta_a_dep: '135',
  llanta_b_ant: '135.4',llanta_b_dep: '135',
  rod_a_ant:    '922',  rod_a_dep:    '908',
  rod_b_ant:    '923',  rod_b_dep:    '908',
  oval_a_ant:   '0.20', oval_a_dep:   '0.10',
  oval_b_ant:   '0.25', oval_b_dep:   '0.10',
  alabeo_a_ant: '0.20', alabeo_a_dep: '0.20',
  alabeo_b_ant: '0.20', alabeo_b_dep: '0.20',

  // Paso 5 — Manguetas y rodamientos
  mang_a_del:   '130.060', mang_a_det:   '130.060',
  mang_b_del:   '130.060', mang_b_det:   '130.060',
  pista_a_del:  '129.440', pista_a_det:  '129.440',
  pista_b_del:  '129.440', pista_b_det:  '129.440',
  contrac_a:    '0.07',    contrac_b:    '0.07',
  sr_ant:       '1594.15', sr_dep:       '1594.15',
  ar_ant:       '1594.15', ar_dep:       '1594.15',
  cc_ant:       '0.20',    cc_dep:       '0.20',
  alabeo_fuste_ant: '0.20',alabeo_fuste_dep: '0.20',
  fab_rod:      'KINGY',
  anio_rod:     '2025',
  tipo_jaula:   'N — Latón con pasadores',
  tipo_grasa:   'S4 EUDB',
  grasa_lote:   '125226B3B46763',
  grasa_fecha:  'SEP2025',
  perfil:       'S1002 15%',
  denominacion: 'Ep.2001',
  color_ral:    '9005',
  mpa_a:        '-85',
  mpa_b:        '-80',
  tipo_inspeccion: 'Parcial',
  hist_is3_fecha: '2022-11-01',
  hist_is3_taller:'VV.',

  // Paso 6 — Cierre
  fecha_fin:    '2026-03-05',
  nombre_resp:  'Cristian',
};

// Trabajos marcados (índice según array TRABAJOS del HTML)
// 0=A, 1=B, 2=D, 3=E, 4=EM, 5=S, 6=W,
// 7=Clasificación nivel mant., 8=Inspección rodamientos,
// 9=Perfil torneado, 10=Montaje rodamientos, 11=Eje protecc. anticorrosión
const TRABAJOS = [
  { code: 'A',  desc: 'Ultrasonido del eje montado, fisuras en eje' },
  { code: 'B',  desc: 'Ultrasonido de llantas de rueda, fisuras transversales' },
  { code: 'D',  desc: 'Ultrasonido de llantas de rueda, tens. residual' },
  { code: 'E',  desc: 'Velo de rueda MT, fisuras' },
  { code: 'EM', desc: 'Canal de descarga' },
  { code: 'S',  desc: 'Ensayo MT de mangueta' },
  { code: 'W',  desc: 'Ensayo MT del eje' },
  { code: 'CL', desc: 'Clasificación nivel mant.' },
  { code: 'IR', desc: 'Inspección rodamientos' },
  { code: 'PT', desc: 'Perfil torneado' },
  { code: 'MR', desc: 'Montaje rodamientos' },
  { code: 'EP', desc: 'Eje protecc. anticorrosión' },
];

const trabajosChecked = [
  // idx, fecha, empleado
  { i: 1,  fecha: '2025-10-22', emp: 'Juan' },
  { i: 2,  fecha: '2025-10-22', emp: '' },
  { i: 7,  fecha: '2025-10-20', emp: '' },
  { i: 8,  fecha: '2026-03-05', emp: 'Cristian' },
  { i: 9,  fecha: '2025-10-02', emp: '' },
  { i: 10, fecha: '2026-03-05', emp: 'Cristian' },
  { i: 11, fecha: '2026-03-05', emp: 'Juan Fuentes' },
];

// ── GENERAR XML ──────────────────────────────────────────────────────────────
function isoDate(d) { return new Date(d + 'T00:00:00.000Z').toISOString(); }

const ahora     = new Date().toISOString();
const icr       = Date.now().toString().slice(-6);
const numEje    = D.num_eje;
const fCaptura  = isoDate(D.fecha_fin);

const trabajosXml = trabajosChecked.map(({ i, fecha, emp }) => {
  const t = TRABAJOS[i];
  return `    <ns3:Activity ns3:code="${t.code || 'X'}" ns3:description="${t.desc}">
      <ns3:Date>${isoDate(fecha)}</ns3:Date>
      <ns3:Employee>${emp}</ns3:Employee>
    </ns3:Activity>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<VPI_Data_Exchange xmlns="http://www.vpihamburg.de/vpi08/messages/"
  xmlns:ns2="http://www.vpihamburg.de/vpi08/orders/"
  xmlns:ns3="http://www.vpihamburg.de/vpi08/types/"
  xmlns:ns4="http://www.vpihamburg.de/vpi08/general/">
  <Header>
    <VPI_version>3.1</VPI_version>
    <Creation_time>${ahora}</Creation_time>
    <Interchange_control_reference>${icr}</Interchange_control_reference>
    <Sender>124501</Sender>
    <Receiver>137101</Receiver>
  </Header>
  <Body>
    <carriedOutActivities>
${trabajosXml}
    </carriedOutActivities>
    <Radsatz>
      <ns4:technicalWheelsetOutgoing ns3:differentiator="Position" ns3:productIdentifier="${numEje}">
        <ns3:Axle>
          <ns3:AxleNumberOld>${numEje}</ns3:AxleNumberOld>
          <ns3:JournalTreatedMechanicallyLeftA>${D.mang_a_del ? 'true' : 'false'}</ns3:JournalTreatedMechanicallyLeftA>
          <ns3:JournalTreatedMechanicallyRightB>${D.mang_b_del ? 'true' : 'false'}</ns3:JournalTreatedMechanicallyRightB>
        </ns3:Axle>
        <ns3:WheelCollection>
          <ns3:Wheel ns3:differentiator="Side">
            <ns3:Side ns3:type="Side">A</ns3:Side>
            <ns3:UTRadsatzkranz ns3:CaptureDate="${fCaptura}" ns3:type="TestResult">ohne Befund</ns3:UTRadsatzkranz>
            <ns3:InteralStressTest ns3:CaptureDate="${fCaptura}" ns3:unit="MPa">${D.mpa_a}</ns3:InteralStressTest>
            <ns3:NominalTreadDiameter ns3:unit="mm">${D.rod_a_dep}</ns3:NominalTreadDiameter>
            <ns3:RadialDeviation ns3:CaptureDate="${fCaptura}" ns3:unit="mm">${D.alabeo_a_dep}</ns3:RadialDeviation>
            <ns3:WheelProfileDenomination ns3:type="WheelProfileDenomination">${D.perfil}</ns3:WheelProfileDenomination>
            <ns3:FlangeThicknessSd ns3:unit="mm">${D.sd_a_dep}</ns3:FlangeThicknessSd>
            <ns3:FlangeFaceQr ns3:unit="mm">${D.qr_a_dep}</ns3:FlangeFaceQr>
            <ns3:FlangeHeigthSh ns3:unit="mm">${D.sh_a_dep}</ns3:FlangeHeigthSh>
          </ns3:Wheel>
          <ns3:Wheel ns3:differentiator="Side">
            <ns3:Side ns3:type="Side">B</ns3:Side>
            <ns3:UTRadsatzkranz ns3:CaptureDate="${fCaptura}" ns3:type="TestResult">ohne Befund</ns3:UTRadsatzkranz>
            <ns3:InteralStressTest ns3:CaptureDate="${fCaptura}" ns3:unit="MPa">${D.mpa_b}</ns3:InteralStressTest>
            <ns3:NominalTreadDiameter ns3:unit="mm">${D.rod_b_dep}</ns3:NominalTreadDiameter>
            <ns3:RadialDeviation ns3:CaptureDate="${fCaptura}" ns3:unit="mm">${D.alabeo_b_dep}</ns3:RadialDeviation>
            <ns3:WheelProfileDenomination ns3:type="WheelProfileDenomination">${D.perfil}</ns3:WheelProfileDenomination>
            <ns3:FlangeThicknessSd ns3:unit="mm">${D.sd_b_dep}</ns3:FlangeThicknessSd>
            <ns3:FlangeFaceQr ns3:unit="mm">${D.qr_b_dep}</ns3:FlangeFaceQr>
            <ns3:FlangeHeigthSh ns3:unit="mm">${D.sh_b_dep}</ns3:FlangeHeigthSh>
          </ns3:Wheel>
        </ns3:WheelCollection>
        <ns3:BearingHousingCollection>
          <ns3:BearingHousing ns3:differentiator="Side"><ns3:Side ns3:type="Side">A</ns3:Side></ns3:BearingHousing>
          <ns3:BearingHousing ns3:differentiator="Side"><ns3:Side ns3:type="Side">B</ns3:Side></ns3:BearingHousing>
        </ns3:BearingHousingCollection>
        <ns3:BearingCollection>
          <ns3:Bearing ns3:differentiator="Position"><ns3:Position ns3:type="BearingPosition">Innen A</ns3:Position></ns3:Bearing>
          <ns3:Bearing ns3:differentiator="Position"><ns3:Position ns3:type="BearingPosition">Außen A</ns3:Position></ns3:Bearing>
          <ns3:Bearing ns3:differentiator="Position"><ns3:Position ns3:type="BearingPosition">Innen B</ns3:Position></ns3:Bearing>
          <ns3:Bearing ns3:differentiator="Position"><ns3:Position ns3:type="BearingPosition">Außen B</ns3:Position></ns3:Bearing>
        </ns3:BearingCollection>
        <ns3:Wheelsetnumber>${numEje}</ns3:Wheelsetnumber>
        <ns3:ArDimension ns3:unit="mm">${D.ar_dep}</ns3:ArDimension>
        <ns3:SrMass ns3:unit="mm">${D.sr_dep || D.ar_dep}</ns3:SrMass>
        <ns3:WheelsetType ns3:type="WheelsetType">${D.tipo_eje}</ns3:WheelsetType>
        <ns3:EigentumsmerkmalRadsatz ns3:type="ListEigentumsmerkmal">VTG Rail Europe GmbH</ns3:EigentumsmerkmalRadsatz>
        <ns3:IsMaintenanceLevel ns3:type="MaintenanceLevel">${D.nivel_mant}</ns3:IsMaintenanceLevel>
        <ns3:WheelsetCaseType ns3:type="WheelsetBearingHousingType">UIC</ns3:WheelsetCaseType>
        <ns3:MaximumLoad ns3:type="MaximalWheelsetLoad">${D.carga_eje}</ns3:MaximumLoad>
        <ns3:State ns3:type="WheelsetCondition">Einsatzfähig</ns3:State>
        <ns3:TsiApproval>true</ns3:TsiApproval>
        <ns3:GreenDotMarking>false</ns3:GreenDotMarking>
        <ns3:HasZfPA>false</ns3:HasZfPA>
        <ns3:HasZfPS>false</ns3:HasZfPS>
        <ns3:HasZfPE>false</ns3:HasZfPE>
        <ns3:ZfPE1Marking>false</ns3:ZfPE1Marking>
      </ns4:technicalWheelsetOutgoing>
    </Radsatz>
  </Body>
</VPI_Data_Exchange>`;

const xmlName = `hoja_vtg_${numEje}_${D.fecha_creacion}.xml`;
fs.writeFileSync(xmlName, xml, 'utf8');
console.log('XML generado:', xmlName);

// ── GENERAR HTML PARA PDF ────────────────────────────────────────────────────
const trabajosHtml = trabajosChecked.map(({ i, fecha, emp }) => {
  const t = TRABAJOS[i];
  const label = t.code ? `<b>${t.code}</b> — ${t.desc}` : t.desc;
  return `<tr><td>✓ ${label}</td><td>${fecha}</td><td>${emp || '—'}</td></tr>`;
}).join('\n');

const medRow = (label, aAnt, aDep, bAnt, bDep) =>
  `<tr><td>${label}</td><td>${aAnt}</td><td>${aDep}</td><td>${bAnt}</td><td>${bDep}</td></tr>`;

const printHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Hoja de Reparación VTG — ${numEje}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; padding: 15mm; }
  h1 { font-size: 14pt; margin-bottom: 2mm; }
  h2 { font-size: 10pt; background: #1a3c6e; color: #fff; padding: 3px 6px; margin: 6mm 0 2mm; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; font-size: 9pt; }
  th { background: #e8eef5; text-align: left; padding: 3px 5px; border: 0.5px solid #bbb; }
  td { padding: 3px 5px; border: 0.5px solid #ccc; vertical-align: top; }
  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 3mm; }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; margin-bottom: 3mm; }
  .kv td:first-child { width: 45%; color: #555; font-size: 8.5pt; }
  .kv td:last-child { font-weight: 500; }
  .header-bar { display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1.5px solid #1a3c6e; padding-bottom: 3mm; margin-bottom: 4mm; }
  .logo-area { font-size: 8pt; color: #666; text-align: right; }
  .ok { color: #2a6e0a; }
  @page { size: A4; margin: 10mm; }
</style>
</head>
<body>

<div class="header-bar">
  <div>
    <h1>Hoja de Reparación de Eje Completo</h1>
    <div style="font-size:9pt;color:#555">VTG Rail Europe GmbH &nbsp;·&nbsp; Taller V-REQ (131)</div>
  </div>
  <div class="logo-area">
    Eje: <b>${numEje}</b><br>
    Pedido: ${D.num_pedido}<br>
    Fecha: ${D.fecha_fin}
  </div>
</div>

<h2>1. Identificación</h2>
<div class="g2">
<table class="kv"><tr><td>Nº eje completo</td><td>${D.num_eje}</td></tr>
<tr><td>Nº de pedido</td><td>${D.num_pedido}</td></tr>
<tr><td>Nº pedido cliente</td><td>${D.num_pedido_cliente}</td></tr>
<tr><td>Fecha de creación</td><td>${D.fecha_creacion}</td></tr>
<tr><td>Tipo del eje completo</td><td>${D.tipo_eje}</td></tr>
<tr><td>Fabricante de eje</td><td>${D.fab_eje}</td></tr></table>
<table class="kv"><tr><td>Año de fabricación</td><td>${D.anio_fab_eje}</td></tr>
<tr><td>Material de eje</td><td>${D.mat_eje}</td></tr>
<tr><td>Lote de colada</td><td>${D.lote_colada_eje}</td></tr>
<tr><td>Identificación propietario</td><td>${D.prop_eje}</td></tr>
<tr><td>Carga por eje [t]</td><td>${D.carga_eje}</td></tr></table>
</div>

<h2>2. Trabajos Realizados</h2>
<table>
<tr><th>Trabajo</th><th>Fecha</th><th>Empleado</th></tr>
${trabajosHtml}
</table>
<table class="kv"><tr><td>Nivel de mantenimiento</td><td>${D.nivel_mant}</td></tr>
<tr><td>Observaciones</td><td>${D.observaciones}</td></tr></table>

<h2>3. Datos de Ruedas</h2>
<div class="g2">
<table class="kv"><tr><td colspan="2" style="background:#f0f4f8;font-weight:600">Lado A</td></tr>
<tr><td>Fabricante</td><td>${D.fab_rueda_a}</td></tr>
<tr><td>Año fabricación</td><td>${D.anio_rueda_a}</td></tr>
<tr><td>Lote de colada</td><td>${D.colada_rueda_a}</td></tr></table>
<table class="kv"><tr><td colspan="2" style="background:#f0f4f8;font-weight:600">Lado B</td></tr>
<tr><td>Fabricante</td><td>${D.fab_rueda_b}</td></tr>
<tr><td>Año fabricación</td><td>${D.anio_rueda_b}</td></tr>
<tr><td>Lote de colada</td><td>${D.colada_rueda_b}</td></tr></table>
</div>
<table class="kv"><tr><td>Tipo de rueda</td><td>${D.tipo_rueda}</td></tr>
<tr><td>Tipo de rodamiento</td><td>${D.tipo_rodamiento}</td></tr>
<tr><td>Tipo eje completo</td><td>${D.tipo_eje_completo}</td></tr></table>

<h2>4. Mediciones</h2>
<table>
<tr><th>Parámetro</th><th>A — Antes</th><th>A — Después</th><th>B — Antes</th><th>B — Después</th></tr>
${medRow('Sd [mm]',          D.sd_a_ant,     D.sd_a_dep,     D.sd_b_ant,     D.sd_b_dep)}
${medRow('Sh [mm]',          D.sh_a_ant,     D.sh_a_dep,     D.sh_b_ant,     D.sh_b_dep)}
${medRow('qR [mm]',          D.qr_a_ant,     D.qr_a_dep,     D.qr_b_ant,     D.qr_b_dep)}
${medRow('Anchura llanta [mm]',D.llanta_a_ant,D.llanta_a_dep, D.llanta_b_ant, D.llanta_b_dep)}
${medRow('Ø Banda rodadura [mm]',D.rod_a_ant, D.rod_a_dep,    D.rod_b_ant,    D.rod_b_dep)}
${medRow('Ovalización [mm]', D.oval_a_ant,   D.oval_a_dep,   D.oval_b_ant,   D.oval_b_dep)}
${medRow('Alabeo [mm]',      D.alabeo_a_ant, D.alabeo_a_dep, D.alabeo_b_ant, D.alabeo_b_dep)}
</table>

<h2>5. Manguetas, Rodamientos y Grasa</h2>
<table>
<tr><th>Parámetro</th><th>A — Delante</th><th>A — Detrás</th><th>B — Delante</th><th>B — Detrás</th></tr>
<tr><td>Ø Mangueta [mm]</td><td>${D.mang_a_del}</td><td>${D.mang_a_det}</td><td>${D.mang_b_del}</td><td>${D.mang_b_det}</td></tr>
<tr><td>Ø Pista interior [mm]</td><td>${D.pista_a_del}</td><td>${D.pista_a_det}</td><td>${D.pista_b_del}</td><td>${D.pista_b_det}</td></tr>
</table>
<div class="g2">
<table class="kv">
<tr><td>Valor contracción A</td><td>${D.contrac_a} mm</td></tr>
<tr><td>Valor contracción B</td><td>${D.contrac_b} mm</td></tr>
<tr><td>SR antes / después</td><td>${D.sr_ant} / ${D.sr_dep} mm</td></tr>
<tr><td>AR antes / después</td><td>${D.ar_ant} / ${D.ar_dep} mm</td></tr>
<tr><td>C-C' antes / después</td><td>${D.cc_ant} / ${D.cc_dep} mm</td></tr>
<tr><td>Alabeo fuste ant/dep</td><td>${D.alabeo_fuste_ant} / ${D.alabeo_fuste_dep} mm</td></tr>
</table>
<table class="kv">
<tr><td>Fabricante rodamiento</td><td>${D.fab_rod}</td></tr>
<tr><td>Año fab. rodamiento</td><td>${D.anio_rod}</td></tr>
<tr><td>Tipo de jaula</td><td>${D.tipo_jaula}</td></tr>
<tr><td>Tipo de grasa</td><td>${D.tipo_grasa}</td></tr>
<tr><td>Grasa lote</td><td>${D.grasa_lote}</td></tr>
<tr><td>Fecha fab. grasa</td><td>${D.grasa_fecha}</td></tr>
</table>
</div>
<table class="kv">
<tr><td>Perfil</td><td>${D.perfil}</td></tr>
<tr><td>Denominación</td><td>${D.denominacion}</td></tr>
<tr><td>Color RAL</td><td>${D.color_ral}</td></tr>
<tr><td>Rueda A [MPA]</td><td>${D.mpa_a}</td></tr>
<tr><td>Rueda B [MPA]</td><td>${D.mpa_b}</td></tr>
<tr><td>Tipo inspección</td><td>${D.tipo_inspeccion}</td></tr>
<tr><td>IS3 ant. fecha</td><td>${D.hist_is3_fecha}</td></tr>
<tr><td>IS3 ant. taller</td><td>${D.hist_is3_taller}</td></tr>
</table>

<h2>6. Cierre</h2>
<table class="kv">
<tr><td>Fecha de finalización</td><td>${D.fecha_fin}</td></tr>
<tr><td>Trabajador responsable</td><td>${D.nombre_resp}</td></tr>
<tr><td>Estado</td><td class="ok"><b>Einsatzfähig (Apto para servicio)</b></td></tr>
</table>

<div style="margin-top:8mm;font-size:8pt;color:#888;border-top:0.5px solid #ccc;padding-top:3mm">
  Generado por: Hoja de Reparación VTG &nbsp;·&nbsp; ${new Date().toLocaleString('es-ES')} &nbsp;·&nbsp; Taller V-REQ (131)
</div>

</body>
</html>`;

const printHtmlPath = path.resolve('_print_tmp.html');
fs.writeFileSync(printHtmlPath, printHtml, 'utf8');
console.log('HTML de impresión generado:', printHtmlPath);

// ── IMPRIMIR PDF CON CHROME HEADLESS ────────────────────────────────────────
const pdfName = `hoja_vtg_${numEje}_${D.fecha_creacion}.pdf`;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const fileUrl = 'file:///' + printHtmlPath.replace(/\\/g, '/');

try {
  execSync(
    `"${chromePath}" --headless=new --disable-gpu --no-sandbox `+
    `--print-to-pdf="${path.resolve(pdfName)}" `+
    `--print-to-pdf-no-header `+
    `"${fileUrl}"`,
    { stdio: 'inherit', timeout: 30000 }
  );
  console.log('PDF generado:', pdfName);
} catch(e) {
  console.error('Error generando PDF:', e.message);
}

// Limpiar temporal
try { fs.unlinkSync(printHtmlPath); } catch(_) {}
