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
  fileName: "cee-demo.pdf",
  letter: calculateScoreV2(demoProperty).estimatedLetter,
  title: "Certificado de Eficiencia Energetica - Documento demo",
  summary: "Supuesto CEE aportado por el usuario. Documento demo sin validez oficial ni administrativa.",
};

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
    id: "demo-exterior-01",
    name: "exterior-01.jpg",
    type: "image/jpeg",
    size: assetSize("exterior-01.jpg"),
    path: assetPath("exterior-01.jpg"),
    category: "EXTERIOR",
    caption: "Fachada principal",
  },
  {
    id: "demo-exterior-02",
    name: "exterior-02.jpg",
    type: "image/jpeg",
    size: assetSize("exterior-02.jpg"),
    path: assetPath("exterior-02.jpg"),
    category: "EXTERIOR",
    caption: "Vista exterior posterior",
  },
  {
    id: "demo-interior-salon-01",
    name: "interior-salon-01.jpg",
    type: "image/jpeg",
    size: assetSize("interior-salon-01.jpg"),
    path: assetPath("interior-salon-01.jpg"),
    category: "INTERIOR",
    caption: "Salon principal",
  },
  {
    id: "demo-interior-cocina-01",
    name: "interior-cocina-01.jpg",
    type: "image/jpeg",
    size: assetSize("interior-cocina-01.jpg"),
    path: assetPath("interior-cocina-01.jpg"),
    category: "INTERIOR",
    caption: "Cocina",
  },
  {
    id: "demo-interior-dormitorio-01",
    name: "interior-dormitorio-01.jpg",
    type: "image/jpeg",
    size: assetSize("interior-dormitorio-01.jpg"),
    path: assetPath("interior-dormitorio-01.jpg"),
    category: "INTERIOR",
    caption: "Dormitorio principal",
  },
  {
    id: "demo-interior-bano-01",
    name: "interior-bano-01.jpg",
    type: "image/jpeg",
    size: assetSize("interior-bano-01.jpg"),
    path: assetPath("interior-bano-01.jpg"),
    category: "INTERIOR",
    caption: "Bano",
  },
  {
    id: "demo-cee",
    name: "cee-demo.pdf",
    type: "application/pdf",
    size: assetSize("cee-demo.pdf"),
    path: assetPath("cee-demo.pdf"),
    category: "CEE",
    caption: "CEE aportado por el usuario",
    ceeLetter: demoCertificate.letter,
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
  };
}
