import { Document, Page, StyleSheet, Text, View, renderToFile } from '@react-pdf/renderer';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import React from 'react';

const root = process.cwd();
const outputDir = path.join(root, 'public', 'demo-assets', 'property-demo');
mkdirSync(outputDir, { recursive: true });

const images = [
  {
    file: 'exterior-01.jpg',
    title: 'Fachada principal',
    subtitle: 'Vivienda unifamiliar demo, 1998',
    sky: '#a6d7ee',
    wall: '#d7c3a3',
    accent: '#6f8f72',
    room: 'exterior-front',
  },
  {
    file: 'exterior-02.jpg',
    title: 'Vista exterior posterior',
    subtitle: 'Terraza y jardin con margen de mejora solar',
    sky: '#b7e3f1',
    wall: '#cdb793',
    accent: '#5f8a58',
    room: 'exterior-back',
  },
  {
    file: 'interior-salon-01.jpg',
    title: 'Salon principal',
    subtitle: 'Estancia cuidada con carpinteria media',
    sky: '#efe4d1',
    wall: '#cda96c',
    accent: '#386d72',
    room: 'living',
  },
  {
    file: 'interior-cocina-01.jpg',
    title: 'Cocina',
    subtitle: 'Equipamiento convencional',
    sky: '#e7e1d8',
    wall: '#b9b1a5',
    accent: '#7b8d92',
    room: 'kitchen',
  },
  {
    file: 'interior-dormitorio-01.jpg',
    title: 'Dormitorio principal',
    subtitle: 'Huecos con doble acristalamiento antiguo',
    sky: '#ece2d9',
    wall: '#b2a39a',
    accent: '#596e8f',
    room: 'bedroom',
  },
  {
    file: 'interior-bano-01.jpg',
    title: 'Bano',
    subtitle: 'Acabados conservados',
    sky: '#e6ecec',
    wall: '#a8b7b8',
    accent: '#d5b26d',
    room: 'bathroom',
  },
];

function svgFor(image) {
  const isExterior = image.room.startsWith('exterior');
  const foreground = isExterior
    ? `<rect x="0" y="480" width="1280" height="240" fill="${image.accent}"/>
       <rect x="260" y="270" width="680" height="250" rx="8" fill="${image.wall}"/>
       <polygon points="220,280 600,120 980,280" fill="#7b4938"/>
       <rect x="350" y="350" width="90" height="120" fill="#2f4650"/>
       <rect x="520" y="340" width="120" height="80" fill="#84bfd0"/>
       <rect x="720" y="340" width="120" height="80" fill="#84bfd0"/>
       <rect x="850" y="210" width="55" height="120" fill="#705447"/>
       <circle cx="1050" cy="430" r="60" fill="#3f7d45"/>
       <rect x="1038" y="460" width="24" height="110" fill="#68533a"/>`
    : `<rect x="0" y="0" width="1280" height="720" fill="${image.sky}"/>
       <rect x="80" y="90" width="1120" height="520" rx="24" fill="${image.wall}" opacity="0.78"/>
       <rect x="160" y="150" width="320" height="220" rx="14" fill="#f7efe2"/>
       <rect x="520" y="150" width="520" height="270" rx="14" fill="#f2eee7"/>
       <rect x="210" y="410" width="330" height="95" rx="22" fill="${image.accent}"/>
       <rect x="620" y="450" width="260" height="60" rx="16" fill="#74665a"/>
       <rect x="930" y="230" width="70" height="300" rx="10" fill="#8f7a61"/>
       <circle cx="1040" cy="470" r="38" fill="#6f8f72"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${image.sky}"/>
        <stop offset="1" stop-color="#f6efe5"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#g)"/>
    ${foreground}
    <rect x="42" y="42" width="430" height="116" rx="18" fill="#0d1719" opacity="0.72"/>
    <text x="70" y="92" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#f3f6f4">${image.title}</text>
    <text x="70" y="132" font-family="Arial, sans-serif" font-size="20" fill="#dce7e2">${image.subtitle}</text>
    <text x="70" y="666" font-family="Arial, sans-serif" font-size="18" fill="#1f2a2d" opacity="0.7">Imagen sintetica demo - Anclora EnergyScan</text>
  </svg>`;
}

