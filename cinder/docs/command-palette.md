# src/mainview/app/shared/layout/main-layout/command-palette/command-palette.component.ts

Cmd+K (View → Command Palette…) opens a modal `<dialog>` over the window (`showModal`, so the rest of the page is inert and focus stays inside). Focus returns to the element that had it when the palette closes.

## Results

Fuzzy-matched (`shared/utils/fuzzy-match.ts`) against "label detail", grouped in this order with a heading each, at most 8 per group:

| Group | Items | Choosing |
|---|---|---|
| Accounts | every account | expands it in the sidebar and loads its projects; the palette stays open with an empty search |
| Projects | projects already loaded | expands it (and its account) and loads its databases; stays open |
| Databases | databases already loaded | opens the database page, expands it in the sidebar (which loads its root collections); closes |
| Collections | root collections already loaded | opens the collection page in the current tab; closes |
| Tabs | open tabs | switches to it |
| Actions | New query (current database), Export collection and Import into collection (current collection), Add account, Show tasks, New tab, Close tab | runs it |

So the whole tree is reachable from the keyboard: an account, then a project, then a database. "Current" means the active tab's route (`routeContextOf`).

## Keyboard and roles

- The input is a `combobox` (`aria-controls` the `listbox`, `aria-activedescendant` the active `option`); groups are `role="group"` labelled by their heading.
- ArrowDown / ArrowUp move the active option (wrapping) and scroll it into view; Enter chooses; Escape (the dialog's `cancel`) or a click on the backdrop closes; Tab is kept in the input.
- Typing resets the active option to the first match. Mouse hover moves the active option; a click chooses without stealing focus from the input.
