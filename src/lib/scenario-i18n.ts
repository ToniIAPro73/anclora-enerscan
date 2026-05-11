import type { AppLanguage } from './preferences';
import type { ImprovementScenario, SubsidyInfoItem } from './domain/energy-assessment';

const scenarioCopy: Record<AppLanguage, Record<string, Partial<ImprovementScenario>>> = {
  es: {},
  en: {
    basic: {
      title: 'Basic demand reduction package',
      objective: 'Improve comfort and reduce losses without deep renovation.',
      description: 'Low-construction-impact actions targeting openings, infiltration and system controls.',
      estimatedCostRange: 'Low-medium investment',
      estimatedSavingsRange: 'Low-medium qualitative savings, depending on real use',
      expectedLetterImpact: 'Potential improvement subject to official technical assessment',
      rationale: 'Indicative route based on declared data and not a substitute for an official energy certificate.',
    },
    envelope: {
      title: 'Envelope improvement',
      objective: 'Reduce energy demand before replacing systems.',
      description: 'Insulation and openings package to reduce heating and cooling demand.',
      estimatedCostRange: 'Medium-high investment',
      estimatedSavingsRange: 'Medium-high qualitative savings if the current envelope is weak',
      expectedLetterImpact: 'Potential improvement subject to official technical assessment',
      rationale: 'Indicative route based on declared data and not a substitute for an official energy certificate.',
    },
    systems: {
      title: 'Efficient system electrification',
      objective: 'Reduce fossil fuel dependence and improve thermal performance.',
      description: 'Heating, cooling and hot-water renewal with high-efficiency systems.',
      estimatedCostRange: 'Medium investment',
      estimatedSavingsRange: 'Medium qualitative savings, higher when replacing gas or direct electric systems',
      expectedLetterImpact: 'Potential improvement subject to official technical assessment',
      rationale: 'Indicative route based on declared data and not a substitute for an official energy certificate.',
    },
    renewables: {
      title: 'Photovoltaics and solar thermal',
      objective: 'Add renewable generation where roof and usage conditions allow it.',
      description: 'Review of photovoltaic self-consumption and solar thermal support for hot water.',
      estimatedCostRange: 'Medium investment',
      estimatedSavingsRange: 'Variable qualitative savings depending on usage, orientation, roof and compensation',
      expectedLetterImpact: 'Potential improvement subject to official technical assessment',
      rationale: 'Indicative route based on declared data and not a substitute for an official energy certificate.',
    },
    deep: {
      title: 'Combined deep retrofit',
      objective: 'Coordinate envelope, systems and renewables.',
      description: 'Integrated route for homes with weak envelope, penalised systems and relevant sale, rental or renovation horizon.',
      estimatedCostRange: 'High investment',
      estimatedSavingsRange: 'High qualitative savings, subject to technical design and real use',
      expectedLetterImpact: 'Potential improvement subject to official technical assessment',
      rationale: 'Indicative route based on declared data and not a substitute for an official energy certificate.',
    },
  },
  de: {
    basic: {
      title: 'Basispaket zur Reduzierung des Bedarfs',
      objective: 'Komfort verbessern und Verluste ohne tiefgreifende Sanierung reduzieren.',
      description: 'Maßnahmen mit geringem baulichem Eingriff an Öffnungen, Infiltrationen und Systemsteuerung.',
      estimatedCostRange: 'Niedrige bis mittlere Investition',
      estimatedSavingsRange: 'Niedrige bis mittlere qualitative Einsparung, abhängig von der realen Nutzung',
      expectedLetterImpact: 'Mögliche Verbesserung vorbehaltlich offizieller technischer Bewertung',
      rationale: 'Orientierende Route auf Basis deklarierter Daten; kein Ersatz für einen offiziellen Energieausweis.',
    },
    envelope: {
      title: 'Verbesserung der Gebäudehülle',
      objective: 'Energiebedarf reduzieren, bevor Systeme erneuert werden.',
      description: 'Paket für Dämmung und Öffnungen zur Verringerung von Heiz- und Kühlbedarf.',
      estimatedCostRange: 'Mittlere bis hohe Investition',
      estimatedSavingsRange: 'Mittlere bis hohe qualitative Einsparung bei schwacher Gebäudehülle',
      expectedLetterImpact: 'Mögliche Verbesserung vorbehaltlich offizieller technischer Bewertung',
      rationale: 'Orientierende Route auf Basis deklarierter Daten; kein Ersatz für einen offiziellen Energieausweis.',
    },
    systems: {
      title: 'Effiziente Elektrifizierung der Systeme',
      objective: 'Abhängigkeit von fossilen Brennstoffen reduzieren und thermische Leistung verbessern.',
      description: 'Erneuerung von Heizung, Kühlung und Warmwasser mit effizienten Systemen.',
      estimatedCostRange: 'Mittlere Investition',
      estimatedSavingsRange: 'Mittlere qualitative Einsparung, höher beim Ersatz von Gas oder Direktstrom',
      expectedLetterImpact: 'Mögliche Verbesserung vorbehaltlich offizieller technischer Bewertung',
      rationale: 'Orientierende Route auf Basis deklarierter Daten; kein Ersatz für einen offiziellen Energieausweis.',
    },
    renewables: {
      title: 'Photovoltaik und Solarthermie',
      objective: 'Erneuerbare Erzeugung ergänzen, wenn Dach und Nutzung es erlauben.',
      description: 'Prüfung von Photovoltaik-Eigenverbrauch und Solarthermie-Unterstützung für Warmwasser.',
      estimatedCostRange: 'Mittlere Investition',
      estimatedSavingsRange: 'Variable qualitative Einsparung je nach Nutzung, Ausrichtung, Dach und Vergütung',
      expectedLetterImpact: 'Mögliche Verbesserung vorbehaltlich offizieller technischer Bewertung',
      rationale: 'Orientierende Route auf Basis deklarierter Daten; kein Ersatz für einen offiziellen Energieausweis.',
    },
    deep: {
      title: 'Kombinierte tiefgreifende Sanierung',
      objective: 'Gebäudehülle, Systeme und Erneuerbare koordinieren.',
      description: 'Integrierte Route für Immobilien mit schwacher Hülle, belastenden Systemen und relevantem Verkaufs-, Vermietungs- oder Sanierungshorizont.',
      estimatedCostRange: 'Hohe Investition',
      estimatedSavingsRange: 'Hohe qualitative Einsparung, abhängig von Projekt und realer Nutzung',
      expectedLetterImpact: 'Mögliche Verbesserung vorbehaltlich offizieller technischer Bewertung',
      rationale: 'Orientierende Route auf Basis deklarierter Daten; kein Ersatz für einen offiziellen Energieausweis.',
    },
  },
};

