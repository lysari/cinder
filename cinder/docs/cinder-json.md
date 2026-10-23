# src/shared/utils/cinder-json.ts

Writes and reads the lossless Cinder export formats. The export task (`export-task.md`) writes them, the import task (`import-task.md`) and the main process's file summary (`import-file.md`) read them.

## Cinder JSON (format version 1)

One JSON object. The header fields come first, so a reader can stop after the first few kilobytes:

```json
{
	"format": "cinder-json",
	"version": 1,
	"exportedAt": "2026-10-23T09:30:00.000Z",
	"projectId": "demo-cinder",
	"databaseId": "(default)",
	"source": { "type": "collection", "collectionPath": "users", "isRecursive": true },
	"rootPath": "users",
	"documents": [
		{"path":"users/dara","createTime":{"seconds":1,"nanos":0},"updateTime":{"seconds":1,"nanos":0},"fields":{"age":{"type":"integer","value":"30"}}},
		{"path":"users/dara/orders/1","createTime":…,"updateTime":…,"fields":{}}
	],
	"documentCount": 2
}
```

| Field | Meaning |
|---|---|
| `format`, `version` | `cinder-json` and `1`. A reader refuses another format or a newer version. |
| `exportedAt` | when the export started, UTC ISO 8601 |
| `projectId`, `databaseId` | where the documents came from |
| `source` | the `ExportSource` of the task: collection (with `isRecursive`), collection group, structured query, or document |
| `rootPath` | the collection every document lies below: the collection, the document's parent collection, or a query's collection; `null` for a collection group or group query |
| `documents` | one object per document, one per line: its full `path`, `createTime`, `updateTime` and `fields` |
| `documentCount` | written last, after the documents |

`fields` holds tagged values (`FirestoreValue` in `firestore-value.interface.ts`): `{ "type": "integer", "value": "9007199254740993" }`, `{ "type": "double", "value": 2 }`, `{ "type": "timestamp", "value": { "seconds": …, "nanos": … } }`, `bytes` as base64, `reference` as a document path, `geopoint`, `vector`, `array`, `map`. Integers are decimal strings, so every 64-bit digit survives; a double is a JSON number or `"NaN"`, `"Infinity"`, `"-Infinity"`; a negative zero is written as the JSON number `-0` (`toJsonText`), which `JSON.parse` and the streaming parser read back as `-0`.

Documents are ordered: each page of a collection, then the subcollections of each document of that page, depth first.

## Cinder NDJSON (format version 1)

The first line is the header object (the same fields as above with `"format": "cinder-ndjson"`, no `documents` and no `documentCount`); every following line is one document object. Lines end with `\n`; a reader also accepts `\r\n` and skips blank lines.

## Reading

- `parseCinderHeader` checks the format name and version and returns `rootPath` and `exportedAt`.
- `parseCinderDocument` checks the path (`isDocumentPath`) and every tagged value with the same rules as the RPC parser (`parseFields` in `firestore-value-parser.ts`), so a hand-edited file fails per document with a reason instead of writing bad data.
- `createTime` and `updateTime` are informational; Firestore sets new ones on import.
