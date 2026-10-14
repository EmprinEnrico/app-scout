// Objective history archive tests: validate portable snapshot round trips.
import { describe, expect, it } from "vitest";
import {
  parseObjectiveHistory,
  serializeObjectiveHistory,
  type ObjectiveVersion,
} from "./objectiveHistory";

const version: ObjectiveVersion = {
  id: "version-1",
  areaId: "area-1",
  createdAt: "2026-10-13T12:00:00.000Z",
  content: "# Objective\n",
  reason: "baseline",
};

describe("objective history archives", () => {
  it("round trips snapshots", () => {
    expect(parseObjectiveHistory(serializeObjectiveHistory([version]))).toEqual([version]);
  });

  it("rejects malformed snapshots", () => {
    expect(() => parseObjectiveHistory(JSON.stringify({
      schemaVersion: 1,
      objectiveVersions: [{ ...version, reason: "unknown" }],
    }))).toThrow("Invalid objective version.");
  });
});
