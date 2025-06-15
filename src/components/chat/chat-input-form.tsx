"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "../ui/button";
import { AutosizeTextarea, AutosizeTextAreaRef } from "../ui/autosize-textarea";
import { TextQuote } from "../text-quote";
import ModelDropdown from "./model-dropdown/main";
import ImagePreview from "./previews/image-preview";
import PDFPreview from "./previews/pdf-preview";
import { ModelId } from "@/lib/providers";
import uploadFile from "@/utils/upload-file";
import { GenericFileData } from "@/lib/files";

export interface FileData {
	file: File;
	isUploaded: boolean;
	uploadUrl: string;
	fileId: string;
}

type Props = {
	quote?: string;
	setQuote: (q: string | undefined) => void;
	modelId: ModelId | null;
	providersList: any[];
	setModelId: (id: ModelId) => void;
	isAnswering: boolean;
	messagesLength: number;
	onSubmit: (input: string, fileDataList: GenericFileData[]) => void;
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
	const inputAreaRef = useRef<AutosizeTextAreaRef>(null);
	const [files, setFiles] = useState<FileData[]>([]);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		processFiles(acceptedFiles);
	}, []);

	const processFiles = async (acceptedFiles: File[]) => {
		const newFiles: FileData[] = acceptedFiles.map((file) => ({
			file,
			isUploaded: false,
			fileId: "",
			uploadUrl: "",
		}));
		setFiles((prev) => [...prev, ...newFiles]);

		// Process uploads for each new file
		for (const newFileItem of newFiles) {
			const result = await uploadFile(newFileItem.file);
			console.log(result);
			if (result) {
				setFiles((prev) =>
					prev.map((item) =>
						item.file === newFileItem.file
							? {
									...item,
									isUploaded: true,
									uploadUrl: result.uploadUrl,
									fileId: result.fileId,
								}
							: item
					)
				);
			}
		}
	};

	const { getRootProps, isDragActive } = useDropzone({
		onDrop,
		noClick: true,
		noKeyboard: true,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg"],
			"application/pdf": [".pdf"],
		},
	});

	// Handle paste event
	useEffect(() => {
		const handlePaste = async (event: ClipboardEvent) => {
			if (
				document.activeElement === inputAreaRef.current?.textArea &&
				event.clipboardData
			) {
				const items = Array.from(event.clipboardData.items);

				const filesToProcess: File[] = [];

				for (const item of items) {
					if (item.kind === "file") {
						const file = item.getAsFile();
						if (file) {
							// Check if the file type is accepted
							const acceptedTypes = [
								"image/png",
								"image/jpg",
								"image/jpeg",
								"application/pdf",
							];
							if (acceptedTypes.includes(file.type)) {
								filesToProcess.push(file);
							}
						}
					}
				}

				if (filesToProcess.length > 0) {
					event.preventDefault(); // Prevent default paste behavior
					await processFiles(filesToProcess);
				}
			}
		};

		document.addEventListener("paste", handlePaste);

		return () => {
			document.removeEventListener("paste", handlePaste);
		};
	}, []);

	const handleSend = () => {
		const input = inputAreaRef.current?.textArea.value.trim();
		if (!input || isAnswering || !inputAreaRef.current) return;

		const areFilesUploading = files.some((file) => !file.isUploaded);
		if (areFilesUploading) return;

		const fileDataList: GenericFileData[] = files.map((fileData) => ({
			name: fileData.file.name,
			fileId: fileData.fileId,
			uploadUrl: fileData.uploadUrl,
			mimeType: fileData.file.type,
		}));

		inputAreaRef.current.textArea.value = "";
		setFiles([]);

		onSubmit(input, fileDataList);
	};

	const onRemove = (fileToRemove: File) => {
		setFiles((prev) => prev.filter((item) => item.file !== fileToRemove));
	};

	return (
		<form
			className="relative w-full max-w-3xl max-lg:px-4 shrink-0"
			{...getRootProps()}
		>
			{isDragActive && (
				<div
					className="absolute inset-0 flex items-center rounded-tl-2xl rounded-tr-2xl justify-center bg-blue-500/20 text-blue-800 text-lg font-semibold border-2 border-blue-500 border-dashed z-10 pointer-events-none"
					style={{ backdropFilter: "blur(2px)" }}
				>
					Drop files here!
				</div>
			)}

			<div
				ref={inputContainerRef}
				className="bg-neutral-50 p-4 rounded-tl-2xl rounded-tr-2xl border border-neutral-300 relative z-0"
			>
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
					<div className="w-full h-16 flex items-center gap-2 mb-2 overflow-x-scroll no-scrollbar">
						{files.map((fileData, index) =>
							fileData.file.type.startsWith("image/") ? (
								<ImagePreview
									key={index}
									fileData={fileData}
									onRemove={() => onRemove(fileData.file)}
								/>
							) : (
								<PDFPreview
									key={index}
									fileData={fileData}
									onRemove={() => onRemove(fileData.file)}
								/>
							)
						)}
					</div>
				)}

				<AutosizeTextarea
					ref={inputAreaRef}
					type="transparent"
					maxHeight={170}
					className="w-full focus:outline-none resize-none bg-transparent px-0.75"
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
				/>

				<div className="flex justify-between items-center mt-2 -mx-1.25">
					<ModelDropdown
						modelId={modelId}
						providersList={providersList}
						setModelId={setModelId}
					/>
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
