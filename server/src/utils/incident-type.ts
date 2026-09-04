/** Map refinement / SOS event types onto Prisma IncidentType. */
export function toIncidentType(raw: string): string {
  const key = raw.toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    FLOOD_REPORT: "FLOOD",
    FLOOD: "FLOOD",
    MEDICAL: "MEDICAL",
    FIRE: "FIRE",
    TRAPPED: "TRAPPED",
    MISSING_PERSON: "MISSING_PERSON",
    ROAD_BLOCKAGE: "ROAD_BLOCKAGE",
    INFRASTRUCTURE_DAMAGE: "INFRASTRUCTURE_DAMAGE",
    STRUCTURAL_DANGER: "STRUCTURAL_DANGER",
    LANDSLIDE: "LANDSLIDE",
    OTHER: "OTHER",
  };
  return map[key] ?? "OTHER";
}

export function toHazardType(raw: string): string {
  const incident = toIncidentType(raw);
  const map: Record<string, string> = {
    FLOOD: "FLOOD",
    LANDSLIDE: "LANDSLIDE",
    FIRE: "FIRE",
    STRUCTURAL_DANGER: "EARTHQUAKE",
  };
  return map[incident] ?? "OTHER";
}
