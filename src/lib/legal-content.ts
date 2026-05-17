import type { AppLanguage } from './preferences';

export type LegalPageKind = 'privacy' | 'terms' | 'legal';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export type LegalPageContent = {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

const updatedAt: Record<AppLanguage, string> = {
  es: '10 de mayo de 2026',
  en: '10 May 2026',
  de: '10. Mai 2026',
};

export const legalContent: Record<AppLanguage, Record<LegalPageKind, LegalPageContent>> = {
  es: {
    privacy: {
      title: 'Política de privacidad',
      description: 'Esta política explica cómo Anclora EnergyScan trata los datos personales usados para crear cuentas, generar prediagnósticos energéticos orientativos, gestionar adjuntos y tramitar solicitudes de contacto.',
      updatedAt: updatedAt.es,
      sections: [
        { title: 'Responsable y contacto', paragraphs: ['Responsable del tratamiento: Anclora Group, entidad propietaria y operadora de Anclora EnergyScan.', 'Contacto para privacidad: hola@anclora.com.'] },
        { title: 'Datos que podemos tratar', items: ['Datos de cuenta, autenticación y sesión.', 'Datos declarados de la vivienda y documentación aportada voluntariamente.', 'Solicitudes de contacto con proveedores o partners.', 'Datos técnicos necesarios para seguridad, operación y diagnóstico de incidencias.'] },
        { title: 'Finalidades', items: ['Crear y mantener la cuenta.', 'Generar prediagnósticos energéticos orientativos e informes PDF.', 'Conservar valoraciones, adjuntos y solicitudes asociadas.', 'Gestionar solicitudes de contacto cuando el usuario lo pida.'] },
        { title: 'Carácter orientativo', paragraphs: ['Anclora EnergyScan no genera Certificados de Eficiencia Energética oficiales. Las estimaciones, letras, costes y recomendaciones son orientativas y deben contrastarse con un técnico competente.'] },
      ],
    },
    terms: {
      title: 'Términos del servicio',
      description: 'Estas condiciones regulan el uso de Anclora EnergyScan como plataforma de prediagnóstico energético orientativo para viviendas.',
      updatedAt: updatedAt.es,
      sections: [
        { title: 'Objeto del servicio', paragraphs: ['Anclora EnergyScan permite introducir datos de una vivienda, adjuntar documentación, obtener una estimación energética orientativa, visualizar propuestas de mejora y generar informes informativos.'] },
        { title: 'No sustitución de certificado oficial', paragraphs: ['Anclora EnergyScan no emite Certificados de Eficiencia Energética oficiales, no realiza inspecciones técnicas y no sustituye el criterio de un técnico competente.'] },
        { title: 'Datos y adjuntos aportados', paragraphs: ['El usuario garantiza que tiene derecho a subir los archivos que aporta. Los adjuntos se usan como soporte documental sin validación técnica automática.'] },
        { title: 'Solicitudes de contacto', paragraphs: ['La conexión con proveedores se realiza como solicitud de información o presupuesto, sin garantía de aceptación, resultado, precio, plazo ni ejecución.'] },
      ],
    },
    legal: {
      title: 'Aviso legal',
      description: 'Información general del titular del sitio y condiciones básicas de acceso a Anclora EnergyScan.',
      updatedAt: updatedAt.es,
      sections: [
        { title: 'Titular del sitio', paragraphs: ['Titular y operador: Anclora Group.', 'Anclora EnergyScan es una marca comercial operada bajo licencia exclusiva por Anclora Group.', 'Sitio web: https://anclora-energyscan.vercel.app/', 'Email de contacto: hola@anclora.com.'] },
        { title: 'Finalidad del sitio', paragraphs: ['El sitio ofrece una herramienta web de prediagnóstico energético orientativo para viviendas, generación de informes informativos y preparación de solicitudes de contacto.'] },
        { title: 'Naturaleza informativa', paragraphs: ['La información mostrada tiene carácter orientativo, comercial e informativo. No constituye certificación energética oficial, informe pericial ni asesoramiento legal.'] },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy policy',
      description: 'This policy explains how Anclora EnergyScan processes personal data used to create accounts, generate indicative energy pre-assessments, manage attachments and handle contact requests.',
      updatedAt: updatedAt.en,
      sections: [
        { title: 'Controller and contact', paragraphs: ['Controller: Anclora Group, owner and operator of Anclora EnergyScan.', 'Privacy contact: hola@anclora.com.'] },
        { title: 'Data we may process', items: ['Account, authentication and session data.', 'Declared property data and documentation voluntarily submitted.', 'Provider or partner contact requests.', 'Technical data required for security, operation and incident diagnosis.'] },
        { title: 'Purposes', items: ['Create and maintain the user account.', 'Generate indicative energy pre-assessments and PDF reports.', 'Store assessments, attachments and linked requests.', 'Manage contact requests when requested by the user.'] },
        { title: 'Indicative nature', paragraphs: ['Anclora EnergyScan does not generate official Energy Performance Certificates. Estimates, ratings, costs and recommendations are indicative and must be checked by a qualified technician.'] },
      ],
    },
    terms: {
      title: 'Terms of service',
      description: 'These terms govern the use of Anclora EnergyScan as an indicative energy pre-assessment platform for homes.',
      updatedAt: updatedAt.en,
      sections: [
        { title: 'Service scope', paragraphs: ['Anclora EnergyScan lets users enter property data, attach documentation, obtain an indicative energy estimate, view improvement proposals and generate informative reports.'] },
        { title: 'No replacement for official certification', paragraphs: ['Anclora EnergyScan does not issue official Energy Performance Certificates, perform technical inspections or replace a qualified technician’s judgement.'] },
        { title: 'User data and attachments', paragraphs: ['The user confirms they have the right to upload submitted files. Attachments are used as supporting documentation without automatic technical validation.'] },
        { title: 'Contact requests', paragraphs: ['Provider connection is a request for information or quotation, without guarantee of acceptance, result, price, timeline or execution.'] },
      ],
    },
    legal: {
      title: 'Legal notice',
      description: 'General information about the site owner and basic access conditions for Anclora EnergyScan.',
      updatedAt: updatedAt.en,
      sections: [
        { title: 'Site owner', paragraphs: ['Owner and operator: Anclora Group.', 'Anclora EnergyScan is a commercial brand operated under exclusive license by Anclora Group.', 'Website: https://anclora-energyscan.vercel.app/', 'Contact email: hola@anclora.com.'] },
        { title: 'Site purpose', paragraphs: ['The site provides an indicative energy pre-assessment web tool for homes, informative report generation and preparation of contact requests.'] },
        { title: 'Informative nature', paragraphs: ['The displayed information is indicative, commercial and informative. It is not official energy certification, expert evidence or legal advice.'] },
      ],
    },
  },
  de: {
    privacy: {
      title: 'Datenschutzerklärung',
      description: 'Diese Erklärung beschreibt, wie Anclora EnergyScan personenbezogene Daten für Konten, orientierende Energievoreinschätzungen, Anhänge und Kontaktanfragen verarbeitet.',
      updatedAt: updatedAt.de,
      sections: [
        { title: 'Verantwortlicher und Kontakt', paragraphs: ['Verantwortlicher: Anclora Group, Eigentümerin und Betreiberin von Anclora EnergyScan.', 'Kontakt für Datenschutz: hola@anclora.com.'] },
        { title: 'Verarbeitete Daten', items: ['Konto-, Authentifizierungs- und Sitzungsdaten.', 'Angegebene Immobiliendaten und freiwillig bereitgestellte Dokumentation.', 'Kontaktanfragen an Anbieter oder Partner.', 'Technische Daten für Sicherheit, Betrieb und Fehlerdiagnose.'] },
        { title: 'Zwecke', items: ['Nutzerkonto erstellen und verwalten.', 'Orientierende Energievoreinschätzungen und PDF-Berichte erzeugen.', 'Bewertungen, Anhänge und Anfragen speichern.', 'Kontaktanfragen auf Wunsch des Nutzers verwalten.'] },
        { title: 'Orientierender Charakter', paragraphs: ['Anclora EnergyScan erstellt keine offiziellen Energieausweise. Schätzungen, Klassen, Kosten und Empfehlungen sind orientierend und müssen von qualifizierten Fachleuten geprüft werden.'] },
      ],
    },
    terms: {
      title: 'Nutzungsbedingungen',
      description: 'Diese Bedingungen regeln die Nutzung von Anclora EnergyScan als Plattform für orientierende Energievoreinschätzungen von Wohnimmobilien.',
      updatedAt: updatedAt.de,
      sections: [
        { title: 'Leistungsumfang', paragraphs: ['Anclora EnergyScan ermöglicht die Eingabe von Immobiliendaten, das Anhängen von Dokumentation, eine orientierende Energieschätzung, Verbesserungsvorschläge und informative Berichte.'] },
        { title: 'Kein Ersatz für offiziellen Energieausweis', paragraphs: ['Anclora EnergyScan stellt keine offiziellen Energieausweise aus, führt keine technischen Inspektionen durch und ersetzt nicht die Beurteilung qualifizierter Fachleute.'] },
        { title: 'Daten und Anhänge', paragraphs: ['Der Nutzer bestätigt, dass er berechtigt ist, die eingereichten Dateien hochzuladen. Anhänge dienen als Nachweis ohne automatische technische Validierung.'] },
        { title: 'Kontaktanfragen', paragraphs: ['Die Verbindung zu Anbietern ist eine Informations- oder Angebotsanfrage ohne Garantie für Annahme, Ergebnis, Preis, Frist oder Ausführung.'] },
      ],
    },
    legal: {
      title: 'Impressum',
      description: 'Allgemeine Informationen zum Betreiber der Website und grundlegende Zugangsbedingungen für Anclora EnergyScan.',
      updatedAt: updatedAt.de,
      sections: [
        { title: 'Betreiber', paragraphs: ['Eigentümerin und Betreiberin: Anclora Group.', 'Anclora EnergyScan ist eine Handelsmarke, die unter exklusiver Lizenz von Anclora Group betrieben wird.', 'Website: https://anclora-energyscan.vercel.app/', 'Kontakt: hola@anclora.com.'] },
        { title: 'Zweck der Website', paragraphs: ['Die Website bietet ein Webtool zur orientierenden Energievoreinschätzung von Wohnimmobilien, informative Berichte und Vorbereitung von Kontaktanfragen.'] },
        { title: 'Informative Natur', paragraphs: ['Die angezeigten Informationen sind orientierend, kommerziell und informativ. Sie sind kein offizieller Energieausweis, kein Gutachten und keine Rechtsberatung.'] },
      ],
    },
  },
};

export function getLegalContent(language: AppLanguage, kind: LegalPageKind): LegalPageContent {
  return legalContent[language][kind];
}
