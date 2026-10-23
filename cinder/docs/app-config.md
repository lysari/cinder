# app.config.ts

- The router uses hash URLs (`withHashLocation`). The view loads from `views://mainview/index.html`; with path URLs the router rewrites the address to `views://mainview/`, which no longer points at a file.
- `withComponentInputBinding` passes route params to page inputs, e.g. the explorer database page's `accountId`, `projectId` and `databaseId`.
- Lucide icons render by name (`<lucide-icon name="plus" />`) only when the icon is listed in the `LucideIconProvider` registered here. lucide-angular 1.0.0 components are not standalone, so components import `LucideAngularModule`. Add each new icon to the provider list.
