// Markdown editor tests: protect line preservation during browser editing.
import { describe, expect, it } from "vitest";
import { editorLinesToText } from "./MarkdownEditor";

describe("editorLinesToText", () => {
  it("keeps empty lines between milestones and tasks", () => {
    expect(editorLinesToText(["Milestone", "", "- Task"])).toBe(
      "Milestone\n\n- Task",
    );
  });

  it("normalizes non-breaking spaces without changing line boundaries", () => {
    expect(editorLinesToText(["A\u00a0B", "- C"])).toBe("A B\n- C");
  });
});
