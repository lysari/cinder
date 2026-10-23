# src/shared/utils/query-script-parser.ts

`parseQueryScript` turns a script back into a `StructuredQuery` only when it has the shape `generateQueryScript` writes (`query-script.md`). Anything else returns `{ isParsed: false, reason }`, and the page keeps the script as JavaScript.

## Tokens

A small tokenizer reads words (`[A-Za-z_$][A-Za-z0-9_$]*`), the punctuators `. ( ) , [ ] { } ; = -`, strings and numbers, skipping any JavaScript whitespace and recording the line and whether a line break came before each token. It refuses at once:

- comments (`//`, `/*`), template literals, any other character (including `+`, non-ASCII identifiers and `\u` escapes in identifiers);
- a string with a raw line break, a line continuation, or an escape outside `\n \r \t \b \f \v \0 \' \" \\ \/ \xHH \uHHHH \u{H…}`;
- a number directly followed by a word character or a dot (`0x10`, `1_000`, `5.toString`). Numbers are decimal without leading zeros (`017` is a legacy octal in sloppy mode), with an optional fraction, exponent or `n` suffix.

## Grammar

```text
script   = "async" "function"¹ "run" "(" ")" "{"
           "const" "query" "=" "await" target where* orderBy* limit? "." "get" "(" ")" end
           "return" "query"¹ ";"? "}" ";"? EOF
target   = "db" "." ("collection" | "collectionGroup") "(" STRING ")"
where    = "." "where" "(" STRING "," OPERATOR-STRING "," value ")"
orderBy  = "." "orderBy" "(" STRING ("," ("asc" | "desc" as STRING))? ")"
limit    = "." "limit" "(" PLAIN-INTEGER ")"
value    = scalar | "[" (scalar ("," scalar)*)? "]"
scalar   = STRING | "-"? NUMBER | "true" | "false" | "null" | "NaN" | "-"? "Infinity"
         | "admin" "." "firestore" "." "Timestamp" "." "fromMillis" "(" "-"? PLAIN-INTEGER ")"
         | "new" "admin" "." "firestore" "." "Timestamp" "(" "-"? PLAIN-INTEGER "," "-"? PLAIN-INTEGER ")"
end      = ";" | a line break before "return"
```

¹ must be on the same line as the token before it: `async` + line break + `function` is not an async function, and `return` + line break returns `undefined`.

- Clause order is fixed (filters, orders, one limit), as the generator writes it. Trailing commas, holes, nested lists, objects, variables and computed members are refused.
- An order without a direction reads as ascending.
- Numbers: no `.`/exponent means integer; it must be a safe integer, or carry `n` and fit 64 bits. With `.` or an exponent it is a double and must be finite (`1e999` is refused; `Infinity` is written by name).
- `fromMillis(ms)` becomes `{ seconds: floor(ms / 1000), nanos: rest × 10^6 }`, so negative times keep non-negative nanos.

## What it does not check

Field paths, collection paths, list sizes and Firestore's combination rules are left to `validateQuery`; a parsed query can still have issues, which the builder then shows under its rows.

## Reasons

`Line N: the query builder cannot show "<token>" here.`, `Line N: the query builder cannot keep comments.`, `Line N: the query builder cannot show template literals.`, `Line N: a string is not closed.`, `Line N: the query builder cannot show this escape in a string.`, `Line N: the query builder cannot show this number.`, and `The script ends before the query is complete.`
