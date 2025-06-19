import { Button } from "@/components/ui/button";
import { Doc } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";

function Content({ agent }: { agent: Doc<"agents"> }) {
	return (
		<div className="flex gap-3.5 justify-start items-center w-full h-full overflow-hidden">
			{agent.imageUrl && (
				<Image
					src={agent.imageUrl}
					alt={`${agent.title} Icon`}
					className="size-20 aspect-square rounded-full"
					width={50}
					height={50}
					unoptimized
				/>
			)}
			<div className="flex flex-col grow min-w-0 text-left">
				<h1 className="text-xl font-bold">{agent.title}</h1>
				<p className="line-clamp-3 break-words whitespace-normal">
					{agent.description}
				</p>
			</div>
		</div>
	);
}

export default function AgentButton({
	agent,
	onClick,
}: {
	agent: Doc<"agents">;
	onClick?: () => void;
}) {
	return (
		<Button
			className="flex gap-5 w-full h-full p-3.5 shadow-none rounded-lg bg-primary/2.5 hover:bg-primary/5 border border-primary/5"
			variant="secondary"
			onClick={() => {
				if (onClick) {
					onClick();
				}
			}}
			asChild={!onClick ? true : false}
		>
			{onClick ? (
				<Content agent={agent} />
			) : (
				<Link href={`/chat/agents/${agent._id}`}>
					<Content agent={agent} />
				</Link>
			)}
		</Button>
	);
}
