# src/mainview/app/shared/utils/value-draft.ts

The field editor's model: a `ValueDraft` (`shared/interfaces/value-draft.interface.ts`) holds what the user typed, so an invalid input can stay on screen with its error. `valueFromDraft` turns a valid draft back into a tagged value.

## Inputs per type

| Type | Draft | Accepted input |
|---|---|---|
| string | text | anything, newlines included |
| integer | text | a whole number in the signed 64-bit range |
| double | text | a decimal or exponent number, or `NaN`, `Infinity`, `-Infinity` |
| timestamp | text | ISO 8601 with an offset: `YYYY-MM-DDTHH:MM[:SS[.fraction]]` then `Z` or `±HH:MM`, years 1 to 9999; a space may replace `T` |
| geopoint | latitude and longitude texts | -90 to 90 and -180 to 180 |
| reference | text | a document path |
| bytes | text | padded base64 |
| vector | text | numbers separated by commas |
| boolean, null | value | — |
| map | field drafts | names present, valid and unique |
| array | item drafts | no array directly inside an array |

## Hidden constraints

- Digits of any script are read as numbers (Khmer `១២៣` reads as `123`). The digit table is built once from every numbering system `Intl` supports, keeping only glyphs that are Unicode decimal digits.
- A timestamp draft starts from the UTC ISO text with full nanosecond precision, so an untouched timestamp reads back exactly.
- Switching between text types keeps the typed text; switching to another type starts from an empty value (a new timestamp starts at the current second).
- Field drafts get an increasing `id` for list tracking, and are sorted by name in Firestore's order (UTF-16 code units, `compareNames`).
- `diffFields` compares values by their JSON with map keys sorted, so a map that only changed key order is not a change.
