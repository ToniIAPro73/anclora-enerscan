export interface ImprovementScenario {
  id: string;
  name: string;
  objective: string;
  measures: string[];
  costRange: string;
  savingsPercentage: string;
  letterJump: string;
}

export function generateScenarios(): ImprovementScenario[] {
  const scenarios: ImprovementScenario[] = [
    {
      id: "basic",
      name: "Básico",
      objective: "Confort y bajo consumo",
      measures: [
        "Termostato programable o inteligente",
        "Sustitución a iluminación LED completa",
        "Sellado de juntas y grietas en ventanas",
        "Ajuste de sistemas existentes"
      ],
      costRange: "500 - 2.000 €",
      savingsPercentage: "5 - 15 %",
      letterJump: "Hasta 1 nivel"
    },
    {
      id: "intermediate",
      name: "Intermedio",
      objective: "Subir un nivel con presupuesto medio",
      measures: [
        "Sustitución de ventanas (doble acristalamiento)",
        "Mejora del sistema de ACS",
        "Climatización parcial o bomba de calor",
        "Protecciones solares y persianas"
      ],
      costRange: "5.000 - 18.000 €",
      savingsPercentage: "20 - 40 %",
      letterJump: "1 - 2 niveles"
    },
    {
      id: "deep",
      name: "Profundo",
      objective: "Letra objetivo concreta",
      measures: [
        "Aislamiento de fachada (SATE o similar)",
        "Aislamiento de cubierta",
        "Sustitución completa de carpintería",
        "Aerotermia + FV o solar térmica"
      ],
      costRange: "25.000 - 70.000+ €",
      savingsPercentage: "50 - 75 %",
      letterJump: "2 - 4 niveles"
    }
  ];

  return scenarios;
}