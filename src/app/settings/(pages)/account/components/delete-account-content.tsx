"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { createAuthClient } from "better-auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
const authClient = createAuthClient();

const DELETE_INPUT_STRING = "delete my account";

export default function DeleteAccountContent() {
	const router = useRouter();

	const [open, setOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmation, setConfirmation] = useState("");

	function handleOpen(open: boolean) {
		if (!open && isDeleting) {
			return;
		}
		setOpen(open);
	}

	async function handleDeletion() {
		setIsDeleting(true);

		const data = await authClient.deleteUser();

		if (data?.error) {
			setIsDeleting(false);
			return toast.error(data?.error?.message || "An error has occured.");
		}

		router.push("/");
	}

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>
				<Button variant="destructive" size="lg">
					Delete Account
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Account</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete your account? This action cannot be
						undone.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col ">
					<Input
						placeholder={`Type '${DELETE_INPUT_STRING}' to confirm`}
						value={confirmation}
						onChange={(e) => setConfirmation(e.target.value)}
					/>
				</div>

				<DialogFooter>
					<Button
						variant="destructive"
						disabled={isDeleting || confirmation !== DELETE_INPUT_STRING}
						onClick={handleDeletion}
					>
						{isDeleting && <Loader2 className="animate-spin" />}
						Delete Account
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
