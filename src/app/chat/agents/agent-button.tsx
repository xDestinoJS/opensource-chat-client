import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Doc } from "../../../../convex/_generated/dataModel";

export default function AgentButton({
	agent,
	onClick,
}: {
	agent: Doc<"agents">;
	onClick: () => void;
}) {
	return (
		<Button
			className="flex gap-5 w-full h-fit p-5 shadow-none rounded-lg bg-primary/2.5 hover:bg-primary/5 border border-primary/5"
			variant="secondary"
			onClick={onClick}
		>
			<div className="flex flex-col grow text-left">
				<h1 className="text-xl font-bold">{agent.title}</h1>
				<p className="line-clamp-3">{agent.description}</p>
			</div>
		</Button>
	);
}
