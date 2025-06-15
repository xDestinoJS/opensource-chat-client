"use client";

import { ModelId, Provider } from "@/lib/providers";
import { Fragment } from "react";
import { motion } from "framer-motion";
import NonExpandedModelButton from "./non-expanded-list-button";

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
						<NonExpandedModelButton
							key={model.id}
							provider={provider}
							model={model}
							onSelect={onSelect}
						/>
					))}
				</Fragment>
			))}
		</motion.div>
	);
}
