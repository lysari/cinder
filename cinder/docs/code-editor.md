# src/mainview/app/shared/components/code-editor.component.ts

A JavaScript editor on CodeMirror 6 (`codemirror` `basicSetup`: line numbers, bracket matching, autocompletion, search, history).

## API

| Member | Meaning |
|---|---|
| `value` (input) | the text; a new value that differs from the document replaces it |
| `label` (input) | the `aria-label` of the editable content |
| `completionSources` (input) | CodeMirror completion sources added to the JavaScript language, e.g. `completeScriptContext` |
| `valueChange` (output) | the whole text after every edit |
| `runRequested` (output) | Cmd/Ctrl+Enter |

## Hidden constraints

- The view is created in `afterNextRender` and destroyed with the component (`DestroyRef`). `label` and `completionSources` are read once when it is created.
- Writing `value` back from `valueChange` causes no loop: the effect only dispatches when the text differs from the document.
- `basicSetup` binds Mod-Enter to "insert blank line"; the run binding uses `Prec.highest` and returns true, so the line is not inserted.
- The theme (`EditorView.theme`) and the highlight style use only CSS custom properties (`--bg-input`, `--code-keyword`, `--code-selection` …). The palette switches them for dark mode, so one theme serves both schemes; the `--code-*` colours live in `_palette.scss`.
- Angular change detection is coalesced into animation frames (`eventCoalescing`), so code that drives the page by DOM must wait a frame after an input before reading the DOM.
