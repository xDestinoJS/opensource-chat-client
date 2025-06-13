import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getConvexSiteUrl() {
	const baseConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
	let convexSiteUrl;

	if (baseConvexUrl.includes(".cloud")) {
		convexSiteUrl = baseConvexUrl.replace(/\.cloud$/, ".site");
	} else {
		const url = new URL(baseConvexUrl);
		url.port = String(Number(url.port) + 1);
		convexSiteUrl = url.toString();
	}

	return convexSiteUrl;
}
