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
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useAgentModalStore } from "@/stores/use-agent-modal";
import { Copy, ImageIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import uploadFile from "@/utils/upload-file";

const formSchema = z.object({
	title: z.string().max(50),
	description: z.string().max(100),
	imageUrl: z.string(),
	modelId: z.string().max(50),
	systemPrompt: z.string().max(450),
	sessionToken: z.string().max(50),
});

export default function AgentModal() {
	const { agent, isOpen, setAgent, close } = useAgentModalStore();
	const { data: sessionData } = useSession();

	const [preview, setPreview] = useState<string | null | undefined>(null);
	const [file, setFile] = useState<File | null>(null);
	const [link, setLink] = useState("");

	const fileInputRef = useRef<HTMLInputElement | null>(null);

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

	const pickFile = () => fileInputRef.current?.click();

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const f = e.target.files?.[0];
			if (!f) return;
			setFile(f);
			setPreview(URL.createObjectURL(f));
		},
		[]
	);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!sessionData) return;

		if (file) {
			const res = await uploadFile(file);
			if (!res?.uploadUrl) {
				toast.error("An error occured while uploading the image.");
				return;
			}
			values.imageUrl = res.uploadUrl;
		}

		if (!agent) {
			await createAgent({
				title: values.title,
				description: values.description,
				imageUrl: values.imageUrl,
				systemPrompt: values.systemPrompt,
				sessionToken: sessionData.session.token,
			});
			toast.success("Created agent succesfully!");
		} else {
			await updateAgent({
				id: agent._id,
				title: values.title,
				imageUrl: values.imageUrl,
				description: values.description,
				systemPrompt: values.systemPrompt,
				sessionToken: sessionData.session.token,
			});
			toast.success("Updated agent succesfully!");
		}

		close();
	};

	useEffect(() => {
		if (agent) {
			form.reset({
				title: agent.title,
				description: agent.description,
				systemPrompt: agent.systemPrompt,
				imageUrl: agent.imageUrl,
			});
			setPreview(agent.imageUrl);
			setLink(`${window.location.origin}/chat/agents/${agent._id}`);
		}
	}, [agent, form]);

	useEffect(() => {
		if (!isOpen) {
			setPreview(null);
			setFile(null);
			setLink("");
			setAgent(null);
		}
	}, [isOpen, setAgent]);

	useEffect(() => {
		return () => {
			if (preview) URL.revokeObjectURL(preview);
		};
	}, [preview]);

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{agent ? "Update" : "Create"} Agent</DialogTitle>
					<DialogDescription>
						{agent ? "Update" : "Create"} your very own agent.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="w-full flex flex-col gap-2 items-center">
							<button
								type="button"
								onClick={pickFile}
								className="relative flex flex-col cursor-pointer justify-center items-center gap-1 size-30 group bg-foreground/5 hover:bg-foreground/10 rounded-full overflow-clip"
							>
								{preview ? (
									<img
										src={preview}
										alt="preview"
										className="absolute inset-0 w-full h-full object-cover"
									/>
								) : (
									<>
										<ImageIcon />
										<span>Upload</span>
									</>
								)}
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								hidden
								onChange={handleFileChange}
							/>
						</div>

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
								type="button"
								variant="destructive"
								onClick={async () => {
									if (agent && sessionData) {
										await deleteAgent({
											id: agent._id,
											sessionToken: sessionData.session.token,
										});
										toast.success("Agente eliminado.");
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
											toast.success("Link copiado.");
										}}
									>
										<Copy />
										Copy link
									</Button>
								)}
								<Button
									variant="highlight"
									type="submit"
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
