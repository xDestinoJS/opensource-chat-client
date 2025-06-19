"use client";

import AgentButton from "./agent-button";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useAgentModalStore } from "@/stores/use-agent-modal";
import { Doc } from "../../../../convex/_generated/dataModel";

export default function Agent() {
	const { data: sessionData } = useSession();
	const { setAgent, open } = useAgentModalStore();

	const ownedAgents = useQuery(
		api.agents.getOwnedAgents,
		sessionData
			? {
					sessionToken: sessionData.session.token,
				}
			: "skip"
	);

	const allAgents = useQuery(
		api.agents.getAllAgents,
		sessionData
			? {
					sessionToken: sessionData.session.token,
				}
			: "skip"
	);

	function openAgent(agent: Doc<"agents">) {
		setAgent(agent);
		open();
	}

	return (
		<main className="pt-20 px-5 flex justify-center items-center w-full">
			<div className="flex flex-col items-center gap-4 justify-center w-full max-w-3xl">
				<h1 className="text-4xl font-bold">Agents</h1>
				<p className="text-primary/80">
					Discover and create custom versions of chat bots with extra knowledge
				</p>

				<div className="flex flex-col gap-2 w-full mt-3">
					<h1 className="text-xl font-bold">Your Agents</h1>
					{!ownedAgents || ownedAgents.length == 0 ? (
						<p>You haven't created any agents yet!</p>
					) : (
						<div className="grid grid-cols-2 gap-3 w-full">
							{ownedAgents?.map((agent) => (
								<AgentButton agent={agent} onClick={() => openAgent(agent)} />
							))}
						</div>
					)}
					<div className="w-full justify-end">
						<Button onClick={() => open()} variant="highlight">
							Create Agent
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-2 w-full mt-3">
					<h1 className="text-xl font-bold">Community Agents</h1>
					{!allAgents || allAgents.length == 0 ? (
						<p>There are no community agents available.</p>
					) : (
						<div className="grid grid-cols-2 gap-3 w-full">
							{allAgents?.map((agent) => (
								<AgentButton agent={agent} onClick={() => openAgent(agent)} />
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
