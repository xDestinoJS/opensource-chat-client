"use client";

import { ModelId, Provider } from "@/lib/providers";
import { Fragment } from "react";
import { motion } from "framer-motion";
import NonExpandedModelContent from "./non-expanded-model-content";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function NonExpandedList({
	providers,
	onSelect,
}: {
	providers: Provider[];
	onSelect: (id: ModelId) => void;
}) {
	return (
		<motion.div
			key="collapsed"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className="p-1"
		>
			{providers.map((provider) => (
				<Fragment key={provider.name}>
					{provider.models.map((model) => (
						<DropdownMenuItem key={model.id} className="p-0">
							<NonExpandedModelContent
								provider={provider}
								model={model}
								onSelect={onSelect}
							/>
						</DropdownMenuItem>
					))}
				</Fragment>
			))}
		</motion.div>
	);
}
