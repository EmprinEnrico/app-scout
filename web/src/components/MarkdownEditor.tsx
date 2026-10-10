// Markdown editor: provides a plain, browser-native contenteditable document.
import { useEffect, useRef, type KeyboardEvent } from "react";

function textFromEditor(editor: HTMLDivElement): string {
  const clone = editor.cloneNode(true) as HTMLDivElement;
  clone.querySelectorAll("[data-editor-metadata]").forEach((node) => node.remove());
  return clone.innerText.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
}

function lineAndOffset(value: string, position: number): { line: number; offset: number } {
  const lines = value.split("\n");
  let remaining = Math.max(0, position);
  for (const [line, text] of lines.entries()) {
    if (remaining <= text.length) return { line, offset: remaining };
    remaining -= text.length + 1;
  }
  return { line: lines.length - 1, offset: lines.at(-1)?.length ?? 0 };
}

function setCaretPosition(editor: HTMLDivElement, value: string, position: number) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  const target = lineAndOffset(value, position);
  const lines = editor.querySelectorAll<HTMLElement>("[data-editor-line]");
  const line = lines[target.line];
  const textNode = line?.firstChild?.nodeType === Node.TEXT_NODE ? line.firstChild : null;
  if (line && textNode) {
    range.setStart(textNode, Math.min(target.offset, textNode.textContent?.length ?? 0));
  } else if (line) {
    range.selectNodeContents(line);
    range.collapse(true);
  } else {
    range.selectNodeContents(editor);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

export function MarkdownEditor({
  initialValue,
  initialCaret,
  metadata,
  ariaLabel,
  onExit,
}: {
  initialValue: string;
  initialCaret: number;
  metadata: string[][];
  ariaLabel: string;
  onExit: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(initialValue);
  const closedRef = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    setCaretPosition(editor, initialValue, initialCaret);
  }, [initialCaret, initialValue]);

  function exit() {
    if (closedRef.current) return;
    closedRef.current = true;
    const editor = editorRef.current;
    onExit(editor ? textFromEditor(editor) : valueRef.current);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" && event.key !== "Esc") return;
    event.preventDefault();
    exit();
  }

  const lines = initialValue.split("\n");

  return (
    <div
      ref={editorRef}
      className="markdown-editor"
      aria-label={ariaLabel}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onInput={(event) => {
        valueRef.current = textFromEditor(event.currentTarget);
      }}
      onBlur={exit}
      onKeyDown={handleKeyDown}
    >
      {lines.map((line, index) => (
        <div className="editor-line-group" key={index}>
          {metadata[index]?.map((entry) => (
            <span
              className="editor-metadata"
              contentEditable={false}
              data-editor-metadata
              key={entry}
            >
              {entry}
            </span>
          ))}
          <span data-editor-line>{line || <br />}</span>
        </div>
      ))}
    </div>
  );
}
