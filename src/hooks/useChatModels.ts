import { useState, useEffect, useMemo } from "react";
import providers, { listAllModels, ModelId, Provider } from "@/lib/providers";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function cloneAndMarkProviders(
	providers: Provider[],
	availableIds: string[] | undefined
): Provider[] {
	const availableSet = new Set(availableIds ?? []);

	return providers.map((provider) => ({
		...provider,
		models: provider.models.map((model) => ({
			...model,
			available: availableSet.has(model.id),
		})),
	}));
}

export default function useChatModels() {
	const availableIds = useQuery(api.models.listAvailableModels, {});

	const providersList = useMemo(
		() => cloneAndMarkProviders(providers, availableIds),
		[availableIds]
	);

	const allModels = useMemo(
		() => listAllModels(providersList),
		[providersList]
	);

	const getInitial = (): ModelId | "" => {
		if (typeof window === "undefined") return "";
		const stored = localStorage.getItem("modelId") as ModelId | null;
		return stored && allModels.some((m) => m.id === stored) ? stored : "";
	};

	const [modelId, setModelIdState] = useState<ModelId | "">(getInitial);

	useEffect(() => {
		if (typeof window === "undefined" || availableIds === undefined) return;

		const currentIsAvailable = allModels.some(
			(m) => m.id === modelId && m.available
		);
		const fallback = allModels.find((m) => m.available)?.id ?? "";

		const selected = currentIsAvailable ? modelId : fallback;

		if (modelId !== selected) setModelIdState(selected);
		localStorage.setItem("modelId", selected);
	}, [allModels, availableIds, modelId]);

	const modelData = allModels.find((m) => m.id === modelId);

	const setModelId = (id: ModelId | "") => {
		if (typeof window === "undefined") return;
		setModelIdState(id);
		localStorage.setItem("modelId", id);
	};

	return {
		modelId,
		setModelId,
		modelData,
		providersList,
	};
}
