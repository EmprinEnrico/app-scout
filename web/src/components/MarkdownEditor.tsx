// Markdown editor: provides a plain, browser-native contenteditable document.
import { useEffect, useRef, type KeyboardEvent } from "react";

function textFromEditor(editor: HTMLDivElement): string {
  return editor.innerText.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
}

function setCaretPosition(editor: HTMLDivElement, position: number) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(0, position);
  let node = walker.nextNode();

  while (node) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) {
      range.setStart(node, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= length;
    node = walker.nextNode();
  }

  range.selectNodeContents(editor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function MarkdownEditor({
  initialValue,
  initialCaret,
  ariaLabel,
  onExit,
}: {
  initialValue: string;
  initialCaret: number;
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
    setCaretPosition(editor, initialCaret);
  }, [initialCaret]);

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
      {initialValue}
    </div>
  );
}