const genericMeasures: Record<AppLanguage, string[]> = {
  es: [],
  en: [
    'Review envelope weak points and prioritise actions with a qualified technician.',
    'Request itemised quotes before committing to works.',
    'Check permissions, community requirements and technical compatibility.',
  ],
  de: [
    'Schwachstellen der Gebäudehülle mit Fachleuten prüfen und Maßnahmen priorisieren.',
    'Vor Beauftragung detaillierte Angebote einholen.',
    'Genehmigungen, Gemeinschaftsanforderungen und technische Kompatibilität prüfen.',
  ],
};

const subsidyCopy: Record<AppLanguage, Record<string, Pick<SubsidyInfoItem, 'title' | 'description' | 'eligibilityDisclaimer'>>> = {
  es: {},
  en: {
    'self-consumption-storage': {
      title: 'Self-consumption, storage and renewables',
      description: 'State or regional programmes linked to self-consumption and storage incentives, when open.',
      eligibilityDisclaimer: 'Availability depends on calls, budget, region, application date and technical requirements.',
    },
    'energy-renovation': {
      title: 'Home energy renovation',
      description: 'Information lines related to envelope improvement, energy demand reduction or building renovation.',
      eligibilityDisclaimer: 'Each call requires checking the building, action, justified savings, technical documentation and deadlines.',
    },
    'heat-pump-electrification': {
      title: 'Heat pumps and efficient electrification',
      description: 'Some public programmes may support replacing fossil systems with heat pumps or efficient alternatives.',
      eligibilityDisclaimer: 'Eligibility must be confirmed against official terms and professional quote.',
    },
    'tax-deductions-local-bonuses': {
      title: 'Tax deductions and local bonuses',
      description: 'Tax deductions or municipal bonuses may exist for energy improvements, self-consumption or renovation.',
      eligibilityDisclaimer: 'They depend on municipality, current tax rules, certificates and administrative requirements.',
    },
  },
  de: {
    'self-consumption-storage': {
      title: 'Eigenverbrauch, Speicher und Erneuerbare',
      description: 'Staatliche oder regionale Programme zu Eigenverbrauch und Speicheranreizen, sofern geöffnet.',
      eligibilityDisclaimer: 'Verfügbarkeit hängt von Ausschreibung, Budget, Region, Datum und technischen Anforderungen ab.',
    },
    'energy-renovation': {
      title: 'Energetische Gebäudesanierung',
      description: 'Informationslinien zur Verbesserung der Gebäudehülle, Senkung des Energiebedarfs oder Sanierung.',
      eligibilityDisclaimer: 'Jede Ausschreibung erfordert Prüfung von Gebäude, Maßnahme, Einsparung, Dokumentation und Fristen.',
    },
    'heat-pump-electrification': {
      title: 'Wärmepumpen und effiziente Elektrifizierung',
      description: 'Einige Programme können den Ersatz fossiler Systeme durch Wärmepumpen oder effiziente Alternativen fördern.',
      eligibilityDisclaimer: 'Die Förderfähigkeit muss anhand offizieller Bedingungen und Angebote bestätigt werden.',
    },
    'tax-deductions-local-bonuses': {
      title: 'Steuerabzüge und lokale Boni',
      description: 'Für energetische Verbesserungen, Eigenverbrauch oder Sanierung können steuerliche oder kommunale Vorteile bestehen.',
      eligibilityDisclaimer: 'Sie hängen von Gemeinde, Steuerregeln, Nachweisen und Verwaltungsanforderungen ab.',
    },
  },
};

export function localizeScenarios(scenarios: ImprovementScenario[], language: AppLanguage): ImprovementScenario[] {
  if (language === 'es') return scenarios;
  return scenarios.map((scenario) => ({
    ...scenario,
    ...scenarioCopy[language][scenario.id],
    measures: genericMeasures[language],
    dependencies: [],
    warnings: [],
    disclaimers: scenario.disclaimers,
  }));
}

export function localizeSubsidies(subsidies: SubsidyInfoItem[], language: AppLanguage): SubsidyInfoItem[] {
  if (language === 'es') return subsidies;
  return subsidies.map((item) => ({
    ...item,
    ...(subsidyCopy[language][item.id] || {}),
  }));
}
