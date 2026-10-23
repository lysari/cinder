# src/mainview/app/shared/utils/script-completion.ts

`completeScriptContext` completes the names the run-script context provides (see `run-script.md`).

- After `db.`, `admin.`, `admin.firestore.`, `admin.firestore.FieldValue.`, `admin.firestore.Timestamp.`, `admin.firestore.FieldPath.` and `console.` it lists that object's members.
- After any other dot (a call such as `db.collection("x").`, a variable such as `snapshot.`, or a line that starts with `.` in a chain) it lists common Query, CollectionReference, DocumentReference and snapshot members.
- Otherwise, while a word is typed (or on Ctrl+Space), it offers `db`, `admin` and `console`; `lang-javascript` adds keywords and local names itself.
- It reads only the current line before the cursor, and returns nothing inside strings, template strings, comments and regular expressions (looked up in the syntax tree).
