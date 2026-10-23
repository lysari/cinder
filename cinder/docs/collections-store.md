# src/mainview/app/core/stores/collections.store.ts

App-wide cache of each database's root collection ids, used by the sidebar and the explorer database page.

- `loadRootCollections` loads a database's list once; it does nothing while that list is loaded or loading, and retries after a failure.
- `refreshRootCollections` always reloads, for the refresh buttons. Creating or deleting documents does not refresh the list by itself.
- Entries are keyed by the JSON array of account id, project id and database id.
