import { File, X } from "lucide-react";
import RemoveButton from "./remove-button";
import { FileData } from "../chat-input-form";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import useProgress from "@/hooks/useProgress";

export default function PDFPreview({
	name,
	fileData,
	onRemove,
}: {
	name?: string;
	fileData?: FileData;
	onRemove?: () => void;
}) {
	const { progress } = useProgress();

	return (
		<div className="relative flex gap-3 h-full w-75 shrink-0 p-2 select-none items-center rounded-xl border border-muted-foreground/20">
			<div className="flex justify-center items-center h-full aspect-square rounded-lg text-white bg-pink-500">
				{fileData?.isUploaded || name ? (
					<File />
				) : (
					<div className="p-3">
						<CircularProgressbar
							value={progress}
							styles={buildStyles({
								pathTransitionDuration: 1,
								pathColor: "white",
								trailColor: "#ADAEB3",
								strokeLinecap: "round",
							})}
						/>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-0.25 grow">
				<p className="text-bold line-clamp-1 w-[calc(100%-25px)]">
					{name ?? fileData?.file.name}
				</p>
				<p className="text-muted-foreground text-sm -mt-1.5">PDF</p>
			</div>

			{onRemove && (
				<div className="h-full">
					<RemoveButton onRemove={onRemove} />
				</div>
			)}
		</div>
	);
}
