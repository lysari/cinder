# src/mainview/app/core/services/rpc.service.ts

The only place in the webview that creates `Electroview`. Stores call `request.<name>(params, options)`.

- Electrobun's default request timeout is 1 second, so the service sets 60 seconds for every request.
- Requests that wait for the user (the file dialog of `importServiceAccount`, `signInWithGoogle`) pass `{ maxRequestTime: Infinity }`; the main process ends a sign-in after 5 minutes itself.
- A request whose main-process handler throws rejects with an `Error` carrying the handler's message.
