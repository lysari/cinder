import type { Loadable } from "../interfaces/loadable.interface";
import { errorMessage } from "./error-message";

/** Runs a request and returns its outcome as a loaded value or a failure message. Pass the request as a function. */
export async function load<T>(request: () => Promise<T>): Promise<Loadable<T>> {
	try {
		return { status: "loaded", value: await request() };
	} catch (error) {
		return { status: "failed", error: errorMessage(error) };
	}
}
