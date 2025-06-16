import { useState, useEffect, useRef } from "react";

function useProgress({
	isComplete: forceComplete = false,
}: { isComplete?: boolean } = {}) {
	const FINAL_PROGRESS = 100;

	const [progress, setProgress] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// Function to clear the existing interval
		const cleanup = () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};

		// If the progress is forced to complete or is already at 100%
		if (forceComplete || progress >= FINAL_PROGRESS) {
			setProgress(FINAL_PROGRESS);
			setIsComplete(true);
			cleanup(); // Clear any running interval
			return;
		}

		// Start the interval if it's not already running
		if (!intervalRef.current) {
			intervalRef.current = setInterval(() => {
				setProgress((prev) => {
					if (prev >= FINAL_PROGRESS) {
						return FINAL_PROGRESS;
					}

					const remaining = FINAL_PROGRESS - prev;
					// Adjust the increment for a smoother animation towards the end
					const increment =
						prev > FINAL_PROGRESS * 0.75 ? remaining / 20 : remaining / 5;

					return Math.min(FINAL_PROGRESS, prev + increment);
				});
			}, 100);
		}

		// The cleanup function will be called when the component unmounts
		// or when forceComplete changes from false to true.
		return cleanup;
	}, [forceComplete]); // The effect now only depends on the external `forceComplete` prop.

	return { progress, isComplete };
}

export default useProgress;
