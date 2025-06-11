import { useState, useMemo } from "react";
import models, { ModelConfig, ModelId } from "@/lib/models";

const DEFAULT_MODEL: ModelId = "gemini-2.0-flash";

export default function useChatModel() {
	const getInitialModelId = (): ModelId => {
		if (typeof window === "undefined") return DEFAULT_MODEL;

		const stored = localStorage.getItem("modelId");
		return stored && models.some((m) => m.id === stored)
			? (stored as ModelId)
			: DEFAULT_MODEL;
	};

	const [modelId, setModelIdState] = useState<ModelId>(getInitialModelId);

	const modelData: ModelConfig = useMemo(() => {
		return (
			models.find((m) => m.id === modelId) ||
			models.find((m) => m.id === DEFAULT_MODEL) ||
			models[0]
		);
	}, [modelId]);

	function setModelId(newId: ModelId) {
		const validId = models.some((m) => m.id === newId) ? newId : DEFAULT_MODEL;
		setModelIdState(validId);
		if (typeof window !== "undefined") {
			localStorage.setItem("modelId", validId);
		}
	}

	return {
		modelId,
		setModelId,
		modelData,
	};
}
