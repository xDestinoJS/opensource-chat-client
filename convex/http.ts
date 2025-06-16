import { httpRouter } from "convex/server";
import { triggerImageGeneration, streamTextAnswer } from "./generate";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
	path: "/generate/text",
	method: "POST",
	handler: streamTextAnswer,
});

http.route({
	path: "/generate/image",
	method: "POST",
	handler: triggerImageGeneration,
});

http.route({
	path: "/generate/text",
	method: "OPTIONS",
	handler: httpAction(async (_, request) => {
		const headers = request.headers;
		if (
			headers.get("Origin") !== null &&
			headers.get("Access-Control-Request-Method") !== null &&
			headers.get("Access-Control-Request-Headers") !== null
		) {
			return new Response(null, {
				headers: new Headers({
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST",
					"Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
					"Access-Control-Max-Age": "86400",
				}),
			});
		} else {
			return new Response();
		}
	}),
});

http.route({
	path: "/generate/image",
	method: "OPTIONS",
	handler: httpAction(async (_, request) => {
		const headers = request.headers;
		if (
			headers.get("Origin") !== null &&
			headers.get("Access-Control-Request-Method") !== null &&
			headers.get("Access-Control-Request-Headers") !== null
		) {
			return new Response(null, {
				headers: new Headers({
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST",
					"Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
					"Access-Control-Max-Age": "86400",
				}),
			});
		} else {
			return new Response();
		}
	}),
});

export default http;