for (const image of images) {
  const svgPath = path.join(outputDir, `${image.file}.svg`);
  const jpgPath = path.join(outputDir, image.file);
  writeFileSync(svgPath, svgFor(image), 'utf8');
  execFileSync('convert', [svgPath, '-quality', '82', '-resize', '1200x675', jpgPath]);
  rmSync(svgPath);
}

const styles = StyleSheet.create({
  page: {
    padding: 42,
    fontFamily: 'Helvetica',
    color: '#17201d',
    backgroundColor: '#ffffff',
  },
  demoBanner: {
    padding: 12,
    marginBottom: 18,
    backgroundColor: '#fff3cd',
    border: '1 solid #f4c95d',
  },
  bannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7a4b00',
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: '#5a6762',
    marginBottom: 22,
  },
  section: {
    marginTop: 14,
    paddingTop: 10,
    borderTop: '1 solid #d7dedb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#005f49',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '38%',
    fontSize: 10,
    color: '#60706a',
  },
  value: {
    width: '62%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  energyBox: {
    marginTop: 12,
    width: 110,
    height: 80,
    backgroundColor: '#f29f05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyLetter: {
    fontSize: 44,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 5,
  },
});

const CeeDemo = () => React.createElement(
  Document,
  null,
  React.createElement(
    Page,
    { size: 'A4', style: styles.page },
    React.createElement(
      View,
      { style: styles.demoBanner },
      React.createElement(Text, { style: styles.bannerText }, 'Documento demo de ejemplo. Sin validez oficial ni administrativa.')
    ),
    React.createElement(Text, { style: styles.title }, 'Certificado de Eficiencia Energetica - Documento demo'),
    React.createElement(Text, { style: styles.subtitle }, 'Supuesto documento aportado por el usuario para la demo premium de Anclora EnergyScan. No es un certificado oficial.'),
    React.createElement(
      View,
      { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'Identificacion del inmueble demo'),
      [
        ['Referencia demo', 'CEE-DEMO-ENERGYSCAN-1998-E'],
        ['Tipo de inmueble', 'Vivienda unifamiliar aislada demo'],
        ['Codigo postal', '07141'],
        ['Ano de construccion', '1998'],
        ['Superficie util', '185 m2'],
        ['Sistemas', 'Calefaccion y ACS de gas natural; refrigeracion mediante splits'],
      ].map(([label, value]) => React.createElement(
        View,
        { key: label, style: styles.row },
        React.createElement(Text, { style: styles.label }, label),
        React.createElement(Text, { style: styles.value }, value)
      ))
    ),
    React.createElement(
      View,
      { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'Resultado energetico demo'),
      React.createElement(Text, { style: styles.text }, 'Clasificacion energetica declarada para esta demo: letra E. Consumo estimado de energia primaria no renovable: 245 kWh/m2 ano. Emisiones estimadas: 48 kgCO2/m2 ano. Valores orientativos y ficticios.'),
      React.createElement(View, { style: styles.energyBox }, React.createElement(Text, { style: styles.energyLetter }, 'E'))
    ),
    React.createElement(
      View,
      { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'Descripcion resumida'),
      React.createElement(Text, { style: styles.text }, 'Vivienda unifamiliar demo de 1998, cuidada y en uso, con orientacion favorable y doble acristalamiento antiguo, pero sin renovables declaradas y con sistemas convencionales de gas. Presenta margen de mejora en ventanas, aislamiento, climatizacion eficiente y posible autoconsumo.')
    ),
    React.createElement(
      View,
      { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'Tecnico y fecha ficticia'),
      React.createElement(Text, { style: styles.text }, 'Tecnico ficticio: Demo Tecnico Colegiado 0000. Fecha ficticia: 14/03/2026. Documento creado exclusivamente para pruebas y demostracion comercial.')
    ),
    React.createElement(
      View,
      { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'Observaciones'),
      React.createElement(Text, { style: styles.text }, 'Las recomendaciones asociadas deberian confirmarse mediante visita tecnica real, mediciones, proyecto si procede y emision de un Certificado de Eficiencia Energetica oficial por tecnico competente.')
    )
  )
);

await renderToFile(React.createElement(CeeDemo), path.join(outputDir, 'cee-demo.pdf'));
