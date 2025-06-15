import { useState, useEffect } from "react";

const FINAL_PROGRESS = 100;

interface UseProgressProps {
	onComplete?: () => void;
}

function useProgress({ onComplete }: UseProgressProps = {}) {
	const [progress, setProgress] = useState(0);
	const [isComplete, setIsComplete] = useState(false);

	useEffect(() => {
		if (isComplete) return;

		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= FINAL_PROGRESS) {
					clearInterval(interval);
					setIsComplete(true);
					onComplete?.(); // Call the onComplete callback if provided
					return FINAL_PROGRESS;
				}

				if (prev > FINAL_PROGRESS * 0.75) {
					const remaining = FINAL_PROGRESS - prev;
					return Math.min(FINAL_PROGRESS, prev + remaining / 20);
				}
				const remaining = FINAL_PROGRESS - prev;

				return Math.min(FINAL_PROGRESS, prev + remaining / 5);
			});
		}, 100);

		return () => clearInterval(interval);
	}, [onComplete, isComplete]);

	return { progress, isComplete };
}

export default useProgress;
