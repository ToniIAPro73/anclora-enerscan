import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToFile } from '@react-pdf/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const output = path.join(root, 'public', 'demo-assets', 'property-demo', 'cee-demo-anclora-energyscan-vivienda-07141.pdf');

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingHorizontal: 34,
    paddingBottom: 32,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#050505',
    backgroundColor: '#ffffff',
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '0.75 solid #111111',
  },
  demoStamp: {
    position: 'absolute',
    top: 315,
    left: 115,
    fontSize: 58,
    color: '#e7e7e7',
    transform: 'rotate(-28deg)',
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 12,
    border: '0.6 solid #222222',
  },
  sectionTitle: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    backgroundColor: '#f0dfd1',
    borderBottom: '0.6 solid #222222',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '0.35 solid #555555',
    minHeight: 18,
  },
  rowLast: {
    flexDirection: 'row',
    minHeight: 18,
  },
  label: {
    width: '25%',
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    borderRight: '0.35 solid #555555',
  },
  value: {
    width: '38%',
    padding: 4,
    borderRight: '0.35 solid #555555',
  },
  labelRight: {
    width: '18%',
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    borderRight: '0.35 solid #555555',
  },
  valueRight: {
    width: '19%',
    padding: 4,
  },
  text: {
    fontSize: 8.5,
    lineHeight: 1.35,
    marginBottom: 5,
  },
  note: {
    padding: 7,
    backgroundColor: '#fff4cc',
    border: '0.5 solid #e2c56d',
    fontSize: 8,
    lineHeight: 1.35,
    marginBottom: 10,
  },
  ratingWrap: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 8,
  },
  ratingBox: {
    flex: 1,
    border: '0.6 solid #222222',
    paddingBottom: 8,
  },
  ratingTitle: {
    textAlign: 'center',
    backgroundColor: '#f0dfd1',
    borderBottom: '0.6 solid #222222',
    padding: 5,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    marginLeft: 10,
    marginTop: 3,
  },
  letter: {
    width: 16,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  bar: {
    height: 19,
    justifyContent: 'center',
    paddingLeft: 5,
  },
  marker: {
    marginLeft: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 34,
    right: 34,
    fontSize: 7,
    color: '#555555',
    borderTop: '0.35 solid #aaaaaa',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const ratingColors = {
  A: '#00a651',
  B: '#70bf44',
  C: '#c7df21',
  D: '#ffe000',
  E: '#f7941d',
  F: '#ef4136',
  G: '#be1e2d',
};

function Header({ page }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Text, { style: styles.demoStamp }, 'DEMO SIN VALIDEZ OFICIAL'),
    React.createElement(
      View,
      { style: styles.topLine },
      React.createElement(Text, null, 'Fecha 09/05/2026'),
      React.createElement(Text, null, 'Ref. demo DEMO-07141-ENERGYSCAN')
    ),
    React.createElement(Text, { style: styles.title }, 'CERTIFICADO DE EFICIENCIA ENERGETICA DE EDIFICIOS - DEMO'),
    React.createElement(
      View,
      { style: styles.footer },
      React.createElement(Text, null, 'Documento demo generado para Anclora EnergyScan. No es un CEE oficial ni tiene validez administrativa.'),
      React.createElement(Text, null, `Pagina ${page} / 4`)
    )
  );
}

function Section({ title, children }) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionTitle }, title),
    children
  );
}

function DataRow({ leftLabel, leftValue, rightLabel, rightValue, last = false }) {
  return React.createElement(
    View,
    { style: last ? styles.rowLast : styles.row },
    React.createElement(Text, { style: styles.label }, leftLabel),
    React.createElement(Text, { style: styles.value }, leftValue),
    React.createElement(Text, { style: styles.labelRight }, rightLabel),
    React.createElement(Text, { style: styles.valueRight }, rightValue)
  );
}

function RatingScale({ title, unit, value }) {
  const widths = { A: 130, B: 142, C: 154, D: 166, E: 178, F: 190, G: 202 };
  return React.createElement(
    View,
    { style: styles.ratingBox },
    React.createElement(Text, { style: styles.ratingTitle }, `${title}\n[${unit}]`),
    Object.keys(ratingColors).map((letter) => React.createElement(
      View,
      { key: letter, style: styles.barRow },
      React.createElement(
        View,
        { style: [styles.bar, { width: widths[letter], backgroundColor: ratingColors[letter] }] },
        React.createElement(Text, { style: styles.letter }, letter)
      ),
      letter === 'E' ? React.createElement(Text, { style: styles.marker }, value) : null
    ))
  );
}

function PageFrame({ page, children }) {
  return React.createElement(
    Page,
    { size: 'A4', style: styles.page },
    React.createElement(Header, { page }),
    children
  );
}

