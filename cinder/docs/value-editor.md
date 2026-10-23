# src/mainview/app/shared/components/value-editor/value-editor.component.ts

One recursive component edits any `ValueDraft`; with `isRoot` it edits a document's fields (the root map) without a type select of its own.

- It never changes its input. Every edit emits a whole new draft for its level (`draftChange`), and each parent replaces that child and emits upward, so the page receives a new root draft per keystroke.
- Each emit is computed from the component's current input. Two input events dispatched in the same task, before change detection runs, would base the second on the stale input; real typing always runs change detection between events.
- Map fields are tracked by their draft `id`, array items by index, so inputs keep focus while typing.
- Nested entries sit in a `.children` block shifted left by the name column (`--value-editor-name-width` plus the gap) and indented by `--value-editor-indent`, so every nesting level indents by the same amount. Changing the name column width keeps this aligned because both use the same custom property.
- Strings use a textarea (up to 8 rows tall) so newlines survive editing.
