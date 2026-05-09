import fs from "fs";
import path from "path";
import { calculateScoreV2 } from "./scoring";
import { AssessmentAttachment, EnergyLetter, PropertyDataV2 } from "./domain/energy-assessment";

export type DemoAttachmentCategory = "EXTERIOR" | "INTERIOR" | "CEE";

export interface DemoAttachment extends AssessmentAttachment {
  path: string;
  category: DemoAttachmentCategory;
  caption: string;
  ceeLetter?: EnergyLetter;
}

const DEMO_ASSET_BASE = "demo-assets/property-demo";

export const demoProperty: PropertyDataV2 = {
  objective: "sale_rent",
  propertyType: "house",
  year: 1998,
  area: 185,
  zipcode: "07141",
  orientation: "south",
  roofType: "pitched",
  heating: "gas",
  cooling: "split",
  waterHeating: "gas",
  ventilation: "natural",
  windows: "double",
  renewables: "none",
  facadeInsulation: "partial",
  roofInsulation: "good",
  budgetRange: "medium",
  timelineHorizon: "one_year",
  targetLetter: "C",
};

export const demoCertificate = {
  id: "cee-demo",
  fileName: "cee-demo-anclora-energyscan-vivienda-07141.pdf",
  letter: calculateScoreV2(demoProperty).estimatedLetter,
  title: "Certificado de Eficiencia Energetica - Documento demo",
  summary: "Supuesto CEE aportado por el usuario. Documento demo sin validez oficial ni administrativa.",
};

export const demoPublicRef = "DEMO-EZNFOIFQ";

function assetPath(fileName: string): string {
  return `${DEMO_ASSET_BASE}/${fileName}`;
}

function assetSize(fileName: string): number {
  try {
    return fs.statSync(getDemoAssetPathByFileName(fileName)).size;
  } catch {
    return 0;
  }
}

export const demoAttachments: DemoAttachment[] = [
  {
    id: "demo-cee",
    name: demoCertificate.fileName,
    type: "application/pdf",
    size: assetSize(demoCertificate.fileName),
    path: assetPath(demoCertificate.fileName),
    category: "CEE",
    caption: "Certificado energético demo aportado por el usuario",
    ceeLetter: demoCertificate.letter,
  },
  {
    id: "demo-exterior-01-fachada",
    name: "exterior-01.png",
    type: "image/png",
    size: assetSize("exterior-01.png"),
    path: assetPath("exterior-01.png"),
    category: "EXTERIOR",
    caption: "Fachada principal",
  },
  {
    id: "demo-exterior-02-lateral",
    name: "exterior-02.png",
    type: "image/png",
    size: assetSize("exterior-02.png"),
    path: assetPath("exterior-02.png"),
    category: "EXTERIOR",
    caption: "Vista exterior lateral",
  },
  {
    id: "demo-interior-07-distribuidor",
    name: "interior-07.png",
    type: "image/png",
    size: assetSize("interior-07.png"),
    path: assetPath("interior-07.png"),
    category: "INTERIOR",
    caption: "Distribuidor de planta superior",
  },
  {
    id: "demo-interior-06-bano-suite",
    name: "interior-06.png",
    type: "image/png",
    size: assetSize("interior-06.png"),
    path: assetPath("interior-06.png"),
    category: "INTERIOR",
    caption: "Baño principal / baño en suite",
  },
  {
    id: "demo-interior-05-dormitorio",
    name: "interior-05.png",
    type: "image/png",
    size: assetSize("interior-05.png"),
    path: assetPath("interior-05.png"),
    category: "INTERIOR",
    caption: "Dormitorio principal",
  },
  {
    id: "demo-interior-04-acceso-escalera",
    name: "interior-04.png",
    type: "image/png",
    size: assetSize("interior-04.png"),
    path: assetPath("interior-04.png"),
    category: "INTERIOR",
    caption: "Acceso y escalera interior",
  },
  {
    id: "demo-interior-02-cocina",
    name: "interior-02.png",
    type: "image/png",
    size: assetSize("interior-02.png"),
    path: assetPath("interior-02.png"),
    category: "INTERIOR",
    caption: "Cocina",
  },
  {
    id: "demo-interior-01-salon",
    name: "interior-01.png",
    type: "image/png",
    size: assetSize("interior-01.png"),
    path: assetPath("interior-01.png"),
    category: "INTERIOR",
    caption: "Salón principal",
  },
  {
    id: "demo-exterior-03-piscina",
    name: "exterior-03.png",
    type: "image/png",
    size: assetSize("exterior-03.png"),
    path: assetPath("exterior-03.png"),
    category: "EXTERIOR",
    caption: "Vista exterior posterior con piscina",
  },
];

export function getDemoAttachmentById(id: string): DemoAttachment | undefined {
  return demoAttachments.find((attachment) => attachment.id === id);
}

export function getDemoAssetPath(id: string): string | undefined {
  const attachment = getDemoAttachmentById(id);
  if (!attachment) return undefined;
  return path.join(process.cwd(), "public", attachment.path);
}

export function getDemoAssetPathByFileName(fileName: string): string {
  return path.join(process.cwd(), "public", DEMO_ASSET_BASE, fileName);
}

export function getDemoAssessmentPayload() {
  return {
    propertyData: demoProperty,
    attachments: demoAttachments,
    isDemo: true,
    publicRef: demoPublicRef,
  };
}
