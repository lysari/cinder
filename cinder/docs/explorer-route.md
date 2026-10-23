# src/mainview/app/shared/utils/explorer-route.ts

Builds the router commands of the explorer pages:

| Page | URL |
|---|---|
| Database | `#/explorer/<accountId>/<projectId>/<databaseId>` |
| Collection | `#/explorer/<accountId>/<projectId>/<databaseId>/c/<collectionPath>` |
| New document | `#/explorer/<accountId>/<projectId>/<databaseId>/c/<collectionPath>/new` |
| Document | `#/explorer/<accountId>/<projectId>/<databaseId>/d/<documentPath>` |

## Encoding

- A collection or document path of any depth is one URL segment. The helpers pass it as one router command, and Angular's `DefaultUrlSerializer` percent-encodes it (`/` as `%2F`, `(` `)` `;` `=` `?` `#` `%` and non-ASCII too), so `users/dara/orders` becomes `users%2Fdara%2Forders`. The router decodes the param back to the exact path, which reaches the page as its `collectionPath` or `documentPath` input.
- `c` and `d` tell the two kinds apart, so a route never has to guess from the number of ids.
- Always navigate with these commands (`routerLink` or `Router.navigate`), never by joining a URL string by hand: a hand-built URL with a raw `/` in the path would split the path into several segments and match no route.
