import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function IconButton({
	children,
	hasConfirmation = false,
	onClick,
}: {
	children: React.ReactNode;
	hasConfirmation?: boolean;
	onClick: () => void;
}) {
	const [confirmed, setConfirmed] = useState(false);

	return (
		<Button
			size="icon"
			variant="ghost"
			className="cursor-pointer"
			onClick={() => {
				if (hasConfirmation) {
					if (!confirmed) {
						onClick();
						setConfirmed(true);
						setTimeout(() => setConfirmed(false), 2000); // Reset confirmation after 2 seconds
					}
				} else {
					onClick();
				}
			}}
		>
			<AnimatePresence mode="wait">
				{confirmed ? (
					<motion.div
						key="check"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
					>
						<Check />
					</motion.div>
				) : (
					<motion.div
						key="children"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</Button>
	);
}
