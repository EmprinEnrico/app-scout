// Objective history contracts and portable history archive helpers.

export type ObjectiveVersionReason = "edit" | "completion" | "baseline";

export type ObjectiveVersion = {
  id: string;
  areaId: string;
  createdAt: string;
  content: string;
  reason: ObjectiveVersionReason;
};

export type ObjectiveHistoryArchive = {
  schemaVersion: 1;
  objectiveVersions: ObjectiveVersion[];
};

export function serializeObjectiveHistory(versions: ObjectiveVersion[]): string {
  return JSON.stringify({ schemaVersion: 1, objectiveVersions: versions }, null, 2);
}

export function parseObjectiveHistory(json: string): ObjectiveVersion[] {
  const value: unknown = JSON.parse(json);
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid objective history archive.");
  }
  const archive = value as Partial<ObjectiveHistoryArchive>;
  if (archive.schemaVersion !== 1 || !Array.isArray(archive.objectiveVersions)) {
    throw new Error("Unsupported objective history archive.");
  }
  for (const version of archive.objectiveVersions) {
    if (!version || typeof version !== "object"
      || typeof version.id !== "string" || typeof version.areaId !== "string"
      || typeof version.createdAt !== "string" || typeof version.content !== "string"
      || !["edit", "completion", "baseline"].includes(version.reason)) {
      throw new Error("Invalid objective version.");
    }
  }
  return archive.objectiveVersions;
}
