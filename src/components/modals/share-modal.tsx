import { Link2Icon } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function ShareModal() {
	return (
		<Dialog open={false}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Share public link to chat</DialogTitle>
					<DialogDescription>
						Your name, custom instructions, and any messages you add after
						sharing stay private.
					</DialogDescription>
				</DialogHeader>

				<div className="flex w-full gap-2 rounded-lg">
					<Input className="grow" />
					<Button>
						<Link2Icon /> Create link
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
