import { useState, useMemo, useEffect } from "react";
import models, { ModelConfig, ModelId } from "@/lib/models";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function useChatModel() {
	const availableModels = useQuery(api.models.listAvailableModels, {});

	const modelList = useMemo(() => {
		// Initially, if availableModels is undefined (loading), use all models.
		// Once availableModels is loaded (even if empty array), filter by it.
		return availableModels
			? models.filter((m) => availableModels.includes(m.id))
			: models;
	}, [availableModels]); // `models` is a static import, so not needed in deps if its reference doesn't change.

	const getInitialModelId = (): ModelId | "" => {
		if (typeof window === "undefined") {
			return models[0]?.id || "";
		}
		const storedId = localStorage.getItem("modelId") as ModelId | null;
		// Prefer stored ID if it's valid within the broader static list of models.
		// useEffect will later refine this based on *actually available* models.
		if (storedId && models.some((m) => m.id === storedId)) {
			return storedId;
		}
		// Fallback to the first model in the static list, or empty if static list is empty.
		return models[0]?.id || "";
	};

	const [modelId, setModelIdState] = useState<ModelId | "">(getInitialModelId);

	useEffect(() => {
		if (typeof window === "undefined" || availableModels === undefined) {
			// Wait for availableModels to load and only run on client-side
			return;
		}

		const currentModelIdInState = modelId;
		const currentModelIdInStorage = localStorage.getItem(
			"modelId"
		) as ModelId | null;

		if (modelList.length === 0) {
			// No models available
			if (currentModelIdInState !== "") {
				setModelIdState("");
			}
			if (currentModelIdInStorage !== null) {
				localStorage.removeItem("modelId");
			}
		} else {
			// Models are available
			const firstAvailableModelId = modelList[0].id;
			let newModelToSet: ModelId | "" = "";

			// 1. Try localStorage if it's valid in the current modelList
			if (
				currentModelIdInStorage &&
				modelList.some((m) => m.id === currentModelIdInStorage)
			) {
				newModelToSet = currentModelIdInStorage;
			}
			// 2. Else, try current state modelId if it's valid in the current modelList
			else if (
				currentModelIdInState &&
				modelList.some((m) => m.id === currentModelIdInState)
			) {
				newModelToSet = currentModelIdInState;
			}
			// 3. Else, default to the first available model
			else {
				newModelToSet = firstAvailableModelId;
			}

			if (currentModelIdInState !== newModelToSet) {
				setModelIdState(newModelToSet);
			}

			if (currentModelIdInStorage !== newModelToSet) {
				if (newModelToSet) {
					// This case should ideally not be hit if modelList.length > 0
					localStorage.removeItem("modelId");
				} else {
					localStorage.setItem("modelId", newModelToSet);
				}
			}
		}
	}, [modelList, availableModels, modelId]); // Rerun when available models change or modelId state changes

	const modelData: ModelConfig | undefined = useMemo(() => {
		if (!modelId) {
			return undefined;
		}
		// Find in current modelList first
		const config = modelList.find((m) => m.id === modelId);
		if (config) {
			return config;
		}
		// If modelId is set but not found in the current modelList,
		// it implies a transient state or an issue. Return undefined.
		// useEffect should correct modelId to a valid one if modelList is not empty.
		return undefined;
	}, [modelId, modelList]);

	function setModelId(newId: ModelId | "") {
		if (typeof window === "undefined") return;

		if (newId === "") {
			setModelIdState("");
			localStorage.removeItem("modelId");
			return;
		}

		if (modelList.length === 0) {
			// Cannot set a specific model if no models are available
			setModelIdState("");
			localStorage.removeItem("modelId");
			return;
		}

		if (modelList.some((m) => m.id === newId)) {
			setModelIdState(newId);
			localStorage.setItem("modelId", newId);
		} else {
			// If the newId is not in the available list, default to the first available model
			const firstAvailableModelId = modelList[0].id;
			setModelIdState(firstAvailableModelId);
			localStorage.setItem("modelId", firstAvailableModelId);
		}
	}

	return {
		modelId,
		setModelId,
		modelData,
		modelList,
	};
}