function CeeDemo() {
  return React.createElement(
    Document,
    null,
    React.createElement(
      PageFrame,
      { page: 1 },
      React.createElement(
        Section,
        { title: 'IDENTIFICACION DEL EDIFICIO O DE LA PARTE QUE SE CERTIFICA' },
        React.createElement(DataRow, { leftLabel: 'Nombre del edificio', leftValue: 'Vivienda unifamiliar demo Anclora EnergyScan', rightLabel: 'Codigo Postal', rightValue: '07141' }),
        React.createElement(DataRow, { leftLabel: 'Direccion', leftValue: 'Zona residencial mediterranea litoral - direccion demo', rightLabel: 'Municipio', rightValue: 'Marratxi / Mallorca (demo)' }),
        React.createElement(DataRow, { leftLabel: 'Provincia', leftValue: 'Illes Balears', rightLabel: 'Comunidad Autonoma', rightValue: 'Illes Balears' }),
        React.createElement(DataRow, { leftLabel: 'Zona climatica', leftValue: 'Mediterranea litoral aproximada', rightLabel: 'Ano construccion', rightValue: '1998' }),
        React.createElement(DataRow, { leftLabel: 'Normativa vigente construccion/rehabilitacion', leftValue: 'NBE-CT-79 / transicion a CTE (estimacion demo)', rightLabel: 'Referencia catastral', rightValue: 'DEMO07141ENERGYSCAN', last: true })
      ),
      React.createElement(
        Section,
        { title: 'TIPO DE EDIFICIO O PARTE DEL EDIFICIO QUE SE CERTIFICA' },
        React.createElement(Text, { style: { padding: 5 } }, '[x] Edificio existente   [x] Vivienda   [x] Unifamiliar   [ ] Bloque   [ ] Local   [ ] Terciario')
      ),
      React.createElement(
        Section,
        { title: 'DATOS DEL TECNICO CERTIFICADOR / GENERADOR DEMO' },
        React.createElement(DataRow, { leftLabel: 'Nombre y apellidos', leftValue: 'Generador demo Anclora EnergyScan', rightLabel: 'NIF/NIE', rightValue: '-' }),
        React.createElement(DataRow, { leftLabel: 'Razon social', leftValue: 'Anclora EnergyScan Demo', rightLabel: 'NIF', rightValue: '-' }),
        React.createElement(DataRow, { leftLabel: 'Domicilio', leftValue: 'Documento sintetico generado para pruebas internas', rightLabel: 'Codigo Postal', rightValue: '-' }),
        React.createElement(DataRow, { leftLabel: 'e-mail', leftValue: 'demo@anclora.local', rightLabel: 'Telefono', rightValue: '-' }),
        React.createElement(DataRow, { leftLabel: 'Titulacion habilitante', leftValue: 'No aplicable - documento demo sin validez oficial', rightLabel: 'Procedimiento', rightValue: 'Simulacion inspirada en formato CEE', last: true })
      ),
      React.createElement(Text, { style: [styles.text, { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 8 }] }, 'CALIFICACION ENERGETICA OBTENIDA - SIMULADA'),
      React.createElement(
        View,
        { style: styles.ratingWrap },
        React.createElement(RatingScale, { title: 'CONSUMO DE ENERGIA PRIMARIA NO RENOVABLE', unit: 'kWh/m2 ano', value: '245,00 E' }),
        React.createElement(RatingScale, { title: 'EMISIONES DE DIOXIDO DE CARBONO', unit: 'kgCO2/m2 ano', value: '48,00 E' })
      )
    ),
    React.createElement(
      PageFrame,
      { page: 2 },
      React.createElement(
        Section,
        { title: 'DATOS ENERGETICOS DEL INMUEBLE - SIMULADOS' },
        React.createElement(DataRow, { leftLabel: 'Superficie util habitable', leftValue: '185 m2', rightLabel: 'Compacidad', rightValue: 'Media' }),
        React.createElement(DataRow, { leftLabel: 'Tipo de envolvente', leftValue: 'Fachada con aislamiento parcial; cubierta inclinada con aislamiento correcto', rightLabel: 'Huecos', rightValue: 'Doble acristalamiento antiguo' }),
        React.createElement(DataRow, { leftLabel: 'Calefaccion', leftValue: 'Caldera de gas natural', rightLabel: 'Refrigeracion', rightValue: 'Equipos split' }),
        React.createElement(DataRow, { leftLabel: 'ACS', leftValue: 'Gas natural', rightLabel: 'Renovables', rightValue: 'No declaradas', last: true })
      ),
      React.createElement(
        Section,
        { title: 'INDICADORES GLOBALES - SIMULADOS' },
        React.createElement(DataRow, { leftLabel: 'Consumo energia primaria no renovable', leftValue: '245,00 kWh/m2 ano', rightLabel: 'Calificacion', rightValue: 'E' }),
        React.createElement(DataRow, { leftLabel: 'Emisiones CO2', leftValue: '48,00 kgCO2/m2 ano', rightLabel: 'Calificacion', rightValue: 'E' }),
        React.createElement(DataRow, { leftLabel: 'Demanda calefaccion', leftValue: '78,00 kWh/m2 ano', rightLabel: 'Demanda refrigeracion', rightValue: '22,00 kWh/m2 ano' }),
        React.createElement(DataRow, { leftLabel: 'Demanda ACS', leftValue: '31,00 kWh/m2 ano', rightLabel: 'Energia final estimada', rightValue: '162,00 kWh/m2 ano', last: true })
      ),
      React.createElement(
        Section,
        { title: 'DESCRIPCION RESUMIDA' },
        React.createElement(Text, { style: { padding: 7, lineHeight: 1.4 } }, 'Vivienda unifamiliar demo de 1998, cuidada y en uso, con orientacion favorable y doble acristalamiento antiguo, pero sin renovables declaradas y con sistemas convencionales de gas. Presenta margen de mejora en ventanas, aislamiento, climatizacion eficiente y posible autoconsumo. Los valores se han generado exclusivamente para demostrar el anexo documental de Anclora EnergyScan.')
      ),
      React.createElement(Text, { style: styles.note }, 'Aviso: este documento demo no puede registrarse ante ninguna administracion, no acredita una calificacion oficial y no sustituye a un Certificado de Eficiencia Energetica emitido por tecnico competente.')
    ),
    React.createElement(
      PageFrame,
      { page: 3 },
      React.createElement(
        Section,
        { title: 'RECOMENDACIONES DE MEJORA - SIMULADAS' },
        React.createElement(DataRow, { leftLabel: 'Medida 1', leftValue: 'Sustitucion progresiva de ventanas por carpinteria eficiente con control solar', rightLabel: 'Impacto esperado', rightValue: 'Medio' }),
        React.createElement(DataRow, { leftLabel: 'Medida 2', leftValue: 'Refuerzo de aislamiento en puntos singulares de fachada y cubierta', rightLabel: 'Impacto esperado', rightValue: 'Medio' }),
        React.createElement(DataRow, { leftLabel: 'Medida 3', leftValue: 'Bomba de calor / aerotermia dimensionada tras visita tecnica', rightLabel: 'Impacto esperado', rightValue: 'Alto' }),
        React.createElement(DataRow, { leftLabel: 'Medida 4', leftValue: 'Estudio de autoconsumo fotovoltaico si cubierta y normativa local lo permiten', rightLabel: 'Impacto esperado', rightValue: 'Medio', last: true })
      ),
      React.createElement(
        Section,
        { title: 'POTENCIAL ORIENTATIVO TRAS MEJORAS' },
        React.createElement(DataRow, { leftLabel: 'Escenario conservador', leftValue: 'Mejoras de huecos y sellado', rightLabel: 'Letra estimada', rightValue: 'D' }),
        React.createElement(DataRow, { leftLabel: 'Escenario recomendado', leftValue: 'Huecos, aislamiento y ajuste de sistemas', rightLabel: 'Letra estimada', rightValue: 'C-D' }),
        React.createElement(DataRow, { leftLabel: 'Escenario profundo', leftValue: 'Electrificacion eficiente y renovables viables', rightLabel: 'Letra estimada', rightValue: 'B-C', last: true })
      ),
      React.createElement(Text, { style: styles.note }, 'Las recomendaciones asociadas deberian confirmarse mediante visita tecnica real, mediciones, proyecto si procede y emision de un Certificado de Eficiencia Energetica oficial por tecnico competente.')
    ),
    React.createElement(
      PageFrame,
      { page: 4 },
      React.createElement(
        Section,
        { title: 'PRUEBAS, COMPROBACIONES E INSPECCION - DEMO' },
        React.createElement(DataRow, { leftLabel: 'Visita presencial', leftValue: 'No realizada - datos ficticios', rightLabel: 'Mediciones', rightValue: 'No realizadas' }),
        React.createElement(DataRow, { leftLabel: 'Documentacion aportada', leftValue: 'Imagenes demo y datos sinteticos', rightLabel: 'Contraste oficial', rightValue: 'No aplicable' }),
        React.createElement(DataRow, { leftLabel: 'Fecha de generacion', leftValue: '09/05/2026', rightLabel: 'Validez', rightValue: 'Sin validez oficial', last: true })
      ),
      React.createElement(
        Section,
        { title: 'OBSERVACIONES FINALES' },
        React.createElement(Text, { style: { padding: 7, lineHeight: 1.45 } }, 'Este CEE demo se incluye siempre en espanol porque simula un documento oficial espanol aportado por el usuario. Aunque el informe Anclora EnergyScan pueda generarse en otros idiomas, este anexo mantiene su idioma original y sus unidades espanolas. No debe interpretarse como documento administrativo, oferta tecnica, presupuesto cerrado ni certificado registrable.')
      ),
      React.createElement(Text, { style: styles.note }, 'Documento demo de ejemplo. Sin validez oficial ni administrativa.')
    )
  );
}

await renderToFile(React.createElement(CeeDemo), output);
console.log(`Generated ${output}`);
