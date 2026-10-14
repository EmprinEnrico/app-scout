// Persistence tests: verify version snapshots and archive behavior in IndexedDB.
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createInitialState } from "./goalState";
import {
  loadGoalState,
  loadObjectiveVersions,
  recordObjectiveVersion,
  replaceGoalArchive,
  saveGoalState,
} from "./goalsDb";

function initial() {
  let index = 0;
  return createInitialState(() => `test-id-${++index}`, "2026-01-01T00:00:00.000Z");
}

describe("objective file history", () => {
  it("keeps one baseline and groups draft saves into a committed version", async () => {
    const base = initial();
    await replaceGoalArchive(base, []);
    const areaId = base.selectedAreaId;
    expect(await loadObjectiveVersions(areaId)).toHaveLength(1);

    const firstDraft = {
      ...base,
      areas: base.areas.map((area) => ({ ...area, name: "Imparare spagnolo" })),
    };
    const finalDraft = {
      ...firstDraft,
      areas: firstDraft.areas.map((area) => ({ ...area, name: "Imparare lo spagnolo" })),
    };
    await saveGoalState(firstDraft);
    await saveGoalState(finalDraft);
    expect(await loadObjectiveVersions(areaId)).toHaveLength(1);

    await recordObjectiveVersion(areaId);
    await recordObjectiveVersion(areaId);
    const versions = await loadObjectiveVersions(areaId);
    expect(versions).toHaveLength(2);
    expect(versions[1]!.content).toContain("# Imparare lo spagnolo");
    expect((await loadGoalState(base)).areas[0]!.name).toBe("Imparare lo spagnolo");
  });

  it("replaces history together with current data on archive restore", async () => {
    const base = initial();
    await replaceGoalArchive(base, []);
    const before = await loadObjectiveVersions(base.selectedAreaId);
    await replaceGoalArchive(base, before);
    expect(await loadObjectiveVersions(base.selectedAreaId)).toEqual(before);
    expect((await loadGoalState(base)).areas[0]!.name).toBe(base.areas[0]!.name);
  });
});
