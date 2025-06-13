import { motion } from "framer-motion";

const dots = [0, 1, 2];

export default function WaveLoader() {
	return (
		<div className="flex items-center gap-2">
			{dots.map((_, i) => (
				<motion.span
					key={i}
					className="block size-2 rounded-full bg-muted-foreground/65"
					animate={{ y: [0, -4, 0] }}
					transition={{
						duration: 1.2,
						times: [0, 0.6, 1],
						repeat: Infinity,
						delay: i * 0.2,
						ease: "easeInOut",
					}}
				/>
			))}
		</div>
	);
}
