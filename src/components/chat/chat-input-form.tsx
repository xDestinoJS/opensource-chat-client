"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUp, Paperclip, Search, Square } from "lucide-react";

import { Button } from "../ui/button";
import { AutosizeTextarea, AutosizeTextAreaRef } from "../ui/autosize-textarea";
import { TextQuote } from "../text-quote";
import ModelDropdown from "./model-dropdown/main";

import { getModelDataById, ModelId } from "@/lib/providers";
import uploadFile from "@/utils/upload-file";
import { GenericFileData, UploadItem } from "@/lib/files";
import ImagePreview from "./previews/image-preview";
import PDFPreview from "./previews/pdf-preview";

type Props = {
	quote?: string;
	setQuote: (q: string | undefined) => void;
	modelId: ModelId | null;
	providersList: any[];
	setModelId: (id: ModelId) => void;
	isAnswering: boolean;
	messagesLength: number;
	onSubmit: (text: string, files: GenericFileData[]) => void;
	onCancel: () => void;
	inputContainerRef: React.RefObject<HTMLDivElement | null>;
};

export default function ChatInputForm({
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
}: Props) {
	const textAreaRef = useRef<AutosizeTextAreaRef>(null);
	const hiddenInputRef = useRef<HTMLInputElement>(null);

	const [files, setFiles] = useState<UploadItem[]>([]);

	const modelData = useMemo(
		() => (modelId ? getModelDataById(modelId) : undefined),
		[modelId]
	);

	// File handling
	const startUpload = async (file: File, itemRef: UploadItem) => {
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
	};

	const addFiles = (incoming: File[]) => {
		incoming.forEach((file) => {
			const newItem: UploadItem = {
				name: file.name,
				mimeType: file.type,
				fileId: "",
				uploadUrl: file.type.startsWith("image/") // generate a local URL image
					? URL.createObjectURL(file)
					: "",
				isUploaded: false,
			};

			setFiles((prev) => [...prev, newItem]);
			startUpload(file, newItem);
		});
	};

	/* Drag and Drop */
	const { getRootProps, isDragActive } = useDropzone({
		onDrop: addFiles,
		noClick: true,
		noKeyboard: true,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg"],
			"application/pdf": [".pdf"],
		},
	});

	/* Upload from Clipboard */
	useEffect(() => {
		const handler = (e: ClipboardEvent) => {
			if (
				document.activeElement === textAreaRef.current?.textArea &&
				e.clipboardData
			) {
				const items = Array.from(e.clipboardData.items)
					.filter((i) => i.kind === "file")
					.map((i) => i.getAsFile())
					.filter(
						(f): f is File =>
							!!f &&
							[
								"image/png",
								"image/jpg",
								"image/jpeg",
								"application/pdf",
							].includes(f.type)
					);
				if (items.length) {
					e.preventDefault();
					addFiles(items);
				}
			}
		};
		document.addEventListener("paste", handler);
		return () => document.removeEventListener("paste", handler);
	}, []);

	/* UI helpers */
	const pickFiles = () => hiddenInputRef.current?.click();
	const removeFile = (target: UploadItem) =>
		setFiles((prev) => prev.filter((f) => f !== target));

	const handleSend = () => {
		const text = textAreaRef.current?.textArea.value.trim();
		if (!text || isAnswering) return;
		if (files.some((f) => !f.isUploaded)) return; // wait for files to upload

		const ready: GenericFileData[] = files.map(
			({ isUploaded, ...data }) => data
		);

		textAreaRef.current!.textArea.value = "";
		setFiles([]);
		onSubmit(text, ready);
	};

	return (
		<form
			className="relative w-full max-w-3xl max-lg:px-4 shrink-0"
			{...getRootProps()}
		>
			<input
				ref={hiddenInputRef}
				type="file"
				multiple
				accept="image/png,image/jpg,image/jpeg,application/pdf"
				className="hidden"
				onChange={(e) => {
					if (e.target.files) addFiles(Array.from(e.target.files));
				}}
			/>

			{isDragActive && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-tl-2xl rounded-tr-2xl border-2 border-dashed border-blue-500 bg-blue-500/20 text-lg font-semibold text-blue-800 backdrop-blur-sm">
					Drop your files here!
				</div>
			)}

			<div
				ref={inputContainerRef}
				className="relative z-0 rounded-tl-2xl rounded-tr-2xl border border-neutral-300 bg-neutral-50 p-4"
			>
				{/* Quote */}
				{quote && (
					<div className="mb-2">
						<TextQuote
							quote={quote}
							variant="foreground"
							onRemove={() => setQuote(undefined)}
						/>
					</div>
				)}

				{/* File Previews */}
				{files.length > 0 && (
					<div className="mb-2 flex h-16 w-full items-center gap-2 overflow-x-auto no-scrollbar">
						{files.map((f, i) =>
							f?.mimeType?.startsWith("image/") ? (
								<ImagePreview
									key={i}
									fileData={f}
									onRemove={() => removeFile(f)}
								/>
							) : (
								<PDFPreview
									key={i}
									fileData={f}
									onRemove={() => removeFile(f)}
								/>
							)
						)}
					</div>
				)}

				{/* Text area */}
				<AutosizeTextarea
					ref={textAreaRef}
					type="transparent"
					maxHeight={170}
					className="w-full resize-none bg-transparent px-0.75 focus:outline-none"
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
				/>

				{/* Buttons */}
				<div className="mt-2 flex items-center justify-between -mx-1.25">
					<div className="flex items-center gap-1">
						<ModelDropdown
							modelId={modelId}
							providersList={providersList}
							setModelId={setModelId}
						/>

						{modelData?.features.some((f) =>
							["vision", "files"].includes(f)
						) && (
							<Button
								size="sm"
								variant="outline"
								type="button"
								className="rounded-full shadow-none"
								onClick={pickFiles}
							>
								<Paperclip />
							</Button>
						)}

						{modelData?.features.includes("search") && (
							<Button
								size="sm"
								variant="outline"
								type="button"
								className="rounded-full shadow-none"
							>
								<Search /> Buscar
							</Button>
						)}
					</div>

					{messagesLength === 0 || !isAnswering ? (
						<Button size="icon" type="button" onClick={handleSend}>
							<ArrowUp />
						</Button>
					) : (
						<Button size="icon" type="button" onClick={onCancel}>
							<Square className="fill-secondary" />
						</Button>
					)}
				</div>
			</div>
		</form>
	);
}
