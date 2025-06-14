import { ModelFilterId } from "@/lib/filters";
import { useState, useEffect, useCallback } from "react";

const LOCAL_STORAGE_KEY = "modelFilters";

const useModelFilters = () => {
	// Initialize state from local storage or default values
	const [enabledFilters, setFilters] = useState<ModelFilterId[]>(() => {
		if (typeof window === "undefined") {
			return []; // Server-side rendering: return default
		}
		const storedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
		return storedFilters ? JSON.parse(storedFilters) : [];
	});

	// Function to toggle a filter
	const toggleFilter = useCallback((filterId: ModelFilterId) => {
		setFilters((prevFilters) => {
			if (prevFilters.includes(filterId)) {
				return prevFilters.filter((id) => id !== filterId);
			} else {
				return [...prevFilters, filterId];
			}
		});
	}, []);

	// Effect to save filters to local storage whenever they change
	useEffect(() => {
		if (typeof window !== "undefined") {
			// Only run in the browser
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(enabledFilters));
		}
	}, [enabledFilters]);

	// Function to clear all filters
	const clearFilters = useCallback(() => {
		setFilters([]);
		if (typeof window !== "undefined") {
			// Only run in the browser
			localStorage.removeItem(LOCAL_STORAGE_KEY);
		}
	}, []);

	return {
		enabledFilters,
		toggleFilter,
		clearFilters,
	};
};

export default useModelFilters;
