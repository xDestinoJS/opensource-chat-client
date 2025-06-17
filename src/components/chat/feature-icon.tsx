import { getFeatureById, ModelFeatureId } from "@/lib/features";
import { cn } from "@/lib/utils";

export default function FeatureIcon({
	featureId,
	className,
}: {
	featureId: ModelFeatureId;
	className?: string;
}) {
	const feature = getFeatureById(featureId);
	if (!feature) return;

	const Icon = feature.icon;

	return (
		<div
			className={cn(
				"flex justify-center items-center h-full aspect-square rounded-sm p-1",
				feature.colors.background
			)}
		>
			<Icon className={cn(feature.colors.icon, className)} />
		</div>
	);
}
