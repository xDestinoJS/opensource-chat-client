"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowDown, ArrowUp, Globe, Paperclip, Square, X } from "lucide-react";

import { Button } from "../ui/button";
import { AutosizeTextarea, AutosizeTextAreaRef } from "../ui/autosize-textarea";
import { TextQuote } from "../text-quote";
import ModelDropdown from "./model-dropdown/main";

import {
	getModelDataById,
	modelHasFeature,
	ModelId,
	Provider,
} from "@/lib/providers";
import uploadFile from "@/utils/upload-file";
import { GenericFileData, UploadItem } from "@/lib/files";
import ImagePreview from "./previews/image-preview";
import PDFPreview from "./previews/pdf-preview";
import { cn } from "@/lib/utils";
import { useChatFeatures } from "@/stores/use-chat-features-store";
import {
	EffortControlSelector,
	getIconForReasoningEffort,
} from "./effort-control-selector";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSession } from "@/lib/auth-client";

type Props = {
	chatScrollManagment: {
		isAtBottom: boolean;
		scrollToBottom: () => void;
	};
	quote?: string;
	setQuote: (q: string | undefined) => void;
	modelId: ModelId | null;
	providersList: Provider[];
	setModelId: (id: ModelId) => void;
	isAnswering: boolean;
	messagesLength: number;
	onSubmit: (text: string, files: GenericFileData[]) => void;
	onCancel: () => void;
	inputContainerRef: React.RefObject<HTMLDivElement | null>;
	inputValue: string;
	setInputValue: (v: string) => void;
	textAreaRef: React.RefObject<AutosizeTextAreaRef | null>;
};

