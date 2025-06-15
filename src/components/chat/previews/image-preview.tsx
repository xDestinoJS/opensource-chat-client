import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import RemoveButton from "./remove-button";
import { FileData } from "../chat-input-form";
import useProgress from "@/hooks/useProgress";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { cn } from "@/lib/utils";

export default function ImagePreview({
	imageUrl,
	fileData,
	onRemove,
}: {
	imageUrl?: string;
	fileData?: FileData;
	onRemove?: () => void;
}) {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [isZoomed, setIsZoomed] = useState(false);
	const { progress } = useProgress();

	useEffect(() => {
		// Create an object URL for the file when the component mounts
		const objectUrl = fileData ? URL.createObjectURL(fileData?.file) : imageUrl;
		setImageSrc(objectUrl ?? "");

		return () => {
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [imageUrl, fileData?.file]);

	return imageSrc ? (
		<div className="relative h-full select-none bg-muted border border-muted-foreground/20 rounded-xl aspect-square shrink-0 overflow-hidden">
			<Image
				src={imageSrc}
				className="absolute w-full h-full object-cover cursor-zoom-in"
				unoptimized
				alt={fileData ? `Preview of ${fileData.file.name}` : "Preview Image"}
				width={75}
				height={75}
				onClick={() => setIsZoomed(true)}
			/>

			<ControlledZoom
				isZoomed={isZoomed}
				onZoomChange={setIsZoomed}
				wrapElement="span"
				zoomMargin={10}
			>
				<div
					className={cn(
						"absolute top-1/2 -transform-y-1/2",
						isZoomed ? "opacity-100" : "opacity-0"
					)}
				>
					<Image
						src={imageSrc}
						className="w-full h-full object-cover"
						unoptimized
						alt={"Preview Image"}
						width={75}
						height={75}
					/>
				</div>
			</ControlledZoom>

			{onRemove && (
				<RemoveButton
					className="absolute top-1.25 right-1.25"
					onRemove={onRemove}
				/>
			)}

			{!imageUrl && !fileData?.isUploaded && (
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 size-5">
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
	) : null;
}
