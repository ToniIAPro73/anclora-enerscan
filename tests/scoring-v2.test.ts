import { calculateScoreV2, inferClimateZoneFromZipcode } from "../src/lib/scoring";
import { PropertyDataV2 } from "../src/lib/domain/energy-assessment";

describe("inferClimateZoneFromZipcode", () => {
  it("infers Mediterranean zone correctly", () => {
    expect(inferClimateZoneFromZipcode("08001")).toBe("Aproximada: Mediterránea litoral"); // Barcelona
    expect(inferClimateZoneFromZipcode("46001")).toBe("Aproximada: Mediterránea litoral"); // Valencia
  });

  it("infers unknown when empty or invalid", () => {
    expect(inferClimateZoneFromZipcode("")).toBe("Desconocida");
    expect(inferClimateZoneFromZipcode("123")).toBe("Desconocida");
  });
});

describe("calculateScoreV2", () => {
  const baseData: PropertyDataV2 = {
    year: 2000,
    area: 100,
    zipcode: "28001",
    propertyType: "flat",
    heating: "gas",
    cooling: "split",
    waterHeating: "gas",
    windows: "double",
    renewables: "none",
    facadeInsulation: "partial",
    roofInsulation: "partial",
  };

  it("Vivienda antigua + ventanas simples + eléctrico directo -> F/G", () => {
    const data: PropertyDataV2 = {
      ...baseData,
      year: 1970,
      windows: "single",
      heating: "electric",
      waterHeating: "electric",
    };
    const result = calculateScoreV2(data);
    expect(["F", "G"]).toContain(result.estimatedLetter);
  });

  it("Vivienda reciente + bomba de calor + triple ventana + FV -> A/B/C", () => {
    const data: PropertyDataV2 = {
      ...baseData,
      year: 2021,
      windows: "triple",
      heating: "heat_pump",
      waterHeating: "heat_pump",
      renewables: "photovoltaic",
      facadeInsulation: "good",
      roofInsulation: "good",
    };
    const result = calculateScoreV2(data);
    expect(["A", "B", "C"]).toContain(result.estimatedLetter);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("Vivienda 1990 + gas + doble ventana -> rango intermedio", () => {
    const data: PropertyDataV2 = {
      ...baseData,
      year: 1990,
      heating: "gas",
      windows: "double",
    };
    const result = calculateScoreV2(data);
    expect(["D", "E"]).toContain(result.estimatedLetter);
  });

  it("CP desconocido baja confianza", () => {
    const data: PropertyDataV2 = {
      ...baseData,
      zipcode: "123", // invalid
    };
    const result = calculateScoreV2(data);
    expect(result.confidence).toBe("Media");
    expect(result.missingData).toContain("Código postal");
  });

  it("Falta envolvente baja confianza", () => {
    const data: PropertyDataV2 = {
      ...baseData,
      facadeInsulation: "unknown",
      roofInsulation: "unknown",
    };
    const result = calculateScoreV2(data);
    expect(result.confidence).toBe("Baja");
    expect(result.missingData).toContain("Aislamiento de fachada");
  });

  it("Superficie grande + sistema ineficiente penaliza", () => {
    const dataNormal: PropertyDataV2 = { ...baseData, area: 100, heating: "electric", renewables: "none" };
    const dataLarge: PropertyDataV2 = { ...baseData, area: 200, heating: "electric", renewables: "none" };
    
    const resultNormal = calculateScoreV2(dataNormal);
    const resultLarge = calculateScoreV2(dataLarge);
    
    expect(resultLarge.score).toBeGreaterThan(resultNormal.score); // Mayor score = peor
    expect(resultLarge.penalties).toContain("Superficie grande con sistemas ineficientes");
  });

  it("Piso vs unifamiliar con mismos datos produce diferencia razonable", () => {
    const dataPiso: PropertyDataV2 = { ...baseData, propertyType: "flat" };
    const dataCasa: PropertyDataV2 = { ...baseData, propertyType: "house" };
    
    const resultPiso = calculateScoreV2(dataPiso);
    const resultCasa = calculateScoreV2(dataCasa);
    
    expect(resultCasa.score).toBeGreaterThan(resultPiso.score);
  });

  it("ACS solar mejora frente a ACS eléctrico", () => {
    const dataElectric: PropertyDataV2 = { ...baseData, waterHeating: "electric" };
    const dataSolar: PropertyDataV2 = { ...baseData, waterHeating: "solar" };
    
    const resultElectric = calculateScoreV2(dataElectric);
    const resultSolar = calculateScoreV2(dataSolar);
    
    expect(resultSolar.score).toBeLessThan(resultElectric.score);
  });

  it("Renovables sin buena envolvente no garantizan A", () => {
    const data: PropertyDataV2 = {
      ...baseData,
      year: 1970,
      windows: "single",
      facadeInsulation: "none",
      roofInsulation: "none",
      renewables: "both",
    };
    const result = calculateScoreV2(data);
    expect(result.estimatedLetter).not.toBe("A"); // The penalties should push it down
  });

  it("Score siempre queda entre 0 y 100", () => {
    const dataWorst: PropertyDataV2 = {
      ...baseData,
      year: 1900,
      area: 500,
      windows: "single",
      heating: "electric",
      waterHeating: "electric",
      renewables: "none",
      propertyType: "house",
    };
    const resultWorst = calculateScoreV2(dataWorst);
    expect(resultWorst.score).toBeLessThanOrEqual(100);
    
    const dataBest: PropertyDataV2 = {
      ...baseData,
      year: 2025,
      area: 50,
      windows: "triple",
      heating: "heat_pump",
      waterHeating: "solar",
      renewables: "both",
      propertyType: "flat",
      facadeInsulation: "good",
      roofInsulation: "good",
    };
    const resultBest = calculateScoreV2(dataBest);
    expect(resultBest.score).toBeGreaterThanOrEqual(0);
  });

  it("missingData se rellena cuando faltan datos críticos", () => {
    const data: PropertyDataV2 = {
      year: 0,
      area: 0,
      zipcode: "",
      propertyType: "unknown",
      heating: "unknown",
      cooling: "unknown",
      waterHeating: "unknown",
      windows: "unknown",
      renewables: "unknown",
    };
    const result = calculateScoreV2(data);
    expect(result.missingData.length).toBeGreaterThan(5);
    expect(result.confidence).toBe("Baja");
  });
});
