import { getModelDataById, getProviderDataById } from "@/lib/providers";
import { useTheme } from "next-themes";
import { useMemo } from "react";

export default function useModelIcon() {
	const { theme } = useTheme();

	return {
		getModelIcon: (modelId: string) => {
			return useMemo(() => {
				const modelData = getModelDataById(modelId);
				return (
					(theme === "dark" ? modelData?.darkIcon : modelData?.icon) ??
					modelData?.icon ??
					""
				);
			}, [theme, modelId]);
		},
		getProviderIcon: (providerId: string) => {
			return useMemo(() => {
				const providerData = getProviderDataById(providerId);
				return (
					(theme === "dark" ? providerData?.darkIcon : providerData?.icon) ??
					providerData?.icon ??
					""
				);
			}, [theme, providerId]);
		},
	};
}
