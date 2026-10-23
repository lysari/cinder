# src/mainview/app/core/services/rpc.service.ts

The only place in the webview that creates `Electroview`. Stores call `request.<name>(params, options)`.

- `taskUpdates`, `liveUpdates`, `menuActions` and `tabOpenRequests` are `Subject`s of the `taskUpdated`, `liveUpdated`, `menuActionInvoked` and `tabOpenRequested` messages. The handler runs inside `NgZone`, because the message arrives from the native bridge, so subscribers update the view.
- Electrobun's default request timeout is 1 second, so the service sets 60 seconds for every request.
- Requests that wait for the user (the file dialog of `importServiceAccount`, `signInWithGoogle`) pass `{ maxRequestTime: Infinity }`; the main process ends a sign-in after 5 minutes itself.
- A request whose main-process handler throws rejects with an `Error` carrying the handler's message.
- `send.<name>(payload)` sends a message to the main process (`saveViewState`); it has no answer.