export default function ChatInputForm({
	chatScrollManagment,
	quote,
	setQuote,
	modelId,
	providersList,
	setModelId,
	isAnswering,
	messagesLength,
	onSubmit,
	onCancel,
	inputContainerRef,
	inputValue,
	setInputValue,
	textAreaRef,
}: Props) {
	const [isClient, setIsClient] = useState(false);

	const { isSearchEnabled, toggleSearch, reasoningEffort } = useChatFeatures();

	const hiddenInputRef = useRef<HTMLInputElement>(null);

	const [files, setFiles] = useState<UploadItem[]>([]);

	const { data: sessionData } = useSession();
	const remainingMessages = useQuery(
		api.users.remainingMessages,
		sessionData
			? {
					sessionToken: sessionData.session.token,
				}
			: "skip"
	);

	const modelData = useMemo(
		() => (modelId ? getModelDataById(modelId) : undefined),
		[modelId]
	);

	useEffect(() => setIsClient(true), []);

	// Allowed file types based on model features
	const allowedFileTypes = useMemo(() => {
		const accept: Record<string, string[]> = {};
		const allowedMimeTypes: string[] = [];

		if (modelHasFeature(modelId, "vision")) {
			accept["image/*"] = [".png", ".jpg", ".jpeg"];
			allowedMimeTypes.push("image/png", "image/jpg", "image/jpeg");
		}
		if (modelHasFeature(modelId, "files")) {
			accept["application/pdf"] = [".pdf"];
			allowedMimeTypes.push("application/pdf");
		}
		return { accept, allowedMimeTypes };
	}, [modelData]);

	// Filter files that are allowed whenever allowedMimeTypes changes
	useEffect(() => {
		setFiles((prevFiles) =>
			prevFiles.filter((file) =>
				allowedFileTypes.allowedMimeTypes.includes(file.mimeType ?? "")
			)
		);
	}, [allowedFileTypes.allowedMimeTypes]);

	// Upload a file and update its state
	const startUpload = useCallback(async (file: File, itemRef: UploadItem) => {
		const res = await uploadFile(file);
		if (!res) return;
		setFiles((prev) =>
			prev.map((f) =>
				f === itemRef
					? {
							...f,
							fileId: res.fileId,
							uploadUrl: res.uploadUrl,
							isUploaded: true,
						}
					: f
			)
		);
	}, []);

	// Add files from drag/drop or input
	const addFiles = useCallback(
		(incoming: File[]) => {
			incoming.forEach((file) => {
				if (!allowedFileTypes.allowedMimeTypes.includes(file.type)) {
					console.warn(
						`File type ${file.type} not allowed for the current model.`
					);
					return;
				}
				const newItem: UploadItem = {
					name: file.name,
					mimeType: file.type,
					fileId: Date.now().toString(),
					uploadUrl: URL.createObjectURL(file).toString(),
					isUploaded: false,
				};
				setFiles((prev) => [...prev, newItem]);
				startUpload(file, newItem);
			});
		},
		[allowedFileTypes.allowedMimeTypes, startUpload]
	);

	const { getRootProps, isDragActive } = useDropzone({
		onDrop: addFiles,
		noClick: true,
		noKeyboard: true,
		accept: allowedFileTypes.accept,
	});

	// Paste files from clipboard
	useEffect(() => {
		const handler = (e: ClipboardEvent) => {
			if (
				document.activeElement === textAreaRef.current?.textArea &&
				e.clipboardData
			) {
				const filesFromClipboard = Array.from(e.clipboardData.items)
					.filter((item) => item.kind === "file")
					.map((item) => item.getAsFile())
					.filter(
						(file): file is File =>
							!!file && allowedFileTypes.allowedMimeTypes.includes(file.type)
					);

				if (filesFromClipboard.length) {
					e.preventDefault();
					addFiles(filesFromClipboard);
				}
			}
		};
		document.addEventListener("paste", handler);
		return () => document.removeEventListener("paste", handler);
	}, [allowedFileTypes.allowedMimeTypes, addFiles, textAreaRef]);

	const pickFiles = () => hiddenInputRef.current?.click();
	const removeFile = (target: UploadItem) =>
		setFiles((prev) => prev.filter((f) => f !== target));

	const handleSend = () => {
		const text = inputValue.trim();
		if (!text || isAnswering || files.some((f) => !f.isUploaded)) return;

		const readyFiles: GenericFileData[] = files.map(
			({ isUploaded, ...rest }) => rest
		);

		setInputValue("");
		setFiles([]);
		onSubmit(text, readyFiles);
	};

	const inputAcceptString = useMemo(
		() => Object.values(allowedFileTypes.accept).flat().join(","),
		[allowedFileTypes.accept]
	);

	const [isLimitsPopupHidden, setIsLimitsPopupHidden] = useState(false);
	const ReasoningEffortIcon = getIconForReasoningEffort(reasoningEffort);

	return (
		<div className="sticky bottom-0 w-full" ref={inputContainerRef}>
			<div className="relative h-full w-full flex justify-center">
				<div className="absolute flex flex-col items-center justify-center -top-0 -translate-y-full left-1/2 -translate-x-1/2 w-full pointer-events-none">
					{!chatScrollManagment.isAtBottom && (
						<Button
							className="rounded-full mb-3 bg-background border border-muted-foreground/20 pointer-events-auto"
							variant="secondary"
							onClick={() => {
								chatScrollManagment.scrollToBottom();
							}}
						>
							Scroll to bottom <ArrowDown />
						</Button>
					)}
					{((remainingMessages != null &&
						!isLimitsPopupHidden &&
						remainingMessages <= 10) ||
						remainingMessages == 0) && (
						<div className="flex gap-2.5 mb-3 items-center justify-center bg-yellow-300/50 dark:bg-yellow-500/20 border border-yellow-700/30 dark:border-yellow-500/20 px-5 backdrop-blur-lg py-2.5 pointer-events-auto text-yellow-800 dark:text-yellow-100 rounded-xl shadow-sm">
							You only have {remainingMessages} messages left.
							<Link
								href={
									!sessionData?.user?.isAnonymous
										? "/settings/api-keys"
										: "/auth"
								}
								className="text-yellow-600 dark:text-yellow-300 underline"
							>
								{sessionData?.user?.isAnonymous
									? "Sign in to reset your limits."
									: "Get no limits by BYOK."}
							</Link>
							<Button
								size="icon"
								variant="ghost"
								className="size-6 text-700 dark:text-white"
								onClick={() => setIsLimitsPopupHidden(true)}
							>
								<X />
							</Button>
						</div>
					)}
				</div>
				<form
					className="relative w-full max-w-3xl max-lg:px-4 shrink-0"
					{...getRootProps()}
				>
					{isClient && (
						<input
							ref={hiddenInputRef}
							type="file"
							multiple
							accept={inputAcceptString}
							className="hidden"
							onChange={(e) =>
								e.target.files && addFiles(Array.from(e.target.files))
							}
						/>
					)}

					{isDragActive && (
						<div className="absolute inset-0 z-10 flex items-center justify-center rounded-tl-2xl rounded-tr-2xl border-2 border-dashed border-blue-500 bg-blue-500/20 text-lg font-semibold text-blue-800 backdrop-blur-sm">
							Drop your files here!
						</div>
					)}

					<div className="bg-gradient-to-b from-highlight-background/10 to-highlight-background/20 dark:from-accent/30 dark:to-gradient-bottom/60 border border-foreground/3.5 shadow-lg px-1 pt-1 backdrop-blur-lg rounded-t-3xl">
						<div className="relative z-0 rounded-t-3xl p-4 pb-2 bg-background/85 border border-foreground/3.5 dark:bg-highlight-foreground/5">
							{quote && (
								<div className="mb-2">
									<TextQuote
										quote={quote}
										variant="foreground"
										onRemove={() => setQuote(undefined)}
									/>
								</div>
							)}

							{files.length > 0 && (
								<div className="mb-2 flex h-16 w-full items-center gap-2 overflow-x-auto no-scrollbar">
									{files.map((file) =>
										file.mimeType?.startsWith("image/") ? (
											<ImagePreview
												key={file.fileId}
												fileData={file}
												onRemove={() => removeFile(file)}
											/>
										) : (
											<PDFPreview
												key={file.fileId}
												fileData={file}
												onRemove={() => removeFile(file)}
											/>
										)
									)}
								</div>
							)}

							<AutosizeTextarea
								ref={textAreaRef}
								type="transparent"
								maxHeight={170}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								placeholder="Type your message here..."
								className="w-full resize-none bg-transparent px-0.75 focus:outline-none no-scrollbar"
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSend();
									}
								}}
							/>

							<div className="mt-2 flex items-center justify-between -mx-1.25">
								<div className="flex items-center gap-1.5">
									<ModelDropdown
										modelId={modelId}
										providersList={providersList}
										setModelId={setModelId}
									/>

									{isClient && modelHasFeature(modelId, "effort-control") && (
										<EffortControlSelector>
											<Button
												size="xs"
												variant="outline"
												type="button"
												className="shadow-none"
											>
												<ReasoningEffortIcon />
												<span className="capitalize">{reasoningEffort}</span>
											</Button>
										</EffortControlSelector>
									)}

									{isClient && modelHasFeature(modelId, "search") && (
										<Button
											size="xs"
											variant="outline"
											type="button"
											className={cn(
												"shadow-none",
												isSearchEnabled &&
													"bg-primary/10 hover:bg-primary/15 border-primary"
											)}
											onClick={() => toggleSearch()}
										>
											<Globe /> Search
										</Button>
									)}

									{isClient &&
										(modelHasFeature(modelId, "vision") ||
											modelHasFeature(modelId, "files")) && (
											<Button
												size="xs"
												variant="outline"
												type="button"
												className="shadow-none"
												onClick={pickFiles}
											>
												<Paperclip />
											</Button>
										)}
								</div>

								{messagesLength === 0 || !isAnswering ? (
									<Button
										size="icon"
										type="button"
										variant="highlight"
										className="dark:bg-secondary"
										disabled={inputValue.length == 0}
										onClick={handleSend}
									>
										<ArrowUp />
									</Button>
								) : (
									<Button
										size="icon"
										type="button"
										className="dark:bg-secondary"
										onClick={onCancel}
									>
										<Square className="fill-highlight-foreground" />
									</Button>
								)}
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
