"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export default function SignOutButton() {
	return (
		<Button
			size="sm"
			variant="ghost"
			className="text-sm text-primary/95"
			onClick={async () => {
				await signOut();
				redirect("/");
			}}
		>
			<LogOut /> Sign out
		</Button>
	);
}
