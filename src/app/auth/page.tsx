"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { RiGoogleFill } from "react-icons/ri";

export default function AuthPage() {
	async function signInWithGoogle() {
		await authClient.signIn.social({
			provider: "google",
		});
	}

	return (
		<main className="flex justify-center items-center">
			<Button onClick={signInWithGoogle}>
				<RiGoogleFill /> Sign in with Google
			</Button>
		</main>
	);
}
