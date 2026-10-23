# src/mainview/app/features/query/components/query-builder/query-builder.component.ts

The builder owns a typed `FormGroup` (filters and orders are `FormArray`s the user adds to and removes from) but takes its values from the `value` input and reports every change with `valueChange`, so the page can store them.

- It rebuilds the form only when `value` is a different object from the one it last emitted. The page stores exactly the emitted object, so typing never rebuilds the form (which would drop focus); a value set by the store, e.g. after switching from JavaScript, rebuilds it.
- Choosing in, not-in or array-contains-any on a filter with no list values starts the list with the row's single value.
- Choosing the boolean type sets the text to `true` unless it is `true` or `false`; null clears it. Booleans travel as the text `"true"`/`"false"` (`query-form.ts`).
