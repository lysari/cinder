export type Loadable<T> = { status: "loading" } | { status: "loaded"; value: T } | { status: "failed"; error: string };
