"use client";

import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import copyToClipboard from "@/utils/copy-to-clipboard";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SettingsItem from "@/app/settings/components/settings-item";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useSession } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { useAgentModalStore } from "@/stores/use-agent-modal";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";

const formSchema = z.object({
	title: z.string().min(0).max(50),
	description: z.string().min(0).max(100),
	image: z.object({
		name: z.string(),
		fileId: z.string(),
		uploadUrl: z.string(),
	}),
	modelId: z.string().min(0).max(50),
	systemPrompt: z.string().min(0).max(450),
	sessionToken: z.string().min(0).max(50),
});

export default function AgentModal() {
	const { agent, isOpen, setAgent, close } = useAgentModalStore();
	const { data: sessionData } = useSession();

	const [link, setLink] = useState("");

	const createAgent = useMutation(api.agents.createAgent);
	const updateAgent = useMutation(api.agents.updateAgent);
	const deleteAgent = useMutation(api.agents.deleteAgent);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			systemPrompt: "",
			sessionToken: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		if (sessionData) {
			if (!agent) {
				const agentId = await createAgent({
					title: values.title,
					description: values.description,
					systemPrompt: values.systemPrompt,
					sessionToken: sessionData.session.token,
				});

				close();
				toast.success("Created agent succesfully!");
			} else {
				await updateAgent({
					id: agent._id,
					title: values.title,
					description: values.description,
					systemPrompt: values.systemPrompt,
					sessionToken: sessionData.session.token,
				});

				toast.success("Updates agent succesfully!");
			}
		}
	}

	useEffect(() => {
		if (agent) {
			form.setValue("title", agent.title);
			form.setValue("description", agent.description);
			form.setValue("systemPrompt", agent.systemPrompt);
			setLink(window.location.origin + "/chat/agents/" + agent._id);
		}
	}, [agent]);

	useEffect(() => {
		if (!isOpen) {
			setAgent(null);
		}
	}, [isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{agent ? "Update" : "Create"} Agent</DialogTitle>
					<DialogDescription>
						{agent ? "Update" : "Create"} your very own agent, a bot specialized
						in anything you need.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<SettingsItem title="Title" size="sm" form>
									<FormControl>
										<Input placeholder="Title" {...field} />
									</FormControl>
								</SettingsItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<SettingsItem title="Description" size="sm" form>
									<FormControl>
										<Textarea placeholder="Description" {...field} />
									</FormControl>
								</SettingsItem>
							)}
						/>
						<FormField
							control={form.control}
							name="systemPrompt"
							render={({ field }) => (
								<SettingsItem title="System Prompt" size="sm" form>
									<FormControl>
										<Textarea placeholder="System Prompt" {...field} />
									</FormControl>
								</SettingsItem>
							)}
						/>

						<div className="w-full flex justify-between">
							<Button
								type="submit"
								variant="destructive"
								onClick={async () => {
									if (agent && sessionData) {
										await deleteAgent({
											id: agent._id,
											sessionToken: sessionData.session.token,
										});
										toast.success("Deleted agent succesfully!");
										close();
									}
								}}
							>
								Delete Agent
							</Button>
							<div className="flex gap-2 items-center">
								{link && (
									<Button
										type="button"
										variant="ghost"
										onClick={() => {
											copyToClipboard(link);
											toast.success("Copied link to clipboard!");
										}}
									>
										<Copy /> Copy link
									</Button>
								)}
								<Button
									type="button"
									variant="highlight"
									onClick={() => onSubmit(form.getValues())}
								>
									Submit
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
